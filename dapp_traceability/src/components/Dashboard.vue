<template>
  <b-container>
    <h2><b>Dashboard</b></h2>
    <b-row align-h="center">
      <b-card-group deck>
        <b-card header="Actor Account Balances">
          <ol>
            <li v-for="(value, key) in accountBalances" v-b-tooltip.hover :title="key" :key="key">{{ addressToMachineName(key) }}: {{ fromWeiToETH(value) }} ETH</li>
          </ol>
        </b-card>
        <b-card title="Block Chain Info">
          <div>latest Block Number: {{ latestBlockNumber }}</div>
          <div>gas price: {{ currentGasPrice }} ETH</div>
        </b-card>
        <b-card title="Token Profile">
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
        </b-card>
      </b-card-group>
    </b-row>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Dashboard',
  data () {
    return {
      tkID: '',
      tkSN: '',
      tkST: '',
      tkURI: '',
      tkCtrl: '',
      tkBl: '',
      latestBlockNumber: '',
      currentGasPrice: '',
      web3Contract: {}
    }
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
          this.currentGasPrice = this.fromWeiToETH(price)
        } else {
          console.log('Some error occured while getting the current price: ', err)
        }
      })
    }
    latestBlock()
    gasPrice()
    this.createWeb3Contract()
    // setInterval(gasPrice, 20000)
    // setInterval(latestBlock, 20000)
  },
  watch: {
    tkID: 'registerContract'
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    ...mapGetters('contracts', ['getContractData', 'contractInstances']),
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
    createWeb3Contract () {
    /**
    * the web3 contract object in drizzle has not every web3 function, such as
    * 'getPastEvents', thus, here we create an original web3 contract object.
    */
      const web3 = this.drizzleInstance.web3
      const myContract = this.drizzleInstance.contracts.APTSC
      this.web3Contract = new web3.eth.Contract(myContract.abi, myContract.address)
    },
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
