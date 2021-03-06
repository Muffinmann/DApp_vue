import Vue from 'vue'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// import drizzleVuePlugin from '@drizzle/vue-plugin'
// import drizzleOptions from './drizzleOptions'

import App from './App.vue'
import router from './router'
import store from './store'

// Vue.use(drizzleVuePlugin, { store, drizzleOptions })
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
