<template>
  <b-container>
    <b-input-group>
        <b-form-input v-model="tkID" placeholder="Enter Token ID"></b-form-input>
        <b-button @click="tokenProfile">Submit</b-button>
    </b-input-group>
    <div v-if="tkSN">
      <div>Serial Number: {{ tkSN }}</div>
      <div>Status: {{ tkST }}</div>
      <div>URI: {{ tkURI }}</div>
      <div>Controller: {{ tkCtrl }}</div>
      <div>token Balance: {{ tkBl }}</div>
    </div>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  name: 'TokenProfile',
  data () {
    return {
      tkID: '',
      tkSN: '',
      tkST: '',
      tkURI: '',
      tkCtrl: '',
      tkBl: '',
      web3Contract: {}
    }
  },
  created () {

  },
  mounted () {
    this.createWeb3Contract()
  },
  watch: {
    tkID: 'registerContract'
  },
  computed: {
    ...mapGetters('contracts', ['getContractData']),
    ...mapGetters('drizzle', ['drizzleInstance'])
  },
  methods: {
    createWeb3Contract () {
    /**
    * the web3 contract object in drizzle has not every web3 function, such as
    * 'getPastEvents', thus, here we create an original web3 contract object.
    */
      const web3 = this.drizzleInstance.web3
      const myContract = this.drizzleInstance.contracts.APTSC
      this.web3Contract = new web3.eth.Contract(myContract.abi, myContract.address)
    },
    tokenProfile () {
      const options = {
        filter: { _id: this.tkID },
        fromBlock: 0,
        toBlock: 'latest'
      }
      this.web3Contract.getPastEvents('serialNumber', options, (e, event) => {
        this.tkSN = event.map(el => el.returnValues._serialNumber).join('-->')
      })
      this.web3Contract.getPastEvents('status', options, (e, event) => {
        console.log('status: ', event)
        this.tkST = event.map(el => el.returnValues._status).join('-->')
      })
      this.web3Contract.getPastEvents('URI', options, (e, event) => {
        console.log('URI: ', event)
        this.tkURI = event.map(el => el.returnValues._value).join('-->')
      })
      this.web3Contract.getPastEvents('controllerUpdate', options, (e, event) => {
        console.log('controllerUpdate: ', event)
        this.tkCtrl = event.map(el => el.returnValues._updatedAddress).join('-->')
      })
      // this.registerContract('0x9d56414F2218e4F33d474ad29A643DF9adB01F73', this.tkID)
      this.tkBl = this.getContractData({
        contract: 'APTSC',
        method: 'balanceOf'
      })
    },
    registerContract () {
      this.$store.dispatch('drizzle/REGISTER_CONTRACT', {
        contractName: 'APTSC',
        method: 'balanceOf',
        methodArgs: ['0x9d56414F2218e4F33d474ad29A643DF9adB01F73', this.tkID]
      })
    }
  }
}
</script>
