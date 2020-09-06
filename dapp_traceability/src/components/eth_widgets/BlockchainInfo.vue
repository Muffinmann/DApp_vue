<template>
  <b-container>
    <div>latest Block Number: {{ latestBlockNumber }}</div>
    <div>gas price: {{ currentGasPrice }} Gwei</div>
    <div>Current Nonce: {{ nonce }}</div>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'BlockchainInfo',
  data () {
    return {
      latestBlockNumber: '',
      currentGasPrice: ''
    }
  },
  created () {
    this.$store.dispatch('drizzle/REGISTER_CONTRACT', {
      contractName: 'APTSC',
      method: 'nonce',
      methodArgs: ''
    })
  },
  mounted () {
    const web3 = this.$store.getters['drizzle/drizzleInstance'].web3
    const latestBlock = () => {
      web3.eth.getBlockNumber((err, number) => {
        if (!err) {
          console.log('Number: ', number)
          this.latestBlockNumber = number
        } else {
          console.log('Some error occured while getting the latest block: ', err)
        }
      })
    }
    const gasPrice = () => {
      web3.eth.getGasPrice((err, price) => {
        if (!err) {
          console.log('gas $: ', price)
          this.currentGasPrice = this.fromWei(price, 'Gwei')
        } else {
          console.log('Some error occured while getting the current price: ', err)
        }
      })
    }
    latestBlock()
    gasPrice()
    // setInterval(gasPrice, 20000)
    // setInterval(latestBlock, 20000)
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    ...mapGetters('contracts', ['getContractData']),
    nonce () {
      return this.getContractData({
        contract: 'APTSC',
        method: 'nonce'
      })
    }
  },
  methods: {
    fromWei (balance, unit) {
      return this.drizzleInstance.web3.utils.fromWei(balance, unit)
    }
  }
}
</script>
