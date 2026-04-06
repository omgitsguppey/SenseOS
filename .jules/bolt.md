## 2026-04-04 - Granular Zustand Subscriptions
**Learning:** Destructuring entire Zustand stores (e.g. `const { processes } = useOSStore()`) causes unnecessary application-wide React re-renders on ANY state change, degrading UI performance during rapid state updates. Early bailouts returning the `state` reference itself in setter callbacks prevent listeners from firing when no updates occurred.
**Action:** Always use targeted atomic selectors (e.g. `useOSStore(state => state.processes)`) and ensure mutative actions return the existing state if the mutation logic yields a no-op result.
