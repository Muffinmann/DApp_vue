  <template>
  <b-col cols="4">

    <b-input-group>
        <b-form-input v-model="tkID" placeholder="Enter Token ID"></b-form-input>
        <b-button :disabled="!tkID" v-b-toggle.sidebar-1>Token Profile</b-button>
    </b-input-group>

    <b-sidebar id="sidebar-1" title="Token Profile" @shown="tokenProfile" shadow>
      <div class="px-3 py-2">

        <b-img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/330px-Ethereum-icon-purple.svg.png" fluid thumbnail></b-img>

        <div v-show="loading">
          <b-spinner class="my-3" label="Loading..."></b-spinner>
          <p>Fetching data from blockchain...</p>
        </div>

        <b-card :title="'Token: '+tkID" v-show="!loading">
          <b-card-header header-tag="header" class="p-1" role="tab" v-for="(v,k) in fields" :key="k">
            <b-button block v-b-toggle="'collapse-'+k" >{{k}}<b-badge variant="dark">{{v.length}}</b-badge></b-button>
          <b-collapse :id="'collapse-'+k">
            <b-list-group>
              <b-list-group-item v-for="(val,key) in v" :key="key"><small>{{ val }}</small></b-list-group-item>
            </b-list-group>
          </b-collapse>
          </b-card-header>
        </b-card>
      </div>
    </b-sidebar>

  </b-col>
</template>
<script>
import app from '@/js/web3Facade.js'
export default {
  name: 'TokenProfile',
  data () {
    return {
      fields: {
        SerialNumber: '',
        Status: '',
        URI: '',
        Controller: '',
        TokenBalance: ''
      },
      tkID: '',
      loading: false
    }
  },
  methods: {
    async tokenProfile () {
      const options = {
        filter: { _id: this.tkID },
        fromBlock: 0,
        toBlock: 'latest'
      }
      this.loading = true
      console.log('get batch transfer: ', await app.getPastEvents('TransferBatch', options))
      const sn = await app.getPastEvents('serialNumber', options)
      this.fields.SerialNumber = sn.map(e => e.returnValues._serialNumber)

      const st = await app.getPastEvents('status', options)
      console.log('### status: ', st)
      this.fields.Status = st.map(e => e.returnValues._status)

      const uri = await app.getPastEvents('URI', options)
      this.fields.URI = uri.map(e => e.returnValues._value)

      const ctrl = await app.getPastEvents('controllerUpdate', options)
      const ctrlNoDuplicate = Array.from(new Set(ctrl.map(el => el.returnValues._updatedAddress)))

      const bl = await Promise.all(ctrlNoDuplicate.map(c => app.balanceOfTokenByOwner(this.tkID, c)))
      console.log('bl: ', bl)
      const a = '0x39939ad04f579c6ECaae83dD59ACa71018E2a2Bc'
      console.log('Balance: ', await app.balanceOfTokenByOwner(9, a))
      this.fields.Controller = ctrlNoDuplicate
      this.fields.TokenBalance = bl

      this.loading = false
      // app.balanceOfTokenByOwner(tkID, )
    }
  }
}
</script>
