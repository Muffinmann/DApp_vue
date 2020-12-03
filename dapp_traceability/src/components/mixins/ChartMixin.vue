<script>
import app from '@/js/web3Facade.js'
export default {
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
      const blocks = await Promise.all(blockNumbers.map(n => app.getBlock(n)))

      console.log('get blocks: ', blocks)
      return blocks
    },
    async reduceTxn (txn) {
      const funSig = txn.input.slice(0, 10)
      const funName = app.decodeFuncSig(funSig)
      const txnReceipt = await app.getTxnReceipt(txn.hash)
      // console.log('txn: ', txnReceipt)
      let inputLength = 1
      if (funName === 'craft' || funName === 'safeBatchTransferFrom') {
        const [TransferBatchLog] = txnReceipt.logs
        const transferBatch = app.decodeEventLog('TransferBatch', TransferBatchLog)
        inputLength = transferBatch._ids.length
        if (inputLength === 19) console.log('********', funName, transferBatch, txnReceipt)
      }
      return {
        funName: funName,
        from: txnReceipt.from.toLowerCase(),
        gas: txnReceipt.gasUsed,
        inputLength: inputLength
      }
    },
    async reduceBlock (b) {
      return {
        blockNumber: b.number,
        blockGasUsed: b.gasUsed,
        transactions: await Promise.all(b.transactions.map(async (t) => await this.reduceTxn(t)))
      }
    },
    async accounts () {
      const accounts = await app.accounts()
      return accounts.map(a => a.address.toLowerCase())
    },
    async orderAnalyser (startBlockList, endBlockList) {
      const areas = await this.accounts()
      const orderData = []
      for (const [i, b] of Object.entries(startBlockList)) {
        const blocks = await this.getBlocks(b, endBlockList[i])
        const txns = await Promise.all(blocks.flatMap(b => b.transactions.map(t => this.reduceTxn(t))))

        const total = txns.reduce((acc, crr) => acc + crr.gas, 0)

        const create = txns.filter(tx => tx.funName === 'create').reduce((acc, crr) => acc + crr.gas, 0)

        const craft = txns.filter(tx => tx.funName === 'craft').reduce((acc, crr) => acc + crr.gas, 0)
        const craftGasByLength = txns.filter(tx => tx.funName === 'craft').map(txn => [txn.inputLength, txn.gas])

        const safeBatchTransferFrom = txns.filter(tx => tx.funName === 'safeBatchTransferFrom').reduce((acc, crr) => acc + crr.gas, 0)
        const transferGasByLength = txns.filter(tx => tx.funName === 'safeBatchTransferFrom').map(txn => [txn.inputLength, txn.gas])

        const addController = txns.filter(tx => tx.funName === 'addController').reduce((acc, crr) => acc + crr.gas, 0)

        const p1txns = txns.filter(tx => tx.from === areas[0])
        const p2txns = txns.filter(tx => tx.from === areas[1])
        const p3txns = txns.filter(tx => tx.from === areas[2])

        const p1total = p1txns.reduce((acc, crr) => acc + crr.gas, 0)
        const p2total = p2txns.reduce((acc, crr) => acc + crr.gas, 0)
        const p3total = p3txns.reduce((acc, crr) => acc + crr.gas, 0)

        const p1transfer = p1txns.filter(tx => tx.funName === 'safeBatchTransferFrom').reduce((acc, crr) => acc + crr.gas, 0)
        const p1addCtrl = p1txns.filter(tx => tx.funName === 'addController').reduce((acc, crr) => acc + crr.gas, 0)

        const p2craft = p2txns.filter(tx => tx.funName === 'craft').reduce((acc, crr) => acc + crr.gas, 0)
        const p2addCtrl = p2txns.filter(tx => tx.funName === 'addController').reduce((acc, crr) => acc + crr.gas, 0)
        const p2transfer = p2txns.filter(tx => tx.funName === 'safeBatchTransferFrom').reduce((acc, crr) => acc + crr.gas, 0)

        const p3craft = p3txns.filter(tx => tx.funName === 'craft').reduce((acc, crr) => acc + crr.gas, 0)

        const blockCount = endBlockList[i] - b + 1

        const p1txnCount = p1txns.length
        const p1createCount = txns.filter(tx => tx.funName === 'create').length
        const p1addCtrlCount = p1txns.filter(tx => tx.funName === 'addController').length
        const p1transferCount = p1txns.filter(tx => tx.funName === 'safeBatchTransferFrom').length
        const p2txnCount = p2txns.length
        const p2craftCount = p2txns.filter(tx => tx.funName === 'craft').length
        const p2addCtrlCount = p2txns.filter(tx => tx.funName === 'addController').length
        const p2transferCount = p2txns.filter(tx => tx.funName === 'safeBatchTransferFrom').length
        const p3craftCount = p3txns.filter(tx => tx.funName === 'craft').length
        const gasData = {
          orderID: `o_1${+i + 11}`,
          total: total,
          create: create,
          craft: craft,
          craftGasByLength: craftGasByLength,
          safeBatchTransferFrom: safeBatchTransferFrom,
          transferGasByLength: transferGasByLength,
          addController: addController,
          blockCount: blockCount,
          p1total: p1total,
          p2total: p2total,
          p3total: p3total,
          p1addCtrl: p1addCtrl,
          p1transfer: p1transfer,
          p1txnCount: p1txnCount,
          p1createCount: p1createCount,
          p1addCtrlCount: p1addCtrlCount,
          p1transferCount: p1transferCount,
          p2craft: p2craft,
          p2addCtrl: p2addCtrl,
          p2transfer: p2transfer,
          p2txnCount: p2txnCount,
          p2craftCount: p2craftCount,
          p2addCtrlCount: p2addCtrlCount,
          p2transferCount: p2transferCount,
          p3craft: p3craft,
          p3craftCount: p3craftCount
        }
        orderData.push(gasData)
      }
      return orderData
    }
  }
}
</script>
