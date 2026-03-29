global.requestIdleCallback = function (cb) { cb(); return 0; };
globalThis.requestIdleCallback = function (cb) { cb(); return 0; };
if (!global.navigator) {
  Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' } });
}

// In order to allow Node.js to exit naturally after tests run without resorting to `process.exit(0)`,
// we override setInterval and setTimeout to unref by default during tests.
// This is non-destructive to the actual execution timings, it simply tells Node
// "do not wait for these timers if everything else is done."
const originalSetInterval = global.setInterval;
const originalSetTimeout = global.setTimeout;

global.setInterval = function (...args) {
  const interval = originalSetInterval(...args);
  if (interval && typeof interval.unref === 'function') interval.unref();
  return interval;
};
globalThis.setInterval = global.setInterval;

global.setTimeout = function (...args) {
  const timeout = originalSetTimeout(...args);
  if (timeout && typeof timeout.unref === 'function') timeout.unref();
  return timeout;
};
globalThis.setTimeout = global.setTimeout;
