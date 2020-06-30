<template>
  <section></section>
</template>

<script>
import Toasted from 'vue-toasted'
import Vue from 'vue'

Vue.use(Toasted)

export default {
  mounted () {
    const contractEventHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'TransferSingle') {
        // console.log('contractName------>', contractName)
        // console.log('eventName------>', eventName)
        // console.log('data------>', data)
        const display = `${contractName}|${eventName}:(token:${data._id}|${data._value})---> ${data._to}`
        const subOptions = {
          duration: 5000,
          action: {
            text: 'Cancel',
            onClick: (e, toastObject) => {
              toastObject.goAway(0)
            }
          }
        }
        this.$toasted.show(display, subOptions)
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { contractEventHandler(payload) })
  }
}
</script>
