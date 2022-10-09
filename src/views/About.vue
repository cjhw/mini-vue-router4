<template>
  <div class="about">
    <img alt="Vue logo" src="../assets/vue.svg" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'About',
  components: {
    HelloWorld,
  },
  beforeRouteLeave(to, from, next) {
    console.log('beforeRouteLeave', to)
  },
  beforeRouteUpdate(to, from, next) {
    console.log('beforeRouteUpdate', to)
  },
  beforeRouteEnter(to, from, next) {
    console.log('beforeRouteEnter', to)
  },
}
</script>

<style lang="scss" scoped></style>
