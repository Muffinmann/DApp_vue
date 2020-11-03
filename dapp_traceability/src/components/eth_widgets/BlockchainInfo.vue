<template>
  <b-card no-body class="mb-1">
    <b-card-header header-tag="header" class="p-1" role="tab">
      <b-button block v-b-toggle.accordion-2>Blockchain Info</b-button>
    </b-card-header>
    <b-collapse id="accordion-2" accordion="my-accordion" role="tabpanel">
      <b-card-body>
        <b-list-group>
          <b-list-group-item><small>latest Block Number: {{ latestBlockNumber }}</small></b-list-group-item>
          <b-list-group-item><small>gas price: {{ fromWei(gasPrice) }} Gwei</small></b-list-group-item>
          <b-list-group-item><small><span>Current Nonce: {{ nonce }}</span></small></b-list-group-item>
        </b-list-group>
      </b-card-body>
    </b-collapse>
  </b-card>
</template>
<script>
import app from '@/js/web3Facade.js'
export default {
  name: 'BlockchainInfo',
  data () {
    return {
      latestBlockNumber: '',
      gasPrice: '',
      nonce: ''
    }
  },
  created () {
    this.init()
  },
  mounted () {
    const headerHandler = (data) => {
      this.init(data)
    }
    app.subscribeBlockHeader(headerHandler)
  },
  methods: {
    async init (data) {
      this.latestBlockNumber = data ? data.number : await app.mostRecentBlock()
      this.$store.commit('newBlock', { blockNumber: this.latestBlockNumber })
      this.gasPrice = await app.gasPrice()
      this.nonce = await app.currentNonce()
    },
    fromWei (balance) {
      return app.convertFromWei(balance, 'Gwei')
    }
  }
}
</script>
