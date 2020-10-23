<template>
  <b-col cols="6">
    <Area
      :currentOrder="currentOrder"
      :actor="actor"
      area="p1"
      :isSelectable="true"
      :fields="assemblyFields"
      :items="assemblyItems"
      :itemDetails="itemDetails"
      :mintFunc="mintFunc"
      :detachFunc="detachFunc"
    />
    <b-container>
        <h2 v-b-tooltip :title="actor"><b>P1 Area</b></h2>
        <p>Current Order: {{currentOrder}} | Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>
        <b-progress :max="genMax" animated>
          <b-progress-bar :value="genStep" variant="info" :label="`${((genStep / genMax) * 100).toFixed(1)}% |P1`"></b-progress-bar>
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
          ref="AssemblyPool"
          show-empty small
          sticky-header="500px"
          :fields="assemblyFields"
          :items="assemblyItems"
          :filter="childrenFilter"
          :filter-function="multipleItemFilter"
          :busy="isBusy"
          >
          <template v-slot:table-busy>
            <div class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>Loading...</strong>
            </div>
          </template>
          <template v-slot:cell(tokenSupply)="row">
            {{ row.value }}
          </template>
          <template v-slot:cell(assemblyID)="row">
            <p v-b-tooltip :title="actor">{{ row.value }} <b-icon icon="arrows-expand" @click="row.toggleDetails"></b-icon></p>
          </template>
          <template v-slot:row-details="row">
            <b-card>
              <ul>
                <li v-for="(value, key) in detailFilter(row.item)" :key="key">{{ key }}:{{ value }}</li>
              </ul>
            </b-card>
          </template>
        </b-table>

        <b-button class="mx-3" @click="mintToken"> Mint Token </b-button>
        <b-button class="mx-3" @click="detachToken">Detach Token</b-button>
        <b-button class="mx-3" @click="detachAllTokens">Detach All Tokens</b-button>
        <b-button class="mx-3" @click="transferToken">Transfer Token</b-button>
        <b-button class="mx-3" @click="approveControl">Approve Control</b-button>
        <p>{{txHash()}}</p>
    </b-container>
  </b-col>
</template>

<script>
import neo from '@/js/neo4jAPI.js'
import Area from '@/components/templates/Area.vue'
import { mapGetters } from 'vuex'
export default {
  name: 'Station',
  props: ['actor'],
  components: {
    Area
  },
  data () {
    return {
      isBusy: false,
      filter: '',
      assemblyFields: [
        {
          key: 'assemblyID',
          label: 'Assembly ID',
          sortable: true
        },
        'action',
        'tokenID',
        'tokenSupply'
      ],
      assemblyItems: [],
      tokenIndexMap: {},
      tokenSupplyMap: {},
      mintPool: [],
      attatchToken: [],
      savedBookmarks: [],
      genStep: 0,
      genMax: 100
    }
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'TransferSingle' && data._operator === this.actor) {
        console.group('>>> P1 TransferSingle <<<')
        console.log(data)
        console.groupEnd()
        const tokenID = data._id
        const tokenSupply = parseInt(data._value)
        this.savedBookmarks = this.createTokenNode(tokenID, tokenSupply)
      } else if (eventName === 'serialNumber' && data._actor === this.actor) {
        console.group('>>> P1 serial number <<<')
        console.log('data: ', data)
        console.groupEnd()
        const tokenID = data._id
        const serialNumber = data._serialNumber
        const timeStamp = this.createTimeStamp()
        this.attatchToken.shift()
        this.attatchToken.push({
          serialNumber: serialNumber,
          tokenID: tokenID,
          timeStamp: timeStamp
        })
        this.updateAssemblyToken()
        this.genStep += 1
      } else if (eventName === 'TransferBatch' && data._operator === this.actor) {
        console.log('transferBatch: ', data)
        // this.updateTokenSupply(data._ids, data._values)
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    ...mapGetters('contracts', ['getContractData', 'contractInstances']),
    currentOrder () {
      return this.$store.state.selectedOrder
    },
    childrenFilter () {
      return this.$store.getters.getChildrenFilter.length ? this.$store.getters.getChildrenFilter : this.filter
    },
    autoRefresh () {
      return this.$store.state.autoRefresh
    },
    txHash () {
      return () => {
        const state = this.drizzleInstance.store.getState()
        return Array.from(new Set(state.contracts.APTSC.events.map(e => e.transactionHash)))
      }
    }
  },
  watch: {
    currentOrder: 'initAssembly',
    autoRefresh: 'initAssembly',
    genStep: 'loadNext'
  },
  methods: {
    // @para item: the assembly item object
    itemDetails (item) {
      const filterOut = ['assemblyID', 'tokenID', 'tokenSupply', '_showDetails']
      const details = {}
      const keys = Object.keys(item).filter(key => !filterOut.some(i => i === key)).sort()
      keys.forEach(k => { details[k] = item[k] })
      return details
    },
    mintFunc (items) {
      console.log('items: ', items)
      items.map(i => this.createToken(400, i.assemblyUID))
    },
    detachFunc () {
      console.log('detach func')
      console.log('this drizzle: ', this.drizzleInstance)
    },
    async initAssembly () {
      this.toggleBusy('start')
      await this.getAssembly()
      this.toggleBusy('end')
    },
    loadNext () {
      console.log('THIS RESULT------>', this.result)
      if (!this.result.done) {
        this.result.value.then(r => {
          this.result = this.poolGen.next(r)
        })
      } else {
        const state = this.drizzleInstance.store.getState()
        const events = state.contracts.APTSC.events
        const txHash = Array.from(new Set(events.map(event => event.transactionHash)))
        txHash.forEach(h => this.drizzleInstance.web3.eth.getTransactionReceipt(h, console.log))
        console.group('TX Events')
        console.log('Events: ', events)
        console.groupEnd()
      }
    },
    createTokenNode (tokenID, tokenSupply) {
      return neo.createToken(tokenID, tokenSupply)
      // this.savedBookmarks.push(bm)
    },
    mintToken () {
      let mintPool
      if (this.childrenFilter) {
        const filters = this.childrenFilter
        mintPool = this.assemblyItems.filter(row => this.multipleItemFilter(row, filters)).filter(row => row.tokenID === null)
      } else {
        mintPool = this.assemblyItems.filter(row => row.tokenID === null)
      }
      this.genMax = mintPool.length
      this.genStep = 0
      mintPool = mintPool.map(e => Promise.resolve(e))
      const poolGenerator = function * (pool, thisArg) {
        for (const i of pool) {
          const assembly = yield i
          thisArg.createToken(assembly.batchsize, assembly.assemblyUID)
        }
      }
      this.poolGen = poolGenerator(mintPool, this)
      const result = this.poolGen.next()
      console.log('result:', result)
      result.value.then(r => {
        this.result = this.poolGen.next(r)
      })
    },
    transferToken () {
      const p2Request = this.$store.getters.getRequestPool('p2')
      if (p2Request !== undefined) {
        const p2Actor = Object.keys(p2Request)
        const p2Tokens = Object.values(p2Request)
        p2Tokens.forEach((tokens, index) => {
          tokens.forEach(token => {
            this.addController(token, p2Actor[index])
          })
          const p2Qtys = Array(tokens.length).fill(1)
          const gas = 200000 * Math.ceil(p2Qtys.length / 10) ** 2
          // console.group('TRANSFER BATCH TOKEN')
          // console.log('p2 actor: ', p2Actor[index])
          // console.log('p2 tokens: ', tokens)
          // console.log('p2 quantity: ', p2Qtys)
          // console.groupEnd()
          this.transferBatch(this.actor, p2Actor[index], tokens, p2Qtys, gas)
        })
      }
      const p3Request = this.$store.getters.getRequestPool('p3')
      if (p3Request !== undefined) {
        const p3Actor = Object.keys(p3Request)
        const p3Tokens = Object.values(p3Request)
        // console.group('TRANSFER TOKEN')
        // console.log('p2 request: ', p2Request)
        // console.log('p2 actor: ', p2Actor)
        // console.log('p2 tokens: ', p2Tokens)
        // console.groupEnd()
        p3Tokens.forEach((tokens, index) => {
          tokens.forEach(token => {
            this.addController(token, p3Actor[index])
          })
          const p3Qtys = Array(tokens.length).fill(1)
          const gas = 200000 * Math.ceil(p3Qtys.length / 10) ** 2
          this.transferBatch(this.actor, p3Actor[index], tokens, p3Qtys, gas)
        })
      }
      // TODO: Update request after transfer
      // this.$store.commit('clearRequestPool')
    },
    approveControl () {
      this.setApproval('0x76471f9b4A5cbbaC6CE3Cd504ad2aFB702094f80')
      this.checkApproval(this.actor, '0x76471f9b4A5cbbaC6CE3Cd504ad2aFB702094f80')
    },
    /**
    * NEO4J FUNCTIONS
    */
    async getAssembly () {
      this.assemblyItems = await neo.getAssembliesByOrder(this.currentOrder)
      this.assemblyItems.forEach(assemblyItem => {
        const a = assemblyItem
        this.$store.commit('updateAssemblyTokenMap', { aUID: a.assemblyUID, tokenID: a.tokenID, tokenSupply: a.tokenSupply })
        this.$store.commit('updateTokenSupplyMap', { tokenID: a.tokenID, tokenSupply: a.tokenSupply })
      })
      this.$store.commit('refreshRequest')
      return true
    },
    updateAssemblyToken () {
      this.savedBookmarks.then(bm => neo.updateAssemblyTokensOfOrder(this.currentOrder, this.attatchToken, bm)).then(() => this.getAssembly())
    },
    detachToken () {
      const session = this.$store.state.neo4jDriver.session()
      const assemblyUID = this.assemblyItems[0].assemblyUID
      session
        .run(
          'MATCH (a:AssemblyUID{assemblyUID:$assemblyUID})-[:HAS_WUID]-(b:Token)' +
          'DETACH DELETE b', { assemblyUID: assemblyUID })
        .then(() => session.readTransaction(this.getAssembly))
        .then(() => session.close())
    },
    detachAllTokens () {
      const session = this.$store.state.neo4jDriver.session()
      session
        .run(
          'MATCH (t:Token)' +
          'DETACH DELETE t')
        .then(() => session.readTransaction(this.getAssembly))
        .then(() => session.close())
    },
    /**
    * BLOCKCHAIN FUNCTIONS
    */
    createToken (qty, serialNumber) {
      this.drizzleInstance
        .contracts.APTSC
        .methods.create
        .cacheSend(qty, 'uri/path', serialNumber, this.actor, { gas: 100000, from: this.actor })
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
    /**
    * HELPER FUNCTIONS
    */
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
    multipleItemFilter (row, filter) {
      const filters = filter.toLowerCase().split(',').map(el => el.trim())
      return Object.keys(row).some(function (key) {
        return filters.some(function (filter) {
          return (
            String(row[key])
              .toLowerCase()
              .indexOf(filter) > -1
          )
        })
      })
    },
    detailFilter (item) {
      return {
        AssemblyUID: item.assemblyUID,
        BatchSize: item.batchsize,
        BatchSplit: item.batchsplit,
        MaterialType: item.materialtype
      }
    },
    createTimeStamp () {
      const date = new Date().toJSON() // e.x: "2020-09-01T13:17:29.468Z"
      return date.slice(0, date.indexOf('.'))
    }
  }
}
</script>

<style scoped>

</style>
