## 2024-05-24 - Secure Error Handling API Responses
**Vulnerability:** Information Exposure (CWE-200). Express API endpoints returned `res.status(500).json({ error: error.message })`.
**Learning:** Returning `error.message` on 500 status codes directly to clients exposes sensitive internal details like stack traces or database errors, which can aid malicious actors in understanding system internals.
**Prevention:** Always implement a generic catch-all error response (e.g., `res.status(500).json({ error: 'Internal server error' })`) and rely exclusively on server-side logging (`console.error`) to capture the actual error details for debugging.
