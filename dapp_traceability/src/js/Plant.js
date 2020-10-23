class Plant {
  constructor () {
    this.actor1 = '0x00'
    this.actor2 = '0x01'
    this.actor3 = '0x02'
  }

  async initOrder () {
    const orders = await Order.findAll()
    this.op = new orderProcessor(orders)
    
  }

  initProduction () {
    const currentOrder = this.op.next()
    const p1Area = new P1Area(this.actor1, currentOrder)
    const p2Area = new P2Area(this.actor2, currentOrder)
    const p3Area = new P3Area(this.actor3, currentOrder)

    p1Area.initProduction()
    p2Area.initProduction()
    p3Area.initProduction()
  }
}