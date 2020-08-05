<template>
  <b-container>
    <h5><b>Create Token</b></h5>
    <b-form-group inline>
      <b-form-input
        v-model="args.quantity"
        type="number"
        placeholder="Quantity"
        required
      />
      <b-form-input
        v-model="args.uri"
        type="text"
        placeholder="URI"
      />
      <b-form-input
        v-model="args.serialNumber"
        type="text"
        placeholder="Serial Number"
      />
      <b-form-select
        v-model="args.actor"
        type="text"
        :options="actors"
      />
      <b-button @click="onSubmit" size="sm" class="mx-2">Submit</b-button>
    </b-form-group>
    <b-card class="mt-3" header="Selected Args Result">
      <pre class="m-0">{{ args }}</pre>
    </b-card>
  </b-container>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'CreateToken',
  created () {
    this.fetchActors()
  },
  computed: {
    ...mapGetters('drizzle', ['drizzleInstance']),
    ...mapGetters('accounts', ['activeAccount'])
  },
  methods: {
    onSubmit () {
      console.log('actor--->', this.args.actor)
      this.drizzleInstance
        .contracts.APTSC
        .methods.create
        .cacheSend(this.args.quantity, this.args.uri, this.args.serialNumber, this.args.actor, { gas: 100000, from: this.args.actor })
    },
    fetchActors () {
      const actorlist = [{ text: 'Actor', value: null }]
      actorlist.push(...Object.keys(this.$store.state.accounts.accountBalances))
      this.actors = actorlist
    }
  },
  data () {
    return {
      actors: [],
      args: {
        quantity: 1,
        uri: null,
        serialNumber: null,
        actor: null
      }
    }
  }
  // created () {
  //   this.actor = ''
  //   console.log('ACTIVE ACCOUNT --->' + this.actor)
  // }
}
</script>
