## 2025-03-01 - [Hardcoded Admin Backdoor Removal]
**Vulnerability:** A hardcoded email address (`athenarosiejohnson@gmail.com`) was functioning as a global "backdoor" for admin authorization across the entire application stack.
**Learning:** Hardcoding credentials or specific user emails into source code bypasses database-driven Role-Based Access Control (RBAC).
**Prevention:** Rely strictly on the `admin` role assigned to users in the database (`role === 'admin'`). Do not use specific emails or usernames to grant privileges in the source code.