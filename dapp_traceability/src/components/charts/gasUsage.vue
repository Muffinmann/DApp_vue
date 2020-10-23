<template>
  <b-col>
    <h2>Charts</h2>
    <div>
      <b-form-select v-model="selectFunc"></b-form-select>
      <label for="range-1">The latest {{rangeValue}} blocks</label>
      <b-form-input id="range-1" v-model="rangeValue" type="range" min="1" :max="latestBlockNumber"></b-form-input>
    </div>
    <div ref="main" style="width:600px; height:400px"></div>
  </b-col>
</template>
<script>
import echarts from 'echarts'
import app from '@/js/web3Facade.js'
export default {
  name: 'gasUsageChart',
  data () {
    return {
      selectFunc: true,
      myChart: null,
      option: null,
      rangeValue: 10,
      latestBlockNumber: 10
    }
  },
  mounted () {
    this.initChart()
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
    async initChart () {
      console.log('initizing...')
      this.latestBlockNumber = await app.mostRecentBlock()
      const blocks = await this.getBlocks(this.latestBlockNumber - this.rangeValue * 2 + 1, this.latestBlockNumber) // Array of block objects
      const blocksReduced = await Promise.all(blocks.map(b => this.reduceBlock(b)))
      const drawBlocks = blocksReduced.slice(this.rangeValue) // the first 'rangeValue' blocks are only used for calculating avg. gas usage
      console.log('blocksReduced: ', blocksReduced)
      // const latestBlock = await app.getBlock(latestBlockNumber)
      // const txns = latestBlock.transactions
      // const receipts = await Promise.all(txns.map(async txn => await app.getTxnReceipt(txn)))
      // const gasUsage = receipts.map(r => r.gasUsed)
      // console.group('LATEST BLOCK')
      // console.log('latest Block: ', latestBlock)
      // console.log('txn receipt: ', receipts)
      // console.log('gas Usage: ', gasUsage)
      // console.groupEnd()

      this.myChart = echarts.init(this.$refs.main)
      this.option = {
        title: {
          text: 'Gas Usage',
          top: '15%',
          left: '42%',
          textAlign: 'bottom', // 'auto','left','right','center'
          // subtext: 'description'
          textVerticalAlign: 'bottom' // 'auto','top','bottom','middle'
        },
        grid: {
          left: '1%',
          right: '5%',
          top: '20%',
          containLabel: true
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
          data: ['blockTotal', 'create', 'craft', 'safeBatchTransferFrom', 'addController', 'Avg. Gas Usage'],
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
            nameLocation: 'end', // 'start', 'end'
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
            name: 'blockTotal',
            type: 'bar',
            // stack: 'gasUsage',
            color: '#666600',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.map(b => b.blockGasUsed)
          },
          {
            name: 'create',
            type: 'bar',
            stack: 'gasUsage',
            color: '#9bad47',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.flatMap(b => b.transactions.map(t => t.funName === 'create' ? t.gas : 0))
          },
          {
            name: 'craft',
            type: 'bar',
            stack: 'gasUsage',
            color: '#9abc17',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.flatMap(b => b.transactions.map(t => t.funName === 'craft' ? t.gas : 0))
          },
          {
            name: 'safeBatchTransferFrom',
            type: 'bar',
            stack: 'gasUsage',
            color: '#aabc17',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.flatMap(b => b.transactions.map(t => t.funName === 'safeBatchTransferFrom' ? t.gas : 0))
          },
          {
            name: 'addController',
            type: 'bar',
            stack: 'gasUsage',
            color: '#abc017',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: drawBlocks.flatMap(b => b.transactions.map(t => t.funName === 'addController' ? t.gas : 0))
          },
          {
            name: 'Avg. Gas Usage',
            type: 'line',
            color: '#20240f',
            xAxisIndex: 0,
            yAxisIndex: 0,
            data: (() => {
              const res = []
              const gas = blocksReduced.map(b => b.blockGasUsed)
              console.log('gas ', gas)
              const range = this.rangeValue
              const last = gas.length
              for (let i = 0; i < range; i++) {
                console.log(gas.slice(0 - range - i, last - i))
                const sum = gas.slice(0 - range - i, last - i).reduce((acc, crr) => acc + crr)
                console.log('sum ', sum)
                const avg = sum / this.rangeValue
                res.unshift(avg)
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
