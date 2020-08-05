<template>
  <div>
  <img alt="Vue logo" src="../assets/logo.png">
  <b-container>
    <b-jumbotron class>
      <template v-slot:header>APTSC</template>
      <template v-slot:lead>solutions for traceability problem with Ethereum</template>
      <hr class="my-5">
      <Dashboard/>
      <b-card-group deck>
        <b-card>
          <Station/>
        </b-card>
      </b-card-group>
      <Toast/>
    </b-jumbotron>
  </b-container>
  </div>
</template>

<script>
// @ is an alias to /src
import Toast from '@/components/Toast.vue'
import Dashboard from '@/components/Dashboard.vue'
import Station from '@/components/Station.vue'
export default {
  name: 'Home',
  components: {
    Toast,
    Dashboard,
    Station
  }
}
</script>
