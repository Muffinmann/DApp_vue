<script>
// import app from '@/web3Wrapper.js'
export default {
  methods: {
    multipleItemFilter (row, filter) {
      let filters
      if (Array.isArray(filter)) {
        filters = filter.map(f => f.toLowerCase())
      } else {
        filters = filter.toLowerCase().split(',').map(el => el.trim())
      }
      return Object.keys(row).some(key => {
        if (key === 'children') {
          return filters.some(filter =>
            row[key]
              .map(child => child.assemblyUID)
              .some(e =>
                String(e).toLowerCase()
                  .indexOf(filter) > -1
              )
          )
        } else {
          return filters.some(filter =>
            String(row[key])
              .toLowerCase()
              .indexOf(filter) > -1
          )
        }
      })
    },
    createTimeStamp () {
      const date = new Date().toJSON() // format: "2020-09-01T13:17:29.468Z"
      return date.slice(0, date.indexOf('.'))
    },
    constructPool (items) {
      let pool
      if (this.filter) {
        pool = items
          .filter(i => this.multipleItemFilter(i, this.filter))
          .filter(i => i.tokenID === null)
      } else {
        pool = items
          .filter(i => i.tokenID === null)
      }
      return pool
    }
  }
}
</script>
