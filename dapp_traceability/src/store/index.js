import Vue from 'vue'
import Vuex from 'vuex'
import neo4j from 'neo4j-driver'

Vue.use(Vuex)
const connection = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'neo4jpassword'))

export default new Vuex.Store({
  state: {
    mytestvar: 110,
    neo4jDriver: connection
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
