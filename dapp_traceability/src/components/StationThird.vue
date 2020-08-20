<template>
  <b-col cols="6">
    <b-container>
      <h2 v-b-tooltip :title="actor">P3 Area</h2>
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
            <li v-for="(value, key) in row.item.children" :key="key">{{ value.assemblyID }} </li>
          </ul>
        </b-card>
      </template>
      </b-table>
      <button>Craft Token</button>
    </b-container>
  </b-col>
</template>
<script>
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
  watch: {
    currentOrder: 'initPM'
  },
  computed: {
    currentOrder () {
      return this.$store.state.selectedOrder
    }
  },
  methods: {
    retrievePM (tx) {
      const result = tx.run(
        'MATCH (:Product{productDefinitionID:$productId})-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid)' +
        'RETURN distinct(pmid), aid, auid',
        { productId: 'wh' + this.currentOrder.slice(1) })
      result.subscribe({
        onNext: record => {
          const pmID = record.get('pmid').properties
          const aUID = record.get('auid').properties
          const aID = record.get('aid').properties
          // console.group('ProductionModules')
          // console.log('PM: ', pm)
          // console.log('PMUID: ', pmUID)
          // console.log('AID: ', aID)
          // console.log('AUID: ', aUID)
          // console.groupEnd()
          this.pmItems.push({ children: [{ ...aUID, ...aID }], ...pmID })
        }
      })
    },
    constructChildComponent () {
      let currentItem = this.pmItems[0]
      const pmWithGroupChildren = []
      this.pmItems.forEach((el, index, array) => {
        if (el.pmID === currentItem.pmID) {
          currentItem.children = [...currentItem.children, ...el.children]
          if (index === array.length - 1) {
            pmWithGroupChildren.push(currentItem)
          }
        } else {
          pmWithGroupChildren.push(currentItem)
          currentItem = this.pmItems[index]
        }
      })
      this.pmItems = pmWithGroupChildren
    },
    updateProductActor () {
      this.pmItems.forEach(el => {
        this.$store.commit('updateProductActor', { pmID: el.pmID, station: this.actor })
      })
    },
    initPM () {
      this.pmItems = []
      const session = this.$store.state.neo4jDriver.session()
      session
        .readTransaction(this.retrievePM)
        .then(() => this.constructChildComponent())
        .then(() => this.updateProductActor())
        .then(() => session.close())
    }
  }
}
</script>
