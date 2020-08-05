<template>
  <div>
    <h2><b>Active Account</b></h2>
    <div>
      <p>{{ activeAccount }}</p>
      <p>-- {{ account }} --</p>
    </div>
    <div>Balance: {{ activeBalanceInETH }} ETH</div>
    <div><button @click="setActiveAccount">Set Active Account</button></div>
  </div>
</template>
<script>
import { mapGetters, mapMutations } from 'vuex'
export default {
  name: 'Account',
  created () {
    // console.log('state before------>', this.$store)
    const balance = this.$store.state.accounts.accountBalances
    this.$store.dispatch('accounts/SET_ACCOUNTS', {
      activeAccount: '0x76471f9b4A5cbbaC6CE3Cd504ad2aFB702094f80',
      accountBalances: balance
    })
    // console.log('state after------>', this.$store)
  },
  computed: {
    ...mapGetters('accounts', ['activeAccount', 'activeBalance']), // This is equal to: activeAccount () { return this.$store.getters['accounts/activeAccount'] }
    ...mapGetters('drizzle', ['drizzleInstance']),
    activeBalanceInETH () {
      return this.fromWeiToETH(this.activeBalance)
    },
    account () {
      console.log('acctive account------>', this.$store.getters['accounts/activeAccount'])
      console.log('account balances------>', this.$store.state.accounts.accountBalances)
      return this.$store.getters['accounts/activeAccount']
    }
  },
  methods: {
    ...mapMutations('accounts', ['SET_ACCOUNTS']),
    fromWeiToETH (balance) {
      return this.drizzleInstance.web3.utils.fromWei(balance, 'ether')
    },
    setActiveAccount () {
      this.setAccount({
        activeAccount: '0x76471f9b4A5cbbaC6CE3Cd504ad2aFB702094f80',
        accountBalances: '1000000000000'
      })
    }
  }
}
</script>
