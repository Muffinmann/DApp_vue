<template>
  <b-container fluid>
    <h1>neo4j</h1>
    <b-row align-h="center">
      <b-col cols="3" class="my-1" offset="1">
        <b-form-group class="mb-0">
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
        </b-form-group>
      </b-col>

      <b-col cols="3" class="my-1" offset="3">
        <b-form-group class="mb-0">
          <b-input-group size="sm">
            <b-form-input
            v-model="currentOrder"
            @keyup.enter="queryPM"
            placeholder="Order ID"
            ></b-form-input>
            <b-input-group-append>
            <b-button variant="info" @click="queryPM" size="sm">get Order PMs</b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row align-h="center" class="mt-2">
      <span v-if="currentOrder">{{ currentOrder }}</span>
      <span v-if="currentPM">--->{{ currentPM }}</span>
      <span v-if="currentMaterial">--->{{ currentMaterial }}</span>
    </b-row>
<!--PM table-->
    <b-row class="mx-3">
      <b-col cols=4 class="my-4" offset="1">
        <b-table
          ref="selectableTable"
          selectable
          show-empty small
          sticky-header="500px"
          select-mode="single"
          :items="PMs"
          :fields="fields"
          :filter="filter"
          @row-selected="onRowSelected"
        >
          <template v-slot:cell(index)="row">
            {{ row.index + 1 }}
          </template>
          <template v-slot:cell(pmID)="row">
            {{ row.value }}
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" @click="row.toggleDetails">
              {{ row.detailsShowing ? 'Hide' : 'Show' }} Details
            </b-button>
          </template>
          <template v-slot:row-details="row">
            <b-card>
              <ul>
                <li v-for="(value, key) in row.item" :key="key">{{ key }}:{{ value }} </li>
              </ul>
            </b-card>
          </template>
        </b-table>
      </b-col>
<!--Component table of selected PM-->
      <b-col cols=4 class="my-4">
        <b-table
          ref="pmTable"
          selectable show-empty small
          sticky-header="500px"
          select-mode="single"
          :items="pmComponents"
          :fields="compFields"
          @row-selected="onRowSelectedMaterial"
        >
          <template v-slot:cell(comp)="row">
            {{ row.value }}
          </template>
        </b-table>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import neo4j from 'neo4j-driver'

export default {
  name: 'neo4j',
  data () {
    return {
      fields: [
        'index',
        {
          key: 'pmID',
          label: 'Production Module',
          sortable: true,
          sortDirection: 'desc'
        },
        'actions'
      ],
      compFields: [{ key: 'comp', label: 'Material' }],
      filter: null,
      driver: null,
      PMs: [],
      currentOrder: '',
      currentPM: null,
      currentMaterial: null,
      pmComponents: []
    }
  },
  created: function () {
    this.connectDriver()
  },
  watch: {
    currentPM: 'choosePM'
  },
  methods: {
    onRowSelected (pm) {
      this.currentPM = pm[0].pmID
    },
    onRowSelectedMaterial (m) {
      this.currentMaterial = m[0].comp
    },
    connectDriver () {
      const self = this
      const connection = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'neo4jpassword'))
      self.driver = connection
    },
    queryPM () {
      const session = this.driver.session()
      const order = this.currentOrder
      const self = this
      session
        .run('match (pm:PM)<-[:CONTAINS_C_PM]-(:FM)<-[:CONTAINS_C_FM]-(:Product)<-[:CO_MAPPING_ORDER]-(o:Order) where o.orderID= $orderId return pm', { orderId: order })
        .then(function (result) {
          var pmArr = []
          result.records.forEach(function (record) {
            pmArr.push(
              {
                pmID: record._fields[0].properties.pmID,
                pmDuration: record._fields[0].properties.duration
              }
            )
            // pm.Arr.push(record._fields[0].properties)
          })
          self.PMs = pmArr
        })
        .then(() => session.close())
        .catch(function (err) {
          console.log(err)
        })
    },
    choosePM () {
      const session = this.driver.session()
      const pmid = this.currentPM
      const self = this
      session
        .run('optional match (p:PM{pmID:$pmid})-[:CONTAINS_C_MATERIAL]-(m) optional match (q:PM{pmID:$pmid})-[:CONTAINS_C_ASSEMBLY]-(a) return m,a', { pmid: pmid })
        .then(function (result) {
          var children = []
          result.records.forEach(function (record) {
            var material = record._fields[0]
            var assembly = record._fields[1]
            if (material) {
              children.push(material.properties.materialID)
            }
            if (assembly) {
              children.push(assembly.properties.assemblyID)
            }
          })
          var subcomponents = [...new Set(children)]
          self.pmComponents = subcomponents.map(element => ({ comp: element }))
        })
        .catch(function (err) {
          console.log(err)
        })
    }
  }
}
</script>

<style scoped>
.select-content {
  background: #EEE;
  cursor: pointer;
}

.active {
  background: lightblue;
}
</style>
