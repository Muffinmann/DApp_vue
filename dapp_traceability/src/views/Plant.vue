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
    <b-row>
      <gasChartByArea/>
    </b-row>
    <b-row>
      <gasAllOrders/>
    </b-row>
    <b-row>
      <gasBlocks/>
    </b-row>

  </b-container>
</template>

<script>
import Account from '@/components/eth_widgets/Account.vue'
import BcInfo from '@/components/eth_widgets/BlockchainInfo.vue'
import TkProfile from '@/components/eth_widgets/TokenProfile.vue'
import gasChart from '@/components/charts/gasUsage.vue'
import gasChartByArea from '@/components/charts/gasUsageByArea.vue'
import gasAllOrders from '@/components/charts/gasAllOrders.vue'
import gasBlocks from '@/components/charts/gasBlocks.vue'
import Order from '@/components/Order.vue'
// import Alert from '@/components/Alert.vue'
import Production from '@/components/Production.vue'
export default {
  name: 'Plant',
  components: {
    Order,
    // Alert,
    Account,
    BcInfo,
    TkProfile,
    gasChart,
    gasChartByArea,
    gasAllOrders,
    gasBlocks,
    Production
  }
}
</script>
