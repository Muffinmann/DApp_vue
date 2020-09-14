<template>
  <b-container>
    <Dashboard/>
    <hr class="my-5" />
    <Order/>
    <b-row>
      <StationFirst :actor="actors[0]"/>
      <Station :actor="actors[1]" area="p2"/>
    </b-row>
    <b-row>
      <Station :actor="actors[2]" area="p3"/>
      <FinalProduct/>
    </b-row>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
import Dashboard from '@/components/Dashboard.vue'
import Order from '@/components/Order.vue'
import StationFirst from '@/components/StationFirst.vue'
import Station from '@/components/Station.vue'
import FinalProduct from '@/components/FinalProduct.vue'

export default {
  name: 'Plant',
  components: {
    Dashboard,
    Order,
    StationFirst,
    Station,
    FinalProduct
  },
  data () {
    return {
      neo4jDriver: null,
      orderList: null
    }
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
