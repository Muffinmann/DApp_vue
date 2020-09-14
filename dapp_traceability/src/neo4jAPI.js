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
    console.log(`connectivity verification failed. ${error}`)
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
        'WITH DISTINCT o,aid, auid ' +
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
    await session.readTransaction(query).then(() => session.close())
    return items
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
      console.log('Creating Token Node failed: ', err)
    }
  },
  // @PARAM tokens: a list of objects having properties:
  // { serialNumber: String, tokenID: String, tokenSupply: Int, timeStamp: String }
  updateAssemblyTokensOfOrder: async function (orderID, tokens, savedBookmarks) {
    const tkDefID = 'tk' + orderID.slice(orderID.indexOf('_'))
    const query = (tx, tokens, tkDefID) => {
      return tx.run('UNWIND $items as item ' +
            'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly), (t:Token{tokenID: item.tokenID}) ' +
            'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(t)-[:HAS_WUID {timeStamp:item.timeStamp}]->(a) ', { items: tokens, tkDefID: tkDefID })
      // return tx.run('UNWIND $items as item ' +
      //       'MATCH (a:AssemblyUID {assemblyUID: item.serialNumber})-[:IS_C_UID]-(b:Assembly), (t:Token{tokenID: item.tokenID}) ' +
      //       'MERGE (b)-[:HAS_TOKEN{timeStamp:item.timeStamp}]->(t:Token {tokenID: item.tokenID, tokenSupply:item.tokenSupply})-[:HAS_WUID {timeStamp:item.timeStamp}]->(a) ', { items: tokens, tkDefID: tkDefID })
      // + 'WITH t ' + 'MATCH (tk:TK{tokenDefinitionID:$tkDefID}) ' + 'MERGE (t)<-[:CONTAINS_TOKEN]-(tk)'
    }
    const session = driver.session({ bookmarks: savedBookmarks })
    try {
      await session.writeTransaction(tx => query(tx, tokens, tkDefID)).then(() => session.close())
    } catch (err) {
      console.log('Update Assembly Token failed: ', err)
    }
    return true
  },
  getPMsByOrderAndArea: async function (orderID, area) {
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
  // @DESCRIB: attach crafted token to PM and update the supply of assembly tokens
  // @PARAM tokens: a list of objects containing properties as:
  // { serialNumber: String, tokenID: String, timeStamp: String, children: Array}
  updatePmTokensOfOrder: async function (orderID, tokens, area, savedBookmarks) {
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
    const session = driver.session({ bookmarks: savedBookmarks })
    await session.writeTransaction(tx => query(tx, orderID, tokens)).then(() => session.close())
    return true
  }
}
// const getAllOrdersPromise = function () {
//   return new Promise((resolve, reject) => {
//     const orders = []
//     const query = tx => {
//       const result = tx.run('MATCH (o:Order) return o')
//       result.subscribe({
//         onNext: record => {
//           const o = record.get('o').properties
//           orders.push({
//             value: o.orderID,
//             text: o.orderID,
//             order: o.orderID
//           })
//         }
//       })
//     }
//     const session = driver.session()
//     session
//       .readTransaction(query)
//       .then(() => {
//         console.log('r---->', r)
//         resolve(orders)
//         session.close()
//       })
//   })
// }

// export {
//   driver,
//   getAllOrders,
//   getAssembliesByOrder,
//   updateAssemblyTokensOfOrder,
//   getPMsByOrderAndArea,
//   transferTokenToPM,
//   updatePmTokensOfOrder
// }
