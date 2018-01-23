/* For testing purposes */

global.window = {
  requestAnimationFrame(fn) {
    setImmediate(() => {
      fn(Date.now())
    })
  }
}

global.performance = {
  now: () => Date.now()
}
