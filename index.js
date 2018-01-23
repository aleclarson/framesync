
const frame = exports

Object.defineProperty(frame, 'step', {
  get: () => ~stepIdx ? steps[stepIdx] : null,
  enumerable: true,
})

Object.defineProperty(frame, 'time', {
  get: () => lastFrameTime,
  enumerable: true,
})

Object.defineProperty(frame, 'elapsed', {
  get: () => elapsed,
  enumerable: true,
})

frame.now = () => performance.now()

frame.dilate = (value) => {dilation = value}

frame.promise = (step, asap) => {
  if (typeof step == 'boolean') {
    asap = step; step = null
  }
  return new Promise(resolve => {
    frame.once(step || 'start', resolve, asap)
  })
}

frame.once = function(step, fn, asap) {
  if (typeof fn != 'function') {
    throw TypeError('Expected a function')
  }
  const i = steps.indexOf(step)
  if (i < 0) {
    throw Error(`Unknown render step: "${step}"`)
  }
  if (asap) {
    // Put our function in the `now` queue if our step is active.
    // This ensures the soonest possible execution.
    if (i == stepIdx) {
      queues[i].now.push(fn)
      return fn
    }
  }
  // When our step is after the active step, the `next` queue will
  // be processed in the current frame. To ensure our function is
  // executed in the *next* frame, it must go in the `now` queue.
  else if (~stepIdx && i > stepIdx) {
    queues[i].now.push(fn)
    willFlush = true
    return fn
  }
  // Here, the `next` queue is definitely what it says it is,
  // the function queue that is processed in the next frame.
  queues[i].next.push(fn)
  willFlush = true
  return fn
}

frame.on = function(step, fn) {
  return frame.once(step, function eachFrame() {
    if (fn() !== false) frame.once(step, eachFrame)
  })
}

frame.off = function(step, fn) {
  const queue = queues[steps.indexOf(step)]
  if (!queue) {
    throw Error(`Unknown render step: "${step}"`)
  }
  if (typeof fn == 'function') {
    const i = queue.next.indexOf(fn)
    if (~i) queue.next[i] = undefined
  } else {
    throw TypeError('Expected a function')
  }
}

//
// Internal state
//

const raf = window.requestAnimationFrame

// Tolerance of delay between frames (to prevent visual jumps).
const MAX_ELAPSED = 40

// The render steps in order.
const steps = ['start', 'update', 'render', 'end']

// The queues for each render step.
const queues = steps.map(step => ({
  now: [],
  next: [],
}))

// The current render step.
let stepIdx = -1

// When the most recent frame began.
let lastFrameTime = frame.now()

// Time since the previous frame.
let elapsedTime = 0

// Control the speed of animations by distorting time between frames.
let dilation = 1

// Continually flush the listener queue.
let willFlush = false
raf(function tick(time) {
  if (willFlush) {
    willFlush = false
    elapsedTime = dilation *
      Math.max(1, Math.min(MAX_ELAPSED, time - lastFrameTime))
    lastFrameTime = time
    queues.forEach(flush)
    stepIdx = -1
  } else {
    lastFrameTime = time
  }
  raf(tick)
})

function flush(queue, idx) {
  const {next} = queue
  if (next.length) {
    stepIdx = idx

    // Reuse the queues to avoid garbage collection.
    queue.next = queue.now
    queue.now = next

    let i = -1, fn
    while (++i < next.length) {
      fn = next[i]; fn && fn()
    }
    next.length = 0
  }
}
