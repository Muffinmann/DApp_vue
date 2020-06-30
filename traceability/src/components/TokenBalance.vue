<template>
  <div>
  <h5><b>Balance of Token</b></h5>
  <p>{{ balanceOfToken }}</p>
  <p>{{ getTokenBalance }}</p>
  <p>Current Token Supply: {{ nonce }}</p>
  </div>
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
    const activeAccount = this.$store.state.accounts.activeAccount
    console.log('AA----->', activeAccount)
    this.$store.dispatch('drizzle/REGISTER_CONTRACT', {
      contractName: args.contractName,
      method: args.method,
      methodArgs: [activeAccount, 1]
    })
    this.$store.dispatch('drizzle/REGISTER_CONTRACT', {
      contractName: args.contractName,
      method: 'nonce',
      methodArgs: ''
    })
  },
  computed: {
    ...mapGetters('contracts', ['getContractData']),
    ...mapGetters('drizzle', ['drizzleInstance']),
    getTokenBalance () {
      const dataKey = this.drizzleInstance
        .contracts.APTSC
        .methods.balanceOf
        .cacheCall(this.$store.state.accounts.activeAccount, 1)
      // console.log(dataKey)
      const balance = this.$store.state.contracts.instances.APTSC.balanceOf[dataKey].value
      // console.log('balance------>', balance)
      return balance
    },
    balanceOfToken () {
      // const activeAccount = this.$store.state.accounts.activeAccount
      return this.getContractData({
        contract: args.contractName,
        method: args.method
      })
    },
    nonce () {
      return this.getContractData({
        contract: 'APTSC',
        method: 'nonce'
      })
    }
  }
}
</script>
