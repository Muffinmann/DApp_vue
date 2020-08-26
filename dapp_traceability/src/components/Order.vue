<template>
  <b-container>
    <!-- <b-table
      ref="OrderList"
      show empty small
      selectable
      sticky-header="300px"
      select-mode="single"
      @row-selected="onRowSelected"
      :fields="fields"
      :items="orders"
    >
    </b-table> -->
    <b-form-select v-model="selectOrder" :options="orders"></b-form-select>
    <div>Selected: {{ selectOrder }}</div>
  </b-container>
</template>
<script>
export default {
  data () {
    return {
      // fields: [
      //   {
      //     key: 'name',
      //     sortable: true,
      //     sortDirection: 'asc'
      //   }
      // ],
      orders: [{ value: null, text: 'Please select an order', disabled: true }],
      selectOrder: null
    }
  },
  created () {
    const session = this.$store.state.neo4jDriver.session()
    session
      .readTransaction(this.retrieveOrder)
      .then(() => session.close())
  },
  watch: {
    selectOrder: 'onRowSelected'
  },
  methods: {
    onRowSelected () {
      // this.selectOrder = o[0].order
      this.$store.commit('selectOrder', this.selectOrder)
    },
    /**
    * Neo4j functions *
    */
    retrieveOrder (tx) {
      const result = tx.run('MATCH (o:Order) return o')
      result.subscribe({
        onNext: record => {
          const order = record.get('o').properties
          this.orders.push({ value: order.orderID, text: order.orderID, order: order.orderID })
        }
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
