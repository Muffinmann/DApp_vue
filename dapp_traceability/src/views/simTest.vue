<template>
  <b-container fluid="sm">

    <b-row>
      <craftBoxPlot/>
    </b-row>
    <b-row>
      <craftLinePlot/>
    </b-row>
    <b-row>
      <craftScatter/>
    </b-row>
    <b-row>
      <transferScatter/>
    </b-row>

  </b-container>
</template>

<script>
import craftBoxPlot from '@/components/charts/craftBoxPlot.vue'
import craftLinePlot from '@/components/charts/craftLinePlot.vue'
import craftScatter from '@/components/charts/craftScatter.vue'
import transferScatter from '@/components/charts/transferScatter.vue'
export default {
  name: 'Plant',
  components: {
    craftBoxPlot,
    craftLinePlot,
    craftScatter,
    transferScatter
  }
}
</script>
