## 2024-04-06 - Zustand Destructuring Anti-pattern in React

**Learning:** Destructuring the entire Zustand store state in core layout files (e.g. `const { processes, launchApp } = useOSStore();` in `App.tsx` and `AppWindow.tsx`) is a significant performance anti-pattern. Because the component is subscribed to the *entire* store, any modification to *any* property within that store triggers a complete re-render of the component, even if the changed property is unused by that specific component.

**Action:** Always use targeted Zustand selectors (e.g., `const processes = useOSStore(state => state.processes);`) instead of destructured store extraction to ensure referential equality is preserved and components only re-render when the specific data they consume actually changes.