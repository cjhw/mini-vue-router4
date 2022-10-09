import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'
import { shallowRef, computed, reactive, unref } from 'vue'
import { RouterLink } from './route-link'

function normalizedRouteRecord(record) {
  return {
    path: record.path,
    meta: record.meta || {},
    beforeEnter: record.beforeEnter,
    name: record.name,
    components: {
      default: record.component,
    },
    children: record.children || [],
  }
}

function createRouteRecordMatcher(record, parent) {
  const matcher = {
    path: record.path,
    record,
    parent,
    children: [],
  }

  if (parent) {
    parent.children.push(matcher)
  }

  return matcher
}

function createRouterMatcher(routes) {
  const matchers = []
  function addRoute(route, parent) {
    let normalizedRecord = normalizedRouteRecord(route)

    if (parent) {
      normalizedRecord.path = parent.path + normalizedRecord.path
    }

    const matcher = createRouteRecordMatcher(normalizedRecord, parent)

    if ('children' in normalizedRecord) {
      let children = normalizedRecord.children
      for (let i = 0; i < children.length; i++) {
        addRoute(children[i], matcher)
      }
    }

    matchers.push(matcher)
  }

  routes.forEach((route) => addRoute(route))

  function resolve(location) {
    const matched = []

    let path = location.path
    let matcher = matchers.find((m) => m.path === location.path)

    while (matcher) {
      matched.unshift(matcher.record) // 将用户的原始数据放到matched里
      matcher = matcher.parent
    }

    return {
      path,
      matched,
    }
  }

  console.log(matchers)

  return {
    resolve,
    addRoute,
  }
}

const START_LOCATION_NORMALIZED = {
  path: '/',
  params: {},
  query: {},
  matched: [],
}

function createRouter(options) {
  const routerHistory = options.history
  const matcher = createRouterMatcher(options.routes)

  const currentRoute = shallowRef(START_LOCATION_NORMALIZED)

  function resolve(to) {
    if (typeof to === 'string') {
      return matcher.resolve({ path: to })
    }
  }

  let ready
  function markAsReady() {
    if (ready) return
    ready = true // 标记是否渲染完毕

    routerHistory.listen((to) => {
      const targetLocation = resolve(to)
      const from = currentRoute.value
      finalizeNavigation(targetLocation, from, true)
    })
  }

  function finalizeNavigation(to, from, replaced) {
    if (from === START_LOCATION_NORMALIZED || replaced) {
      routerHistory.replace(to.path)
    } else {
      routerHistory.push(to.path)
    }
    currentRoute.value = to
    console.log(currentRoute.value)

    // 初始化注入listen,使前进后退能被监听到
    markAsReady()
  }

  function pushWithRedirect(to) {
    const targetLocation = resolve(to)
    const from = currentRoute.value

    finalizeNavigation(targetLocation, from)
    console.log(targetLocation, from)
  }

  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    install(app) {
      const router = this
      app.config.globalProperties.$router = router

      Object.defineProperty(app.config.globalProperties, '$route', {
        enumerable: true,
        get: () => unref(currentRoute),
      })

      const reactiveRoute = {}

      for (let key in START_LOCATION_NORMALIZED) {
        reactiveRoute[key] = computed(() => currentRoute.value[key])
      }

      app.provide('router', router)
      app.provide('route location', reactive(reactiveRoute))

      app.component('RouterLink', RouterLink)

      app.component('RouterView', {
        setup:
          (props, { slots }) =>
          () =>
            <div></div>,
      })

      if (currentRoute.value == START_LOCATION_NORMALIZED) {
        // 初始化，需要经过路由系统进行一次跳转 发生匹配
        push(routerHistory.location)
      }

      return router
    },
  }
  console.log(options)
  return router
}

export { createWebHashHistory, createWebHistory, createRouter }
