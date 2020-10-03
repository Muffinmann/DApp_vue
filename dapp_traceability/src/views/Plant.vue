<template>
  <b-container fluid="sm">

    <b-row align-h="start">
      <b-col cols="4" class="accordion" role="tablist">
        <Account/>
        <BcInfo/>
      </b-col>
      <Order/>
      <TkProfile/>
    </b-row>

    <b-row>
      <Production/>
    </b-row>

    <b-row>
      <gasChart/>
    </b-row>

  </b-container>
</template>

<script>
// @ is an alias to /src
// import options from '@/ethOptions.js'
// import app from '@/web3Wrapper.js'
// import neo from '@/neo4jAPI.js'
// import AreaMixin from '@/components/mixins/AreaMixin.vue'
import Account from '@/components/eth_widgets/Account.vue'
import BcInfo from '@/components/eth_widgets/BlockchainInfo.vue'
import TkProfile from '@/components/eth_widgets/TokenProfile.vue'
import gasChart from '@/components/charts/gasUsage.vue'
import Order from '@/components/Order.vue'
// import Alert from '@/components/Alert.vue'
import Production from '@/components/Production.vue'
export default {
  name: 'Plant',
  // mixins: [AreaMixin],
  components: {
    Order,
    // Alert,
    Account,
    BcInfo,
    TkProfile,
    gasChart,
    Production
  }
}
</script>
