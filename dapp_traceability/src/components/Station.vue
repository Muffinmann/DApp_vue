<template>
  <b-container>
    <h2>P1 Station</h2>
    <b-row>
      <b-table
        ref="AssemblyPool"
        show-empty small
        sticky-header="500px"
        :fields="assemblyFields"
        :items="infoBoard"
        >
        <template v-slot:cell(index)="row">
          {{row.index + 1 }}
        </template>
        <template v-slot:cell()="row">
          {{ row.value }}
        </template>
      </b-table>
      <b-button @click="startMint"> Mint Token </b-button>
      <b-button @click="burnAllTokens">Burn All Tokens</b-button>
    </b-row>
    <b-row>
      <TokenBalance/>
    </b-row>
  </b-container>
</template>

<script>
import neo4j from 'neo4j-driver'
import TokenBalance from '@/components/eth_widgets/TokenBalance.vue'
import { mapGetters } from 'vuex'
export default {
  name: 'Station',
  props: ['neo4jDriver'],
  components: {
    TokenBalance
  },
  data () {
    return {
      assemblyFields: [
        'index',
        {
          key: 'assemblyUID',
          label: 'Batch ID',
          sortable: true,
          sortDirection: 'desc'
        },
        {
          key: 'batchsize',
          label: 'Batch Size'
        },
        'tokenID'
      ],
      assemblyItems: [],
      // savedBookmarks: [], //used for cross sesion in neo4j
      actor: this.$store.state.accounts.activeAccount // TODO: using props to accept "actor" from father component
    }
  },
  created () {
    this.initAssembly()
  },
  mounted () {
    const tokenRegisterHandler = ({ contractName, eventName, data }) => {
      if (eventName === 'serialNumber') {
        console.log('event data------>', data)
        const display = `Registered: ${data._serialNumber} ------> Token ${data._id}`
        const subOptions = {
          duration: 5000,
          action: {
            text: 'Cancel',
            onClick: (e, toastObject) => {
              toastObject.goAway(0)
            }
          }
        }
        const session = this.neo4jDriver.session({ defaultAccessMode: neo4j.WRITE })
        console.log('neo4j session------>', session)
        session
          .writeTransaction(tx => this.attachTokenToAssembly(tx, data._id, data._serialNumber))
          .then(() => this.updateTokenInfo())
          .then(() => session.close())
          .then(() => this.$toasted.show(display, subOptions))
      }
    }
    this.$drizzleEvents.$on('drizzle/contractEvent', payload => { tokenRegisterHandler(payload) })
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    ...mapGetters('accounts', ['activeAccount']),
    infoBoard () {
      return this.assemblyItems
    }

  },
  methods: {
    initAssembly () {
      const session = this.neo4jDriver.session()
      session
        .readTransaction(this.getAssemblyUID)
        .then(() => this.tokenMixIn())
        .then(() => session.close())
    },
    getAssemblyUID (tx) {
      const result = tx.run('MATCH (n:AssemblyUID) RETURN n LIMIT 3')
      result.subscribe({
        onNext: record => {
          const assemblyInstance = record.get('n').properties
          this.assemblyItems.push({ tokenID: null, ...assemblyInstance })
        }
      })
    },
    tokenMixIn () {
      this.assemblyItems.forEach((el, index) => {
        const session = this.neo4jDriver.session()
        session
          .readTransaction(tx => {
            this.queryAssemblyToken(tx, el, index)
          })
          .then(() => session.close())
      })
    },
    queryAssemblyToken (tx, assembly, index) {
      const result = tx.run('MATCH (a:AssemblyUID{assemblyUID: $UID})<-[:HAS_WUID]-(t:Token) return t', { UID: assembly.assemblyUID })
      result.subscribe({
        onNext: record => {
          const tokenInstance = record.get('t').properties
          // console.group('TOKEN FOUND: ')
          // console.log(assembly.assemblyUID, ' has token: ')
          // console.log(tokenInstance)
          // console.groupEnd()
          this.assemblyItems[index].tokenID = tokenInstance.tokenID
        }
      })
    },
    createToken (serialNumber) {
      this.drizzleInstance
        .contracts.APTSC
        .methods.create
        .cacheSend(1, 'uri/path', serialNumber, this.actor, { gas: 100000, from: this.actor })
    },
    startMint () {
      this.assemblyItems.forEach(el => {
        if (el.tokenID === null) {
          this.createToken(el.assemblyUID)
        }
      })
    },
    burnAllTokens () {
      const session = this.neo4jDriver.session()
      session
        .run(
          'MATCH (a:AssemblyUID)<-[:HAS_WUID]-(b:Token)' +
          'DETACH DELETE b'
        )
        .then(session.writeTransaction(tx => this.updateAssemblyItems(tx)))
        .then(() => session.close())
        .catch(function (err) {
          console.log(err)
        })
    },
    attachTokenToAssembly (tx, tokenID, assemblyUID) {
      const serialNumber = assemblyUID
      const re = /W\d{4}/ // assemblyID has the form of 'W0123'
      const assemblyID = assemblyUID.match(re)[0]
      return tx.run(
        'MATCH (a:Assembly {assemblyID: $assemblyID})' +
        'MATCH (b:AssemblyUID {assemblyUID: $serialNumber})' +
        'MERGE (a)-[:HAS_TOKEN]->(t:Token {tokenID: $tokenID})-[:HAS_WUID]->(b)',
        { assemblyID: assemblyID, serialNumber: serialNumber, tokenID: tokenID }
      )
    },
    updateTokenInfo (tx) {
      this.assemblyItems.forEach((el, index) => {
        if (el.tokenID === null) {
          const session = this.neo4jDriver.session()
          session
            .readTransaction(tx => {
              this.queryAssemblyToken(tx, el, index)
            })
            .then(() => session.close())
        }
      })
    },
    updateAssemblyItems (tx) {
      const result = tx.run('MATCH (n:AssemblyUID) RETURN n LIMIT 3')
      result.subscribe({
        onNext: record => {
          const assemblyInstance = record.get('n').properties
          this.assemblyItems.push({ tokenID: null, ...assemblyInstance })
          this.assemblyItems.shift()
        }
      })
    }
  }
}
</script>
