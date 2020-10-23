import {Assembly, Module, Product} from './ProductConfig.js'
class ProductionArea {
  constructor (actor, order) {
    this.actor = actor
    this.order = order
    this.items = 'LocalAreaProducts'
  }

  async initProduction () {}

  async getAssemblies () {
    return await Assembly.findAll(this.order)

  }

  async getModules (area) {
    return await Module.findAll(this.order, area)
  }

  async getProduct () {
    return await Product.findAll(this.order)
  }

  createTable(tableAttrs) {
    const t = new Btable(tableAttrs)
  }
}

class P1Area extends ProductionArea {
  async initProduction () {
    this.items = await this.getAssemblies()
  }
}

class P2Area extends ProductionArea {
  async initProduction () {
    this.items = await this.getModules('p2')
  }
}

class P3Area extends ProductionArea {
  async initProduction () {
    this.items = await this.getModules('p3')
    this.getProduct()
  }
}