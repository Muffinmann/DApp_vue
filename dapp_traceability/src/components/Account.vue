<template>
  <div>
    <h2><b>Active Account</b></h2>
    <div>
      <p>{{ activeAccount }}</p>
      <p>{{ accountlist }}</p>
    </div>
    <div>Balance: {{ activeBalanceInETH }} ETH</div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Account',
  computed: {
    ...mapGetters('accounts', ['activeAccount', 'activeBalance']),
    ...mapGetters('drizzle', ['drizzleInstance']),
    activeBalanceInETH () {
      return this.fromWeiToETH(this.activeBalance)
    },
    accountlist: function () {
      return this.$store.getters['account/getAccount']
    }
    // this is equal to:
    // activeAccount: function() { return this.$store.getters['accounts/activeAccount'] },
  },
  methods: {
    fromWeiToETH (balance) {
      return this.drizzleInstance.web3.utils.fromWei(balance, 'ether')
    }
  }
}
</script>
