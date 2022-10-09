function buildState(
  back,
  current,
  forward,
  replace = false,
  computedScroll = false
) {
  return {
    back,
    current,
    forward,
    replace,
    scroll: computedScroll
      ? { left: window.pageXOffset, top: window.pageYOffset }
      : null,
    position: window.history.length - 1,
  }
}

function createCurrentLocation(base) {
  const { pathname, search, hash } = window.location
  const hasPos = base.indexOf('#')

  if (hasPos > -1) {
    console.log(base.slice(1) || '/')
    return base.slice(1) || '/'
  }

  return pathname + search + hash
}

function useHistoryStateNavigation(base) {
  const currentLocation = {
    value: createCurrentLocation(base),
  }
  const historyState = {
    value: window.history.state,
  }

  if (!historyState.value) {
    changeLocation(
      currentLocation.value,
      buildState(null, currentLocation.value, null, true),
      true
    )
  }

  function changeLocation(to, state, replace) {
    const hasPos = base.indexOf('#')

    const url = hasPos > -1 ? base + to : to

    window.history[replace ? 'replaceState' : 'pushState'](state, null, url)
    historyState.value = state
  }

  function push(to, data) {
    // 还没跳转 只是更新了状态
    const currentState = Object.assign({}, historyState.value, {
      forward: to,
      scroll: { left: window.pageXOffset, top: window.pageYOffset },
    })

    // 跳转前我要知道我去哪
    changeLocation(currentState.current, currentState, true)

    const state = Object.assign(
      {},
      buildState(currentLocation.value, to, null),
      {
        position: currentState.position + 1,
      },
      data
    )

    changeLocation(to, state, false)
  }

  function replace(to, data) {
    const state = Object.assign(
      {},
      buildState(historyState.value.back, to, historyState.value.forward, true),
      data
    )
    changeLocation(to, state, true)
    currentLocation.value = to
  }

  return {
    location: currentLocation,
    state: historyState,
    push,
    replace,
  }
}

function useHistoryListeners(base, historyState, currentLocation) {
  let listeners = []
  const popStateHandler = ({ state }) => {
    const to = createCurrentLocation(base)
    const from = currentLocation.value
    const fromState = historyState.value

    currentLocation.value = to
    historyState.value = state

    let isBack = state.position - fromState.position < 0

    listeners.forEach((listener) => {
      listener(to, from, { isBack })
    })
  }
  window.addEventListener('popstate', popStateHandler)

  function listen(cb) {
    listeners.push(cb)
  }

  return {
    listen,
  }
}

export function createWebHistory(base = '') {
  const historyNavigation = useHistoryStateNavigation(base)
  const historyListeners = useHistoryListeners(
    base,
    historyNavigation.state,
    historyNavigation.location
  )

  const routerHistory = Object.assign({}, historyNavigation, historyListeners)

  Object.defineProperty(routerHistory, 'location', {
    get: () => historyNavigation.location.value,
  })

  Object.defineProperty(routerHistory, 'state', {
    get: () => historyNavigation.state.value,
  })

  return routerHistory
}
