---
name: debug-nodejs
description: '**WORKFLOW SKILL** — Debug Node.js applications step-by-step in this workspace. USE FOR: troubleshooting runtime errors, debugging server issues, fixing client-side problems in the loveconnect-app. DO NOT USE FOR: general coding questions, non-Node.js debugging, production deployment issues. INVOKES: terminal tools for running/debugging, file tools for code inspection, browser tools for client-side issues.'
---

# Debug Node.js Application

## Step-by-Step Workflow

1. **Gather Information**: Collect error messages, stack traces, user actions that trigger the issue, and environment details (dev/prod).

2. **Review Application Logs**: Check server console output, client browser console, and any logging files for error details.

3. **Start the Application**: Run the server (`npm start` in server/) and client (`npm run dev` in client/) to check for startup errors.

4. **Reproduce the Issue**: Perform the actions that cause the problem, noting exact steps and conditions.

5. **Isolate the Component**: Determine if it's client-side (UI, API calls), server-side (routes, controllers, database), or both.

6. **Inspect Relevant Code**:
   - For client issues: Check components in `client/src/pages/` and `client/src/components/`
   - For server issues: Check `server/routes/`, `server/controllers/`, `server/models/`
   - For auth: Check `server/controllers/authController.js` and middleware
   - For chat: Check `server/controllers/chatController.js` and socket handler

7. **Use Debugging Tools**:
   - Server: Use Node.js inspector (`node --inspect server/server.js`)
   - Client: Use browser dev tools, check network tab for API calls
   - Database: Check `server/config/db.js` and run queries manually

8. **Identify Root Cause**: Look for common issues like null references, async errors, incorrect API endpoints, database connection problems.

9. **Apply Fix**: Edit the code to resolve the issue, following project conventions.

10. **Test the Fix**: Restart the app, reproduce the scenario, ensure the fix works and no regressions.

## Decision Points

- **Client vs Server**: If error in browser console or UI behavior → client; if API 500 errors or server logs → server.
- **Error Type**: 
  - Syntax/ReferenceError: Check code for typos, imports.
  - TypeError: Check for null/undefined access.
  - Network errors: Check API routes and client fetch calls.
  - Database errors: Check model queries and db connection.
- **Severity**: Blocking errors (app crashes) → prioritize; minor warnings → note but continue.
- **Environment**: Dev issues may be code; prod issues could be config or data.

## Quality Criteria

- Application starts and runs without unhandled errors.
- The reported issue is resolved.
- No new errors introduced in related functionality.
- Code changes follow ESLint rules and project structure.
- Test the fix across different scenarios (login, chat, marketplace, etc.).
- Verify in both client and server if applicable.