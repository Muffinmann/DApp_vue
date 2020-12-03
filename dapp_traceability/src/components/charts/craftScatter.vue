<template>
  <b-col>
    <hr>
    <div ref="craftGas" style="width:1000px; height:600px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
import ecStat from 'echarts-stat'
// import * as numberUtil from 'echarts/src/util/number'
// import neo from '@/js/neo4jAPI.js'
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
    removeDuplicate (dataArray) {
      const dataNoDup = Array.from(new Set(dataArray.map(d => d.toString())))
      return dataNoDup.map(d => d.split(',').map(x => +x))
    },
    async initChart () {
      const startBlockList = [1119, 1138, 1146, 1154, 1163, 1171, 1179, 1187, 1195, 1201, 1209, 1217, 1223, 1229, 1237]
      const endBlockList = [1136, 1144, 1152, 1161, 1169, 1177, 1185, 1193, 1199, 1207, 1215, 1221, 1227, 1235, 1241]
      const orderData = await this.orderAnalyser(startBlockList, endBlockList)
      let data = orderData.flatMap(o => o.craftGasByLength)
      console.log('data-------->', data)
      data = this.removeDuplicate(data)
      var myRegression = ecStat.regression('linear', data)
      myRegression.points.sort(function (a, b) {
        return a[0] - b[0]
      })
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
          show: false,
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
            type: 'value',
            name: 'Input length',
            nameTextStyle: {
              fontSize: 15
            },
            nameLocation: 'center',
            nameGap: 30
          }
        ],
        yAxis: [
          {
            // gridIndex: 0,
            type: 'value',
            // scale: true,
            name: 'Gas usage',
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
            name: 'craft',
            type: 'scatter',
            color: 'rgba(151, 193, 57, 1)',
            // itemStyle: { borderColor: 'rgba(6, 6, 6, 1)' },
            data: data,
            emphasis: {
              label: {
                show: true,
                position: 'left',
                color: 'blue',
                fontSize: 16
              }
            }
          },
          {
            name: 'line',
            type: 'line',
            showSymbol: false,
            color: 'rgba(0, 0, 0, 1)',
            data: myRegression.points,
            markPoint: {
              itemStyle: {
                color: 'transparent'
              },
              label: {
                show: true,
                position: 'bottom',
                distance: 80,
                formatter: myRegression.expression,
                color: '#333',
                fontSize: 14
              },
              data: [{
                coord: myRegression.points[myRegression.points.length - 1]
              }]
            }
          }
        ]
      }
      this.myChart.setOption(this.option)
    }
  }
}
</script>
