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
import app from '@/js/web3Facade.js'
import neo from '@/js/neo4jAPI.js'
import AreaMixin from '@/components/mixins/AreaMixin.vue'
import Area from '@/components/templates/Area.vue'
import Alert from '@/components/Alert.vue'
import { Order, Product, Module } from '@/js/Model_design1.js'
export default {
  name: 'About',
  mixins: [AreaMixin],
  components: {
    Area,
    Alert
  },
  data () {
    return {
      currentOrder: '',
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
      interval: 500,
      startBlocks: [],
      endBlocks: []
      // receipts: [],
      // refreshComponents: false
    }
  },
  created () {
    // this.test()
    this.init()
  },
  computed: {
    updateOrder () {
      return this.$store.state.selectedOrder
    },
    productionTrigger () {
      return this.$store.state.runProduction
    }
  },
  watch: {
    updateOrder: 'updateCurrentOrder',
    productionTrigger: 'runOrderProduction',
    currentOrder: 'init'
  },
  methods: {
    async test () {
      const o = await Order.find('o_111')
      const m = await Module.find('580FL0037_1A')
      // await Assembly.find()
      // const product = await o.product()
      // console.log('o ', o)
      // console.log('product ', await o.product())
      // console.log('find all...', await Order.findAll())
      // console.log('find...', await Order.find('o_111'))
      console.log('kanorder of order...', await o.kanbanOrders)
      console.log('create product...', await Product.find('wh_111'))
      console.log('create module...', await Module.find('580FL0037_1A'))
      console.log('create Assembly...', await m.assemblies)
      // console.log('modules in product...', await o.product.modules())
    },
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
      console.log('p1 count: ', this.p1Items.length)
    },
    async initP2 () {
      this.p2IsBusy = true
      const [, p2] = await app.accounts()
      this.p2Actor = p2.address
      this.p2Items = await neo.getPMsByOrderAndArea(this.currentOrder, 'p2')
      const p2length = this.p2Items.map(i => i.children.length)
      console.log('P2 item children length range: ', p2length, 'Min: ', Math.min(...p2length), '---', 'Max: ', Math.max(...p2length))
      this.p2IsBusy = false
    },
    async initP3 () {
      this.p3IsBusy = true
      const [, , p3, log] = await app.accounts()
      this.p3Actor = p3.address
      this.logActor = log.address
      this.p3Items = await neo.getPMsByOrderAndArea(this.currentOrder, 'p3')
      const p3length = this.p3Items.map(i => i.children.length)
      console.log('P3 item children length range: ', p3length, 'Min: ', Math.min(...p3length), '---', 'Max: ', Math.max(...p3length))
      this.p3IsBusy = false
    },
    async createToken () {
      const creationPool = this.constructPool(this.p1Items)
      // const receiptCollector = []
      const updateQueue = []
      // const tokenObjects = []
      this.p1Step = 0
      this.p1Max = creationPool.length
      // console.log('p1Max: ', this.p1Max)
      for (const item of creationPool) {
        const createTokenOpt = {
          qty: item.batchsize,
          uri: 'URI',
          serialNumber: item.assemblyUID,
          actor: this.p1Actor
        }
        const receipt = app.create(createTokenOpt)
        // receiptCollector.push(receipt)
        const update = new Promise(resolve => {
          receipt.then(async (r) => {
            console.log('Create Txn Receipt: ', r)
            const ts = r.events.TransferSingle.returnValues
            const sn = r.events.serialNumber.returnValues
            const time = this.createTimeStamp()
            const tokenObj = {
              serialNumber: sn._serialNumber,
              tokenID: sn._id,
              tokenSupply: +ts._value,
              timeStamp: time
            }
            await neo.updateAssemblyTokens(tokenObj)
            this.p1Items = await neo.getAssembliesByOrder(this.currentOrder)
            this.p1Step += 1
            resolve()
            if (this.p1Step === this.p1Max) {
              this.showAlert('Creation Complete!', 1)
            }
          })
        })
        updateQueue.push(update)
        await this.delay(this.interval)
      }
      console.log('updateQueue: ', updateQueue)
      // console.log('receiptCollector: ', receiptCollector)
      return updateQueue
    },
    async craftTokenP2 () {
      const craftPool = this.constructPool(this.p2Items)
      console.log('p2 craft pool: ', craftPool)
      this.p2Step = 0
      this.p2Max = craftPool.length
      // const loader = craftPool.values()
      // const interval = 500
      // const receiptCollector = []
      const updateQueue = []
      for (const item of craftPool) {
        const inputUIDs = item.children.map(child => child.assemblyUID)
        const inputTokens = inputUIDs.flatMap(uid => this.p1Items.filter(i => this.multipleItemFilter(i, uid))).map(i => i.tokenID)
        console.log('input UIDs: ', inputUIDs)
        console.log('input Tokens: ', inputTokens)

        const craftTokenOpt = {
          inIds: inputTokens,
          inValues: Array(inputTokens.length).fill(1),
          outQty: 1,
          uri: 'URI',
          serialNumber: item.pmUID,
          actor: this.p2Actor
        }
        const receipt = app.craft(craftTokenOpt)
        const update = new Promise(resolve => {
          receipt.then(async r => {
            console.log('craft receipt: ', r)
            const sn = r.events.serialNumber.returnValues
            const time = this.createTimeStamp()
            const tokenObj = {
              serialNumber: sn._serialNumber,
              tokenID: sn._id,
              timeStamp: time,
              children: inputTokens
            }
            await neo.updatePmTokensOfOrder(this.currentOrder, [tokenObj], 'p2')
            this.p2Items = await neo.getPMsByOrderAndArea(this.currentOrder, 'p2')
            this.p2Step += 1
            resolve()
            if (this.p2Step === this.p2Max) {
              this.showAlert('Craft Complete!', 2)
            }
          })
        })
        updateQueue.push(update)
        await this.delay(this.interval)
      }
      return updateQueue
    },
    async craftTokenP3 () {
      const craftPool = this.constructPool(this.p3Items)
      // console.log('craft pool: ', craftPool)
      this.p3Step = 0
      this.p3Max = craftPool.length
      // const loader = craftPool.values()
      // const interval = 500
      // const receiptCollector = []
      const updateQueue = []
      for (const item of craftPool) {
        const inputUIDs = item.children.map(child => child.assemblyUID)
        const inputTokens = inputUIDs.flatMap(uid => this.p1Items.filter(i => this.multipleItemFilter(i, uid))).map(i => i.tokenID)
        const craftTokenOpt = {
          inIds: inputTokens,
          inValues: Array(inputTokens.length).fill(1),
          outQty: 1,
          uri: 'URI',
          serialNumber: item.pmID,
          actor: this.p3Actor
        }
        const receipt = app.craft(craftTokenOpt)
        // receiptCollector.push(receipt)
        const update = new Promise(resolve => {
          receipt.then(async r => {
            console.log('craft txn receipt: ', r)
            const sn = r.events.serialNumber.returnValues
            const time = this.createTimeStamp()
            const tokenObj = {
              serialNumber: sn._serialNumber,
              tokenID: sn._id,
              timeStamp: time,
              children: inputTokens
            }
            await neo.updatePmTokensOfOrder(this.currentOrder, [tokenObj], 'p3')
            this.p3Items = await neo.getPMsByOrderAndArea(this.currentOrder, 'p3')
            this.p3Step += 1
            resolve()
            if (this.p3Step === this.p3Max) {
              this.showAlert('Craft Complete!', 3)
            }
          })
        })
        updateQueue.push(update)
        await this.delay(this.interval)
      }
      return updateQueue
    },
    async finalMount () {
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
      return new Promise(resolve => {
        receipt.then(async r => {
          this.p3Step = Math.floor(this.p3Max / 2)
          console.log('Craft Recipt: ', r)
          const sn = r.events.serialNumber.returnValues
          const time = this.createTimeStamp()
          const token = {
            tokenID: sn._id,
            timeStamp: time,
            children: tokens
          }
          await neo.updateProductTokenOfOrder(this.currentOrder, token)
          this.p3Step = this.p3Max
          resolve()
          this.showAlert('Final Mount Complete!', 3)
          this.$store.commit('refrehTrigger', new Date().toJSON())
          const endBlock = r.blockNumber
          this.endBlocks.push(endBlock)
          console.group('Start and End Block Lists')
          console.log('start: ', this.startBlocks)
          console.log('end: ', this.endBlocks)
          console.groupEnd()
        })
      })
    },
    async p1TransferToken () {
      const updateQueue = []
      // get all assemblyUIDs in P2/P3
      const uidsToP2 = this.p2Items.flatMap(i => i.children.map(child => child.assemblyUID))
      const uidsToP3 = this.p3Items.flatMap(i => i.children.map(child => child.assemblyUID))
      // console.log('uidsToP2', uidsToP2)
      // console.log('uidsToP3', uidsToP3.includes('P4D200423W0015C1'))
      // filter p1 items by uids, prepare for getting token ID
      const itemsToP2 = uidsToP2
        .flatMap(uid => this.p1Items.filter(i => this.multipleItemFilter(i, uid)))
        .filter(i => this.multipleItemFilter(i, this.filter))
      const itemsToP3 = uidsToP3
        .flatMap(uid => this.p1Items.filter(i => this.multipleItemFilter(i, uid)))
        .filter(i => this.multipleItemFilter(i, this.filter))

      const tokensToP2 = itemsToP2.map(i => i.tokenID)
      const tokensToP3 = itemsToP3.map(i => i.tokenID)
      console.log('tokensToP2', tokensToP2)
      console.log('tokensToP3', tokensToP3)
      // const itemsToP2 = this.p1Items.filter(i => this.multipleItemFilter(i, uidsToP2) && this.multipleItemFilter(i, this.filter))
      // const itemsToP3 = this.p1Items.filter(i => this.multipleItemFilter(i, uidsToP3) && this.multipleItemFilter(i, this.filter))
      // console.log('itemsToP3', itemsToP3.find(e => e.assemblyUID === 'P4D200423W0015C1'))
      // console.log('itemsToP2: ', itemsToP2)
      // console.log('itemsToP3: ', itemsToP3)
      // if one token has been used (tokenSupply != batchsize), the next actor has already control of this token
      const newTokens = this.p1Items.filter(i => i.tokenID !== null && +i.tokenSupply === +i.batchsize)
      const addControllerP2 = newTokens
      const addControllerP3 = newTokens
      console.log('addControllerP2: ', addControllerP2)
      console.log('addControllerP3: ', addControllerP3)
      // init process bar
      this.p1Step = 0
      this.p1Max = addControllerP2.length + addControllerP3.length
      // console.log('add controller length: ', this.p1Max)
      const runAddCtrl = async (items, to) => {
        for (const item of items) {
          const approve = {
            id: item.tokenID,
            newController: to,
            actor: this.p1Actor
          }
          const receipt = app.addController(approve)
          const update = new Promise(resolve => {
            receipt.then(r => {
              console.log('addController receipt', r)
              this.showAlert(`approve new controller for ${item.tokenID}`, 1)
              this.p1Step += 1
              resolve()
            })
          })
          updateQueue.push(update)
          await this.delay(this.interval)
        }
        return updateQueue
      }
      const waitCtrlToP2 = await runAddCtrl(addControllerP2, this.p2Actor)
      const waitCtrlToP3 = await runAddCtrl(addControllerP3, this.p3Actor)

      // const g2 = addControllerP2.values()
      // const g3 = addControllerP3.values()

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
      // const s1 = tokensToP3.slice(0, tokensToP3.length / 2)
      // const s2 = tokensToP3.slice(tokensToP3.length / 2)
      // const toP3OptS1 = {
      //   from: this.p1Actor,
      //   to: this.p3Actor,
      //   ids: s1,
      //   values: Array(s1.length).fill(1),
      //   actor: this.p1Actor
      // }
      // const toP3OptS2 = {
      //   from: this.p1Actor,
      //   to: this.p3Actor,
      //   ids: s2,
      //   values: Array(s2.length).fill(1),
      //   actor: this.p1Actor
      // }

      const transferToP2 = () => new Promise(resolve => {
        this.showAlert('transfering to P2...', 1)
        console.log('preparing to P2')
        const receiptP2 = app.transferBatch(toP2Opt)
        receiptP2.then(r => {
          this.showAlert('Token transfer to P2 finished!', 1)
          console.log('transfer Batch to P2', r)
          resolve()
        }).catch(err => console.error('p1-p2 transfer failed, ', err))
      })
      const transferToP3 = () => new Promise(resolve => {
        this.showAlert('transfering to P3...', 1)
        console.log('preparing to P3')
        const receiptP3 = app.transferBatch(toP3Opt)
        // receiptCollector.push(receiptP3)
        receiptP3
          .then(r => {
            this.showAlert('Token transfer to P3 finished!', 1)
            console.log('transfer Batch to P3', r)
            resolve()
          })
          .catch(err => {
            console.error('p1-p3 transfer failed, ', err)
          })
      })
      const composeP2 = new Promise(resolve => {
        Promise.all(waitCtrlToP2).then(() => {
          resolve(transferToP2())
        })
      })
      const composeP3 = new Promise(resolve => {
        Promise.all(waitCtrlToP3).then(() => {
          resolve(transferToP3())
        })
      })

      return [composeP2, composeP3]
    },
    async p2TransferToken () {
      const tokensToP3 = this.p2Items.map(i => i.tokenID)
      console.log('tokens to P3: ', tokensToP3)
      const updateQueue = []
      // const g = tokensToP3.values()
      this.p2Step = 0
      this.p2Max = tokensToP3.length
      // const receiptCollector = []
      // console.log('p2 transfer qty: ', this.p2Max)
      for (const token of tokensToP3) {
        const approve = {
          id: token,
          newController: this.p3Actor,
          actor: this.p2Actor
        }
        const receipt = app.addController(approve)
        // receiptCollector.push(receipt)
        const update = new Promise(resolve => {
          receipt.then(r => {
            this.p2Step += 1
            resolve()
          })
        })
        updateQueue.push(update)
        await this.delay(this.interval)
      }
      const toP3Opt = {
        from: this.p2Actor,
        to: this.p3Actor,
        ids: tokensToP3,
        values: Array(tokensToP3.length).fill(1),
        actor: this.p2Actor
      }
      const transferToP3 = new Promise(resolve => {
        this.showAlert('transfering to P3...', 2)
        const receiptP3 = app.transferBatch(toP3Opt)
        // receiptCollector.push(receiptP3)
        receiptP3.then(r => {
          this.showAlert('Token transfer to P3 finished!', 2)
          console.log('transfer Batch to P3', r)
          resolve()
        }).catch(err => console.error('p2-p3 transfer failed, ', err))
      })
      const compose = new Promise(resolve => {
        Promise.all(updateQueue).then(() => {
          resolve(transferToP3)
        })
      })
      // run(g, transferToP3)
      return compose
      // console.log(g, run)
      // transferToP3()
    },
    async runOrderProduction () {
      let orders = await neo.getAllOrders()
      orders = orders.map(o => o.order)
      // orders = ['o_111']
      console.log('orders: ', orders)
      for (const o of orders) {
        this.currentOrder = o
        await this.initP1()
        await this.initP2()
        await this.initP3()
        const startNumber = this.$store.state.mostRecentBlockNumber + 1
        this.startBlocks.push(startNumber)
        this.showAlert('Preaparing assemblies......', 1)
        // const p1end = await this.createTokenV2()
        await Promise.all(await this.createToken())
        // console.log('p1 end: ', p1end)
        // await this.delay(15000)
        this.showAlert('Assemblies ready to transfer', 1)
        const p1 = await this.p1TransferToken()
        this.showAlert('Transfer Finished', 1)
        await Promise.all(p1)
        const p2c = Promise.all(await this.craftTokenP2())
        this.showAlert('Start to craft', 2)
        const p3c = Promise.all(await this.craftTokenP3())
        this.showAlert('Start to craft', 3)
        await Promise.all([p2c, p3c])
        this.showAlert('Craft finished', 2)
        this.showAlert('Craft finished', 3)
        this.showAlert('Modules ready to transfer', 2)
        const p2t = await this.p2TransferToken()
        await p2t
        console.log('P2 transfer to P3 finshed')
        this.showAlert('Start final mounting', 3)
        await this.finalMount()
        this.showAlert('Finished mounting', 3)
        await this.delay(15000)
      }
    },
    // updateOrder (selectOrder) {
    //   this.currentOrder = selectOrder
    // },
    updateCurrentOrder () {
      this.currentOrder = this.$store.state.selectedOrder
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
