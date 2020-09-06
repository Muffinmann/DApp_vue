<template>
  <b-container>
    <h2><b>Dashboard</b></h2>
    <b-row align-h="center">
      <b-card-group deck>

        <b-card header="Actor Account Balances">
          <Account/>
        </b-card>

        <b-card title="Block Chain Info">
          <BlockchainInfo/>
        </b-card>

        <b-card title="Token Profile">
          <TokenProfile/>
        </b-card>

      </b-card-group>
    </b-row>
  </b-container>
</template>

<script>
import Account from '@/components/eth_widgets/Account.vue'
import BlockchainInfo from '@/components/eth_widgets/BlockchainInfo.vue'
import TokenProfile from '@/components/eth_widgets/TokenProfile.vue'
export default {
  name: 'Dashboard',
  components: {
    Account,
    BlockchainInfo,
    TokenProfile
  }
}
</script>
