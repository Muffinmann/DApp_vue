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
      this.accounts = await app.accounts()
    },
    addressToMachineName (address) {
      // const acc = this.accounts
      const mapTable = {
        [this.accounts[0].address]: 'P1',
        [this.accounts[1].address]: 'P2',
        [this.accounts[2].address]: 'P3'
      }
      return mapTable[address]
    },
    fromWeiToETH (balance) {
      return app.convertFromWei(balance, 'gether')
    }
  }
}
</script>
