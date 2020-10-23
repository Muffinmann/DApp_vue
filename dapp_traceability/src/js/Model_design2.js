import driver from '@/js/aioneo4j.js'

async function readTxn (query) {
  const session = driver.session()
  const q = async tx => {
    const run = tx.run(query)
    return await run
  }
  try {
    const result = await session.readTransaction(q)
    await session.close()
    return result
  } catch (err) {
    console.error('readTransaction failed: ', err)
  }
}

// async function writeTxn (query, args) {
//   const session = driver.session()
//   const q = async tx => {
//     const run = tx.run(query, args)
//     return await run
//   }
//   try {
//     await session.writeTransaction(q)
//     await session.close()
//   } catch (err) {
//     console.error('writeTransaction failed: ', err)
//   }
// }

function propMapping (kargs) {
  for (const [k, v] of Object.entries(kargs)) {
    this[k] = v
  }
}
async function findN () {
  const query = `MATCH (${this.nodeKey}:${this.nodeType}) RETURN ${this.nodeKey}`
  const rs = await readTxn(query)
  const instances = rs.records.map(r => r.get(this.nodeKey).properties)
  return instances.map(props => new this.Cls(props))
}

async function findOne (where) {
  const query = `MATCH (${this.nodeKey}:${this.nodeType}) WHERE ${this.nodeKey}.${this.primaryKey}='${where}' RETURN ${this.nodeKey}`
  console.log('QUERY= ', query)
  const rs = await readTxn(query)
  const [instanceProps] = rs.records.map(r => r.get(this.nodeKey).properties)
  return new this.Cls(instanceProps)
}

class TraceObject {
  static objectType
  static nodeType
  static nodeKey
  static Cls
  static primaryKey
  static findAll = () => findN.bind(this)
  static find = () => findOne.bind(this)
}

class Order extends TraceObject {
  static objectType = 'Order'
  static nodeType = 'Order'
  static nodeKey = 'o'
  static Cls = Order
  static primaryKey = 'orderID'
  constructor (props) {
    super()
    const localPropMapping = propMapping.bind(this)
    localPropMapping(props)
  }

  coMapping () {}

  logUID () {}

  get product () {
    return (async () => {
      const query = `MATCH (o:Order)-[:CO_MAPPING_ORDER]-(p) WHERE o.orderID='${this.orderID}' RETURN p`
      const rs = await readTxn(query)
      const [productProp] = rs.records.map(r => r.get('p').properties)
      return new Product(productProp)
    })()
  }

  get subOrders () {
    return (async () => {
      const query = `MATCH (o:Order)-[:CONTAINS_O_SO]-(so) WHERE o.orderID='${this.orderID}' RETURN so`
      const rs = await readTxn(query)
      const subOrders = rs.records.map(r => r.get('so').properties)
      return subOrders
    })()
  }

  get kanbanOrders () {
    return (async () => {
      const so = await this.subOrders
      const soArray = so.map(s => s.subOrderID)
      console.log('soArray: ', soArray)
      const query = `
      MATCH (o:Order)-[:CONTAINS_O_KO]-(ko1) WHERE o.orderID='${this.orderID}' RETURN ko1 AS ko 
      UNION MATCH (so:SubOrder)-[:CONTAINS_O_KO]-(ko2) WHERE so.subOrderID IN ${JSON.stringify(soArray)} RETURN ko2 AS ko
      `
      const rs = await readTxn(query)
      const kanbanOrders = rs.records.map(r => r.get('ko').properties)
      return kanbanOrders
    })()
  }

  parameter () {
    return 4
  }
}

class Product extends TraceObject {
  static objectType = 'ProductConfiguration'
  static nodeType = 'Product'
  static nodeKey = 'p'
  static Cls = Product
  static primaryKey = 'productDefinitionID'
  constructor (props) {
    super()
    const localPropMapping = propMapping.bind(this)
    localPropMapping(props)
  }

  get modules () {
    return (async () => {
      const query = `MATCH (p:Product)-[:CONTAINS_C_PM]-(pm) WHERE p.productDefinitionID='${this.productDefinitionID}' RETURN pm`
      const rs = await readTxn(query)
      const modulePropsArray = rs.records.map(r => r.get('pm').properties)
      return modulePropsArray.map(props => new Module(props))
    })()
  }
}

class Module extends TraceObject {
  static objectType = 'ProductConfiguration'
  static nodeType = 'PM'
  static nodeKey = 'pm'
  static Cls = Module
  static primaryKey = 'pmID'
  constructor (props) {
    super()
    const localPropMapping = propMapping.bind(this)
    localPropMapping(props)
  }

  get assemblies () {
    return (async () => {
      const query = `MATCH (pm:PM)-[:CONTAINS_C_ASSEMBLY]-(a) WHERE pm.pmID='${this.pmID}' RETURN a`
      const rs = await readTxn(query)
      const propsArray = rs.records.map(r => r.get('a').properties)
      return propsArray.map(props => new Assembly(props))
    })()
  }
}

class Assembly extends TraceObject {
  static objectType = 'ProductConfiguration'
  static nodeType = 'Assembly'
  static nodeKey = 'aID'
  static Cls = Assembly
  static primaryKey = 'assemblyID'
  constructor (props) {
    super()
    const localPropMapping = propMapping.bind(this)
    localPropMapping(props)
  }
}

export { Order, Product, Module, Assembly }
