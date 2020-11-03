import neo4j from 'neo4j-driver'

// @NOTICE connectionAcquisitionTimeout:
// For connection pools where all connections are currently being used and the MaxConnectionPoolSize
// limit has been reached, a session will wait this duration for a connection to be made available.
// ensure that the value of this configuration is higher than the configured ConnectionTimeout
//
// @NOTICE connectionTimeout:
// If a connection is not available, then an attempt to create a new connection (provided the
// MaxConnectionPoolSize limit has not been reached) is made with this configuration option,
// providing the maximum amount of time to wait for the connection to be established.

const driver = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'neo4jpassword'), {
  maxConnectionPoolSize: 200,
  connectionAcquisitionTimeout: 2 * 60 * 1000,
  connectionTimeout: 20 * 1000
})
const initVerification = async function () {
  try {
    await driver.verifyConnectivity()
    console.log('Driver created')
  } catch (error) {
    console.error(`connectivity verification failed. ${error}`)
  }
}
/**
    * recursively collect all children(assemblies) of each PM. Children are always pushed into the
    * first pmItem of the list, after that, other pmItems having same pmID will be removed from the list.
    */
const collectItemChildren = function (pmItems) {
  const idx = pmItems.map((el, index) => el.pmID === pmItems[0].pmID ? index : null).filter(e => e !== null)
  const idList = pmItems.map(el => el.pmID)
  const finished = idList.length === [...new Set(idList)].length ? 1 : 0
  if (finished) {
    return pmItems
  } else if (idx.length !== 1) {
    idx.shift() // exclude the targett item from the iteration
    idx.forEach(i => {
      pmItems[0].children = [...pmItems[0].children, ...pmItems[i].children]
      pmItems[i] = null
    })
    pmItems = pmItems.slice(1).concat(pmItems[0]).filter(e => e !== null) // move the first item to the end of the list
    return collectItemChildren(pmItems)
  } else {
    pmItems = pmItems.slice(1).concat(pmItems[0])
    return collectItemChildren(pmItems)
  }
}
initVerification()
export default {
  getAllOrders: async function () {
    const orders = []
    const query = tx => {
      const result = tx.run('MATCH (o:Order) return o')
      result.subscribe({
        onNext: record => {
          const o = record.get('o').properties
          orders.push({
            value: o.orderID,
            text: o.orderID,
            order: o.orderID
          })
        }
      })
    }
    const session = driver.session()
    await session.readTransaction(query).then(() => session.close())
    return orders
  },
  orderGenerator: async function * () {
    const orders = []
    const query = tx => {
      const result = tx.run('MATCH (o:Order) return o')
      result.subscribe({
        onNext: record => {
          const o = record.get('o').properties
          orders.push(o.orderID)
        }
      })
    }
    const session = driver.session()
    await session.readTransaction(query).then(() => session.close())
    for (const o of orders) {
      yield o
    }
  },
  getAssembliesByOrder: async function (orderID) {
    const items = []
    const query = tx => {
      const result = tx.run(
        'MATCH(o:Order{orderID:$orderID})-[:CO_MAPPING_ORDER]-()-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
        'WITH DISTINCT aid, auid ' +
        'OPTIONAL MATCH (auid)-[:HAS_WUID]-(t:Token) ' +// -[:CONTAINS_TOKEN]-(:TK)-[:CO_MAPPING_TOKEN]-(o)
        'RETURN t,auid,aid', { orderID: orderID })
      result.subscribe({
        onNext: record => {
          const token = record.get('t') ? record.get('t').properties : { tokenID: null, tokenSupply: null }
          const aid = record.get('aid').properties
          const auid = record.get('auid').properties
          items.push({ ...aid, ...auid, ...token })
        }
      })
    }
    const session = driver.session()
    try {
      await session.readTransaction(query).then(() => session.close())
      return items
    } catch (err) {
      console.error('Getting Assemblies failed: ', err)
    }
  },
  createToken: async function (tokenID, tokenSupply) {
    const query = (tx, tokenID, tokenSupply) => {
      return tx.run('CREATE (:Token{tokenID: $tokenID, tokenSupply: $tokenSupply})', { tokenID: tokenID, tokenSupply: tokenSupply })
    }
    const session = driver.session()
    let bookmark
    try {
      await session.writeTransaction(tx => query(tx, tokenID, tokenSupply))
        .then(() => { bookmark = session.lastBookmark() })
        .then(() => session.close())
      return bookmark
    } catch (err) {
      console.error('Create Token Node failed: ', err)
    }
  },
  // @PARAM tokenObj: an Array of object having properties:
  // { serialNumber: String, tokenID: String, tokenSupply: Int, timeStamp: String }
  // updateAssemblyTokens: async function (tokenObjects) {
  //   // const expression = `MATCH (a:AssemblyUID {assemblyUID: '${serialNumber}'})-[:IS_C_UID]-(b:Assembly)
  //   // MERGE (b)-[:HAS_TOKEN{timeStamp:'${timeStamp}'}]->(t:Token{tokenID: '${tokenID}', tokenSupply: ${tokenSupply}})-[:HAS_WUID {timeStamp:'${timeStamp}'}]->(a)`
  //   const query = (tx) => {
  //     // return tx.run(expression)
  //     return tx.run('UNWIND $items as item ' +
  //           'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly) ' +
  //           'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(t:Token{tokenID: item.tokenID, tokenSupply: item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a) ', { items: tokenObjects })
  //     // return tx.run('UNWIND $items as item ' +
  //     //       'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly), (t:Token{tokenID: item.tokenID}) ' +
  //     //       'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(t:Token {tokenID: item.tokenID, tokenSupply:item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a) ', { items: tokens, tkDefID: tkDefID })
  //     // + 'WITH t ' + 'MATCH (tk:TK{tokenDefinitionID:$tkDefID}) ' + 'MERGE (t)<-[:CONTAINS_TOKEN]-(tk)'
  //   }
  //   const session = driver.session()
  //   try {
  //     await session.writeTransaction(tx => query(tx)).then(() => session.close())
  //   } catch (err) {
  //     console.error('Update Assembly Token failed: ', err)
  //   }
  //   return true
  // },
  updateAssemblyTokens: async function ({ serialNumber, tokenID, tokenSupply, timeStamp }) {
    const expression = `MATCH (a:AssemblyUID {assemblyUID: '${serialNumber}'})-[:IS_C_UID]-(b:Assembly)
            MERGE (b)-[:HAS_TOKEN{timeStamp:'${timeStamp}'}]->(t:Token{tokenID: '${tokenID}', tokenSupply: ${tokenSupply}})-[:HAS_WUID {timeStamp:'${timeStamp}'}]->(a)`
    const query = (tx) => {
      return tx.run(expression)
      // return tx.run('UNWIND $items as item ' +
      //       'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly) ' +
      //       'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(t:Token{tokenID: item.tokenID, tokenSupply: item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a) ', { items: tokenObj })
      // return tx.run('UNWIND $items as item ' +
      //       'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly), (t:Token{tokenID: item.tokenID}) ' +
      //       'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(t:Token {tokenID: item.tokenID, tokenSupply:item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a) ', { items: tokens, tkDefID: tkDefID })
      // + 'WITH t ' + 'MATCH (tk:TK{tokenDefinitionID:$tkDefID}) ' + 'MERGE (t)<-[:CONTAINS_TOKEN]-(tk)'
    }
    const session = driver.session()
    try {
      await session.writeTransaction(tx => query(tx)).then(() => session.close())
    } catch (err) {
      console.error('Update Assembly Token failed: ', err)
    }
    return true
  },
  getPMsByOrderAndArea: async function (orderID, area) {
    const items = []
    const query = (tx, orderID, area) => {
      let result
      // const query2 = 'MATCH(o:Order{orderID:$orderID})-[:CONTAINS_O_SO]-()-[:LOGS_C_UID]-(pmuid)-[:IS_C_UID]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
      //     'WITH DISTINCT o, pmuid, pmid, aid, auid OPTIONAL MATCH (pmuid)-[:HAS_PMUID]-(t:Token) ' +// -[:CONTAINS_TOKEN]-(:TK)-[:CO_MAPPING_TOKEN]-(o) ' +
      //     'RETURN pmuid, pmid, aid, auid, t'
      const expression2 = `MATCH (o:Order{orderID:'${orderID}'})-[:CONTAINS_O_SO]-(:SubOrder)-[:LOGS_C_UID]-(pmuid:pmUID)-[:IS_C_UID]-(pm:PM)
            WITH pm,pmuid
            MATCH (pm)-[:CONTAINS_C_ASSEMBLY]-(a)-[:IS_C_UID]-(auid)
            WITH pm, a, auid,pmuid
            OPTIONAL MATCH (pmuid)-[:HAS_PMUID]-(t)
            RETURN pm, a, auid, pmuid, t`
      const expression3 = `MATCH (:Order{orderID:'${orderID}'})-[:CO_MAPPING_ORDER]-(p)-[:CONTAINS_C_PM]-(pm)-[:CR_MAPPING]-(ws{locationID:'p3'})
            WITH pm,p
            MATCH (pm)-[:CONTAINS_C_ASSEMBLY]-(a)-[:IS_C_UID]-(auid)
            WITH pm, a, auid, p
            OPTIONAL MATCH (pm)-[:HAS_TOKEN]-(t)-[:CONTAINS_TOKEN]-(p:Product)
            RETURN pm, a, auid, t`
      if (area === 'p2') {
        result = tx.run(expression2)
      } else if (area === 'p3') {
        result = tx.run(expression3)
      }
      result.subscribe({
        onNext: record => {
          const pmID = record.get('pm').properties
          const aUID = record.get('auid').properties
          const aID = record.get('a').properties
          const token = record.get('t') ? record.get('t').properties : { tokenID: null, tokenSupply: null }
          if (area === 'p2') {
            const pmUID = record.get('pmuid').properties
            items.push({ children: [{ ...aUID, ...aID }], ...pmUID, ...pmID, ...token })
          } else if (area === 'p3') {
            items.push({ children: [{ ...aUID, ...aID }], ...pmID, ...token })
          }
        }
      })
    }
    const session = driver.session()
    await session.readTransaction(tx => query(tx, orderID, area)).then(() => session.close())
    return collectItemChildren(items)
  },
  // @PARAM trans: a list of objects containing properties as:
  // { tokenID: String, to: String, amount: Int }
  // transferTokenToPM: async function (trans, area) {
  //   const p2query = 'UNWIND $transfer as tf ' +
  //           'MATCH (t:Token{tokenID: tf.tokenID})-[:HAS_TOKEN]-()-[:CONTAINS_C_ASSEMBLY]-(:PM)-[:IS_C_UID]-(p:pmUID{pmUID: tf.to}) ' +
  //           'MERGE (t)-[r:TRANSFER_TO{quantity: tf.amount}]->(p) ' +
  //           'ON CREATE SET t.tokenSupply = t.tokenSupply - tf.amount ' +
  //           'ON MATCH SET t.tokenSupply = t.tokenSupply - tf.amount, r.quantity = r.quantity + tf.amount'
  //   const query = (tx, trans) => tx.run('UNWIND $transfer as tf ' +
  //           'MATCH (t:Token{tokenID: tf.tokenID})-[:HAS_TOKEN]-()-[:CONTAINS_C_ASSEMBLY]-(:PM)-[:IS_C_UID]-(p:pmUID{pmUID: tf.to}) ' +
  //           'MERGE (t)-[r:TRANSFER_TO{quantity: tf.amount}]->(p) ' +
  //           'ON CREATE SET t.tokenSupply = t.tokenSupply - tf.amount ' +
  //           'ON MATCH SET t.tokenSupply = t.tokenSupply - tf.amount, r.quantity = r.quantity + tf.amount', { transfer: trans })
  //   const session = driver.session()
  //   await session.writeTransaction((tx) => query(tx, trans)).then(() => session.close())
  //   return true
  // },
  updatePmTokensOfOrder: async function (orderID, tokens, area) {
    const p2query = 'UNWIND $tokens as token ' +
          'MATCH (b:pmUID {pmUID: token.serialNumber})-[:IS_C_UID]-(a:PM) ' +
          'MERGE (a)-[:HAS_TOKEN{timeStamp: token.timeStamp}]->(t:Token {tokenID: token.tokenID})-[:HAS_PMUID{timeStamp: token.timeStamp}]->(b) ' +
          'ON CREATE SET t.tokenSupply = 1 ' +
          'WITH t, token ' +
          'UNWIND token.children as child ' +
          'MATCH (c:Token{tokenID: child}) ' +
          'MERGE (t)-[:HAS_CHILDREN{amount:1}]-(c) ' +
          'ON CREATE SET c.tokenSupply = c.tokenSupply - 1 '
          // 'MATCH (tk:TK)-[:CO_MAPPING_TOKEN]-(o:Order{orderID:$orderID})' +
          // 'MERGE (t)<-[:CONTAINS_TOKEN]-(tk)'
    const p3query = 'UNWIND $tokens as token ' +
          'MATCH (:Order{orderID:$orderID})-[:CO_MAPPING_ORDER]-(pd:Product)-[:CONTAINS_C_PM]-(a:PM{pmID: token.serialNumber}) ' +
          'MERGE (a)-[:HAS_TOKEN{timeStamp: token.timeStamp}]->(t:Token {tokenID: token.tokenID})<-[:CONTAINS_TOKEN]-(pd) ' +
          'ON CREATE SET t.tokenSupply = 1 ' +
          'WITH t, token ' +
          'UNWIND token.children as child ' +
          'MATCH  (c:Token{tokenID: child}) ' +
          'MERGE (t)-[:HAS_CHILDREN{amount:1}]-(c) ' +
          'ON CREATE SET c.tokenSupply = c.tokenSupply - 1 '
    const query = (tx, orderID, tokens) => {
      if (area.toLowerCase() === 'p2') {
        return tx.run(p2query, { orderID: orderID, tokens: tokens })
      } else if (area.toLowerCase() === 'p3') {
        return tx.run(p3query, { orderID: orderID, tokens: tokens })
      }
    }
    const session = driver.session()
    await session.writeTransaction(tx => query(tx, orderID, tokens)).then(() => session.close())
    return true
  },
  updateProductTokenOfOrder: async function (orderID, token) {
    const query = (tx, orderID, token) => {
      return tx.run(
        'MATCH (o:Order{orderID: $orderID})-[:CO_MAPPING_ORDER]-(p:Product) ' +
        'MERGE (o)-[:CO_MAPPING_TOKEN{timeStamp: $token.timeStamp}]->(t:Token{tokenID:$token.tokenID})<-[:HAS_TOKEN{timeStamp: $token.timeStamp}]-(p)' +
        'WITH t UNWIND $token.children as child ' +
        'MATCH  (c:Token{tokenID: child}) ' +
        'MERGE (t)-[:HAS_CHILD{amount:1}]-(c) ' +
        'ON CREATE SET c.tokenSupply = c.tokenSupply - 1 ', { orderID: orderID, token: token })
    }
    const session = driver.session()
    try {
      await session.writeTransaction(tx => query(tx, orderID, token)).then(() => session.close())
    } catch (err) {
      console.error('Update Product Token failed: ', err)
    }
    return true
  },
  async getProductToken (orderID) {
    const query = async (tx) => {
      const rs = tx.run('OPTIONAL MATCH (o:Order{orderID: $orderID})-[:CO_MAPPING_ORDER]-(p:Product)-[:HAS_TOKEN]-(t) RETURN t', { orderID: orderID })
      const result = await rs
      return result.records.map(r => r.get('t'))
    }
    try {
      const session = driver.session()
      const r = await session.readTransaction(query)
      await session.close()
      return r
    } catch (err) {
      console.error('get Product Token failed: ', err)
    }
  },
  async detachToken (tokens) {
    const query = (tx, tokens) => {
      return tx.run('UNWIND $tokens as token ' +
      ' MATCH (t:Token{tokenID:token}) ' +
      'DETACH DELETE t', { tokens: tokens })
    }
    const session = driver.session()
    await session.writeTransaction(tx => query(tx, tokens)).then(() => session.close())
    return true
  }
}
// export test
export async function getAssembliesByOrder (orderID) {
  const items = []
  const query = tx => {
    const result = tx.run(
      'MATCH(o:Order{orderID:$orderID})-[:CO_MAPPING_ORDER]-()-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
      'WITH DISTINCT aid, auid ' +
      'OPTIONAL MATCH (auid)-[:HAS_WUID]-(t:Token) ' +// -[:CONTAINS_TOKEN]-(:TK)-[:CO_MAPPING_TOKEN]-(o)
      'RETURN t,auid,aid', { orderID: orderID })
    result.subscribe({
      onNext: record => {
        const token = record.get('t') ? record.get('t').properties : { tokenID: null, tokenSupply: null }
        const aid = record.get('aid').properties
        const auid = record.get('auid').properties
        items.push({ ...aid, ...auid, ...token })
      }
    })
  }
  const session = driver.session()
  try {
    await session.readTransaction(query).then(() => session.close())
    return items
  } catch (err) {
    console.error('Getting Assemblies failed: ', err)
  }
}
export async function getPMsByOrderAndArea (orderID, area) {
  const items = []
  /**
  * recursively collect all children(assemblies) of each PM. Children are always pushed into the
  * first pmItem of the list, after that, other pmItems having same pmID will be removed from the list.
  */
  const collectItemChildren = function (pmItems) {
    const idx = pmItems.map((el, index) => el.pmID === pmItems[0].pmID ? index : null).filter(e => e !== null)
    const idList = pmItems.map(el => el.pmID)
    const finished = idList.length === [...new Set(idList)].length ? 1 : 0
    if (finished) {
      return pmItems
    } else if (idx.length !== 1) {
      idx.shift() // exclude the targett item from the iteration
      idx.forEach(i => {
        pmItems[0].children = [...pmItems[0].children, ...pmItems[i].children]
        pmItems[i] = null
      })
      pmItems = pmItems.slice(1).concat(pmItems[0]).filter(e => e !== null) // move the first item to the end of the list
      return collectItemChildren(pmItems)
    } else {
      pmItems = pmItems.slice(1).concat(pmItems[0])
      return collectItemChildren(pmItems)
    }
  }
  const query = (tx, orderID, area) => {
    let result
    if (area === 'p2') {
      result = tx.run(
        'MATCH(o:Order{orderID:$orderID})-[:CONTAINS_O_SO]-()-[:LOGS_C_UID]-(pmuid)-[:IS_C_UID]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
        'WITH DISTINCT o, pmuid, pmid, aid, auid OPTIONAL MATCH (pmuid)-[:HAS_PMUID]-(t:Token) ' +// -[:CONTAINS_TOKEN]-(:TK)-[:CO_MAPPING_TOKEN]-(o) ' +
        'RETURN pmuid, pmid, aid, auid, t', { orderID: orderID })
    } else if (area === 'p3') {
      result = tx.run(
        'MATCH r=(pm)-[:CO_MAPPING_SUBORDER]-()-[:CONTAINS_O_SO]-(o:Order{orderID:$orderID}) ' +
        'WITH o, collect(pm) AS pms ' +
        'MATCH (o)-[:CO_MAPPING_ORDER]-(:Product)-[:CONTAINS_C_PM]-(pmid)-[:CONTAINS_C_ASSEMBLY]-(aid)-[:IS_C_UID]-(auid) ' +
        'WHERE NOT pmid IN pms ' +
        'WITH DISTINCT o, pmid, aid, auid OPTIONAL MATCH (pmid)-[:HAS_TOKEN]-(t:Token)-[:CONTAINS_TOKEN]-(:Product)-[:CO_MAPPING_ORDER]-(o) ' +
        'RETURN pmid, aid, auid, t',
        { orderID: orderID })
    }
    result.subscribe({
      onNext: record => {
        const pmID = record.get('pmid').properties
        const aUID = record.get('auid').properties
        const aID = record.get('aid').properties
        const token = record.get('t') ? record.get('t').properties : { tokenID: null, tokenSupply: null }
        if (area === 'p2') {
          const pmUID = record.get('pmuid').properties
          items.push({ children: [{ ...aUID, ...aID }], ...pmUID, ...pmID, ...token })
        } else if (area === 'p3') {
          items.push({ children: [{ ...aUID, ...aID }], ...pmID, ...token })
        }
      }
    })
  }
  const session = driver.session()
  await session.readTransaction(tx => query(tx, orderID, area)).then(() => session.close())
  return collectItemChildren(items)
}
export { getAssembliesByOrder as findAssemblies, getPMsByOrderAndArea as findModules }
