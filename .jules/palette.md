## 2024-04-04 - ARIA labels in complex toolbars
**Learning:** Icon-only buttons used in dense navigation toolbars (like the Photos header) frequently lack accessible names, making them invisible to screen readers despite being visually obvious.
**Action:** Always add descriptive `aria-label`s to custom `<button>` or `<label>` elements wrapping icons (e.g., `<label aria-label="Upload media"><Plus /></label>`).
