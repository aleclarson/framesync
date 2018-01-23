
# framesync v1.0.0

Tiny scheduler that splits each frame into 4 distinct "render steps".

- `start`, `update`, `render`, `end`

The purpose of each step depends on which libraries you use and how
your own code is expected to cooperate with them.

For example, you may have an animation library that updates its state
during the `update` step. Then you probably have a DOM mutation library
that performs mutations during the `render` step. And even further, you
may decide to insert/remove DOM nodes during the `render` step. Then you
may use the `start` and `end` steps for measuring frame performance. But
at the end of the day, it's up to you to decide what works best.

### API

```js
import frame from 'framesync'

// When the current frame began
frame.time

// Get the current time in same precision as `frame.time`
frame.now()

// The current render step (equals null if no step is active)
frame.step

// Time since the previous frame
frame.elapsed

frame.once('start', () => {
  // This function is called during the "start" step
  // at the beginning of the next frame.
})

frame.once('render', () => {
  // Passing true as the 3rd argument means you want your function
  // called as soon as possible. If the "render" queue hasn't been
  // processed this frame, your function is included. Otherwise,
  // your function will have to wait until the next frame.
}, true)

frame.on('update', () => {
  // Use the `on` method to continually call a function on every frame.
  // You can return false to stop the loop, or use the `off` method.
})

// The `off` method removes a queued function before it can be called.
// This method is safe to call even if the given function is not queued.
frame.off('update', fn)

// Create a promise that resolves at the start of the next frame.
frame.promise()

// Pass `true` to resolve the promise as soon as possible.
// In other words, if `frame.step` equals "start", don't wait for the next frame.
frame.promise(true)

// You can also specify which step to resolve the promise.
frame.promise('render', true)
```
