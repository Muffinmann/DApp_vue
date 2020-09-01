<template>
  <b-container>
    <Order/>
    <b-row>
      <StationFirst :actor="actors[0]"/>
      <Station :actor="actors[1]" area="p2"/>
    </b-row>
    <b-row>
      <Station :actor="actors[2]" area="p3"/>
    </b-row>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
import neo4j from 'neo4j-driver'
import Order from '@/components/Order.vue'
import StationFirst from '@/components/StationFirst.vue'
import Station from '@/components/Station.vue'

export default {
  name: 'Plant',
  components: {
    Order,
    StationFirst,
    Station
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
