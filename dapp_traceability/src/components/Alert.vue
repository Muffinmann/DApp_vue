<template>
  <b-alert
    :show="dismissCountDown"
    dismissible
    variant="success"
    @dismissed="dismissCountDown=0;"
    @dismiss-count-down="countDownChanged"
  >
    <p>{{msg}}</p>
    <b-progress
      variant="success"
      :max="dismissSecs"
      :value="dismissCountDown"
      height="4px"
    ></b-progress>
  </b-alert>
</template>

<script>
export default {
  props: {
    msg: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      dismissSecs: 5,
      dismissCountDown: 0,
      showDismissibleAlert: false
    }
  },
  watch: {
    msg: 'triggerAlert'
  },
  methods: {
    countDownChanged (dismissCountDown) {
      this.dismissCountDown = dismissCountDown
    },
    triggerAlert () {
      this.dismissCountDown = this.dismissSecs
    }
  }
}
</script>
