<template>
  <b-col>
    <h2>Charts</h2>
    <div ref="main" style="width:600px; height:400px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
import app from '@/web3Wrapper.js'
export default {
  name: 'gasUsageChart',
  props: {
    axisData: Object
  },
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
      console.log('initizing...')
      const latestBlockNumber = await app.mostRecentBlock()
      const latestBlock = await app.getBlock(latestBlockNumber)
      const txns = latestBlock.transactions
      const receipts = await Promise.all(txns.map(async txn => await app.getTxnReceipt(txn)))
      const gasUsage = receipts.map(r => r.gasUsed)
      console.group('LATEST BLOCK')
      console.log('latest Block: ', latestBlock)
      console.log('txn receipt: ', receipts)
      console.log('gas Usage: ', gasUsage)
      console.groupEnd()
      this.myChart = echarts.init(this.$refs.main)
      this.option = {
        title: {
          text: 'Gas Usage'
          // subtext: 'description'
        },
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
          data: ['Cumulative', 'Each']
        },
        toolbox: {
          show: true,
          feature: {
            dataView: { readOnly: false },
            restore: {},
            saveAsImage: {}
          }
        },
        dataZoom: {
          type: 'inside',
          start: 0,
          end: 100
        },
        xAxis: [
          {
            type: 'category',
            boundaryGap: true,
            data: (function () {
              var now = new Date()
              var res = []
              var len = 10
              while (len--) {
                res.unshift(now.toLocaleTimeString().replace(/^\D*/, ''))
                now = new Date(now - 2000)
              }
              return res
            })()
          },
          {
            type: 'category',
            boundaryGap: true,
            data: (function () {
              var res = []
              var len = 10
              while (len--) {
                res.push(10 - len - 1)
              }
              return res
            })()
          }
        ],
        yAxis: [
          {
            type: 'value',
            scale: true,
            name: 'Avg. Usage',
            max: 210000,
            min: 21000,
            boundaryGap: [0.2, 0.2]
          },
          {
            type: 'value',
            scale: true,
            name: 'Usage',
            max: 210000,
            min: 21000,
            boundaryGap: [0.2, 0.2]
          }
        ],
        series: [
          {
            name: 'Gas Usage',
            type: 'bar',
            color: '#9bad47',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: (function () {
              var res = []
              var len = 10
              while (len--) {
                res.push(Math.round(Math.random() * 100000))
              }
              return res
            })()
          },
          {
            name: 'Avg. Gas Usage',
            type: 'line',
            color: '#20240f',
            data: (function () {
              var res = []
              var len = 0
              while (len < 10) {
                res.push((Math.random() * 100000 + 5).toFixed(1) - 0)
                len++
              }
              return res
            })()
          }
        ]
      }
      this.myChart.setOption(this.option)
    },
    updateChartView () {
      const axisData = this.axisData
      var data0 = this.option.series[0].data
      var data1 = this.option.series[1].data
      data0.shift()
      data0.push(axisData.y0)
      data1.shift()
      data1.push(axisData.y1)

      this.option.xAxis[0].data.shift()
      this.option.xAxis[0].data.push(axisData.x0)
      this.option.xAxis[1].data.shift()
      this.option.xAxis[1].data.push(axisData.x1)

      this.myChart.setOption(this.option)
    }
  }
}
</script>
