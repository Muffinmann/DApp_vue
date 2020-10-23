<template>
  <b-card no-body class="mb-1">
    <b-card-header header-tag="header" class="p-1" role="tab">
      <b-button block v-b-toggle.accordion-1>Acounts Info</b-button>
    </b-card-header>
    <b-collapse id="accordion-1" accordion="my-accordion" role="tabpanel">
      <b-card-body>
        <b-list-group>
          <b-list-group-item v-for="a in accounts" v-b-tooltip.hover :title="a.address" :key="accounts.indexOf(a)"><small>{{ addressToMachineName(a.address) }}: {{ fromWeiToETH(a.balance) }} ETH</small></b-list-group-item>
        </b-list-group>
      </b-card-body>
    </b-collapse>
  </b-card>
</template>
<script>
import app from '@/js/web3Facade.js'
export default {
  name: 'Account',
  data () {
    return {
      accounts: ''
    }
  },
  created () {
    this.init()
  },
  computed: {
    // ...mapGetters('accounts', ['activeAccount', 'activeBalance']), // This is equal to: activeAccount () { return this.$store.getters['accounts/activeAccount'] }
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
    async init () {
      const accounts = await app.accounts()
      this.accounts = accounts.slice(0, -2)
    },
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
      return app.convertFromWei(balance, 'ether')
    }
  }
}
</script>
