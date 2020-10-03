import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    selectedOrder: null,
    mostRecentBlockNumber: 100
  },
  getters: {
  },
  mutations: {
    onOrderSelected (state, { order }) {
      state.selectedOrder = order
    },
    newBlock (state, { blockNumber }) {
      state.mostRecentBlockNumber = blockNumber
    }
  },
  actions: {
  },
  modules: {
  }
})
