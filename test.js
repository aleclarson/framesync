
// Polyfill the browser-specific functions
require('./polyfill')

const tp = require('testpass')

const frame = require('.')

tp.test('render steps are ordered', (t) => {
  t.eq(frame.step, null)
  const order = []
  frame.once('start', () => order.push(frame.step))
  frame.once('update', () => order.push(frame.step))
  frame.once('render', () => order.push(frame.step))
  frame.once('end', () => order.push(frame.step))
  return frame.promise('end').then(() => {
    t.eq(order, ['start', 'update', 'render', 'end'])
    t.eq(frame.step, null)
  })
})

tp.test('queued functions can be removed', (t) => {
  t.eq(frame.step, null)
  let fired = false
  const fire = () => {fired = true}
  frame.once('update', fire)
  frame.once('start', () => frame.off('update', fire))
  return frame.promise('end')
    .then(() => t.eq(fired, false))
})

tp.test('asap function when no step is active', (t) => {
  t.eq(frame.step, null)
  let time
  frame.once('update', () => {
    time = frame.time
  }, true)
  return frame.promise('end')
    .then(() => t.eq(time, frame.time))
})

tp.test('asap function when an earlier step is active', (t) => {
  t.eq(frame.step, null)
  let calls = 0
  frame.once('start', () => {
    const {time} = frame
    calls += 1
    frame.once('update', () => {
      calls += 1
      t.eq(time, frame.time)
    }, true)
  })
  return frame.promise('end')
    .then(() => t.eq(calls, 2))
})

tp.test('asap function when its step is active', (t) => {
  t.eq(frame.step, null)
  let calls = 0
  frame.once('update', () => {
    const {time} = frame
    calls += 1
    frame.once('update', () => {
      calls += 1
      t.eq(time, frame.time)
    }, true)
  })
  return frame.promise('end')
    .then(() => t.eq(calls, 2))
})

tp.test('asap function when a later step is active', (t) => {
  t.eq(frame.step, null)
  let calls = 0
  frame.once('render', () => {
    calls += 1
    frame.once('update', () => {
      calls += 1
    }, true)
  })
  return frame.promise('end')
    .then(() => t.eq(calls, 1))
})