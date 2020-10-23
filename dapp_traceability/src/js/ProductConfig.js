import w3 from '@/js/web3Facade.js'
import {findAssemblies, findModules} from '@/js/neo4jAPI.js'
function propMapping (kargs) {
  for (const [k, v] of Object.entries(kargs)) {
    this[k] = v
  }
}

class Mint {
  constructor () {
    this.receipt = 'transactionReceipt'
  }
  create ({ qty, uri, serialNumber, actor }) {
    return w3.create({ qty, uri, serialNumber, actor })
  }

  craft ({ inIds, inValues, outQty, uri, actor, serialNumber }) {
    return w3.craft({ inIds, inValues, outQty, uri, actor, serialNumber })
  }
}

class Transfer {
  single () {}

  batch ({ from, to, ids, values, actor }) {
    return w3.transferBatch({ from, to, ids, values, actor })
  }
}

class ProductConfiguration {
  static Cls
  static findAll() {}

  mintToken () {}

  transferToNext () {}

  transferToP2 () {}

  transferToP3 () {}

  createToken (opt) {
    return Mint.create(opt)
  }

  craftToken (opt) {
    return Mint.craft(opt)
  }

  static async findAssemblies(orderID) {
    const assemblies = await Neo.findAssemblies(orderID)
    return assemblies.map(a => new this.Cls({ serialNumber:a.assemblyUID, ...a }))
  }

  static async findModules(orderID, area) {
    const modules = Neo.findModules(orderID, area)
    return area === 'p2' ? modules.map(m => ({ serialNumber:m.pmUID, ...m })) : modules.map(m => ({ serialNumber: m.pmID, ...m }))
  }

  static async findProduct(orderID) {
    return `wh${rderID.slice(1)}`
  }

}

class Assembly extends ProductConfiguration {
  static findAll (orderID) {
    return this.findAssemblies(orderID)
  }

  constructor (props) {
    super()
    const localPropMapping = propMapping.bind(this)
    localPropMapping(props)
  }

  mintToken () {
    const opt = {
      qty: this.batchsize,
      uri: this.URI,
      serialNumber: this.serialNumber,
      actor: this.actor
    }
    return this.createToken(opt)
  }
}

class Module extends ProductConfiguration {
  static findAll (orderID, area) {
    return this.findModules(orderID, area)
  }
  constructor () {
      super(props)
      const localPropMapping = propMapping.bind(this)
      localPropMapping(props)
    }

  mintToken () {
    const opt = {
      inIds: this.inputTokens,
      inValues: Array(this.inputTokens.length).fill(1),
      outQty: 1,
      uri: this.URI,
      serialNumber: this.serialNumber,
      actor: this.actor
    }
    return this.craftToken(opt)
  }
}

class Product extends ProductConfiguration {
  constructor (props) {
      super()
      const localPropMapping = propMapping.bind(this)
      localPropMapping(props)
    }

  mintToken () {
    const opt = {
      inIds: this.inputTokens,
      inValues: Array(this.inputTokens.length).fill(1),
      outQty: 1,
      uri: this.URI,
      serialNumber: this.serialNumber,
      actor: this.actor
    }
    return this.craftToken(opt)
  }
}

export {Assembly, Module, Product}