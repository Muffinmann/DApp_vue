<template>
  <b-toast id="create">
    <template v-slot:toast-title>
      <div class="d-flex flex-grow-1 align-items-baseline">
        <strong class="mr-auto">Toast title</strong>
        <small class="text-muted mr-2">time</small>
      </div>
    </template>
    {{ toastMsg }}
  </b-toast>
</template>

<script>
import Toasted from 'vue-toasted'
import Vue from 'vue'

Vue.use(Toasted)

export default {
  data () {
    return {
      toastMsg: ''
    }
  },
  mounted () {
    const contractEventHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'TransferSingle') {
        this.toastMsg = `${contractName}|${eventName}:(token:${data._id}|${data._value})---> ${data._to}`
        // const subOptions = {
        //   toaster: 'b-toaster-top-right',
        //   title: 'Token Created',
        //   autoHideDelay: 1500
        // }
        // this.$bvToast.toast(display, subOptions)
        this.$bvToast.show('create')
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { contractEventHandler(payload) })
  }
}
</script>
