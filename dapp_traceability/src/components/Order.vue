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
import neo from '@/neo4jAPI.js'
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
    this.retrieveOrder()
    // this.getOrder()
    // const session = driver.session()
    // session
    //   .readTransaction(this.retrieveOrder)
    //   .then(() => session.close())
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
    async retrieveOrder () {
      // const result = tx.run('MATCH (o:Order) return o')
      const orders = await neo.getAllOrders()
      this.orders = [...orders, ...this.orders]
      // return result
      // result.subscribe({
      //   onNext: record => {
      //     const order = record.get('o').properties
      //     this.orders.push({ value: order.orderID, text: order.orderID, order: order.orderID })
      //   }
      // })
    }
    // getOrder () {
    //   getAllOrdersPromise().then((orders) => {
    //     this.orders = [...orders, ...this.orders]
    //   })
    // }
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
