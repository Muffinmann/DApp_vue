<template>
  <b-container header="Actor Account Balances">
    <ol>
      <li v-for="(value, key) in accountBalances" v-b-tooltip.hover :title="key" :key="key">{{ addressToMachineName(key) }}: {{ fromWeiToETH(value) }} ETH</li>
    </ol>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Account',
  created () {

  },
  computed: {
    // ...mapGetters('accounts', ['activeAccount', 'activeBalance']), // This is equal to: activeAccount () { return this.$store.getters['accounts/activeAccount'] }
    ...mapGetters('drizzle', ['drizzleInstance']),
    accountBalances () {
      console.log('STORE===>', this.$store)
      const accountBalances = {}
      const allBalances = this.$store.state.accounts.accountBalances
      const keys = Object.keys(allBalances).slice(0, -1)
      keys.forEach(key => {
        accountBalances[key] = allBalances[key]
      })
      return accountBalances
    }

  },
  methods: {
    addressToMachineName (address) {
      const mapTable = {
        '0x9d56414F2218e4F33d474ad29A643DF9adB01F73': 'P1',
        '0x76471f9b4A5cbbaC6CE3Cd504ad2aFB702094f80': 'P2',
        '0x00E97eF3Ce4B250421C593C4Cd064E69Fb6eEAC2': 'P3',
        '0xF5b013C3f7F7f6db154bF9a0E7a24F0e25be2548': 'MES'
      }
      return mapTable[address]
    },
    fromWeiToETH (balance) {
      return this.drizzleInstance.web3.utils.fromWei(balance, 'ether')
    }
  }
}
</script>
