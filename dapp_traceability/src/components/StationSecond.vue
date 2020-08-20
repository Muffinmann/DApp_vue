<template>
  <b-col cols="6">
    <b-container>
      <h2 v-b-tooltip :title="actor">P2 Area</h2>
      <p>Current Order: {{currentOrder}}| Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>
      <b-table
        ref="ProductionModules"
        show-empty small
        sticky-header="500px"
        :fields="fields"
        :items="pmItems"
      >
<!--       <template v-slot:cell(children)="row">
        {{ row.value.map(el=>el.assemblyID) }}
      </template> -->
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
      <button>Craft Token</button>
    </b-container>
  </b-col>
</template>
<script>
import { mapGetters } from 'vuex'
import neo4j from 'neo4j-driver'
export default {
  name: 'StationSecond',
  props: ['actor'],
  data () {
    return {
      fields: [
        'pmID',
        'actions',
        'TokenID'
      ],
      pmItems: []
    }
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      const session = this.$store.state.neo4jDriver.session({ defaultAccessMode: neo4j.WRITE })
      switch (eventName) {
        case 'serialNumber':
          session
            .writeTransaction(tx => this.attachTokenToPM(tx, data._id, data._serialNumber))
            .then(() => this.updateTokenInfo())
            .then(() => session.close())
          break
        case 'controllerUpdate':
          if (data._type === 'removed') {
          }
          console.group('ControllerUpdate')
          console.log('control update data:', data)
          console.groupEnd()
          break
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
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
      this.pmItems = []
      const session = this.$store.state.neo4jDriver.session()
      session
        .readTransaction(this.retrievePM)
        .then(() => this.constructChildComponent())
        .then(() => this.updateProductActor())
        .then(() => session.close())
    },
    retrievePM (tx) {
      const result = tx.run(
        'match(o:Order{orderID:$orderID})-[:CONTAINS_O_SO]-()-[:LOGS_C_UID]-(pmuid)-[:IS_C_UID]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid)' +
        'return pmuid,pmid,aid,auid', { orderID: this.currentOrder })
      result.subscribe({
        onNext: record => {
          const pmUID = record.get('pmuid').properties
          const pmID = record.get('pmid').properties
          const aUID = record.get('auid').properties
          const aID = record.get('aid').properties
          // console.group('ProductionModules')
          // console.log('PM: ', pmID)
          // console.log('PMUID: ', pmUID)
          // console.log('AID: ', aID)
          // console.log('AUID: ', aUID)
          // console.groupEnd()
          this.pmItems.push({ children: [{ ...aUID, ...aID }], ...pmUID, ...pmID })
        }
      })
    },
    constructChildComponent () {
      let currentItem = this.pmItems[0]
      this.pmItems = this.pmItems.slice(1)
      const pmWithAllChildren = []
      this.pmItems.forEach((el, index, array) => {
        if (el.pmID === currentItem.pmID) {
          currentItem.children = [...currentItem.children, ...el.children]
          if (index === array.length - 1) {
            pmWithAllChildren.push(currentItem)
          }
        } else {
          pmWithAllChildren.push(currentItem)
          currentItem = this.pmItems[index]
        }
      })
      this.pmItems = pmWithAllChildren
      this.pmItems.forEach(el => {
        const pmID = el.pmID
        const assemblyUIDs = el.children.map(e => e.assemblyUID)
        const tokens = assemblyUIDs.map(e => this.$store.getters.getAssemblyToken(e))
        // console.group('UPDATE PRODUCT TOKENS')
        // console.log('pmID: ', pmID)
        // console.log('aUIDS: ', assemblyUIDs)
        // console.log('tokens: ', tokens)
        // console.groupEnd()
        this.$store.commit('updateProductTokenMap', { pmID: pmID, tokens: tokens })
      })
    },
    updateProductActor () {
      this.pmItems.forEach(el => {
        this.$store.commit('updateProductActor', { pmID: el.pmID, station: this.actor })
      })
    },
    craftTokenBatch () {
      this.pmItems.forEach(el => {
        const tokens = this.$store.getters.getProductTokens(el.pmID)
        const qtys = Array.from({ length: tokens.length }, x => 1)
        const serialNumber = el.pmUID
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
    }
  }
}
</script>
