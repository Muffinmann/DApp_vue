<template>
  <b-container>
    <img alt="Vue logo" src="../assets/logo.png">
    <b-jumbotron class>
      <template v-slot:header>APTSC</template>
      <template v-slot:lead>solutions for traceability problem with Ethereum</template>
      <hr class="my-5">
      <Dashboard/> <hr class="my-5" />
      <Plant/>
      <Toast/>
    </b-jumbotron>
  </b-container>
</template>

<script>
// @ is an alias to /src
import Toast from '@/components/Toast.vue'
import Dashboard from '@/components/Dashboard.vue'
import Plant from '@/components/Plant.vue'
export default {
  name: 'Home',
  components: {
    Toast,
    Dashboard,
    Plant
  }
}
</script>
