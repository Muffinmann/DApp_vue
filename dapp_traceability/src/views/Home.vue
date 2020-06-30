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
          <Account/>
          <br>
          <TokenBalance/>
          <CreateToken/>
        </b-card>
        <b-card>
          <Account/>
          <br>
          <TokenBalance/>
          <CreateToken/>
        </b-card>
        <b-card>
          <Account/>
          <br>
          <TokenBalance/>
          <CreateToken/>
        </b-card>
      </b-card-group>
      <Toast/>
    </b-jumbotron>
  </b-container>
  </div>
</template>

<script>
// @ is an alias to /src
import Account from '@/components/Account.vue'
import TokenBalance from '@/components/TokenBalance.vue'
import Toast from '@/components/Toast.vue'
import CreateToken from '@/components/CreateToken.vue'
import Dashboard from '@/components/Dashboard.vue'
export default {
  name: 'Home',
  components: {
    Account,
    TokenBalance,
    CreateToken,
    Toast,
    Dashboard
  }
}
</script>
