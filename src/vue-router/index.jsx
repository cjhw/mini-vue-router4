import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'

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

  console.log(matchers)

  return {
    addRoute,
  }
}

function createRouter(options) {
  const routerHistory = options.history
  const matcher = createRouterMatcher(options.routes)
  const router = {
    install(app) {
      app.component('RouterLink', {
        setup:
          (props, { slots }) =>
          () =>
            <a>{slots.default && slots.default()}</a>,
      })

      app.component('RouterView', {
        setup:
          (props, { slots }) =>
          () =>
            <div></div>,
      })
    },
  }
  console.log(options)
  return router
}

export { createWebHashHistory, createWebHistory, createRouter }
