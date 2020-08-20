<template>
  <b-container>
    <Order/>
    <b-row>
      <StationFirst :actor="actors[0]"/>
      <StationSecond :actor="actors[1]"/>
      <StationThird :actor="actors[2]"/>
    </b-row>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
import neo4j from 'neo4j-driver'
import Order from '@/components/Order.vue'
import StationFirst from '@/components/StationFirst.vue'
import StationSecond from '@/components/StationSecond.vue'
import StationThird from '@/components/StationThird.vue'
export default {
  name: 'Plant',
  components: {
    Order,
    StationFirst,
    StationSecond,
    StationThird
  },
  data () {
    return {
      neo4jDriver: null,
      orderList: null
    }
  },
  created () {
    const connection = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'neo4jpassword'))
    this.neo4jDriver = connection
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    actors () {
      const state = this.drizzleInstance.store.getState()
      return state.accounts
    }
  }
}
</script>
