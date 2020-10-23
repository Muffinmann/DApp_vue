import appJson from '../contracts/APTSC.json'
const APTSC = appJson
const options = {
  wsUrl: 'ws://127.0.0.1:8545',
  networkID: '5777', // see: truffle-config.js | networks.develop.network_id
  contract: APTSC
}

export default options
