<template>
  <b-container>
    <b-table
      ref="OrderList"
      show empty small
      sticky-header="300px"
      :fields="fields"
      :items="orders"
    >
    </b-table>
  </b-container>
</template>
<script>
export default {
  name: 'Order',
  props: ['neo4jDriver'],
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
    const session = this.neo4jDriver.session()
    session
      .readTransaction(this.retrieveOrder)
      .then(() => session.close())
  },
  methods: {
    retrieveOrder (tx) {
      const result = tx.run('MATCH (o:Order) return o')
      result.subscribe({
        onNext: record => {
          const order = record.get('o').properties
          this.orders.push({ order: order.orderID })
          this.$emit('pass-orders', this.orders)
        }
      })
    }
  }
}
</script>
