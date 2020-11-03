<template>
  <b-col>
    <hr>
    <b-row>
      <b-col>
        <b-input-group size="sm">
          <b-form-input
            v-model="orderStartBlockList"
            type="text"
            id="startBlockList"
            placeholder="start block list"
          ></b-form-input>
          <b-form-input
            v-model="orderEndBlockList"
            type="text"
            id="endBlockList"
            placeholder="end block list"
          ></b-form-input>
          <b-input-group-append>
            <b-button :disabled="!orderStartBlockList || !orderEndBlockList" @click="update">Update</b-button>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <div ref="gas" style="width:1000px; height:600px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
// import app from '@/js/web3Facade.js'
import chartmixin from '@/components/mixins/ChartMixin'
export default {
  name: 'gasUsageChart',
  mixins: [chartmixin],
  data () {
    return {
      selectFunc: true,
      myChart: null,
      option: null,
      orderStartBlockList: '1463, 1493, 1502, 1513, 1526, 1535, 1544, 1554, 1567, 1576, 1590, 1601, 1610, 1619, 1633',
      orderEndBlockList: '1491, 1500, 1511, 1524, 1533, 1542, 1552, 1565, 1574, 1588, 1599, 1608, 1617, 1631, 1641'
      // 0.3s-start: 1754, 1799, 1812, 1825, 1843, 1855, 1866, 1877, 1890, 1899, 1910, 1921, 1930, 1939, 1953
      // 0.3s-end: 1797, 1810, 1823, 1841, 1853, 1864, 1875, 1888, 1897, 1908, 1919, 1928, 1937, 1951, 1961
      // 0.2s-start: 2006, 2025, 2033, 2041, 2050, 2062, 2073, 2084, 2092, 2098, 2106, 2114, 2120, 2126, 2134
      // 0.2s-end: 2023, 2031, 2039, 2048, 2060, 2071, 2082, 2090, 2096, 2104, 2112, 2118, 2124, 2132, 2139
      // 0.1s-start: 2146, 2179, 2192, 2205, 2216, 2226, 2237, 2244, 2257, 2266, 2280, 2287, 2293, 2299, 2308
      // 0.1s-end: 2177, 2190, 2203, 2214, 2224, 2235, 2242, 2255, 2264, 2278, 2285, 2291, 2297, 2306, 2312
    }
  },
  mounted () {
    this.initChart()
  },
  computed: {
    latestBlockNumber () {
      return this.$store.state.mostRecentBlockNumber
    }
  },
  watch: {
    // orderEndBlockList: 'initChart'
  },
  methods: {
    update () {
      this.initChart()
    },
    async initChart () {
      const startBlockList = this.orderStartBlockList.split(',').map(i => +i)
      const endBlockList = this.orderEndBlockList.split(',').map(i => +i)
      const orderData = await this.orderAnalyser(startBlockList, endBlockList)
      console.log('order data: ', orderData)
      this.myChart = echarts.init(this.$refs.gas)
      this.option = {
        // title: {
        //   text: 'Gas Usage',
        //   top: '15%',
        //   left: '42%',
        //   textAlign: 'bottom', // 'auto','left','right','center'
        //   // subtext: 'description'
        //   textVerticalAlign: 'bottom' // 'auto','top','bottom','middle'
        // },
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
            data: orderData.map(o => o.orderID)
          }
        ],
        yAxis: [
          {
            gridIndex: 0,
            type: 'value',
            scale: true,
            name: 'Gas Usage (Bar)',
            nameTextStyle: {
              fontSize: 15
            },
            nameGap: 70,
            nameLocation: 'center', // 'start', 'end', 'center'
            // nameGap: 50,
            boundaryGap: [0, 0.2]
          },
          {
            gridIndex: 0,
            type: 'value',
            scale: true,
            name: 'Gas Usage (Line)',
            nameTextStyle: {
              fontSize: 15
            },
            nameGap: 70,
            nameLocation: 'center', // 'start', 'end', 'center'
            // nameGap: 50,
            boundaryGap: [0, 0.2]
          }
          // {
          //   gridIndex: 0,
          //   type: 'value',
          //   scale: true,
          //   name: 'Avg. Gas Usage',
          //   nameTextStyle: {
          //     fontSize: 15
          //   },
          //   nameGap: 30,
          //   nameLocation: 'center', // 'start', 'end', 'center'
          //   // nameGap: 50,
          //   boundaryGap: [0, 0.2]
          // }
          // {
          //   gridIndex: 0,
          //   type: 'value',
          //   scale: true,
          //   name: 'Block Count',
          //   nameTextStyle: {
          //     fontSize: 15
          //   },
          //   nameGap: 30,
          //   nameLocation: 'center', // 'start', 'end', 'center'
          //   // nameGap: 50,
          //   min: function (value) {
          //     return value.min - 5
          //   },
          //   boundaryGap: [0, 0.2]
          // }
        ],
        series: [
          {
            name: 'total',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#666600',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.total)
          },
          {
            name: 'create',
            type: 'bar',
            stack: 'gasUsageAll',
            color: '#9bad47',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.create)
          },
          {
            name: 'craft',
            type: 'bar',
            stack: 'gasUsageAll',
            color: '#f7f11e',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.craft)
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'bar',
            stack: 'gasUsageAll',
            color: '#d9ce23',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.safeBatchTransferFrom)
          },
          {
            name: 'addController',
            type: 'bar',
            stack: 'gasUsageAll',
            color: '#dbff00',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.addController)
          },
          // line chart
          {
            name: 'create',
            type: 'line',
            // stack: 'gasUsageAll',
            color: '#9bad47',
            xAxisIndex: 0,
            yAxisIndex: 1,
            lineStyle: {
              // color: 'green',
              width: 3
              // type: 'dashed'
            },
            data: orderData.map(o => o.create)
          },
          {
            name: 'craft',
            type: 'line',
            // stack: 'gasUsageAll',
            color: '#f7f11e',
            xAxisIndex: 0,
            yAxisIndex: 1,
            lineStyle: {
              // color: 'green',
              width: 3
              // type: 'dashed'
            },
            data: orderData.map(o => o.craft)
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'line',
            // stack: 'gasUsageAll',
            color: '#d9ce23',
            xAxisIndex: 0,
            yAxisIndex: 1,
            lineStyle: {
              // color: 'green',
              width: 3
              // type: 'dashed'
            },
            data: orderData.map(o => o.safeBatchTransferFrom)
          },
          {
            name: 'addController',
            type: 'line',
            // stack: 'gasUsageAll',
            color: '#dbff00',
            xAxisIndex: 0,
            yAxisIndex: 1,
            lineStyle: {
              // color: 'green',
              width: 3
              // type: 'dashed'
            },
            data: orderData.map(o => o.addController)
          }
          // {
          //   name: 'blocks',
          //   type: 'line',
          //   // stack: 'gasUsageAll',
          //   color: '#97c139',
          //   xAxisIndex: 0,
          //   yAxisIndex: 0,
          //   data: orderData.map(o => o.blockCount)
          // }
          // {
          //   name: 'create',
          //   type: 'line',
          //   color: '#9bbd47',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   data: orderData.map(o => o.create / o.p1createCount)
          // },
          // {
          //   name: 'craft',
          //   type: 'line',
          //   color: '#f7e11e',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   data: orderData.map(o => (o.p2craft + o.p3craft) / (o.p2craftCount + o.p3craftCount))
          // },
          // {
          //   name: 'safeBatchTransferFrom',
          //   type: 'line',
          //   color: '#d9de23',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   data: orderData.map(o => (o.p1transfer + o.p2transfer) / (o.p1transferCount + o.p2transferCount))
          // },
          // {
          //   name: 'addController',
          //   type: 'line',
          //   color: '#dbef00',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   data: orderData.map(o => (o.p1addCtrl + o.p2addCtrl) / (o.p1addCtrlCount + o.p2addCtrlCount))
          // }
        ]
      }
      this.myChart.setOption(this.option)
    }
  }
}
</script>
