// TODO: use config file to initialize
import Web3 from 'web3'
import options from '@/js/ethOptions.js'

class Web3Facade {
  constructor ({ networkID, contract, wsUrl }) {
    const contractAddress = contract.networks[networkID].address
    const web3Provider = new Web3.providers.WebsocketProvider(wsUrl)
    this.web3 = new Web3(web3Provider)
    this.contract = new this.web3.eth.Contract(contract.abi, contractAddress)
    this.subscriptions = {}
  }

  wholeWeb3Interface () {
    return this.web3
  }

  subscribeEvent (eventName, callback) {
    const eventJsonInterface = this.web3.utils._.find(
      this.contract._jsonInterface,
      i => i.name === eventName && i.type === 'event'
    )
    const subOptions = { address: this.contract.options.address, topics: [eventJsonInterface.signature] }
    const subscription = this.web3.eth.subscribe('logs', subOptions)
      .on('data', log => {
        // console.log('event log: ', log)
        const eventObj = this.web3.eth.abi.decodeLog(eventJsonInterface.inputs, log.data, log.topics.slice(1))
        console.log(`New Event "${eventName}": `, eventObj)
        callback(eventObj)
      })
      .on('error', console.error)
    this.subscriptions[eventName] = subscription
    console.log('subscribed event: ', eventName)
  }

  subscribeBlockHeader (callback) {
    const subscription = this.web3.eth.subscribe('newBlockHeaders')
      .on('data', data => {
        console.log('New Block: ', data)
        callback(data)
      })
      .on('error', console.error)
    this.subscriptions.newBlockHeader = subscription
    console.log('subscribed : newBlockHeader')
  }

  decodeEventLog (eventName, log) {
    const eventJsonInterface = this.web3.utils._.find(
      this.contract._jsonInterface,
      i => i.name === eventName && i.type === 'event'
    )
    return this.web3.eth.abi.decodeLog(eventJsonInterface.inputs, log.data, log.topics.slice(1))
  }

  findEventSig (eventName) {
    const eventJsonInterface = this.web3.utils._.find(
      this.contract._jsonInterface,
      i => i.name === eventName && i.type === 'event'
    )
    return eventJsonInterface.signature
  }

  findContractAddress () {
    return this.contract.options.address
  }

  decodeFuncSig (sig) {
    const funName = this.web3.utils._.find(
      this.contract._jsonInterface,
      i => i.signature === sig && i.type === 'function'
    )
    return funName ? funName.name : 'unknown'
  }

  async accounts () {
    const addresses = await this.web3.eth.getAccounts()
    const accounts = addresses.map(async (address) => ({
      address: address,
      balance: await this.web3.eth.getBalance(address)
    })
    )
    return Promise.all(accounts)
  }

  async mostRecentBlock () {
    return await this.web3.eth.getBlockNumber()
  }

  async gasPrice () {
    return await this.web3.eth.getGasPrice()
  }

  async getBlock (blockNumber) {
    return await this.web3.eth.getBlock(blockNumber, true)
  }

  async getPastLogs (opt) {
    return await this.web3.eth.getPastLogs(opt)
  }

  getPastEvents (eventName, options) {
    return await this.contract.getPastEvents(eventName, options)
    // return new Promise((resolve, reject) => {
    //   this.contract.getPastEvents(eventName, options, (err, events) => {
    //     if (err) { return reject(err) }
    //     resolve(events)
    //   })
    // })
  }

  async getTxnReceipt (txnHash) {
    return await this.web3.eth.getTransactionReceipt(txnHash)
  }

  async balanceOfTokenByOwner (id, owner) {
    return await this.contract.methods.balanceOf(owner, id).call()
  }

  async currentNonce () {
    return await this.contract.methods.nonce().call()
  }

  convertFromWei (balance, unit) {
    return this.web3.utils.fromWei(balance, unit)
  }

  create ({ qty, uri, serialNumber, actor }) {
    return new Promise((resolve, reject) => {
      this.contract.methods
        .create(qty, uri, serialNumber, actor)
        .send({ from: actor, gas: 100000 })
        .on('receipt', receipt => resolve(receipt))
        .on('error', err => reject(err))
    })
  }

  craft ({ inIds, inValues, outQty, uri, actor, serialNumber }) {
    const gas = 500000 * Math.ceil(inValues.length / 10) ** 2
    return new Promise((resolve, reject) => {
      this.contract.methods
        .craft(inIds, inValues, outQty, uri, actor, serialNumber)
        .send({ from: actor, gas: gas })
        .on('receipt', receipt => resolve(receipt))
        .on('error', err => reject(err))
    })
  }

  addController ({ id, newController, actor }) {
    return new Promise((resolve, reject) => {
      this.contract.methods
        .addController(id, newController)
        .send({ from: actor, gas: 100000 })
        .on('receipt', receipt => resolve(receipt))
        .on('error', err => reject(Error('addController' + err)))
    })
  }

  isController ({ id, candidate, actor }) {
    this.contract.methods
      .addController(id, candidate)
      .send({ from: actor })
  }

  transferBatch ({ from, to, ids, values, actor }) {
    const funcJsonIterface = this.web3.utils._.find(
      this.contract._jsonInterface,
      i => i.name === 'safeBatchTransferFrom' && i.type === 'function'
    )
    const data = this.web3.utils.hexToBytes(funcJsonIterface.signature)
    const gas = 200000 * Math.ceil(values.length / 10) ** 2
    return new Promise((resolve, reject) => {
      this.contract.methods
        .safeBatchTransferFrom(from, to, ids, values, data)
        .send({ from: actor, gas: gas })
        .on('receipt', receipt => resolve(receipt))
        .on('error', err => reject(err))
    })
  }
}
export default new Web3Facade(options)
