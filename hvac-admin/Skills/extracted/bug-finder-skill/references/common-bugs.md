# Common Bug Patterns Reference

A quick-lookup guide for diagnosing bugs by category. Each section covers: what it looks like, what causes it, and the fastest path to a fix.

---

## Null / Undefined / None Errors

**Signatures:**
- JS/TS: `TypeError: Cannot read properties of undefined`, `null is not an object`
- Python: `AttributeError: 'NoneType' object has no attribute '...'`, `TypeError: 'NoneType' is not iterable`
- Java/Kotlin: `NullPointerException`

**Common causes:**
- Async data hasn't arrived yet but code assumes it has
- A function that can return `null`/`None` isn't checked before use
- A dictionary key that doesn't exist, returning `None` instead of raising
- Optional chaining or safe-navigation operator missing
- Database query returning no rows, result used directly

**Diagnosis approach:**
1. Find the exact variable that's null/undefined
2. Trace backward: where does it get set? Does that path always run?
3. Check if it's a timing issue (async) or a logic issue (branch not taken)

**Fix patterns:**
```python
# Python - use .get() with a default
value = d.get("key", default_value)

# Python - guard before use
if result is not None:
    result.do_something()
```
```typescript
// TypeScript - optional chaining + nullish coalescing
const name = user?.profile?.name ?? "Anonymous";

// Initialize async state as safe empty value
const [items, setItems] = useState<Item[]>([]);
```

---

## Type Errors

**Signatures:**
- `TypeError`, `ClassCastException`, `cannot convert X to Y`
- Silent wrong values from implicit coercion (JS `"5" + 3 === "53"`)

**Common causes:**
- JSON that comes back as strings that need to be numbers (or vice versa)
- JavaScript implicit coercion (`+`, `==` vs `===`)
- Python 2 vs 3 division behavior (`5/2 = 2` in Py2)
- Passing wrong type to a function expecting something specific
- Database returning `Decimal` where code expects `float`

**Diagnosis approach:**
- Print/log the type AND value of the suspect variable: `console.log(typeof x, x)` or `print(type(x), x)`
- Check if JSON values are being compared/used as the wrong type

**Fix patterns:**
```javascript
// Parse to correct type before use
const count = parseInt(response.data.count, 10);
const price = parseFloat(response.data.price);

// Use strict equality
if (value === null) { ... }  // not ==
```
```python
# Explicit casting
total = float(row["amount"])

# Check type before use
if isinstance(value, str):
    value = int(value)
```

---

## Async / Concurrency Bugs

**Signatures:**
- Missing `await` — function returns a Promise/coroutine, not the value
- Race conditions — results depend on which async op finishes first
- State mutation during async gap — value changes between when you read it and when you use it
- Unhandled promise rejections

**Common causes:**
- Forgot `await` on an async function call
- Multiple concurrent operations mutating shared state
- Event handlers firing before initialization completes
- `useEffect` cleanup not canceling in-flight requests (React)

**Diagnosis approach:**
- Add logging before and after suspect async calls — check what's actually being returned
- Look for Promises being returned where you expected a resolved value: `console.log(result)` shows `Promise { <pending> }`
- In React, check if state is being set after a component unmounts

**Fix patterns:**
```javascript
// Missing await
const data = await fetchUser(id);   // not just fetchUser(id)

// Race condition in React - cancel on unmount
useEffect(() => {
  let cancelled = false;
  fetchData().then(data => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, []);
```
```python
# Python async - ensure proper await
async def get_user(id):
    result = await db.query("SELECT * FROM users WHERE id = ?", id)
    return result
```

---

## Off-by-One and Boundary Conditions

**Signatures:**
- Last or first item missing/duplicated
- Loop processes one too many or too few items
- Index out of bounds on the last element
- Pagination that misses the last page or repeats items

**Common causes:**
- `<` vs `<=` in loop condition
- 0-based vs 1-based indexing confusion
- Slicing with wrong end index (`arr[0:n]` vs `arr[0:n-1]`)
- Page offset calculation (`page * size` vs `(page - 1) * size`)

**Diagnosis approach:**
- Test with small, known inputs: an empty array, a single item, two items
- Check loop bounds manually: what happens at `i = 0` and `i = arr.length - 1`?
- Print the index and value at each iteration

**Fix patterns:**
```python
# Inclusive range in Python
for i in range(len(arr)):       # 0 to len-1
for i in range(1, n + 1):      # 1 to n inclusive

# Safe last-element access
last = arr[-1] if arr else None
```
```javascript
// Correct slice
const page = items.slice(start, start + pageSize);  // end is exclusive

// Loop over all elements
for (let i = 0; i < arr.length; i++) { ... }  // not <=
```

---

## Environment / Config Bugs

**Signatures:**
- Works locally, fails in CI/prod
- `KeyError`, `undefined` for env variables
- Wrong file path, module not found
- SSL errors, connection refused, wrong port

**Common causes:**
- Missing `.env` file or env var not set in deployment environment
- Hardcoded local paths (`/Users/dev/project/...`) that don't exist elsewhere
- Different Node/Python/Ruby versions between local and CI
- `NODE_ENV` / `RAILS_ENV` / `FLASK_ENV` not set or set wrong
- Docker volume not mounted, file not copied into image

**Diagnosis approach:**
- Print the actual value of the env var at startup: `print(os.environ.get("MY_VAR"))` — confirm it's set and correct
- Check if the working directory is what you expect: `print(os.getcwd())`
- Compare the environment: `printenv | sort` locally vs in CI

**Fix patterns:**
```python
# Fail fast on missing required env vars
import os
DB_URL = os.environ["DATABASE_URL"]  # raises KeyError if missing — better than silent None

# Or with a clear error message
DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise EnvironmentError("DATABASE_URL is required but not set")
```
```javascript
// Validate env vars at startup
const requiredEnv = ["API_KEY", "DATABASE_URL", "PORT"];
for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

---

## Dependency / Import Errors

**Signatures:**
- `ModuleNotFoundError`, `ImportError`, `Cannot find module`
- `AttributeError` on a module (function doesn't exist in this version)
- Works for one developer, not another
- Version conflict warnings in pip/npm output

**Common causes:**
- Package not installed in the current virtual environment / node_modules
- Wrong package name (e.g., `import cv2` but package is `opencv-python`)
- Version installed doesn't have the function being called
- Circular imports (Python)
- Wrong import path for named vs default exports (JS/TS)

**Diagnosis approach:**
```bash
# Python — verify the package is installed in the right env
pip show <package-name>
python -c "import <module>; print(<module>.__version__)"

# Node — check if it's in node_modules
ls node_modules/<package> 2>/dev/null || echo "not installed"
npm ls <package>
```

**Fix patterns:**
```bash
# Install missing package
pip install <package>       # Python
npm install <package>       # Node

# Lock versions to prevent drift
pip freeze > requirements.txt
npm ci  # installs exact versions from package-lock.json
```

---

## API and HTTP Bugs

**Signatures:**
- `401 Unauthorized` — auth is wrong or missing
- `403 Forbidden` — authenticated but not allowed
- `400 Bad Request` — malformed request body or missing required fields
- `429 Too Many Requests` — rate limited
- `CORS error` — browser blocking cross-origin request
- `ECONNREFUSED` — server not running or wrong host/port

**Common causes:**
- Auth token expired, missing, or sent in wrong header (`Authorization: Bearer` vs `X-API-Key`)
- Request body is not JSON-encoded, or Content-Type header is wrong
- CORS: server doesn't allow the origin, or preflight OPTIONS not handled
- Sending the wrong HTTP method for the endpoint
- Query params vs body params confusion

**Diagnosis approach:**
1. Log the full request: method, URL, headers, body
2. Log the full response: status, headers, body — not just the status code
3. Try the same request with curl or Postman to eliminate client-side issues
4. For CORS, check the browser Network tab > Headers for `Access-Control-Allow-Origin`

**Fix patterns:**
```python
# Log full request/response for debugging
import requests
response = requests.post(url, json=payload, headers=headers)
print(response.status_code)
print(response.headers)
print(response.text)  # full body, not just response.json()
```
```javascript
// Set Content-Type correctly
fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  body: JSON.stringify(payload)  // don't forget JSON.stringify
});
```

---

## Database / Query Bugs

**Signatures:**
- Query returns 0 rows when you expect some
- `IntegrityError` / constraint violation
- N+1 query performance issue
- Wrong data returned from JOIN
- Migration failures

**Common causes:**
- WHERE clause filters more than intended (wrong column, wrong value type)
- JOIN type mismatch (INNER vs LEFT JOIN losing rows)
- N+1: fetching a list then querying each item individually in a loop
- Transaction not committed before next read
- Null in a column that has a NOT NULL constraint

**Diagnosis approach:**
- Run the query directly in a DB console/REPL with actual values substituted in
- Check the execution plan (`EXPLAIN ANALYZE`) for unexpected behavior
- Log the exact SQL being generated by your ORM

**Fix patterns:**
```python
# Log ORM queries (SQLAlchemy)
import logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

# Eager-load to fix N+1
users = db.query(User).options(joinedload(User.posts)).all()
```
```sql
-- Check JOIN behavior: LEFT vs INNER
-- INNER JOIN drops rows where no match exists
-- LEFT JOIN keeps all left-side rows
SELECT u.id, p.title
FROM users u
LEFT JOIN posts p ON p.user_id = u.id  -- use LEFT if user might have no posts
```

---

## Memory / Performance Bugs

**Signatures:**
- Memory usage grows over time and doesn't go down
- Slow response on large inputs but fast on small ones
- High CPU, process hangs or becomes unresponsive
- `MemoryError`, `OutOfMemoryError`, `heap out of memory`

**Common causes:**
- Growing list/dict that's never cleared (accumulating event listeners, cache without eviction)
- Reading large files entirely into memory instead of streaming
- O(n²) nested loop over large datasets
- Infinite loop or runaway recursion
- Retaining references that prevent garbage collection

**Diagnosis approach:**
- Profile before optimizing: `cProfile` (Python), Node `--inspect` + Chrome DevTools, or language-specific profiler
- Add timing logs around suspect sections
- Check memory over time, not just peak: does it grow unbounded or plateau?

**Fix patterns:**
```python
# Stream large files instead of loading all at once
with open("large_file.csv") as f:
    for line in f:  # iterates line-by-line
        process(line)

# Use generators for large pipelines
def process_items(items):
    for item in items:
        yield transform(item)
```
```javascript
// Clear listeners when no longer needed
const handler = () => { ... };
element.addEventListener("click", handler);
// later:
element.removeEventListener("click", handler);
```
