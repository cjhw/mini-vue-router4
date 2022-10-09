export function normalizedRouteRecord(record) {
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

export function createRouteRecordMatcher(record, parent) {
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

export function createRouterMatcher(routes) {
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
