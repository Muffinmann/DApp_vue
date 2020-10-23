<template>
  <b-container>
    <h2 v-b-tooltip :title="actor">{{ area.toUpperCase() }} Area</h2>
    <p>Current Order: {{currentOrder}}| Product: {{ currentOrder ? 'wh' + currentOrder.slice(1): null }}</p>

    <b-progress :max="maxStep" animated>
      <b-progress-bar :value="step" variant="info" :label="`${((step / maxStep) * 100).toFixed(1)}% | ${area}`"></b-progress-bar>
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
      ref="`${area}`Items"
      show-empty small
      sticky-header="500px"
      select-mode="single"
      :selectable="isSelectable"
      :fields="fields"
      :items="items"
      :filter="useFilter"
      :filter-function="multipleItemFilter"
      :busy="busy"
      @row-selected="onRowSelected"
    >
      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>

      <template v-slot:cell(assemblyID)="row">
        {{row.value}} <span id="icon"><b-icon :icon="useIcon" @click="row.toggleDetails(); toggleDetails = ! toggleDetails"></b-icon></span>
      </template>
      <template v-slot:cell(pmID)="row">
        {{row.value}} <span id="icon"><b-icon :icon="useIcon" @click="row.toggleDetails(); toggleDetails = ! toggleDetails"></b-icon></span>
      </template>

      <template v-slot:row-details="row">
        <b-card>
          <b-list-group>
            <b-list-group-item v-for="(value, key) in itemDetails(row.item)" :key="key">
            {{ key }}: {{ value }}
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </template>

    </b-table>

    <b-button-group>
      <b-button @click="mintFunc">{{ area === 'p1' ? 'Create' : 'Craft'}} Token</b-button>
      <b-button @click="detachToken">Detach Token</b-button>
      <b-button v-if="area !== 'p3'" @click="transferFunc">Transfer Token</b-button>
      <b-button v-if="area === 'p3'" @click="finalMountFunc">Final Mount</b-button>
    </b-button-group>

  </b-container>
</template>

<script>
import AreaMixin from '@/components/mixins/AreaMixin.vue'
export default {
  mixins: [AreaMixin],
  props: {
    busy: {
      type: Boolean,
      default: false
    },
    step: {
      type: [String, Number],
      default: 0
    },
    maxStep: {
      type: [String, Number],
      default: 100
    },
    currentOrder: String,
    crossFilter: {
      type: [String, Array],
      default: ''
    },
    actor: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true,
      default: 'p1'
    },
    isSelectable: {
      type: Boolean,
      default: false
    },
    fields: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    mintFunc: Function,
    detachFunc: Function,
    transferFunc: Function,
    finalMountFunc: Function
  },
  data () {
    return {
      toggleDetails: false,
      filter: '',
      localItems: this.items
    }
  },
  watch: {
    useFilter: 'updateFilter'
  },
  computed: {
    useFilter () {
      return this.crossFilter ? this.crossFilter : this.filter
    },
    useIcon () {
      return this.toggleDetails ? 'chevron-contract' : 'chevron-expand'
    }
  },
  methods: {
    itemDetails (item) {
      const filterOut = ['pmID', 'assemblyID', 'tokenID', 'tokenSupply', '_showDetails']
      const details = {}
      const keys = Object.keys(item).filter(key => !filterOut.some(i => i === key)).sort()
      keys.forEach(k => { details[k] = item[k] })
      if (details.children) {
        details.children = details.children.map(child => child.assemblyUID)
      }
      return details
    },
    detachToken () {
      let detachPool
      if (this.useFilter) {
        detachPool = this.items
          .filter(i => this.multipleItemFilter(i, this.useFilter))
          .map(i => i.tokenID)
          .filter(t => t !== null)
      } else {
        detachPool = this.items
          .map(i => i.tokenID)
          .filter(t => t !== null)
      }
      this.detachFunc(detachPool).then(() => this.$emit('refresh'))
    },
    onRowSelected (item) {
      this.$emit('rowSelected', item)
    },
    updateFilter () {
      this.$emit('filter', this.useFilter)
    }
  }
}
</script>
<style scoped>
  #icon {
    cursor: pointer
  }
</style>
