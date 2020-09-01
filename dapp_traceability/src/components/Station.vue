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
// import neo4j from 'neo4j-driver'
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
      pmItems: []
    }
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'serialNumber' && data._actor === this.actor) {
        console.group('>>> P2 serial number <<<')
        console.log('data: ', data)
        console.groupEnd()
        const session = this.$store.state.neo4jDriver.session()
        session
          .writeTransaction(tx => this.attachTokenToPM(tx, data._id, data._serialNumber))
          .then(() => session.close())
          .then(() => this.initPM())
      } else if (eventName === 'TransferBatch' && data._to === this.actor) {
        console.group(`>>> Transfer Batch to  ${this.area.toUpperCase()} <<< `)
        console.log(data)
        console.groupEnd()
        this.updateTokenSupply(data._ids, data._values)
      }
      // // const session = this.$store.state.neo4jDriver.session({ defaultAccessMode: neo4j.WRITE })
      // switch (eventName) {
      //   // case 'serialNumber': {
      //   //   console.group('>>> P2 serial number <<<')
      //   //   console.log('data: ', data)
      //   //   console.groupEnd()
      //   //   const tokenID = data._id
      //   //   const tokenSupply = data._value
      //   //   this.tokenSupplyMap[tokenID] = tokenSupply
      //   //   console.log('token supply: ', this.tokenSupplyMap)
      //   //   // session
      //   //   //   .writeTransaction(tx => this.attachTokenToPM(tx, data._id, data._serialNumber))
      //   //   //   .then(() => session.close())
      //   //   break
      //   // }
      //   case 'controllerUpdate':
      //     if (data._type === 'removed') {
      //     }
      //     console.group('ControllerUpdate')
      //     console.log('control update data:', data)
      //     console.groupEnd()
      //     break
      // }
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
      this.toggleBusy('start')
      this.pmItems = []
      const session = this.$store.state.neo4jDriver.session()
      session
        .readTransaction(this.retrievePM)
        .then(() => this.collectChildren(this.pmItems))
        .then(() => this.toggleBusy('end'))
        .then(() => this.requestToken())
        .then(() => session.close())
    },
    retrievePM (tx) {
      let result
      switch (this.area) {
        case 'p2': {
          result = tx.run(
            'MATCH(o:Order{orderID:$orderID})-[:CONTAINS_O_SO]-()-[:LOGS_C_UID]-(pmuid)-[:IS_C_UID]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
            'WITH pmuid,pmid,aid,auid OPTIONAL MATCH (pmid)-[:HAS_TOKEN]-(t:Token) ' +
            'RETURN pmuid, pmid, aid, auid, t', { orderID: this.currentOrder })
          break
        }
        case 'p3': {
          result = tx.run(
            'MATCH r=(pm)-[:CO_MAPPING_SUBORDER]-()-[:CONTAINS_O_SO]-(:Order{orderID:$orderID}) ' +
            'WITH collect(pm) AS pms ' +
            'MATCH(:Product{productDefinitionID:$productID})-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
            'WHERE NOT pmid IN pms ' +
            'WITH pmid, aid, auid OPTIONAL MATCH (pmid)-[:HAS_TOKEN]-(t:Token) ' +
            'RETURN pmid, aid, auid, t',
            { orderID: this.currentOrder, productID: 'wh' + this.currentOrder.slice(1) })
          break
        }
      }
      result.subscribe({
        onNext: record => {
          const pmID = record.get('pmid').properties
          const aUID = record.get('auid').properties
          const aID = record.get('aid').properties
          const token = record.get('t') ? record.get('t').properties : { tokenID: null, tokenSupply: null }
          // console.group('ProductionModules')
          // console.log('PM: ', pmID)
          // console.log('PMUID: ', pmUID)
          // console.log('AID: ', aID)
          // console.log('AUID: ', aUID)
          // console.groupEnd()
          if (this.area === 'p2') {
            const pmUID = record.get('pmuid').properties
            this.pmItems.push({ children: [{ ...aUID, ...aID }], ...pmUID, ...pmID, ...token })
          } else if (this.area === 'p3') {
            this.pmItems.push({ children: [{ ...aUID, ...aID }], ...pmID, ...token })
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
        pmItems.forEach(pm =>
          pm.children.forEach(child => {
            const token = this.$store.getters.getAssemblyToken(child.assemblyUID)
            this.$store.commit('updateTokenProductMap', { tokenID: token.tokenID, pmID: pm.pmID, area: this.area })
          })
        )
        this.pmItems = pmItems
      } else if (idx.length !== 1) {
        idx.shift() // exclude the first item from the iteration
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
    requestToken () {
      const tokens = this.pmItems
        .map(pm => pm.children)
        .map(children => children.map(child => child.assemblyUID)).flat()
        .map(uid => this.$store.getters.getAssemblyToken(uid).tokenID)
      this.$store.commit('requestToken', { tokens: tokens, newActor: this.actor, area: this.area })
    },
    craftTokenBatch () {
      let craftPool = []
      if (this.filter) {
        craftPool = this.pmItems.filter(row =>
          Object.keys(row).some(key =>
            String(row[key]).toLowerCase().indexOf(this.filter) > -1)
        )
      } else {
        craftPool = this.pmItems
      }
      craftPool.forEach(pm => {
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
    updateTokenSupply (_ids, _values) {
      // const tokenSupplyChange = _ids.map((id, index) => ({ tokenID: id, value: values[index]}))
      const tokenSupplyChange = _ids.map((id, index) => {
        const usedInPM = this.$store.getters.getTokenUsedInPM(id, this.area)
        return { tokenID: id, to: usedInPM, amount: parseInt(_values[index]) }
      })
      console.log('TOKEN SUPPLY CHANGE: ', tokenSupplyChange)
      const session = this.$store.state.neo4jDriver.session()
      session
        .run('UNWIND $changes as change ' +
          'MATCH (t:Token{tokenID: change.tokenID})-[:HAS_TOKEN]-()-[:CONTAINS_C_ASSEMBLY]-(p:PM{pmID: change.to}) ' +
          'MERGE (t)-[:TRANSFER_TO{quantity: change.amount}]->(p) ' +
          'ON CREATE SET t.tokenSupply = t.tokenSupply - change.amount ' +
          'ON MATCH SET t.tokenSupply = t.tokenSupply - change.amount', { changes: tokenSupplyChange })
        .then(() => session.close())
        .then(() => this.$store.commit('autoRefresh'))
    },
    attachTokenToPM (tx, tokenID, pmUID) {
      return tx.run(
        'MATCH (b:pmUID {pmUID: $pmUID})-[:IS_C_UID]-(a:PM)' +
        'MERGE (a)-[:HAS_TOKEN]->(t:Token {tokenID: $tokenID})-[:HAS_PMUID]->(b) ' +
        'ON CREATE SET t.tokenSupply = 1 ' +
        'ON MATCH SET t.tokenSupply = t.tokenSupply + 1',
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
    },
    childrenFilter (row, toggleDetail) {
      if (toggleDetail) {
        const children = row.item.children.map(el => el.assemblyID)
        this.$store.commit('updateChildrenFilter', children.join(','))
      } else {
        this.$store.commit('updateChildrenFilter', '')
      }
    }
  }
}
</script>
