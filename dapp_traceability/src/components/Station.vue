<template>
  <b-col cols="6">
    <b-container>
      <h2 v-b-tooltip :title="actor">{{ area.toUpperCase() }} Area</h2>
      <p>Current Order: {{currentOrder}}| Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>
      <b-progress :max="genMax" animated>
        <b-progress-bar :value="genStep" variant="info" :label="`${((genStep / genMax) * 100).toFixed(1)}% |${area.toUpperCase()}`"></b-progress-bar>
      </b-progress>
      <b-input-group size="sm">
            <b-form-input
              v-model="filter"
              type="search"
              id="filterInput"
              placeholder="Type to Search"
            ></b-form-input>
            <b-input-group-append>
              <b-button :disabled="!filter" @click="filter=''">Clear</b-button>
            </b-input-group-append>
        </b-input-group>

      <b-table
        ref="ProductionModules"
        show-empty small
        sticky-header="500px"
        :fields="fields"
        :items="pmItems"
        :busy="isBusy"
        :filter="filter"
      >
      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>

      <template v-slot:cell(actions)="row">
        <b-button size="sm" @click="row.toggleDetails(); childrenFilter(row, !row.detailsShowing)">
          {{ row.detailsShowing ? 'Hide' : 'Show' }} Assemblies
        </b-button>
      </template>
      <template v-slot:row-details="row">
        <b-card>
          <ul>
            <li v-for="(value, key) in row.item.children" :key="key">
            {{ value.assemblyID }}: {{ value.assemblyUID }} </li>
          </ul>
        </b-card>
      </template>
      </b-table>

      <b-button @click="craftTokenBatch">Craft Token</b-button>
      <b-button class="mx-2" @click="detachToken">Detach Token</b-button>
      <b-button v-if="area==='p2'" class="mx-2" @click="transferTokenToNext">Transfer Token</b-button>
      <b-button v-if="area==='p3'" class="mx-2" @click="finalMount">Final Mount</b-button>
      <b-button @click="getChildrenToken('P4D200426580FL0037_1AC1')">Test</b-button>
    </b-container>
  </b-col>
</template>
<script>
import { mapGetters } from 'vuex'
import neo from '@/js/neo4jAPI.js'

export default {
  name: 'StationSecond',
  props: ['actor', 'area'],
  data () {
    return {
      filter: '',
      isBusy: false,
      fields: [
        { key: 'pmID', sortable: true },
        'actions',
        'tokenID',
        'tokenSupply'
      ],
      pmItems: [],
      attachToken: [],
      craftPool: [],
      poolGen: null,
      result: null,
      genStep: 0,
      genMax: 100
    }
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'serialNumber' && (data._actor === this.actor)) {
        const tokenID = data._id
        const serialNumber = data._serialNumber
        const regex = /wh_/
        const isFinalMount = regex.test(serialNumber)
        const children = this.pmItems.find(pm => pm.pmUID ? pm.pmUID === serialNumber : pm.pmID === serialNumber).children
        const childrenTokenIDs = children.map(child => child.assemblyUID).map(uid => this.$store.getters.getAssemblyToken(uid).tokenID)
        if (isFinalMount) {
          console.log('Product token: ', tokenID)
          const productID = 'wh' + this.currentOrder.slice(1)
          this.$store.commit('updateProductToken', productID, tokenID)
        } else {
          const timeStamp = this.createTimeStamp()
          this.attachToken.shift()
          this.attachToken.push({
            serialNumber: serialNumber,
            tokenID: tokenID,
            timeStamp: timeStamp,
            children: childrenTokenIDs
          })
          // console.group(`>>>SERIAL NUMBER ${this.area}<<<`)
          // console.log('Serial Number: ', serialNumber)
          // console.log('attachToken: ', this.attachToken)
          // console.groupEnd()
          this.attachTokenToPM()
          this.genStep += 1
        }
      } else if (eventName === 'TransferBatch' && data._to === this.actor) {
        console.group(`>>> Transfer Batch to  ${this.area.toUpperCase()} <<< `)
        console.log(data)
        console.groupEnd()
        // this.updateTokenSupply(data._ids, data._values)
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
  },
  watch: {
    currentOrder: 'initPM',
    refreshRequest: 'requestToken',
    genStep: 'loadNext'
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    currentOrder () {
      return this.$store.state.selectedOrder
    },
    refreshRequest () {
      return this.$store.state.refreshRequest
    }
  },
  methods: {
    getChildrenToken (serialNumber) {
      console.log('this PMs: ', this.pmItems)
      const children = this.pmItems.find(pm => pm.pmUID ? pm.pmUID === serialNumber : pm.pmID === serialNumber).children
      console.log('children: ', children)
      const childrenTokenIDs = children.map(child => child.assemblyUID).map(uid => this.$store.getters.getAssemblyToken(uid).tokenID)
      console.log('childrenTokenIDs: ', childrenTokenIDs)
    },
    async initPM () {
      this.toggleBusy('start')
      await this.retrievePM()
      this.requestToken()
      this.toggleBusy('end')
    },
    async retrievePM () {
      this.pmItems = await neo.getPMsByOrderAndArea(this.currentOrder, this.area)
      // this.pmItems.forEach(pm =>
      //   pm.children.forEach(child => {
      //     const token = this.$store.getters.getAssemblyToken(child.assemblyUID)
      //     this.$store.commit('updateTokenProductMap', { tokenID: token.tokenID, pmID: pm.pmID, area: this.area })
      //   })
      // )
    },
    requestToken () {
      const requestPool = this.pmItems.filter(el => el.tokenID === null)
      if (requestPool.length !== 0) {
        const children = requestPool.map(pm => pm.children)
        const uids = children.map(children => children.map(child => child.assemblyUID)).flat()
        const tokens = uids.map(uid => this.$store.getters.getAssemblyToken(uid).tokenID)
        // console.group('Starting requesting token......')
        // console.log('children: ', children)
        // console.log('uids: ', uids)
        // console.log('tokens: ', tokens)
        // console.groupEnd()
        this.$store.commit('requestToken', { tokens: tokens, newActor: this.actor, area: this.area })
      }
    },
    loadNext () {
      if (!this.result.done) {
        this.result.value.then(r => {
          this.result = this.poolGen.next(r)
        })
      }
    },
    craftTokenBatch () {
      let craftPool
      if (this.filter) {
        craftPool = this.pmItems.filter(row =>
          Object.keys(row).some(key =>
            String(row[key]).toLowerCase().indexOf(this.filter) > -1)
        ).filter(row => row.tokenID === null)
      } else {
        craftPool = this.pmItems.filter(row => row.tokenID === null)
      }
      this.genStep = 0
      this.genMax = craftPool.length
      craftPool = craftPool.map(p => Promise.resolve(p))
      const poolGenerator = function * (pool, thisArg) {
        for (const i of pool) {
          const currentPM = yield i
          let serialNumber = ''
          const tokens = currentPM.children
            .map(child => child.assemblyUID)
            .map(uid => thisArg.$store.getters.getAssemblyToken(uid).tokenID)
          const qtys = Array.from({ length: tokens.length }, x => 1)
          const gas = 500000 * Math.ceil(qtys.length / 10) ** 2
          if (thisArg.area === 'p2') {
            serialNumber = currentPM.pmUID
          } else if (thisArg.area === 'p3') {
            serialNumber = currentPM.pmID
          }
          thisArg.craftToken(tokens, qtys, 1, serialNumber, gas)
        }
      }
      this.poolGen = poolGenerator(craftPool, this)
      this.result = this.poolGen.next()
      this.result.value.then(r => {
        this.result = this.poolGen.next(r)
      })
    },
    finalMount () {
      const p2Tokens = this.$store.getters.getP2Tokens
      const p3Tokens = this.pmItems.map(pm => pm.tokenID)
      const allTokens = [...p2Tokens, ...p3Tokens]
      const qtys = Array(allTokens.length).fill(1)
      const serialNumber = 'wh' + this.currentOrder.slice(1)
      const gas = 500000 * Math.ceil(qtys.length / 10) ** 2
      this.craftToken(allTokens, qtys, 1, serialNumber, gas)
    },
    transferTokenToNext () {
      const tokens = this.pmItems.map(pm => pm.tokenID)
      const values = Array(tokens.length).fill(1)
      const to = this.drizzleInstance.store.getState().accounts[2]
      const gas = 200000 * Math.ceil(tokens.length / 10) ** 2
      tokens.forEach(token => this.addController(token, to))
      this.transferBatch(this.actor, to, tokens, values, gas)
      this.$store.commit('updateP2Tokens', tokens)
    },
    detachToken () {
      const tokens = this.pmItems.map(pm => pm.tokenID)
      console.log('DETACH TOKENS: ', tokens)
      const session = this.$store.state.neo4jDriver.session()
      session
        .run('UNWIND $tokens as token ' +
          'MATCH (t:Token{tokenID:token}) ' +
          'DETACH DELETE t', { tokens: tokens })
        .then(() => session.close())
        .then(() => this.initPM())
    },
    addController (id, newController) {
      this.drizzleInstance
        .contracts.APTSC
        .methods.addController
        .cacheSend(id, newController, { gas: 100000, from: this.actor })
    },
    transferBatch (from, to, ids, values, gas) {
      // function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data)
      const web3 = this.drizzleInstance.web3
      // const data = web3.utils.sha3('safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data)')
      const data = web3.utils.sha3('safeBatchTransferFrom')
      const dataBytes = web3.utils.hexToBytes(data)
      try { // p2: 2million gas, p3:10 million gas
        this.drizzleInstance
          .contracts.APTSC
          .methods.safeBatchTransferFrom
          .cacheSend(from, to, ids, values, dataBytes, { gas: gas, from: this.actor })
      } catch (err) {
        console.error('Erro during transferBatch: ', err)
      }
    },
    craftToken (inIds, inQtys, outQtys, serialNumber, gas) {
      // craft(uint256[] calldata _inputIds, uint256[] calldata _inputQuantities, uint256 _outputInitialSupply, string calldata _uri, address _actor, string calldata _serialNumber)
      this.drizzleInstance
        .contracts.APTSC
        .methods.craft
        .cacheSend(inIds, inQtys, outQtys, 'uri/path', this.actor, serialNumber, { gas: gas, from: this.actor })
    },
    async updateTokenSupply (_ids, _values) {
      const tokenSupplyChange = _ids.map((id, index) => {
        const usedInPM = this.$store.getters.getTokenUsedInPM(id, this.area)
        return { tokenID: id, to: usedInPM, amount: parseInt(_values[index]) }
      })
      const updated = await neo.transferTokenToPM(tokenSupplyChange)
      if (updated) { this.$store.commit('autoRefresh') }
    },
    async attachTokenToPM () {
      console.log('attachToken: ', this.attachToken)
      await neo.updatePmTokensOfOrder(this.currentOrder, this.attachToken, this.area)
      this.retrievePM()
    },
    attachTokenToPmArea3 (tx, tokenID, pmID) {
      return tx.run(
        'MATCH (a:PM{pmID: $pmID}) ' +
        'MERGE (a)-[:HAS_TOKEN]->(t:Token {tokenID: $tokenID}) ' +
        'ON CREATE SET t.tokenSupply = 1 ' +
        'WITH t ' +
        'MATCH (tk:TK)-[:CO_MAPPING_TOKEN]-(o:Order{orderID:$orderID})' +
        'MERGE (t)<-[:CONTAINS_TOKEN]-(tk)',
        { pmID: pmID, tokenID: tokenID, orderID: this.currentOrder }
      )
    },
    toggleBusy (state) {
      switch (state) {
        case 'start':
          this.isBusy = true
          break
        case 'end':
          this.isBusy = false
          break
      }
    },
    childrenFilter (row, toggleDetail) {
      if (toggleDetail) {
        const children = row.item.children.map(el => el.assemblyID)
        this.$store.commit('updateChildrenFilter', children.join(','))
      } else {
        this.$store.commit('updateChildrenFilter', '')
      }
    },
    createTimeStamp () {
      const date = new Date().toJSON() // e.x: "2020-09-01T13:17:29.468Z"
      return date.slice(0, date.indexOf('.'))
    }
  }
}
</script>
