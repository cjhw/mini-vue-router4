import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from '@/vue-router'

import Home from '../views/Home.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      { path: 'a', component: { render: () => <h1>a页面</h1> } },
      { path: 'b', component: { render: () => <h1>b页面</h1> } },
    ],
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    beforeEnter: (to, from, next) => {
      console.log('beforeEnter')
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  console.log('beforeEach1----', to, from)
})

router.beforeEach((to, from, next) => {
  console.log('beforeEach2----', to, from)
})

router.beforeResolve((to) => {
  console.log('beforeResolve')
})

router.afterEach((to, from, failure) => {
  console.log('afterEach----', to, from)
})

export default router
