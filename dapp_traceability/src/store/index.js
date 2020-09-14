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
    productTokenMap: {},
    childrenFilter: [],
    p2Tokens: [],
    autoRefresh: false,
    refreshRequest: false
  },
  getters: {
    getRequestPool: state => area => state.requestPool[area],
    getAssemblyToken: state => aUID => state.assemblyTokenMap[aUID],
    getTokenUsedInPM: state => (tokenID, area) => state.tokenProductMap[area][tokenID],
    getTokenSupply: state => tokenID => state.tokenSupplyMap[tokenID],
    getProductToken: state => productID => state.productTokenMap[productID],
    getP2Tokens: state => state.p2Tokens,
    getChildrenFilter: (state) => state.childrenFilter
  },
  mutations: {
    selectOrder (state, payload) {
      state.selectedOrder = payload
    },
    requestToken (state, { tokens, newActor, area }) {
      console.group('<<<REQUEST TOKEN>>>')
      console.log('area: ', area)
      console.log('actor: ', newActor)
      console.log('tokens: ', tokens)
      console.groupEnd()
      state.requestPool[area] = { [newActor]: tokens }
    },
    clearRequestPool (state) {
      // console.log('Clearing Request Pool......')
      state.requestPool = {}
    },
    updateAssemblyTokenMap (state, { aUID, tokenID, tokenSupply }) {
      state.assemblyTokenMap[aUID] = { tokenID: tokenID, tokenSupply: tokenSupply }
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
    updateP2Tokens (state, tokens) {
      state.p2Tokens = tokens
    },
    updateProductToken (state, { productID, tokenID }) {
      state.productTokenMap[productID] = tokenID
    },
    autoRefresh (state) {
      state.autoRefresh = !state.autoRefresh
    },
    refreshRequest (state) {
      state.refreshRequest = !state.refreshRequest
    }
  },
  actions: {
  },
  modules: {
  }
})
