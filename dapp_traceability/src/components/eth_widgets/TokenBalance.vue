<template>
  <b-row class="mx-3">
      <p>Current Nonce: {{ nonce }}</p>
  </b-row>
</template>
<script>
import { mapGetters } from 'vuex'

const args = {
  contractName: 'APTSC',
  method: 'balanceOf',
  methodArgs: ''
}
// TODO: balance table of token id
export default {
  name: 'TokenBalance',
  created () {
    // const activeAccount = this.$store.state.accounts.activeAccount
    // this.$store.dispatch('drizzle/REGISTER_CONTRACT', {
    //   contractName: args.contractName,
    //   method: args.method,
    //   methodArgs: [activeAccount, 190]
    // })
    this.$store.dispatch('drizzle/REGISTER_CONTRACT', {
      contractName: args.contractName,
      method: 'nonce',
      methodArgs: ''
    })
  },
  computed: {
    ...mapGetters('contracts', ['getContractData']),
    ...mapGetters('drizzle', ['drizzleInstance']),
    // getTokenBalance () {
    //   const dataKey = this.drizzleInstance
    //     .contracts.APTSC
    //     .methods.balanceOf
    //     .cacheCall(this.$store.state.accounts.activeAccount, 190)
    //   // console.log(dataKey)
    //   const balance = this.$store.state.contracts.instances.APTSC.balanceOf[dataKey].value
    //   // console.log('balance------>', balance)
    //   return balance
    // },
    // balanceOfToken () {
    //   // const activeAccount = this.$store.state.accounts.activeAccount
    //   return this.getContractData({
    //     contract: args.contractName,
    //     method: args.method
    //   })
    // },
    nonce () {
      return this.getContractData({
        contract: 'APTSC',
        method: 'nonce'
      })
    }
  }
}
</script>
