<template>
  <b-col>
    <hr>
    <div ref="craftGas" style="width:1000px; height:600px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
// import * as numberUtil from 'echarts/src/util/number'
import neo from '@/js/neo4jAPI.js'
import chartmixin from '@/components/mixins/ChartMixin'
export default {
  name: 'gasUsageChart',
  mixins: [chartmixin],
  data () {
    return {
      myChart: null,
      option: null
    }
  },
  mounted () {
    this.initChart()
  },
  methods: {
    async initChart () {
      let orders = await neo.getAllOrders()
      orders = orders.map(o => o.order)
      // orders = ['o_111', 'o_112']
      const statistic = []
      for (const o of orders) {
        const p2Items = await neo.getPMsByOrderAndArea(o, 'p2')
        const p3Items = await neo.getPMsByOrderAndArea(o, 'p3')
        const bundle = {
          orderName: o,
          p2CraftCount: p2Items.length,
          p3CraftCount: p3Items.length,
          totalLength: p2Items.length + p3Items.length
        }
        statistic.push(bundle)
      }
      this.myChart = echarts.init(this.$refs.craftGas)
      this.option = {
        grid: [
          {
            left: '5%',
            right: '5%',
            show: true,
            containLabel: true,
            borderWidth: 1,
            borderColor: '#000'
          }
        ],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#9bad47'
            }
          }
        },
        legend: {
          show: true,
          data: ['p2craft', 'p3craft'],
          orient: 'horizontal' // 'horizontal','vertical'
          // right: 160,
          // top: 20,
          // bottom: 20
        },
        toolbox: {
          show: true,
          bottom: '1%',
          orient: 'horizontal',
          feature: {
            dataView: { readOnly: false, title: 'dataView' },
            magicType: { show: true, type: ['line', 'bar'], title: 'line/bar chart' },
            restore: { title: 'restore' },
            saveAsImage: { title: 'saveAsImage' }
          }
        },
        dataZoom: [
          {
            show: false,
            startValue: this.rangeValue > 20 ? this.latestBlockNumber - 20 : this.rangeValue,
            endValue: this.latestBlockNumber,
            length: '80%',
            bottom: '8%'
          },
          {
            type: 'inside',
            start: 10,
            end: 90
          },
          {
            show: false,
            yAxisIndex: 0,
            filterMode: 'empty',
            width: 20,
            height: '60%',
            showDataShadow: false,
            right: '0%'
          }
        ],
        xAxis: [
          {
            // gridIndex: 0,
            type: 'category',
            name: 'Order ID',
            nameTextStyle: {
              fontSize: 15
            },
            nameLocation: 'center',
            nameGap: 30,
            data: orders
          }
        ],
        yAxis: [
          {
            // gridIndex: 0,
            type: 'value',
            // scale: true,
            name: 'Function call count',
            nameTextStyle: {
              fontSize: 15
            },
            nameGap: 30,
            nameLocation: 'center' // 'start', 'end', 'center'
            // nameGap: 50,
            // boundaryGap: [0, 0.2]
          }
        ],
        series: [
          {
            name: 'p2craft',
            type: 'bar',
            stack: 'craft',
            color: 'rgba(151, 193, 57, 1)',
            // itemStyle: { borderColor: 'rgba(6, 6, 6, 1)' },
            data: statistic.map(o => o.p2CraftCount)
          },
          {
            name: 'p3craft',
            type: 'bar',
            stack: 'craft',
            color: 'rgba(178, 178, 178, 1)',
            data: statistic.map(o => o.p3CraftCount)
          }
        ]
      }
      this.myChart.setOption(this.option)
    }
  }
}
</script>
