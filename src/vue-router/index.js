import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'
import { shallowRef, computed, reactive, unref } from 'vue'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'
import { createRouterMatcher } from './matcher'

const START_LOCATION_NORMALIZED = {
  path: '/',
  params: {},
  query: {},
  matched: [],
}

function useCallback() {
  const handlers = []
  function add(handler) {
    handlers.push(handler)
  }

  return {
    add,
    list: () => handlers,
  }
}

function extractChangeRecoards(to, from) {
  const leavingRecoards = []
  const updatingRecoards = []
  const enteringRecoards = []

  const len = Math.max(to.matched.length, from.matched.length)

  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i]
    if (recordFrom) {
      if (to.matched.find((record) => record.path == recordFrom.path)) {
        updatingRecoards.push(recordFrom)
      } else {
        leavingRecoards.push(recordFrom)
      }
    }
    const recordTo = to.matched[i]
    if (recordTo) {
      if (!from.matched.find((record) => record.path === recordTo.path)) {
        enteringRecoards.push(recordTo)
      }
    }
  }

  return [leavingRecoards, updatingRecoards, enteringRecoards]
}

function guardToPromise(guard, to, from, record) {
  return () =>
    new Promise((resolve, reject) => {
      const next = () => resolve()

      let guardReturn = guard.call(record, to, from, next)
      // 不调用next 也会帮你调
      return Promise.resolve(guardReturn).then(next)
    })
}

function extractComponentsGuards(matched, guardType, to, from) {
  const guards = []
  for (const record of matched) {
    let rawComponent = record.components.default
    const guard = rawComponent[guardType]
    guard && guards.push(guardToPromise(guard, to, from, record))
  }

  return guards
}

function runGuardQueue(guards) {
  return guards.reduce(
    (promise, guard) => promise.then(() => guard()),
    Promise.resolve()
  )
}

function createRouter(options) {
  const routerHistory = options.history
  const matcher = createRouterMatcher(options.routes)

  const currentRoute = shallowRef(START_LOCATION_NORMALIZED)

  const beforeGuards = useCallback()
  const beforeResolveGuards = useCallback()
  const afterGuards = useCallback()

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

  async function navigate(to, from) {
    // 导航守卫 进入组件 离开组件 更新组件的钩子
    const [leavingRecoards, updatingRecoards, enteringRecoards] =
      extractChangeRecoards(to, from)

    let guards = extractComponentsGuards(
      leavingRecoards.reverse(),
      'beforeRouteLeave',
      to,
      from
    )

    return runGuardQueue(guards)
      .then(() => {
        guards = []

        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromise(guard, to, from, guard))
        }

        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        guards = extractComponentsGuards(
          updatingRecoards.reverse(),
          'beforeRouteUpdate',
          to,
          from
        )

        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        for (const record of to.matched) {
          if (record.beforeEnter) {
            guards.push(guardToPromise(record.beforeEnter, to, from, record))
          }
        }

        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        guards = extractComponentsGuards(
          updatingRecoards.reverse(),
          'beforeRouteEnter',
          to,
          from
        )

        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromise(guard, to, from, guard))
        }
        return runGuardQueue(guards)
      })
  }

  function pushWithRedirect(to) {
    const targetLocation = resolve(to)
    const from = currentRoute.value

    navigate(targetLocation, from)
      .then(() => {
        return finalizeNavigation(targetLocation, from)
      })
      .then(() => {
        for (const guard of afterGuards.list()) {
          guard(to, from)
        }
      })

    console.log(targetLocation, from)
  }

  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    beforeEach: beforeGuards.add,
    afterEach: afterGuards.add,
    beforeResolve: beforeResolveGuards.add,
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

      app.component('RouterView', RouterView)

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
