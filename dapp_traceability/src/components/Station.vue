<template>
  <b-col cols="6">
    <b-container>
      <h2 v-b-tooltip :title="actor">{{ area.toUpperCase() }} Area</h2>
      <p>Current Order: {{currentOrder}}| Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>
      <b-table
        ref="ProductionModules"
        show-empty small
        sticky-header="500px"
        :fields="fields"
        :items="pmItems"
        :busy="isBusy"
      >
      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>
      <template v-slot:cell(actions)="row">
        <b-button size="sm" @click="row.toggleDetails">
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
// import neo4j from 'neo4j-driver'
export default {
  name: 'StationSecond',
  props: ['actor', 'area'],
  data () {
    return {
      isBusy: false,
      fields: [
        { key: 'pmID', sortable: true },
        'actions',
        'TokenID'
      ],
      pmItems: []
    }
  },
  mounted () {
    // const eventHandler = ({ contractName, eventName, data }) => {
    //   const session = this.$store.state.neo4jDriver.session({ defaultAccessMode: neo4j.WRITE })
    //   switch (eventName) {
    //     case 'serialNumber':
    //       session
    //         .writeTransaction(tx => this.attachTokenToPM(tx, data._id, data._serialNumber))
    //         .then(() => session.close())
    //       break
    //     case 'controllerUpdate':
    //       if (data._type === 'removed') {
    //       }
    //       console.group('ControllerUpdate')
    //       console.log('control update data:', data)
    //       console.groupEnd()
    //       break
    //   }
    // }
    // this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
  },
  watch: {
    currentOrder: 'initPM'
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    currentOrder () {
      return this.$store.state.selectedOrder
    }
  },
  methods: {
    initPM () {
      this.toggleBusy('start')
      this.pmItems = []
      const session = this.$store.state.neo4jDriver.session()
      session
        .readTransaction(this.retrievePM)
        .then(() => this.collectChildren(this.pmItems))
        .then(() => this.toggleBusy('end'))
        .then(() => session.close())
    },
    retrievePM (tx) {
      let result
      switch (this.area) {
        case 'p2': {
          result = tx.run(
            'MATCH(o:Order{orderID:$orderID})-[:CONTAINS_O_SO]-()-[:LOGS_C_UID]-(pmuid)-[:IS_C_UID]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid)' +
            'RETURN pmuid,pmid,aid,auid', { orderID: this.currentOrder })
          break
        }
        case 'p3': {
          result = tx.run(
            'MATCH r=(pm)-[:CO_MAPPING_SUBORDER]-()-[:CONTAINS_O_SO]-(:Order{orderID:$orderID}) ' +
            'WITH collect(pm) AS pms ' +
            'MATCH(:Product{productDefinitionID:$productID})-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
            'WHERE NOT pmid IN pms ' +
            'RETURN pmid, aid, auid',
            { orderID: this.currentOrder, productID: 'wh' + this.currentOrder.slice(1) })
          break
        }
      }
      result.subscribe({
        onNext: record => {
          const pmID = record.get('pmid').properties
          const aUID = record.get('auid').properties
          const aID = record.get('aid').properties
          // console.group('ProductionModules')
          // console.log('PM: ', pmID)
          // console.log('PMUID: ', pmUID)
          // console.log('AID: ', aID)
          // console.log('AUID: ', aUID)
          // console.groupEnd()
          if (this.area === 'p2') {
            const pmUID = record.get('pmuid').properties
            this.pmItems.push({ children: [{ ...aUID, ...aID }], ...pmUID, ...pmID })
          } else if (this.area === 'p3') {
            this.pmItems.push({ children: [{ ...aUID, ...aID }], ...pmID })
          }
        }
      })
    },
    collectChildren (pmItems) {
      /**
      * recursively collect all children(assemblies) of each PM. Children are always pushed into the
      * first pmItem of the list, after that, other pmItems having same pmID will be removed from the list.
      */
      const idx = pmItems.map((el, index) => el.pmID === pmItems[0].pmID ? index : null).filter(e => e !== null)
      const idList = pmItems.map(el => el.pmID)
      const finished = idList.length === [...new Set(idList)].length ? 1 : 0
      if (finished) {
        this.pmItems = pmItems
      } else if (idx.length !== 1) {
        idx.shift()
        idx.forEach(i => {
          pmItems[0].children = [...pmItems[0].children, ...pmItems[i].children]
          pmItems[i] = null
        })
        pmItems = pmItems.slice(1).concat(pmItems[0]).filter(e => e !== null) // move the first item to the end of the list
        return this.collectChildren(pmItems)
      } else {
        pmItems = pmItems.slice(1).concat(pmItems[0])
        return this.collectChildren(pmItems)
      }
    },
    updateProductActor () {
      this.pmItems.forEach(el => {
        this.$store.commit('updateProductActor', { pmID: el.pmID, station: this.actor })
      })
    },
    craftTokenBatch () {
      this.pmItems.forEach(el => {
        const assemblyUIDs = el.children.map(e => e.assemblyUID)
        const tokens = assemblyUIDs.map(el => this.$store.getters.getAssemblyToken(el).tokenID)
        const qtys = Array.from({ length: tokens.length }, x => 1)
        const serialNumber = el.pmUID
        // console.log('AUIDS: ', assemblyUIDs)
        // console.log('PM:', el)
        // console.log('TOKENS: ', tokens)
        this.craftToken(tokens, qtys, 1, serialNumber)
      })
    },
    craftToken (inIds, inQtys, outQtys, serialNumber) {
      // craft(uint256[] calldata _inputIds, uint256[] calldata _inputQuantities, uint256 _outputInitialSupply, string calldata _uri, address _actor, string calldata _serialNumber)
      this.drizzleInstance
        .contracts.APTSC
        .methods.craft
        .cacheSend(inIds, inQtys, outQtys, 'uri/path', this.actor, serialNumber, { gas: 100000, from: this.actor })
    },
    attachTokenToPM (tx, tokenID, pmUID) {
      return tx.run(
        'MATCH (b:pmUID {pmUID: $pmUID})-[:IS_C_UID]-(a:PM)' +
        'MERGE (a)-[:HAS_TOKEN]->(t:Token {tokenID: $tokenID})-[:HAS_WUID]->(b)',
        { pmUID: pmUID, tokenID: tokenID }
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
    }
  }
}
</script>
