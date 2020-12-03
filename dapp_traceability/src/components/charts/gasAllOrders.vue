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
    <div ref="gas" style="width:1400px; height:800px"></div>
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
      orderStartBlockList: '1387, 1429, 1438, 1449, 1462, 1471, 1480, 1489, 1498, 1505, 1515, 1524, 1531, 1538, 1548',
      orderEndBlockList: '1427, 1436, 1447, 1460, 1469, 1478, 1487, 1496, 1503, 1513, 1522, 1529, 1536, 1546, 1553'
      // 0.3s-start: 1250, 1272, 1280, 1288, 1299, 1307, 1315, 1323, 1331, 1337, 1346, 1354, 1360, 1366, 1374
      // 0.3s-end: 1270, 1278, 1286, 1297, 1305, 1313, 1321, 1329, 1335, 1344, 1352, 1358, 1364, 1372, 1378
      // 0.2s-start: 1119, 1138, 1146, 1154, 1163, 1171, 1179, 1187, 1195, 1201, 1209, 1217, 1223, 1229, 1237
      // 0.2s-end: 1136, 1144, 1152, 1161, 1169, 1177, 1185, 1193, 1199, 1207, 1215, 1221, 1227, 1235, 1241
      // 0.1s-start: 35, 48, 55, 62, 70, 77, 84, 91, 98, 103, 110, 117, 122, 127, 134
      // 0.1s-end: 46, 53, 60, 68, 75, 82, 89, 96, 101, 108, 115, 120, 125, 132, 137
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
          show: true,
          data: ['create', 'safeBatchTransferFrom', 'addController', 'craft', 'total'],
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
            color: 'rgba(200,162,0,1)',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.total)
          },
          {
            name: 'craft',
            type: 'bar',
            stack: 'gasUsageAll',
            color: 'rgba(173,173,173,1)',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.craft)
          },
          {
            name: 'addController',
            type: 'bar',
            stack: 'gasUsageAll',
            color: 'rgba(255, 204, 0, 1)',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.addController)
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'bar',
            stack: 'gasUsageAll',
            color: 'rgba(41,97,147,1)',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.safeBatchTransferFrom)
          },
          {
            name: 'create',
            type: 'bar',
            stack: 'gasUsageAll',
            color: 'rgba(151,193,57,1)',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: orderData.map(o => o.create)
          }
          // line chart
          // {
          //   name: 'create(line)',
          //   type: 'line',
          //   // stack: 'gasUsageAll',
          //   color: 'rgba(151,193,57,1)',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   lineStyle: {
          //     // color: 'green',
          //     width: 3
          //     // type: 'dashed'
          //   },
          //   data: orderData.map(o => o.create)
          // },
          // {
          //   name: 'craft(line)',
          //   type: 'line',
          //   // stack: 'gasUsageAll',
          //   color: 'rgba(173,173,173,1)',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   lineStyle: {
          //     // color: 'green',
          //     width: 3
          //     // type: 'dashed'
          //   },
          //   data: orderData.map(o => o.craft)
          // },
          // {
          //   name: 'safeBatchTransferFrom(line)',
          //   type: 'line',
          //   // stack: 'gasUsageAll',
          //   color: 'rgba(41,97,147,1)',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   lineStyle: {
          //     // color: 'green',
          //     width: 3
          //     // type: 'dashed'
          //   },
          //   data: orderData.map(o => o.safeBatchTransferFrom)
          // },
          // {
          //   name: 'addController(line)',
          //   type: 'line',
          //   // stack: 'gasUsageAll',
          //   color: 'rgba(255, 204, 0, 1)',
          //   xAxisIndex: 0,
          //   yAxisIndex: 1,
          //   lineStyle: {
          //     // color: 'green',
          //     width: 3
          //     // type: 'dashed'
          //   },
          //   data: orderData.map(o => o.addController)
          // }
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
