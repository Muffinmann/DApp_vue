<template>
  <b-col cols="6">
    <b-container>
        <h2 v-b-tooltip :title="actor"><b>P1 Area</b></h2>
        <p>Current Order: {{currentOrder}} | Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>
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
          :filter="filter"
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
            {{ row.value }} <b-icon icon="arrows-expand" @click="row.toggleDetails"></b-icon>
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
        <b-button class="mx-3" @click="detachAllTokens">Detach All Tokens</b-button>
        <b-button class="mx-3" @click="transferToken">Transfer Token</b-button>

        <TokenBalance/>

    </b-container>
  </b-col>
</template>

<script>
// import neo4j from 'neo4j-driver'
import TokenBalance from '@/components/eth_widgets/TokenBalance.vue'
import { mapGetters } from 'vuex'
export default {
  name: 'Station',
  props: ['actor'],
  components: {
    TokenBalance
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
        'tokenID',
        'tokenSupply'
      ],
      assemblyItems: [],
      tokenIndexMap: {},
      tokenSupplyMap: {},
      mintPool: [],
      attatchToken: []
    }
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      // const session = this.$store.state.neo4jDriver.session({ defaultAccessMode: neo4j.WRITE })
      // switch (eventName) {
      //   case 'TransferSingle':
      //     const tokenID = data._id
      //     const tokenSupply = data._value
      //     this.tokenSupplyMap[tokenID] = tokenSupply
      //     break
      //   case 'serialNumber':
      //     const tokenID = data._id
      //     const tokenSupply = this.tokenSupplyMap[data._id]
      //     const serialNumber = data._serialNumber
      //     session
      //       .writeTransaction(tx => this.attachTokenToAssembly(tx, tokenID, tokenSupply, serialNumber))
      //       .then(() => this.updateTokenInfo())
      //       .then(() => session.close())
      //     break
      //   case 'controllerUpdate':
      //     if (data._type === 'removed') {
      //     }
      //     console.group('ControllerUpdate')
      //     console.log('control update data:', data)
      //     console.groupEnd()
      //     break
      // }
      if (eventName === 'TransferSingle') {
        const tokenID = data._id
        const tokenSupply = data._value
        this.tokenSupplyMap[tokenID] = tokenSupply
      } else if (eventName === 'serialNumber') {
        const tokenID = data._id
        const tokenSupply = this.tokenSupplyMap[tokenID]
        const serialNumber = data._serialNumber
        const timeStamp = new Date().toUTCString() // GMT time: locally in GMT +02:00 and it's 07:50, the time stamp is then 05:50
        this.attatchToken.push({
          serialNumber: serialNumber,
          tokenID: tokenID,
          tokenSupply: tokenSupply,
          timeStamp: timeStamp
        })
        if (serialNumber === this.mintPool.slice(-1)[0].assemblyUID) { // update neo4j database after the last token is created
          this.updateTokenInfo()
        }
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    currentOrder () {
      return this.$store.state.selectedOrder
    }
  },
  watch: {
    currentOrder: 'initAssembly'
  },
  methods: {
    initAssembly () {
      this.toggleBusy('start')
      this.assemblyItems = []
      const session = this.$store.state.neo4jDriver.session()
      session
        .readTransaction(this.getAssembly)
        .then(() => session.close())
        .then(() => this.toggleBusy('end'))
    },
    updateTokenInfo () {
      const session1 = this.$store.state.neo4jDriver.session()
      session1
        .run('UNWIND $items as item ' +
          'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly) ' +
          'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(:Token {tokenID: item.tokenID, tokenSupply:item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a)', { items: this.attatchToken })
        .then(() => this.initAssembly())
        .then(() => session1.close())
      // const session2 = this.$store.state.neo4jDriver.session()
      // session2
      //   .run('UNWIND $items as item ' +
      //     'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly) ' +
      //     'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(:Token {tokenID: item.tokenID, tokenSupply:item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a)', { items: this.attatchToken.slice(this.attatchToken.length / 2) })
      //   .then(() => this.initAssembly())
      //   .then(() => session2.close())
    },
    mintToken () {
      this.mintPool = this.assemblyItems.filter(row => row.tokenID === null)
      this.mintPool.forEach(el => this.createToken(el.batchsize, el.assemblyUID))
    },
    transferToken () {
      this.assemblyItems.forEach((el, index) => {
        if (el.tokenID) {
          const newController = this.findController(el.pmID)
          this.transferControl(el.tokenID, newController)
        }
      })
    },
    /**
    * NEO4J FUNCTIONS
    */
    getAssembly (tx) {
      const result = tx.run(
        // TODO: DISTINCT aid
        'MATCH(o:Order{orderID:$orderID})-[:CO_MAPPING_ORDER]-()-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid)' +
        'WITH DISTINCT aid, auid OPTIONAL MATCH (auid)-[:HAS_WUID]-(t:Token)' +
        'RETURN t,auid,aid', { orderID: this.currentOrder })
      result.then(({ records }) => {
        const assemblyItems = []
        records.forEach(record => {
          const token = record.get('t') ? record.get('t').properties : { tokenID: null, tokenSupply: null }
          const aid = record.get('aid').properties
          const auid = record.get('auid').properties
          assemblyItems.push({ ...aid, ...auid, ...token })
          this.$store.commit('updateAssemblyTokenMap', { aUID: auid.assemblyUID, token: token })
          this.$store.commit('updateTokenSupplyMap', { tokenID: token.tokenID, tokenSupply: token.tokenSupply })
        })
        this.assemblyItems = assemblyItems
      })
    },
    // getAssemblyToken (tx, assembly, index) {
    //   const result = tx.run('MATCH (a:AssemblyUID{assemblyUID: $UID})<-[:HAS_WUID]-(t:Token) return t', { UID: assembly.assemblyUID })
    //   result.subscribe({
    //     onNext: record => {
    //       // console.log('RECORD: ', record)
    //       const token = record.get('t').properties
    //       // console.group('TOKEN FOUND: ')
    //       // console.log(assembly.assemblyUID, ' has token: ')
    //       // console.log(token)
    //       // console.groupEnd()
    //       const tokenID = token.tokenID
    //       const tokenSupply = token.tokenSupply
    //       const aUID = this.assemblyItems[index].assemblyUID
    //       this.assemblyItems[index].tokenID = tokenID
    //       this.assemblyItems[index].tokenSupply = tokenSupply
    //       this.tokenIndexMap[tokenID] = index
    //       this.$store.commit('updateAssemblyTokenMap', { aUID: aUID, tokenID: tokenID })
    //       this.$store.commit('updateTokenSupplyMap', { tokenID: tokenID, tokenSupply: tokenSupply })
    //     }
    //   })
    // },
    detachAllTokens () {
      const session = this.$store.state.neo4jDriver.session()
      session
        .run(
          'MATCH (a:AssemblyUID)-[:HAS_WUID]-(b:Token)' +
          'DETACH DELETE b')
        .then(() => session.readTransaction(this.getAssembly))
        .then(() => session.close())
    },
    attachTokenToAssembly (tx, tokenID, tokenSupply, serialNumber, timeStamp) {
      // TODO: property of [:HAS_TOKEN]
      // console.log('TIME------>', new Date().toUTCString())
      return tx.run(
        'MATCH (a:AssemblyUID {assemblyUID: $serialNumber})-[:IS_C_UID]-(b:Assembly)' +
        'MERGE (b)-[:HAS_TOKEN{timeStamp:$timeStamp}]->(t:Token {tokenID: $tokenID, tokenSupply:$tokenSupply})-[:HAS_WUID{timeStamp:$timeStamp}]->(a)',
        {
          serialNumber: serialNumber,
          tokenID: tokenID,
          tokenSupply: tokenSupply,
          timeStamp: timeStamp
        }
      )
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
    transferControl (id, newController) {
      this.drizzleInstance
        .contracts.APTSC
        .methods.transferControl
        .cacheSend(id, newController)
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
    findController (pmID) {
      return this.$store.getters.getProductActor(pmID)
    },
    detailFilter (item) {
      return {
        AssemblyUID: item.assemblyUID,
        BatchSize: item.batchsize,
        BatchSplit: item.batchsplit,
        MaterialType: item.materialtype
      }
    }
  }
}
</script>

<style scoped>

</style>
