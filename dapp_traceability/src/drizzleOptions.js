import APTSC from './contracts/APTSC.json'
const options = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545'
    }
  },
  contracts: [APTSC],
  events: {
    APTSC: ['TransferSingle', 'controllerUpdate', 'serialNumber', 'status', 'URI']
  },
  polls: {
    accounts: 15000
  },
  syncAlways: true
}

export default options
