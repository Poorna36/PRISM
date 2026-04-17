# Authentication

The web app is protected by a login gate. The authentication page is the first thing rendered when the app loads — no dashboard content is accessible until the user is authenticated.

---

## Credentials (Demo / Hackathon)

| Field | Value |
|-------|-------|
| Employee ID | `npd570` |
| Password | `notre570` |

These are hardcoded on the backend for the demo build. No database lookup is required.

---

## Flow

```
Browser loads app
        │
        ▼
AuthPage renders (full-screen, no dashboard visible)
        │
   User enters credentials
        │
        ▼
POST /api/auth/login
        │
   ┌────┴────┐
 Match?     No match
   │              │
   ▼              ▼
Set JWT      Show "Authentication Failed"
in cookie    message on login page
   │
   ▼
Redirect to dashboard (MainPage)
```

---

## Backend

### Endpoint

**POST /api/auth/login**

Request:
```json
{ "employee_id": "npd570", "password": "notre570" }
```

Success response (`200`):
```json
{ "token": "<jwt>", "employee_id": "npd570" }
```

Failure response (`401`):
```json
{ "error": "Authentication Failed" }
```

**POST /api/auth/logout**

Clears the session token. Returns `200`.

**GET /api/auth/me**

Returns current authenticated user from token. Used by frontend on app load to check if session is still valid.

```json
{ "employee_id": "npd570" }
```

Returns `401` if token is missing or expired.

### Implementation (`server/routes/auth.js`)

- Credentials are stored in `server/config/auth.config.js` as constants (not in DB).
- On successful login, a JWT is signed with a secret from `.env` (`JWT_SECRET`) and returned.
- JWT expiry: `8h` (standard working day session).
- Token is stored as an `httpOnly` cookie on the client.
- All other API routes are protected by `middleware/authMiddleware.js`, which validates the JWT on every request. Unauthenticated requests return `401`.

### Files

```
server/
├── routes/
│   └── auth.js                  # POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
├── middleware/
│   └── authMiddleware.js        # JWT validation middleware — applied to all routes except /auth/login
└── config/
    └── auth.config.js           # EMPLOYEE_ID = "npd570", PASSWORD = "notre570"
```

Add to `server/.env`:
```
JWT_SECRET=your-secret-key-here
```

---

## Frontend

### AuthPage (`client/src/pages/AuthPage.jsx`)

Shown when the user is not authenticated. Covers the full viewport — no dashboard content is visible behind it.

**Layout:**
- Centered card (dark surface, consistent with dashboard design system)
- App name / logo at top
- Employee ID input field — placeholder text in background of field reads `npd570` (as `placeholder` attribute)
- Password input field (type=`password`)
- "Sign In" button
- Error message area: displays `"Authentication Failed"` in red when credentials are wrong — hidden when no error

**Behavior:**
- On submit → calls `POST /api/auth/login`
- On success → stores token (cookie handled by browser via `httpOnly`) and navigates to `/` (dashboard)
- On failure → shows `"Authentication Failed"` below the form
- If user is already authenticated (valid token found via `GET /api/auth/me`) → skip AuthPage, go directly to dashboard

### Auth State (`client/src/store/authStore.js`)

Zustand store:
```js
{
  isAuthenticated: boolean,
  employeeId: string | null,
  login: (employeeId, password) => Promise,
  logout: () => void,
  checkSession: () => Promise   // calls GET /api/auth/me on app boot
}
```

### Route Guard

In `App.jsx`, wrap `MainPage` with an auth check:
```jsx
// App.jsx
function App() {
  const { isAuthenticated, checkSession } = useAuthStore();

  useEffect(() => { checkSession(); }, []);

  if (!isAuthenticated) return <AuthPage />;
  return <MainPage />;
}
```

No React Router needed — single-page app, simple conditional render.

### API calls (`client/src/api/index.js`)

```js
export const login = (employeeId, password) =>
  fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',        // sends/receives httpOnly cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: employeeId, password })
  });

export const logout = () =>
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

export const getSession = () =>
  fetch('/api/auth/me', { credentials: 'include' });
```

All other API calls must include `credentials: 'include'` so the auth cookie is sent.

---

## Design Notes

- AuthPage uses the same dark background (`#0f172a`) and card surface (`#1e293b`) as the dashboard — consistent visual language.
- The "Authentication Failed" message appears below the form fields in red (`#ef4444`) — same red used for confidence indicators elsewhere.
- Employee ID placeholder (`npd570`) is shown as the HTML `placeholder` attribute of the input — visible in a muted color when the field is empty.
- No "forgot password" or registration flow — demo build only.
- Framer Motion: fade-in animation on AuthPage mount; error message animates in with a subtle shake (x-axis motion) to draw attention.
