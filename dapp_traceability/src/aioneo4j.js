import neo4j from 'neo4j-driver'
import config from '@/neo4jDriver.config.js'
const driver = ({ bolt, user, password, ...args }) => {
  return neo4j.driver(bolt, neo4j.auth.basic(user, password), args)
}

const verifyConnectivity = async function (driver) {
  try {
    await driver.verifyConnectivity()
    console.log('Driver created')
    return true
  } catch (error) {
    console.error(`Creating driver failed. ${error}`)
  }
}
verifyConnectivity(driver(config))
export default driver(config)
