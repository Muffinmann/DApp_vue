import Vue from 'vue'
import Vuex from 'vuex'
import neo4j from 'neo4j-driver'

Vue.use(Vuex)
const connection = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'neo4jpassword'))

export default new Vuex.Store({
  state: {
    neo4jDriver: connection,
    selectedOrder: null,
    productStation: {},
    assemblyTokenMap: {},
    productTokenMap: {},
    tokenSupplyMap: {}
  },
  getters: {
    getProductActor: (state) => (pmID) => {
      return state.productStation[pmID]
    },
    getAssemblyToken: (state) => (aUID) => {
      return state.assemblyTokenMap[aUID]
    },
    getProductTokens: (state) => (pmID) => {
      return state.productTokenMap[pmID]
    },
    getTokenSupply: (state) => (tokenID) => {
      return state.tokenSupplyMap[tokenID]
    }
  },
  mutations: {
    selectOrder (state, payload) {
      state.selectedOrder = payload
    },
    updateProductActor (state, { pmID, station }) {
      state.productStation[pmID] = station
    },
    updateAssemblyTokenMap (state, { aUID, tokenID }) {
      state.assemblyTokenMap[aUID] = tokenID
    },
    updateProductTokenMap (state, { pmID, tokens }) {
      state.productTokenMap[pmID] = tokens
    },
    updateTokenSupplyMap (state, { tokenID, tokenSupply }) {
      state.tokenSupplyMap[tokenID] = tokenSupply
    }
  },
  actions: {
  },
  modules: {
  }
})
