<template>
  <b-row>
      <b-col>
        <Alert :msg="alertMsg1"/>
        <Area
          area="p1"
          :crossFilter="crossFilter"
          :currentOrder="currentOrder"
          :actor="p1Actor"
          :fields="p1Fields"
          :items="p1Items"
          :detachFunc="detachToken"
          :busy="p1IsBusy"
          :mintFunc="createToken"
          :transferFunc="p1TransferToken"
          :step="p1Step"
          :maxStep="p1Max"
          @refresh="initP1"
          @filter="hasFilter"
        />
      </b-col>
      <b-col>
        <Alert :msg="alertMsg2"/>
        <Area
          area="p2"
          :currentOrder="currentOrder"
          :actor="p2Actor"
          :fields="p2Fields"
          :items="p2Items"
          :detachFunc="detachToken"
          :busy="p2IsBusy"
          :mintFunc="craftTokenP2"
          :transferFunc="p2TransferToken"
          isSelectable
          :step="p2Step"
          :maxStep="p2Max"
          @rowSelected="onSelectedRow"
          @refresh="initP2"
          @filter="hasFilter"
        />
      </b-col>
      <b-col>
        <Alert :msg="alertMsg3"/>
        <Area
          area="p3"
          :currentOrder="currentOrder"
          :actor="p3Actor"
          :fields="p3Fields"
          :items="p3Items"
          :detachFunc="detachToken"
          :busy="p3IsBusy"
          :mintFunc="craftTokenP3"
          :finalMountFunc="finalMount"
          isSelectable
          :step="p3Step"
          :maxStep="p3Max"
          @rowSelected="onSelectedRow"
          @refresh="initP3"
          @filter="hasFilter"
        />
      </b-col>
  </b-row>
</template>
<script>
// @ is an alias to /src
import app from '@/web3Wrapper.js'
import neo from '@/neo4jAPI.js'
import AreaMixin from '@/components/mixins/AreaMixin.vue'
import Area from '@/components/templates/Area.vue'
import Alert from '@/components/Alert.vue'
// import { Product } from '@/Model.js'
export default {
  name: 'About',
  mixins: [AreaMixin],
  components: {
    Area,
    Alert
  },
  data () {
    return {
      alertMsg1: '',
      alertMsg2: '',
      alertMsg3: '',
      crossFilter: '',
      p1Step: 0,
      p2Step: 0,
      p3Step: 0,
      p1Max: 0,
      p2Max: 0,
      p3Max: 0,
      p1Actor: '',
      p2Actor: '',
      p3Actor: '',
      p1Fields: [
        {
          label: 'Assembly ID',
          key: 'assemblyID',
          sortable: true
        },
        {
          key: 'tokenID',
          sortable: true
        },
        'tokenSupply'
      ],
      p2Fields: [
        'pmID',
        {
          key: 'tokenID',
          sortable: true
        },
        'tokenSupply'
      ],
      p3Fields: [
        'pmID',
        {
          key: 'tokenID',
          sortable: true
        },
        'tokenSupply'
      ],
      p1Items: [],
      p2Items: [],
      p3Items: [],
      p1IsBusy: false,
      p2IsBusy: false,
      p3IsBusy: false,
      receipts: [],
      refreshComponents: false
    }
  },
  created () {
    // this.test()
    this.init()
  },
  computed: {
    currentOrder () {
      return this.$store.state.selectedOrder
    }
  },
  watch: {
    currentOrder: 'init'
  },
  methods: {
    // async test () {
    //   const p = new Product('wh_111')
    //   console.log('p', p)
    //   console.log('pd: ', Product.findAll())
    // },
    init () {
      this.initP1()
      this.initP2()
      this.initP3()
    },
    async initP1 () {
      this.p1IsBusy = true
      const [p1] = await app.accounts()
      this.p1Actor = p1.address
      this.p1Items = await neo.getAssembliesByOrder(this.currentOrder)
      this.p1IsBusy = false
    },
    async initP2 () {
      this.p2IsBusy = true
      const [, p2] = await app.accounts()
      this.p2Actor = p2.address
      this.p2Items = await neo.getPMsByOrderAndArea(this.currentOrder, 'p2')
      this.p2IsBusy = false
    },
    async initP3 () {
      this.p3IsBusy = true
      const [, , p3] = await app.accounts()
      this.p3Actor = p3.address
      this.p3Items = await neo.getPMsByOrderAndArea(this.currentOrder, 'p3')
      this.p3IsBusy = false
    },
    createToken () {
      let creationPool
      if (this.filter) {
        creationPool = this.p1Items
          .filter(i => this.multipleItemFilter(i, this.filter))
          .filter(i => i.tokenID === null)
      } else {
        creationPool = this.p1Items
          .filter(i => i.tokenID === null)
      }
      this.p1Step = 0
      this.p1Max = creationPool.length
      console.log('p1Max: ', this.p1Max)
      this.p1Loader = creationPool.values()
      const interval = 500 // production time interval
      const run = () => {
        // console.log('Start creating at:' new Date())
        const result = this.p1Loader.next()
        if (result.done) return
        const currentItem = result.value
        // the create token function in API takes an object with properties as follows:
        const createTokenOpt = {
          qty: currentItem.batchsize,
          uri: 'URI',
          serialNumber: currentItem.assemblyUID,
          actor: this.p1Actor
        }
        const receipt = app.create(createTokenOpt)
        receipt.then(r => {
          // console.log('Txn Receipt: ', r)
          const ts = r.events.TransferSingle.returnValues
          const sn = r.events.serialNumber.returnValues
          const time = this.createTimeStamp()
          const tokenObj = {
            serialNumber: sn._serialNumber,
            tokenID: sn._id,
            tokenSupply: +ts._value,
            timeStamp: time
          }
          neo.updateAssemblyTokens([tokenObj])
            .then(() => neo.getAssembliesByOrder(this.currentOrder))
            .then(result => {
              this.p1Items = result
              this.p1Step += 1
              if (this.p1Step === this.p1Max) {
                this.showAlert('Creation Complete!', 1)
              }
            })
        })
        // run()
        setTimeout(run, interval)
      }
      run()
    },
    craftTokenP2 () {
      const craftPool = this.constructPool(this.p2Items)
      this.p2Step = 0
      this.p2Max = craftPool.length
      const loader = craftPool.values()
      const run = () => {
        const result = loader.next()
        if (result.done) return
        const currentItem = result.value
        const inputUIDs = currentItem.children.map(child => child.assemblyUID)
        const inputTokens = this.p1Items.filter(i => this.multipleItemFilter(i, inputUIDs)).map(i => i.tokenID)
        const craftTokenOpt = {
          inIds: inputTokens,
          inValues: Array(inputTokens.length).fill(1),
          outQty: 1,
          uri: 'URI',
          serialNumber: currentItem.pmUID,
          actor: this.p2Actor
        }
        const receipt = app.craft(craftTokenOpt)

        receipt.then(r => {
          console.log('craft receipt: ', r)
          const sn = app.getReceiptEventValues(r, 'serialNumber')
          const time = this.createTimeStamp()
          const tokenObj = {
            serialNumber: sn.values._serialNumber,
            tokenID: sn.values._id,
            timeStamp: time,
            children: inputTokens
          }
          neo.updatePmTokensOfOrder(this.currentOrder, [tokenObj], 'p2')
            .then(() => neo.getPMsByOrderAndArea(this.currentOrder, 'p2'))
            .then(result => {
              this.p2Items = result
              this.p2Step += 1
              if (this.p2Step === this.p2Max) {
                this.showAlert('Craft Complete!', 2)
              }
            })
        })
        setTimeout(run, 500)
      }
      run()
    },
    craftTokenP3 () {
      const craftPool = this.constructPool(this.p3Items)
      this.p3Step = 0
      this.p3Max = craftPool.length
      const loader = craftPool.values()
      const run = () => {
        const result = loader.next()
        if (result.done) return
        const currentItem = result.value
        const inputUIDs = currentItem.children.map(child => child.assemblyUID)
        const inputTokens = this.p1Items.filter(i => this.multipleItemFilter(i, inputUIDs)).map(i => i.tokenID)
        const craftTokenOpt = {
          inIds: inputTokens,
          inValues: Array(inputTokens.length).fill(1),
          outQty: 1,
          uri: 'URI',
          serialNumber: currentItem.pmID,
          actor: this.p3Actor
        }
        const receipt = app.craft(craftTokenOpt)

        receipt.then(r => {
          console.log('craft receipt: ', r)
          const sn = app.getReceiptEventValues(r, 'serialNumber')
          const time = this.createTimeStamp()
          const tokenObj = {
            serialNumber: sn.values._serialNumber,
            tokenID: sn.values._id,
            timeStamp: time,
            children: inputTokens
          }
          neo.updatePmTokensOfOrder(this.currentOrder, [tokenObj], 'p3')
            .then(() => neo.getPMsByOrderAndArea(this.currentOrder, 'p3'))
            .then(result => {
              this.p3Items = result
              this.p3Step += 1
              if (this.p3Step === this.p3Max) {
                this.showAlert('Craft Complete!', 3)
              }
            })
        })
        setTimeout(run, 500)
      }
      run()
    },
    finalMount () {
      const productID = `wh${this.currentOrder.slice(1)}`
      const allPMs = [...this.p2Items, ...this.p3Items]
      const tokens = allPMs.map(p => p.tokenID)
      this.p3Step = 0
      this.p3Max = tokens.length
      const craftOpt = {
        inIds: tokens,
        inValues: Array(tokens.length).fill(1),
        outQty: 1,
        uri: 'URI',
        serialNumber: productID,
        actor: this.p3Actor
      }
      const receipt = app.craft(craftOpt)
      receipt.then(r => {
        this.p3Step = Math.floor(this.p3Max / 2)
        console.log('Craft Recipt: ', r)
        const sn = app.getReceiptEventValues(r, 'serialNumber')
        const time = this.createTimeStamp()
        const token = {
          tokenID: sn.values._id,
          timeStamp: time,
          children: tokens
        }
        neo.updateProductTokenOfOrder(this.currentOrder, token).then(() => {
          this.p3Step = this.p3Max
          this.showAlert('Final Mount Complete!', 3)
          this.refreshComponents = true
        })
      })
    },
    p1TransferToken () {
      // get all assemblyUIDs in P2/P3
      const uidsToP2 = this.p2Items.flatMap(i =>
        i.children.map(child => child.assemblyUID))
      const uidsToP3 = this.p3Items.flatMap(i =>
        i.children.map(child => child.assemblyUID))
      // filter p1 items by uids, prepare for getting token ID
      const itemsToP2 = this.p1Items.filter(i => this.multipleItemFilter(i, uidsToP2))
      const itemsToP3 = this.p1Items.filter(i => this.multipleItemFilter(i, uidsToP3))
      // if one token has been used (tokenSupply != batchsize), the next actor has already control of this token
      const addControllerP2 = itemsToP2.filter(i => i.tokenID !== null && i.tokenSupply === +i.batchsize)
      const addControllerP3 = itemsToP3.filter(i => i.tokenID !== null && i.tokenSupply === +i.batchsize)
      // init process bar
      this.p1Step = 0
      this.p1Max = addControllerP2.length + addControllerP3.length

      const run = (gen, to, callback) => {
        const result = gen.next()
        if (result.done) {
          callback()
          return
        }
        const approve = {
          id: result.value.tokenID,
          newController: to,
          actor: this.p1Actor
        }
        const receipt = app.addController(approve)
        receipt.then(r => {
          this.p1Step += 1
          if (this.p1Step === this.p1Max) {
            this.showAlert('Control of tokens Approved!', 1)
          }
        })
        // run(gen, to)
        setTimeout(run, 500, gen, to, callback)
      }
      const g2 = addControllerP2.values()
      const g3 = addControllerP3.values()

      const tokensToP2 = itemsToP2.map(i => i.tokenID)
      const tokensToP3 = itemsToP3.map(i => i.tokenID)

      const toP2Opt = {
        from: this.p1Actor,
        to: this.p2Actor,
        ids: tokensToP2,
        values: Array(tokensToP2.length).fill(1),
        actor: this.p1Actor
      }
      const toP3Opt = {
        from: this.p1Actor,
        to: this.p3Actor,
        ids: tokensToP3,
        values: Array(tokensToP3.length).fill(1),
        actor: this.p1Actor
      }

      const transferToP2 = () => {
        this.showAlert('Transfering...', 1)
        const receiptP2 = app.transferBatch(toP2Opt)
        receiptP2.then(r => {
          this.showAlert('Token transfer to P2 finished!', 1)
          console.log('transfer Batch to P2', r)
        })
      }
      const transferToP3 = () => {
        this.showAlert('Transfering...', 1)
        const receiptP3 = app.transferBatch(toP3Opt)
        receiptP3.then(r => {
          this.showAlert('Token transfer to P3 finished!', 1)
          console.log('transfer Batch to P3', r)
        })
      }

      run(g2, this.p2Actor, transferToP2)
      run(g3, this.p3Actor, transferToP3)
    },
    p2TransferToken () {
      const tokensToP3 = this.p2Items.map(i => i.tokenID)
      console.log('tokens to P3: ', tokensToP3)
      const g = tokensToP3.values()
      this.p2Step = 0
      this.p2Max = tokensToP3.length
      const run = (gen, callback) => {
        const result = gen.next()
        if (result.done) {
          callback()
          return
        }
        const approve = {
          id: result.value,
          newController: this.p3Actor,
          actor: this.p2Actor
        }
        const receipt = app.addController(approve)
        receipt.then(r => {
          this.p2Step += 1
          if (this.p2Step === this.p2Max) {
            this.showAlert('Control of tokens Approved!', 2)
          }
        })
        setTimeout(run, 500, gen, callback)
      }

      const toP3Opt = {
        from: this.p2Actor,
        to: this.p3Actor,
        ids: tokensToP3,
        values: Array(tokensToP3.length).fill(1),
        actor: this.p2Actor
      }
      const transferToP3 = () => {
        this.showAlert('transfering to P3...', 2)
        const receiptP3 = app.transferBatch(toP3Opt)
        console.log('receipt: ', receiptP3)
        receiptP3.then(r => {
          this.showAlert('Token transfer to P3 finished!', 2)
          console.log('transfer Batch to P3', r)
        })
      }

      run(g, transferToP3)
    },
    updateOrder (selectOrder) {
      this.currentOrder = selectOrder
    },
    onSelectedRow (rowContent) {
      if (rowContent.length) {
        const [content] = rowContent
        this.crossFilter = content.children.map(child => child.assemblyUID)
      } else {
        this.crossFilter = ''
      }
    },
    detachToken (tokens) {
      // @default: detach tokens according to the applied filter
      // @modify: do not apply any filter and apply your own algorithm here to calculate tokens should be detached
      return neo.detachToken(tokens)
    },
    hasFilter (f) {
      this.filter = f
    },
    showAlert (msg, area) {
      switch (area) {
        case 1:
          this.alertMsg1 = msg
          break
        case 2:
          this.alertMsg2 = msg
          break
        case 3:
          this.alertMsg3 = msg
          break
      }
    }
  }
}
</script>
