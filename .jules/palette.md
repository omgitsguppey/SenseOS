## 2024-05-24 - Icon-Only Interactive Elements in Custom Mobile UIs

**Learning:** Custom iOS-like or specialized UI components (like floating search bars, circular zoom options, upload triggers) consistently rely on clean, textless, icon-only interactive elements (`<button>`, `<label>`). Since these elements lack inherent text nodes, they are entirely invisible to screen readers without explicit `aria-label` attributes.
**Action:** Always verify that interactive elements using pure SVG or library icons (e.g., Lucide React) include descriptive `aria-label` attributes, especially when mimicking minimalist mobile OS interactions in web applications.
