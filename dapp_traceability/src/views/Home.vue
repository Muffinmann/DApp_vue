<template>
  <b-container>
    <b-img src="https://ethereum.org/static/0e6a20f95728214252090016c64d328f/31987/ethereum-logo-portrait-purple-white.png" alt="logo" fluid center ></b-img>
    <b-jumbotron class>
      <template v-slot:header>APTSC</template>
      <template v-slot:lead>solutions for traceability problem with Ethereum</template>
      <hr class="my-5">
      <Plant/>
      <Toast/>
    </b-jumbotron>
  </b-container>
</template>

<script>
// @ is an alias to /src
import Toast from '@/components/Toast.vue'
import Plant from '@/components/Plant.vue'
export default {
  name: 'Home',
  components: {
    Toast,
    Plant
  }
}
</script>
