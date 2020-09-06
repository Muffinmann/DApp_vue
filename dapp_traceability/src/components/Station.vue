<template>
  <b-col cols="6">
    <b-container>
      <h2 v-b-tooltip :title="actor">{{ area.toUpperCase() }} Area</h2>
      <p>Current Order: {{currentOrder}}| Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>

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
            <li v-for="(value, key) in row.item.children" :key="key">{{ value.assemblyID }}: {{ value.assemblyUID }} </li>
          </ul>
        </b-card>
      </template>
      </b-table>

      <button @click="craftTokenBatch">Craft Token</button>
    </b-container>
  </b-col>
</template>
<script>
import { mapGetters } from 'vuex'
import neo from '@/neo4jAPI.js'

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
      craftPool: []
    }
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'serialNumber' && data._actor === this.actor) {
        const tokenID = data._id
        const serialNumber = data._serialNumber
        const timeStamp = this.createTimeStamp()
        this.attachToken.push({
          serialNumber: serialNumber,
          tokenID: tokenID,
          timeStamp: timeStamp
        })
        if (this.area === 'p2') {
          if (serialNumber === this.craftPool.slice(-1)[0].pmUID) {
            this.attachTokenToPM()
          }
        } else if (this.area === 'p3') {
          if (serialNumber === this.craftPool.slice(-1)[0].pmID) {
            this.attachTokenToPM()
          }
        }
      } else if (eventName === 'TransferBatch' && data._to === this.actor) {
        console.group(`>>> Transfer Batch to  ${this.area.toUpperCase()} <<< `)
        console.log(data)
        console.groupEnd()
        this.updateTokenSupply(data._ids, data._values)
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
  },
  watch: {
    currentOrder: 'initPM',
    refreshRequest: 'requestToken'
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
    async initPM () {
      await this.retrievePM()
      this.requestToken()
    },
    async retrievePM () {
      this.toggleBusy('start')
      this.pmItems = await neo.getPMsByOrderAndArea(this.currentOrder, this.area)
      this.pmItems.forEach(pm =>
        pm.children.forEach(child => {
          const token = this.$store.getters.getAssemblyToken(child.assemblyUID)
          this.$store.commit('updateTokenProductMap', { tokenID: token.tokenID, pmID: pm.pmID, area: this.area })
        })
      )
      this.toggleBusy('end')
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
    craftTokenBatch () {
      if (this.filter) {
        this.craftPool = this.pmItems.filter(row =>
          Object.keys(row).some(key =>
            String(row[key]).toLowerCase().indexOf(this.filter) > -1)
        )
      } else {
        this.craftPool = this.pmItems
      }
      this.craftPool.forEach(pm => {
        let serialNumber = ''
        const tokens = pm.children
          .map(child => child.assemblyUID)
          .map(uid => this.$store.getters.getAssemblyToken(uid).tokenID)
        const qtys = Array.from({ length: tokens.length }, x => 1)
        if (this.area === 'p2') {
          serialNumber = pm.pmUID
        } else if (this.area === 'p3') {
          serialNumber = pm.pmID
        }
        this.craftToken(tokens, qtys, 1, serialNumber)
      })
    },
    craftToken (inIds, inQtys, outQtys, serialNumber) {
      // craft(uint256[] calldata _inputIds, uint256[] calldata _inputQuantities, uint256 _outputInitialSupply, string calldata _uri, address _actor, string calldata _serialNumber)
      this.drizzleInstance
        .contracts.APTSC
        .methods.craft
        .cacheSend(inIds, inQtys, outQtys, 'uri/path', this.actor, serialNumber, { gas: 500000, from: this.actor })
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
      await neo.updatePmTokensOfOrder(this.currentOrder, this.attachToken, this.area)
      this.initPM()
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
