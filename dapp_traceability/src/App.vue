<template>
  <div v-if="isDrizzleInitialized" id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">test</router-link>
    </div>
    <keep-alive>
    <router-view/>
    </keep-alive>
  </div>
  <div v-else>Loading...</div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: mapGetters('drizzle', ['isDrizzleInitialized'])
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
