import appJson from '@/contracts/ATM.json'
const ATM = appJson
const options = {
  wsUrl: 'ws://127.0.0.1:8545',
  networkID: '12345', // see: truffle-config.js | networks.develop.network_id
  contract: ATM
}

export default options
