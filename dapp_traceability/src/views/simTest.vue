<template>
  <b-container>
      <h4>Current Order | {{currentOrder}}</h4>
    <!-- <b-list-group horizontal="md">
      <b-list-group-item v-for="(value, key) in orders" :key="key" :active="key === currentkey">{{ value }}</b-list-group-item>
    </b-list-group> -->
    <b-button @click="simProduction();start()">{{ isStarted ? 'Next' : 'Start' }}</b-button>
    <b-button class='mx-3' @click="value + 1">Mint one Assembly</b-button>
    <div>
    <h5>Creating & Crafting Token: </h5>
    <b-progress :max="max+max2+max3" animated>
      <b-progress-bar :value="value" variant="info" :label="`${((value / max) * 100).toFixed(1)}% |P1`"></b-progress-bar>
      <b-progress-bar :value="value2" :label="`${((value2 / max2) * 100).toFixed(1)}% |P2`"></b-progress-bar>
      <b-progress-bar :value="value3" variant="dark" :label="`${((value3 / max3) * 100).toFixed(1)}% |P3`"></b-progress-bar>
    </b-progress>
    <h5>{{products}}</h5>
    </div>
    <Toast/>
  </b-container>
</template>

<script>
import neo from '@/neo4jAPI.js'
import { mapGetters } from 'vuex'
import Toast from '@/components/Toast.vue'

export default {
  name: 'simTest',
  components: {
    Toast
  },
  data () {
    return {
      isStarted: false,
      value: 0,
      value2: 0,
      value3: 0,
      max: 0,
      max2: 0,
      max3: 0,
      currentOrder: '',
      products: [],
      // assemblyItems: [],
      // p2PMs: [],
      // p3PMs: [],
      // tokenSupplyMap: {},
      // tokenMapUID: {},
      attachToken: [],
      savedBookmarks: [],
      mintPoolSize: 5
      // gen: null,
      // result: null
    }
  },
  created () {
    this.initOrder()
  },
  updated: function () {
    this.$nextTick(() => {
    })
  },
  mounted () {
    const eventHandler = ({ contractName, eventName, data }) => {
      // console.log('TX Hash: ', this.txHash())
      if (eventName === 'TransferSingle' && data._operator === this.actors[0]) {
        console.group('>>> TransferSingle <<<')
        console.log(data)
        console.groupEnd()
        const tokenID = data._id
        const tokenSupply = parseInt(data._value)
        this.savedBookmarks = this.createTokenNode(tokenID, tokenSupply)
      } else if (eventName === 'craftedToken') {
        console.group('>>> craftedToken <<<')
        console.log(data)
        console.groupEnd()
        const tokenID = data._outputID
        const tokenSupply = parseInt(data.outputQuantity)
        this.savedBookmarks = this.createTokenNode(tokenID, tokenSupply)
      } else if (eventName === 'serialNumber') {
        console.group('>>> serial number <<<')
        console.log('data: ', data)
        console.groupEnd()
        const regex = /wh_/
        const tokenID = data._id
        const serialNumber = data._serialNumber
        const isFinalMount = regex.test(serialNumber)
        const timeStamp = this.createTimeStamp()
        if (isFinalMount) {
          const product = { productID: serialNumber, productToken: tokenID }
          this.products.push(product)
        } else {
          this.attachToken.shift()
          this.attachToken.push({
            serialNumber: serialNumber,
            tokenID: tokenID,
            timeStamp: timeStamp
          })
          this.updateTokenRelation(data._actor)
        }
      } else if (eventName === 'TransferBatch') {
        console.group('>>> TransferBatch <<<')
        console.log('data: ', data)
        console.groupEnd()
        if (data._to === this.actors[1]) {
          this.startCraftProcess('p2')
        } else if (data._to === this.actors[2] && data._operator === this.actors[1]) {
          this.startCraftProcess('p3')
        }
      } else if (eventName === 'ApprovalForAll') {
        console.group('>>> ApprovalForAll <<<')
        console.log('data: ', data)
        console.groupEnd()
      }
    }
    console.log(eventHandler)
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { eventHandler(payload) })
  },
  watch: {
    value: 'loadNextP1',
    value2: 'loadNextP2',
    value3: 'loadNextP3'
    // this.result.value.then(data => {
    //   const g = this.gen
    //   const result = g.next(data)
    //   this.result = result
    //   this.gen = g
    // })
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    actors () {
      const state = this.drizzleInstance.store.getState()
      return state.accounts
    }
  },
  methods: {
    start () {
      this.isStarted = true
    },
    async initOrder () {
      this.orderGenerator = await neo.orderGenerator()
    },
    async simProduction () {
      // initialize process bar variables
      this.value = 0
      this.value2 = 0
      this.value3 = 0
      this.max = 0
      this.max2 = 0
      this.max3 = 0

      const orderObj = await this.orderGenerator.next()
      this.currentOrder = orderObj.value
      console.log('current order: ', this.currentOrder)

      // initialize assemblies and PMS of the current order before minting token, returning generator that load item in corresponding area
      this.loadP1 = await this.initP1()
      this.loadP2 = await this.initP2()
      this.loadP3 = await this.initP3()
      // console.log(this.getPmChildrenTokenIDs(this.p2PMs[0], this.assemblyItems))
      // start minting process, successful mint will update 'this.value'(in the function 'updateTokenRelation'), which triggers 'loadNextP1' function in watch property.
      // this.startCraftProcess('p2')
      const start = await this.loadP1.next().value
      this.nextItemP1 = this.loadP1.next(start)
    },
    async initP1 () {
      this.assemblyItems = await neo.getAssembliesByOrder(this.currentOrder)
      const mintPool = this.assemblyItems.filter(a => a.tokenID === null)
      console.log('mintPool: ', mintPool)
      this.max = mintPool.length
      return this.setUpMint(mintPool)(this)
      // this.loadP1 = this.setUpMint(mintPool)(this)// set up generator of loading assembly item and minting the token
      // const start = await this.loadP1.next().value
      // this.nextItemP1 = this.loadP1.next(start)
      // console.log('this2: ', this)
    },
    async initP2 () {
      this.p2PMs = await neo.getPMsByOrderAndArea(this.currentOrder, 'p2')
      const craftPool = this.p2PMs.filter(pm => pm.tokenID === null)
      this.max2 = craftPool.length
      return this.setUpCraft(craftPool)(this, 'p2')
    },
    async initP3 () {
      this.p3PMs = await neo.getPMsByOrderAndArea(this.currentOrder, 'p3')
      const craftPool = this.p3PMs.filter(pm => pm.tokenID === null)
      this.max3 = craftPool.length
      return this.setUpCraft(craftPool)(this, 'p3')
    },
    async loadNextP1 () {
      console.group('Minting State')
      console.log('Total: ', this.max)
      console.log('Current Number: ', this.value)
      console.groupEnd()
      if (!this.nextItemP1.done) {
        const currentItem = await this.nextItemP1.value
        this.nextItemP1 = this.loadP1.next(currentItem)
      } else {
        this.transferToNextArea()
      }
    },
    async loadNextP2 () {
      if (!this.nextItemP2.done) {
        const currentItem = await this.nextItemP2.value
        this.nextItemP2 = this.loadP2.next(currentItem)
      } else {
        const p2PMs = await neo.getPMsByOrderAndArea(this.currentOrder, 'p2')
        this.p2Tokens = p2PMs.map(pm => pm.tokenID)
        console.log('P2TOKENS: ', this.p2Tokens)
        const qty = Array(this.p2Tokens.length).fill(1)
        const gas = 200000 * Math.ceil(qty.length / 10) ** 2
        this.p2Tokens.forEach(t => this.addController(t, this.actors[1], this.actors[2]))
        this.batchTransferToken(this.actors[1], this.actors[2], this.p2Tokens, qty, gas)
      }
    },
    async loadNextP3 () {
      if (!this.nextItemP3.done) {
        const currentItem = await this.nextItemP3.value
        this.nextItemP3 = this.loadP3.next(currentItem)
      } else {
        const p3PMs = await neo.getPMsByOrderAndArea(this.currentOrder, 'p3')
        const p3Tokens = p3PMs.map(pm => pm.tokenID)
        const allTokens = [...this.p2Tokens, ...p3Tokens]
        const qty = Array(allTokens.length).fill(1)
        const gas = 200000 * Math.ceil(qty.length / 10) ** 2
        const serialNumber = 'wh' + this.currentOrder.slice(1)
        // craft token for the final product
        this.drizzleInstance
          .contracts.APTSC
          .methods.craft
          .cacheSend(allTokens, qty, 1, 'uri/path', this.actors[2], serialNumber, { gas: gas, from: this.actors[2] })
      }
    },
    async transferToNextArea () {
      // update token info in neo4j
      console.log('Starting tranferring tokens...')
      this.assemblyItems = await neo.getAssembliesByOrder(this.currentOrder)
      console.log('transferToNextArea|this.assemblyItems---->', this.assemblyItems)
      this.tokenMapUID = this.assemblyItems.map(a => ({ [a.assemblyUID]: a.tokenID }))
      //  tokens transferred to P2
      const tokensToP2 = this.p2PMs.map(pm =>
        pm.children.map(child =>
          child.assemblyUID)).flat()// mapping the children properties(array of assemblyUIDS) of every PM to an array of assemblyUIDs
        .map(a => this.assemblyItems
          .filter(e =>
            e.assemblyUID === a).map(a =>
            a.tokenID)).flat()// mapping UIDs to tokenIDs
      console.log('tokensToP2: ', tokensToP2)
      const valuesP2 = Array(tokensToP2.length).fill(1)
      const gasP2 = 200000 * Math.ceil(valuesP2.length / 10) ** 2
      tokensToP2.forEach(t => this.addController(t, this.actors[0], this.actors[1]))
      this.batchTransferToken(this.actors[0], this.actors[1], tokensToP2, valuesP2, gasP2)
      // tokens transfered to P3
      const tokensToP3 = this.p3PMs.map(pm =>
        pm.children.map(child =>
          child.assemblyUID)).flat()
        .map(a => this.assemblyItems
          .filter(e => e.assemblyUID === a).map(a =>
            a.tokenID)).flat()

      console.log('tokensToP3: ', tokensToP3)
      const valuesP3 = Array(tokensToP3.length).fill(1)
      const gasP3 = 200000 * Math.ceil(valuesP3.length / 10) ** 2
      tokensToP3.forEach(t => this.addController(t, this.actors[0], this.actors[2]))
      this.batchTransferToken(this.actors[0], this.actors[2], tokensToP3, valuesP3, gasP3)
    },
    async startCraftProcess (area) {
      if (area === 'p2') {
        console.log('Start P2...')
        const start = await this.loadP2.next().value
        this.nextItemP2 = this.loadP2.next(start)
      } else if (area === 'p3') {
        console.log('Start P3...')
        const start = await this.loadP3.next().value
        this.nextItemP3 = this.loadP3.next(start)
      }
    },
    async craftPMtoken (currentPM, area) {
      console.log('Crafting...')
      const tokens = currentPM.children.map(child => this.assemblyItems.filter(a => a.assemblyUID === child.assemblyUID).map(a => a.tokenID)).flat()
      console.log('INPUT TOKENS: ', tokens)
      const qtys = Array(tokens.length).fill(1)
      const gas = 500000 * Math.ceil(qtys.length / 10) ** 2
      let serialNumber
      let actor
      if (area === 'p2') {
        serialNumber = currentPM.pmUID
        actor = this.actors[1]
      } else if (area === 'p3') {
        serialNumber = currentPM.pmID
        actor = this.actors[2]
      }
      this.drizzleInstance
        .contracts.APTSC
        .methods.craft
        .cacheSend(tokens, qtys, 1, 'uri/path', actor, serialNumber, { gas: gas, from: actor })
    },
    async createTokenNode (tokenID, tokenSupply) {
      return await neo.createToken(tokenID, tokenSupply)
    },
    async updateTokenRelation (actor) {
      const bm = await this.savedBookmarks
      // console.log('bm: ', bm)
      if (actor === this.actors[0]) {
        await neo.updateAssemblyTokensOfOrder(this.currentOrder, this.attachToken, bm)
        this.value += 1
      } else if (actor === this.actors[1]) {
        const attachToken = this.attachToken.map(item => {
          const pmUID = item.serialNumber
          const pm = this.p2PMs.find(pm => pm.pmUID === pmUID)
          const tokenIDs = this.getPmChildrenTokenIDs(pm, this.assemblyItems)
          return { children: tokenIDs, ...item }
        })
        await neo.updatePmTokensOfOrder(this.currentOrder, attachToken, 'p2', bm)
        this.value2 += 1
      } else if (actor === this.actors[2]) {
        const attachToken = this.attachToken.map(item => {
          const pmID = item.serialNumber
          const pm = this.p3PMs.find(pm => pm.pmID === pmID)
          const tokenIDs = this.getPmChildrenTokenIDs(pm, this.assemblyItems)
          return { children: tokenIDs, ...item }
        })
        await neo.updatePmTokensOfOrder(this.currentOrder, attachToken, 'p3', bm)
        this.value3 += 1
      }
    },
    async updatePmToken (area) {
      const bm = await this.savedBookmarksP2
      await neo.updatePmTokensOfOrder(this.currentOrder, this.attachTokenP2, area, bm)
      this.value2 += 1
    },
    setUpMint (mintPool) {
      return function * (thisArg) {
        // const resolves = mintPool.map(a => Promise.resolve(a)).slice(0, 20)
        const resolves = mintPool.map(a => Promise.resolve(a))
        for (const r of resolves) {
          const currentAssembly = yield r
          console.log('currentAssembly: ', currentAssembly)
          thisArg.mintToken(currentAssembly)
        }
      }
    },
    setUpCraft (craftPool) {
      return function * (thisArg, area) {
        const resolves = craftPool.map(pm => Promise.resolve(pm))
        for (const r of resolves) {
          const currentPM = yield r
          thisArg.craftPMtoken(currentPM, area)
        }
      }
    },
    /*
    run (gen, thisArg) {
      var g = gen(thisArg)
      let count = 0
      const next = (data) => {
        var result = g.next(data)
        count++
        console.log('count:', count)
        if (count > this.mintPoolSize) {
          this.result = result
          this.gen = g
          return
        }
        if (result.done) return result.value
        result.value.then(data => {
          next(data)
        })
      }
      next()
    },
    */
    mintToken (a) {
      return this.drizzleInstance
        .contracts.APTSC
        .methods.create
        .cacheSend(a.batchsize, 'uri/path', a.assemblyUID, this.actors[0], { gas: 100000, from: this.actors[0] })
    },
    batchTransferToken (from, to, ids, values, gas) {
      const utils = this.drizzleInstance.web3.utils
      const data = utils.sha3('safeBatchTransferFrom')
      const dataBytes = utils.hexToBytes(data)
      this.drizzleInstance
        .contracts.APTSC
        .methods.safeBatchTransferFrom
        .cacheSend(from, to, ids, values, dataBytes, { gas: gas, from: from })
    },
    addController (id, from, newController) {
      this.drizzleInstance
        .contracts.APTSC
        .methods.addController
        .cacheSend(id, newController, { gas: 60000, from: from })
    },
    set3rdPartyApproval (owner, operator, approved) {
      this.drizzleInstance
        .contracts.APTSC
        .methods.setApprovalForAll
        .cacheSend(operator, approved, { gas: 60000, from: owner })
    },
    getPmChildrenTokenIDs (pm, ass) {
      return pm.children.map(child => ass.find(a => a.assemblyUID === child.assemblyUID).tokenID)
    },
    createTimeStamp () {
      const date = new Date().toJSON() // format: "2020-09-01T13:17:29.468Z"
      return date.slice(0, date.indexOf('.'))
    },
    txHash () {
      const state = this.drizzleInstance.store.getState()
      const events = state.contracts.APTSC.events
      const txHash = Array.from(new Set(events.map(event => event.transactionHash)))
      return txHash
    }
  }
}
</script>
