<template>
  <b-toast id="toast">
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
import app from '@/js/web3Facade.js'

Vue.use(Toasted)

export default {
  data () {
    return {
      toastMsg: ''
    }
  },
  mounted () {
    app.subscribeEvent('TransferSingle', data => {
      this.toastMsg = `new Token minted: (token ${data._id}|${data._value})---> ${data._to}`
      this.$bvToast.show('toast')
    })
    app.subscribeEvent('controllerUpdate', data => {
      this.toastMsg = `controller updated: (token ${data._id}|${data._type})---> ${data._updatedAddress}`
      this.$bvToast.show('toast')
    })
    // app.subscribeEvent('TransferBatch', data => {
    //   this.toastMsg = `new Token minted: (token ${data._id}|${data._value})---> ${data._to}`
    //   this.$bvToast.show('toast')
    // })
  }
}
</script>
