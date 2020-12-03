<template>
  <b-col>
    <hr>
    <div ref="craftGas" style="width:1000px; height:600px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
import * as numberUtil from 'echarts/src/util/number'
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
    prepareBoxplotData (rawData, opt) {
      opt = opt || []
      var boxData = []
      var outliers = []
      var axisData = []
      var boundIQR = opt.boundIQR
      var useExtreme = boundIQR === 'none' || boundIQR === 0

      for (var i = 0; i < rawData.length; i++) {
        axisData.push(i + '')
        var ascList = numberUtil.asc(rawData[i].slice())

        var Q1 = numberUtil.quantile(ascList, 0.25)
        var Q2 = numberUtil.quantile(ascList, 0.5)
        var Q3 = numberUtil.quantile(ascList, 0.75)
        var min = ascList[0]
        var max = ascList[ascList.length - 1]
        var bound = (boundIQR == null ? 1.5 : boundIQR) * (Q3 - Q1)

        var low = useExtreme
          ? min
          : Math.max(min, Q1 - bound)
        var high = useExtreme
          ? max
          : Math.min(max, Q3 + bound)

        boxData.push([low, Q1, Q2, Q3, high])

        for (var j = 0; j < ascList.length; j++) {
          var dataItem = ascList[j]
          if (dataItem < low || dataItem > high) {
            var outlier = [i, dataItem]
            opt.layout === 'vertical' && outlier.reverse()
            outliers.push(outlier)
          }
        }
      }
      return {
        boxData: boxData,
        outliers: outliers,
        axisData: axisData
      }
    },
    async initChart () {
      let orders = await neo.getAllOrders()
      orders = orders.map(o => o.order)
      // orders = ['o_111', 'o_112']
      let statistic = []
      for (const o of orders) {
        const p2Items = await neo.getPMsByOrderAndArea(o, 'p2')
        const p3Items = await neo.getPMsByOrderAndArea(o, 'p3')
        const p2Length = p2Items.map(i => i.children.length)
        const p3Length = p3Items.map(i => i.children.length)
        const bundle = {
          orderName: o,
          p2Length: p2Length,
          p3Length: p3Length,
          totalLength: [...p2Length, ...p3Length]
        }
        statistic.push(bundle)
      }
      statistic = this.prepareBoxplotData(statistic.map(i => i.totalLength))
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
          trigger: 'item',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          show: false,
          // data: ['create', 'craft', 'safeBatchTransferFrom', 'addController', 'total'],
          // data: ['Area Total', 'create', 'craft', 'safeBatchTransferFrom', 'addController', 'blocks'],
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
            name: 'Count of input IDs',
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
            name: 'boxplot',
            type: 'boxplot',
            itemStyle: { borderColor: 'rgba(6, 6, 6, 1)' },
            data: statistic.boxData,
            tooltip: {
              formatter: function (param) {
                // console.log('param: ', param)
                return [
                  'Experiment ' + param.name + ': ',
                  'upper: ' + param.data[5],
                  'Q3: ' + param.data[4],
                  'median: ' + param.data[3],
                  'Q1: ' + param.data[2],
                  'lower: ' + param.data[1]
                ].join('<br/>')
              }
            }
          },
          {
            name: 'outlier',
            type: 'scatter',
            itemStyle: { color: 'rgba(6, 6, 6, 1)' },
            data: statistic.outliers
          }
        ]
      }
      this.myChart.setOption(this.option)
    }
  }
}
</script>
