<template>
  <b-container>
    <h2><b>Dashboard</b></h2>
    <b-row align-h="center">
      <ol>
        <li v-for="(value, key) in accountBalances" v-b-tooltip.hover :title="key" :key="key">{{ addressToMachineName(key) }}: {{ fromWeiToETH(value) }} ETH</li>
      </ol>
    </b-row>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Dashboard',
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    accountBalances () {
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
    fromWeiToETH (balance) {
      return this.drizzleInstance.web3.utils.fromWei(balance, 'ether')
    },
    addressToMachineName (address) {
      const mapTable = {
        '0x9d56414F2218e4F33d474ad29A643DF9adB01F73': 'P1',
        '0x76471f9b4A5cbbaC6CE3Cd504ad2aFB702094f80': 'P2',
        '0x00E97eF3Ce4B250421C593C4Cd064E69Fb6eEAC2': 'P3',
        '0xF5b013C3f7F7f6db154bF9a0E7a24F0e25be2548': 'MES'
      }
      return mapTable[address]
    }
  }
}
</script>
