export default {
  bolt: 'neo4j://localhost:7687',
  user: 'neo4j',
  password: 'neo4jpassword',
  maxConnectionPoolSize: 200,
  connectionAcquisitionTimeout: 2 * 60 * 1000,
  connectionTimeout: 20 * 1000
}
