<template>
  <b-container>
    <p>Product: {{ currentOrder ? 'wh' + currentOrder.slice(1) : null }}</p>
    <p>Token: {{ productToken ? productToken : null }}</p>
  </b-container>
</template>

<script>
export default {
  name: 'FinalProduct',
  computed: {
    currentOrder () {
      return this.$store.state.selectedOrder ? this.$store.state.selectedOrder : null
    },
    productToken () {
      const productID = this.$store.state.selectedOrder ? 'wh' + this.$store.state.selectedOrder.slice(1) : null
      return this.$store.state.productTokenMap[productID]
    }
  }
}
</script>
