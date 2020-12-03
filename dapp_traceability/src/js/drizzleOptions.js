import ATM from './contracts/ATM.json'
const options = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545'
    }
  },
  contracts: [ATM],
  events: {
    ATM: ['TransferSingle', 'TransferBatch', 'controllerUpdate', 'serialNumber', 'status', 'URI', 'ApprovalForAll']
  },
  polls: {
    accounts: 15000
  },
  syncAlways: true
}

export default options
