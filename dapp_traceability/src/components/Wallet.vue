<template>
  <b-container>
    <b-row>
      <b-col>
        {{ wallet }}
      </b-col>
    </b-row>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    wallet () {
      console.log(this.drizzleInstance.web3.eth.accounts.wallet)
      return 1
    }
  }
}
</script>
