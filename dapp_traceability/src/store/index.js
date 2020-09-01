import Vue from 'vue'
import Vuex from 'vuex'
import neo4j from 'neo4j-driver'

Vue.use(Vuex)
const connection = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'neo4jpassword'))

export default new Vuex.Store({
  state: {
    neo4jDriver: connection,
    selectedOrder: null,
    requestPool: {},
    assemblyTokenMap: {},
    tokenProductMap: { p2: {}, p3: {} },
    tokenSupplyMap: {},
    childrenFilter: [],
    autoRefresh: false
  },
  getters: {
    getRequestPool: (state) => (area) => {
      return state.requestPool[area]
    },
    getAssemblyToken: (state) => (aUID) => {
      return state.assemblyTokenMap[aUID]
    },
    getTokenUsedInPM: (state) => (tokenID, area) => {
      return state.tokenProductMap[area][tokenID]
    },
    getTokenSupply: (state) => (tokenID) => {
      return state.tokenSupplyMap[tokenID]
    },
    getChildrenFilter: (state) => state.childrenFilter
  },
  mutations: {
    selectOrder (state, payload) {
      state.selectedOrder = payload
    },
    requestToken (state, { tokens, newActor, area }) {
      state.requestPool[area] = { [newActor]: tokens }
    },
    clearRequestPool (state) {
      state.requestPool = {}
    },
    updateAssemblyTokenMap (state, { aUID, token }) {
      state.assemblyTokenMap[aUID] = { tokenID: token.tokenID, tokenSupply: token.tokenSupply }
    },
    updateTokenProductMap (state, { tokenID, pmID, area }) {
      state.tokenProductMap[area][tokenID] = pmID
    },
    updateTokenSupplyMap (state, { tokenID, tokenSupply }) {
      state.tokenSupplyMap[tokenID] = tokenSupply
    },
    updateChildrenFilter (state, children) {
      state.childrenFilter = children
    },
    autoRefresh (state) {
      state.autoRefresh = !state.autoRefresh
    }
  },
  actions: {
  },
  modules: {
  }
})
