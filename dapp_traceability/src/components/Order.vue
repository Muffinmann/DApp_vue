<template>
  <b-col cols="4">
    <b-card title="Current Order">
      <b-form-select v-model="selectOrder" :options="orders"></b-form-select>
      <b-list-group>
        <b-list-group-item><small> ProductID: {{ selectOrder ? `wh${selectOrder.slice(1)}` : null }}</small></b-list-group-item>
        <b-list-group-item><small>ProductToken: {{productToken}}</small></b-list-group-item>
      </b-list-group>
    </b-card>
  </b-col>
</template>
<script>
import neo from '@/neo4jAPI.js'
export default {
  prop: {
    refreshTrigger: Boolean
  },
  data () {
    return {
      orders: [{ value: null, text: 'Please select an order', disabled: true }],
      selectOrder: null,
      productToken: null
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
    selectOrder: 'onSelected',
    refreshTrigger: 'refresh'// TODO: use store to trigger refresh
  },
  methods: {
    async refresh () {
      const [t] = await neo.getProductToken(this.selectOrder)
      this.productToken = t ? t.properties.tokenID : null
    },
    onSelected () {
      this.$store.commit('onOrderSelected', { order: this.selectOrder })
      this.refresh()
    },
    async retrieveOrder () {
      const orders = await neo.getAllOrders()
      this.orders = [...orders, ...this.orders]
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
