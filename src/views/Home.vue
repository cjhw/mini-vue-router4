<template>
  <div class="home">
    <router-link to="/a">a页面</router-link>
    <router-link to="/b">b页面</router-link>
    <router-view></router-view>
  </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()

console.log(instance.$router)
</script>
