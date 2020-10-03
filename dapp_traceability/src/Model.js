import driver from '@/aioneo4j.js'

async function match (query, args, size) {
  const session = driver.session()
  const statement = size ? `${query} LIMIT ${size}` : query
  const q = async tx => {
    const result = tx.run(statement, args)
    const [key] = await result.keys()
    const rs = await result
    return rs.records.map(r => r.get(key).properties)
  }
  const rs = await session.readTransaction(q)
  await session.close()
  console.log('rows returned: ', rs.length)
  return rs
}

async function execute (query, args) {
  const session = driver.session()
  try {
    await session.writeTransaction(tx => tx.run(query, args))
    await session.close()
  } catch (err) {
    console.error('execute query failed: ', err)
  }
}

function classFactory ({ ...attrs }) {
  const node = attrs.node
  const mappings = {}
  const fields = []
  let primaryKey = null
  for (const [k, v] of Object.entries(attrs)) {
    mappings[k] = v
    if (v.primary_key) {
      if (primaryKey) throw Error('Duplicated primary key!')
      primaryKey = k
    } else {
      fields.push(k)
    }
  }
  if (!primaryKey) throw Error('Primary key not found!')
  return class Model {
    static __node__ = node
    static __mappings__ = mappings
    static __fields__ = fields
    static __primaryKey__ = primaryKey
    constructor ({ ...args }) {
      for (const [k, v] of Object.entries(args)) {
        console.log('k: ', k)
        this[k] = v
      }
    }
  }
}

class Order {
  constructor (orderID) {
    this.orderID = orderID
    this.queryChain = `MATCH (o:Order{orderID:${this.orderID})`
    this.keys = ['orderID']
  }

  getQueryChain () {
    return this.queryChain
  }

  getKeys () {
    return this.keys
  }
}

class Product {
    static nodeRefer = 'p'
    static nodeName = 'Product'
    static nodeProperty = 'productDefinitionID'
    static relationToFather = ''
    static query = 'MATCH (p:Product)'
    constructor (propVal) {
      this.node = propVal ? `(${Product.nodeRefer}:${Product.nodeName}{${Product.nodeProperty}:${propVal}})` : `(${Product.nodeRefer}:${Product.nodeName})`
      this.queryChain = propVal ? `MATCH ${this.node}` : Product.query
      console.log('queryChain: ', this.queryChain)
      console.log('Static queryChain: ', Product.query)
    }

    static getQueryChain () { return this.query }// this in static method refers to class

    static async findAll () {
      const q = `${this.query} RETURN ${this.nodeRefer}`
      const rs = await match(q)
      console.log('rs: ', rs)
    }

    static async find (pk) {
    }

    save () {
      execute()
    }
}

class PM extends Product {
  static nodeRefer = 'pmid'
  static nodeName = 'PM'
  static nodeProperty = 'pmID'
  static relationToFather = '[:CONTAINS_C_PM]'
  constructor (pID, pmid) {
    super(pID)
    this.node = pmid ? `(${PM.nodeRefer}:${PM.nodeName}{${PM.nodeProperty}:${pmid}})` : `(${PM.nodeRefer}:${PM.nodeName})`
    this.queryChain = `${super.getQueryChain()}-${PM.relationToFather}-${this.node}`
  }

  set update (val) {
    const updateNode = `(${this.nodeRefer}:${this.nodeName}{${this.nodeProperty}:${val}})`
    const oldQueryChain = super.getQueryChain()
    this.queryChain = `${oldQueryChain.slice(0, oldQueryChain.lastIndexOf('-'))}-${updateNode}`
  }
}

class Assembly extends PM {
  static nodeRefer = 'aid'
  static nodeName = 'Assembly'
  static nodeProperty = 'assemblyID'
  static relationToFather = '[:CONTAINS_C_ASSEMBLY]'
  constructor (aid) {
    super()
    this.node = aid ? `(${Assembly.nodeRefer}:${Assembly.nodeName}{${Assembly.nodeProperty}:${aid}})` : `(${Assembly.nodeRefer}:${Assembly.nodeName})`
    this.queryChain = `${super.getQueryChain()}-${Assembly.relationToFather}-${Assembly.node}`
  }
}
export { classFactory, Order, Assembly, PM, Product }
