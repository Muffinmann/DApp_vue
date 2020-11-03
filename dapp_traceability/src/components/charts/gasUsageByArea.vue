<template>
  <b-col>
    <hr>
    <b-row>
      <b-col>
        <b-form-group>
          <label for="input-1">From block</label>
          <b-form-input id="input-1" v-model="orderStartBlock1" type="text"></b-form-input>
          <label for="input-2">To block</label>
          <b-form-input id="input-2" v-model="orderEndBlock1" type="text"></b-form-input>
        </b-form-group>
      </b-col>
      <!-- <b-col>
        <b-form-group>
          <label for="input-3">From block</label>
          <b-form-input id="input-3" v-model="orderStartBlock2" type="text"></b-form-input>
          <label for="input-4">To block</label>
          <b-form-input id="input-4" v-model="orderEndBlock2" type="text"></b-form-input>
        </b-form-group>
      </b-col> -->
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
      orderStartBlock1: 34,
      orderEndBlock1: 56,
      orderStartBlock2: 34,
      orderEndBlock2: 56,
      // latestBlockNumber: 3236,
      syncOptions: [
        { text: 'on', value: true },
        { text: 'off', value: false }
      ]
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
    orderEndBlock1: 'initChart',
    orderEndBlock2: 'initChart'
  },
  methods: {
    async initChart () {
      // console.log('blockNumber: ', this.latestBlockNumber)

      const startBlocks = [+this.orderStartBlock1, +this.orderStartBlock2]
      const endBlocks = [+this.orderEndBlock1, +this.orderEndBlock2]
      const orderData = await this.orderAnalyser(startBlocks, endBlocks)
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
            show: true,
            containLabel: true,
            borderWidth: 1,
            borderColor: '#000',
            width: '45%',
            x: '2%',
            y: '5%'
          },
          {
            show: true,
            containLabel: true,
            borderWidth: 1,
            borderColor: '#000',
            width: '45%',
            x2: '0%',
            y: '5%'
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
          data: ['Area Total', 'create', 'craft', 'safeBatchTransferFrom', 'addController'],
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
            gridIndex: 0,
            type: 'category',
            name: 'Production Area \n\n (a)',
            nameTextStyle: {
              fontSize: 15
            },
            nameLocation: 'center',
            nameGap: 30,
            data: ['P1', 'P2', 'P3']
          },
          {
            gridIndex: 1,
            type: 'category',
            name: 'Production Area \n\n (b)',
            nameTextStyle: {
              fontSize: 15
            },
            nameLocation: 'center',
            nameGap: 30,
            data: ['P1', 'P2', 'P3']
          }
          // {
          //   type: 'category',
          //   boundaryGap: true,
          //   data: (function () {
          //     var res = []
          //     var len = 10
          //     while (len--) {
          //       res.push(10 - len - 1)
          //     }
          //     return res
          //   })()
          // }
        ],
        yAxis: [
          {
            gridIndex: 0,
            type: 'value',
            scale: true,
            name: 'Gas Usage',
            nameTextStyle: {
              fontSize: 15
            },
            nameGap: 70,
            nameLocation: 'center', // 'start', 'end', 'center'
            // nameGap: 50,
            boundaryGap: [0, 0.2]
          },
          {
            gridIndex: 1,
            type: 'value',
            scale: true,
            name: 'Transaction Count',
            nameTextStyle: {
              fontSize: 15
            },
            nameGap: 35,
            nameLocation: 'center', // 'start', 'end', 'center'
            // nameGap: 50,
            boundaryGap: [0, 0.2]
          }
          // {
          //   type: 'value',
          //   scale: true,
          //   name: 'Avg. Gas Usage',
          //   nameLocation: 'end',
          //   // nameGap: 50,
          //   boundaryGap: [0, 0.2]
          // }
        ],
        series: [
          {
            name: 'Area Total',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#666600',
            xAxisIndex: 0,
            yAxisIndex: 0,
            // label: {
            //   show: true,
            //   position: 'top',
            //   distance: 25,
            //   rotate: '55',
            //   offset: [5, 0]
            // },
            data: [
              orderData[0].p1total,
              orderData[0].p2total,
              orderData[0].p3total
            ]
          },
          {
            name: 'create',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#9bad47',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: [
              orderData[0].create,
              0,
              0
            ]
          },
          {
            name: 'craft',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#f7f11e',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: [
              0,
              orderData[0].p2craft,
              orderData[0].p3craft
            ]
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#d9ce23',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: [
              orderData[0].p1transfer,
              orderData[0].p2transfer,
              0
            ]
          },
          {
            name: 'addController',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#dbff00',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: [
              orderData[0].p1addCtrl,
              orderData[0].p2addCtrl,
              0
            ]
          },
          // here begins series for 2nd. chart
          {
            name: 'Area Total',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#666600',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: [
              orderData[0].p1txnCount,
              orderData[0].p2txnCount,
              orderData[0].p3craftCount
            ]
          },
          {
            name: 'create',
            type: 'bar',
            // stack: 'gasUsage2',
            color: '#9bad47',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: [
              orderData[0].p1createCount,
              0,
              0
            ]
          },
          {
            name: 'craft',
            type: 'bar',
            // stack: 'gasUsage2',
            color: '#f7f11e',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: [
              0,
              orderData[0].p2craftCount,
              orderData[0].p3craftCount
            ]
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'bar',
            // stack: 'gasUsage2',
            color: '#d9ce23',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: [
              orderData[0].p1transferCount,
              orderData[0].p2transferCount,
              0
            ]
          },
          {
            name: 'addController',
            type: 'bar',
            // stack: 'gasUsage2',
            color: '#dbff00',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: [
              orderData[0].p1addCtrlCount,
              orderData[0].p2addCtrlCount,
              0
            ]
          }
        ]
      }
      this.myChart.setOption(this.option)
    }
  }
}
</script>
