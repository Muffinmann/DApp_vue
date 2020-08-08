<template>
  <b-container>
    <Order
      :neo4jDriver="neo4jDriver"
    />
    <Station
      :neo4jDriver="neo4jDriver"
    />
    <div>
      {{ orderList }}
    </div>
  </b-container>
</template>
<script>
import neo4j from 'neo4j-driver'
import Order from '@/components/Order.vue'
import Station from '@/components/Station.vue'
export default {
  name: 'Plant',
  components: {
    Order,
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
  }
}
</script>
