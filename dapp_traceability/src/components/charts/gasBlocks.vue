<template>
  <b-col>
    <h2>Charts</h2>
    <div>
      <label for="range-1">From Block</label>
      <b-form-input id="range-1" v-model="fromBlock" type="text"></b-form-input>
      <label for="range-2">To Block</label>
      <b-form-input id="range-2" v-model="toBlock" type="text"></b-form-input>
    </div>
    <div ref="main" style="width:1000px; height:600px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
import app from '@/js/web3Facade.js'
import chartmixin from '@/components/mixins/ChartMixin'
export default {
  name: 'gasUsageChart',
  mixins: [chartmixin],
  data () {
    return {
      fromBlock: 1056,
      toBlock: 1319,
      // 0.5s-start: 428, 458, 467, 478, 491, 500, 509, 518, 527, 534, 544, 553, 560, 567, 577
      // 0.5s-end: 456, 465, 476, 489, 498, 507, 516, 525, 532, 542, 551, 558, 565, 575, 582
      // block count 15s: [29, 8, 10, 12, 8, 8, 8, 8, 6, 9, 8, 6, 6, 9, 6]
      // block count 0.5s-10s: [61, 15, 17, 19, 16, 13, 12, 16, 11, 17, 13, 10, 10, 16, 11]
      // block count 0.3s-10s: [56, 15, 17, 23, 16, 13, 12, 14, 11, 17, 13, 10, 7, 16, 11]
      // block count 0.2s-10s: [56, 15, 17, 23, 15, 13, 12, 16, 11, 17, 13, 7, 10, 14, 11]
      // block count 0.1s-10s: [67, 15, 17, 23, 15, 13, 10, 16, 11, 15, 12, 10, 10, 16, 11]
      // 0.3s-start: 150, 171, 179, 187, 198, 206, 214, 222, 230, 236, 245, 253, 259, 265, 273
      // 0.3s-end: 169, 177, 185, 196, 204, 212, 220, 228, 234, 243, 251, 257, 263, 271, 277
      // 0.3s-10s-start: 736, 793, 809, 827, 851, 868, 882, 895, 910, 922, 940, 954, 965, 973, 990
      // 0.3s-10s-end: 791, 807, 825, 849, 866, 880, 893, 908, 920, 938, 952, 963, 971, 988, 1000
      // 0.2s-start: 12, 31, 39, 47, 56, 64, 72, 80, 88, 94, 102, 110, 116, 122, 130
      // 0.2s-end: 29, 37, 45, 54, 62, 70, 78, 86, 92, 100, 108, 114, 120, 128, 134
      // 0.2s-10s-start: [1056, 1113, 1129, 1147, 1171, 1187, 1201, 1214, 1231, 1243, 1261, 1275, 1283, 1294, 1309]
      // 0.2s-10s-end: [1111, 1127, 1145, 1169, 1185, 1199, 1212, 1229, 1241, 1259, 1273, 1281, 1292, 1307, 1319]
      // 0.1s-start: 309, 323, 330, 337, 345, 352, 359, 366, 373, 378, 385, 392, 397, 402, 409,
      // 0.1s-end: 321, 328, 335, 343, 350, 357, 364, 371, 376, 383, 390, 395, 400, 407, 412,
      // 0.1s-10s-start: 1365, 1433, 1449, 1467, 1491, 1507, 1521, 1532, 1549, 1561, 1577, 1590, 1601, 1612, 1629
      // 0.1s-10s-end: [1431, 1447, 1465, 1489, 1505, 1519, 1530, 1547, 1559, 1575, 1588, 1599, 1610, 1627, 1639]
      // /////////////
      // 0.3s-start2: 2697 ,2720, 2727, 2736, 2747, 2755, 2763, 2771, 2779, 2785, 2794, 2802, 2808, 2814, 2822
      // 0.3s-end2: 2718 ,2725, 2734, 2745, 2753, 2761, 2769, 2777, 2783, 2792, 2800, 2806, 2812, 2820, 2826

      myChart: null,
      option: null,
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
  watch: {
    toBlock: 'initChart'
  },
  methods: {
    async getLogs (eventName) {
      const option = {
        fromBlock: this.latestBlockNumber - this.rangeValue,
        toBlock: 'latest',
        address: app.findContractAddress(),
        topic: [app.findEventSig(eventName)]
      }
      return await app.getPastLogs(option)
    },
    async getBlocks (fromNumber, toNumber) {
      const blockNumbers = Array.from({ length: toNumber - fromNumber + 1 }, (v, k) => k + fromNumber)
      const blocks = blockNumbers.map(n => app.getBlock(n))
      // console.log('blocks: ', await Promise.all(blocks))
      return await Promise.all(blocks)
    },
    async reduceTxn (txn) {
      const funSig = txn.input.slice(0, 10)
      const funName = app.decodeFuncSig(funSig)
      const txnReceipt = await app.getTxnReceipt(txn.hash)
      // console.log('txn: ', txnReceipt)
      return {
        funName: funName,
        gas: txnReceipt.gasUsed
      }
    },
    async reduceBlock (b) {
      return {
        blockNumber: b.number,
        blockGasUsed: b.gasUsed,
        transactions: await Promise.all(b.transactions.map(async (t) => await this.reduceTxn(t)))
      }
    },
    refreshChart () {
      // console.log('sync: ', this.useSync)
      if (this.useSync) this.initChart()
    },
    async initChart () {
      // console.log('blockNumber: ', this.latestBlockNumber)
      // const f = this.latestBlockNumber > this.rangeValue * 2 + 1 ? this.latestBlockNumber - this.rangeValue * 2 + 1 : this.latestBlockNumber
      // const blocks = await this.getBlocks(f, this.latestBlockNumber) // Array of block objects
      // console.log('blocks: ', blocks)
      const blocks = await this.getBlocks(this.fromBlock, this.toBlock)
      const blocksReduced = await Promise.all(blocks.map(b => this.reduceBlock(b)))
      // const drawBlocks = blocksReduced.slice(this.rangeValue) // the first 'rangeValue'(default=10) blocks are only used for calculating avg. gas usage
      const drawBlocks = blocksReduced

      this.myChart = echarts.init(this.$refs.main)
      this.option = {
        // title: {
        //   text: 'Gas Usage',
        //   top: '15%',
        //   left: '42%',
        //   textAlign: 'bottom', // 'auto','left','right','center'
        //   // subtext: 'description'
        //   textVerticalAlign: 'bottom' // 'auto','top','bottom','middle'
        // },
        grid: {
          left: '5%',
          right: '5%',
          // top: '20%',
          show: true,
          containLabel: true,
          borderWidth: 1,
          borderColor: '#000'
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
          data: ['create', 'craft', 'safeBatchTransferFrom', 'addController'],
          // data: ['blockTotal', 'create', 'craft', 'safeBatchTransferFrom', 'addController', 'Avg. Gas Usage'],
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
            type: 'category',
            name: 'Block Number',
            nameTextStyle: {
              fontSize: 15
            },
            nameLocation: 'center',
            axisLabel: { rotate: '45' },
            nameGap: 30,
            boundaryGap: true,
            data: drawBlocks.map(b => b.blockNumber)
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
            type: 'value',
            scale: true,
            name: 'Function Gas Usage',
            nameTextStyle: {
              fontSize: 15
            },
            nameLocation: 'center', // 'start', 'end'
            nameGap: 80,
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
          // {
          //   name: 'blockTotal',
          //   type: 'bar',
          //   // stack: 'gasUsage',
          //   color: '#666600',
          //   xAxisIndex: 0,
          //   yAxisIndex: 0,
          //   data: drawBlocks.map(b => b.blockGasUsed)
          // },
          {
            name: 'create',
            type: 'bar',
            stack: 'gasUsage',
            color: '#9bad47',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.map(b => b.transactions.map(t => t.funName === 'create' ? t.gas : 0).reduce((acc, crr) => acc + crr, 0))
          },
          {
            name: 'craft',
            type: 'bar',
            stack: 'gasUsage',
            color: '#f7f11e',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.map(b => b.transactions.map(t => t.funName === 'craft' ? t.gas : 0).reduce((acc, crr) => acc + crr, 0))
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'bar',
            stack: 'gasUsage',
            color: '#d9ce23',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.map(b => b.transactions.map(t => t.funName === 'safeBatchTransferFrom' ? t.gas : 0).reduce((acc, crr) => acc + crr, 0))
          },
          {
            name: 'addController',
            type: 'bar',
            stack: 'gasUsage',
            color: '#dbff00',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.map(b => b.transactions.map(t => t.funName === 'addController' ? t.gas : 0).reduce((acc, crr) => acc + crr, 0))
          }
          // {
          //   name: 'Avg. Gas Usage',
          //   type: 'line',
          //   color: '#20240f',
          //   xAxisIndex: 0,
          //   yAxisIndex: 0,
          //   data: (() => {
          //     const res = []
          //     const gas = blocksReduced.map(b => b.blockGasUsed)
          //     // console.log('gas ', gas)
          //     const range = this.rangeValue
          //     const last = gas.length
          //     for (let i = 0; i < range; i++) {
          //       // console.log(gas.slice(0 - range - i, last - i))
          //       const sum = gas.slice(0 - range - i, last - i).reduce((acc, crr) => acc + crr, 0)
          //       // console.log('sum ', sum)
          //       const avg = sum / this.rangeValue
          //       res.unshift(avg)
          //     }
          //     return res
          //   })()
          // }
        ]
      }
      this.myChart.setOption(this.option)
    }
  }
}
</script>
