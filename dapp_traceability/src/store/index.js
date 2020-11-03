import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    selectedOrder: null,
    mostRecentBlockNumber: 100,
    runProduction: '',
    orderRefresh: '',
    dataCollector: {}
  },
  getters: {
  },
  mutations: {
    onOrderSelected (state, { order }) {
      state.selectedOrder = order
    },
    newBlock (state, { blockNumber }) {
      state.mostRecentBlockNumber = blockNumber
    },
    startProduction (state, time) {
      state.runProduction = time
    },
    refrehTrigger (state, time) {
      state.orderRefresh = time
    },
    updateData (state, orderDataObj) {
      state.dataCollector[orderDataObj.orderID] = orderDataObj
    }
  },
  actions: {
  },
  modules: {
  }
})
