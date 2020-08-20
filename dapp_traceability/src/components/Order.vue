<template>
  <b-container>
    <b-table
      ref="OrderList"
      show empty small
      selectable
      sticky-header="300px"
      select-mode="single"
      @row-selected="onRowSelected"
      :fields="fields"
      :items="orders"
    >
    </b-table>
  </b-container>
</template>
<script>
export default {
  data () {
    return {
      fields: [
        {
          key: 'order',
          sortable: true,
          sortDirection: 'asc'
        }
      ],
      orders: []
    }
  },
  created () {
    const session = this.$store.state.neo4jDriver.session()
    session
      .readTransaction(this.retrieveOrder)
      .then(() => session.close())
  },
  methods: {
    onRowSelected (o) {
      this.$store.commit('selectOrder', o[0].order)
    },
    retrieveOrder (tx) {
      const result = tx.run('MATCH (o:Order) return o')
      result.subscribe({
        onNext: record => {
          const order = record.get('o').properties
          this.orders.push({ order: order.orderID })
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
