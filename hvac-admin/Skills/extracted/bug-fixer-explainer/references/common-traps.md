# Common Bug Traps by Language

Quick-reference for the most frequent footguns. When a bug looks "too simple",
check here first — it's probably a classic.

---

## JavaScript / TypeScript

| Trap | Symptom | Fix |
|---|---|---|
| Missing `await` | Promise object instead of value, `.then is not a function` | Add `await`, make function `async` |
| `var` hoisting | Variable accessible before declaration, unexpected `undefined` | Use `let` / `const` |
| `this` context lost | `this.method is not a function` in callbacks | Arrow function, `.bind(this)`, or destructure |
| Mutating state directly | React state not updating | Spread/clone before modifying: `[...arr]`, `{...obj}` |
| `==` vs `===` | `0 == "0"` is `true`, `null == undefined` is `true` | Always use `===` |
| `forEach` with `async` | Async operations don't complete before loop ends | Use `for...of` with `await`, or `Promise.all` |
| Optional chaining missing | `Cannot read properties of undefined` | Use `?.` on all external/API data |
| Array `.sort()` default | Numbers sort lexicographically (`[10,2,1]` → `[1,10,2]`) | Pass comparator: `.sort((a,b) => a - b)` |
| `const` with objects | Think you can't mutate, but you can — just can't reassign | Use `Object.freeze()` if truly immutable |
| Closure in loop | All closures capture same `i` value | Use `let` in loop, or IIFE |

---

## TypeScript Specific

| Trap | Symptom | Fix |
|---|---|---|
| `any` suppressing real errors | Type errors at runtime despite no TS errors | Tighten types; avoid `as any` |
| Non-null assertion abuse | `!` hides nulls that surface at runtime | Use optional chaining or proper guards |
| Missing `strictNullChecks` | Null/undefined not caught at compile time | Enable in `tsconfig.json` |
| Enums vs union types | Runtime enum value mismatches | Prefer `type Status = "a" \| "b"` for simpler cases |
| Type narrowing failure | Type guard not working in conditional | Use `typeof`, `instanceof`, or discriminated unions |

---

## Python

| Trap | Symptom | Fix |
|---|---|---|
| Mutable default argument | Function mutates shared list/dict across calls | Use `None` as default, init inside function |
| Integer division (Python 2 habit) | `3/2` gives `1` | Use `3/2` (float div) or `3//2` (floor div) intentionally |
| `is` vs `==` | `x is "hello"` may fail even when `x == "hello"` | Use `==` for value equality |
| Late binding closures | Lambda/comprehension captures variable by reference | Use default arg: `lambda x=x: x` |
| Global vs local variable | `UnboundLocalError` when assigning to outer var | Use `global` or `nonlocal` keyword |
| Shallow copy | `.copy()` on nested structure shares inner refs | Use `copy.deepcopy()` |
| Chained comparison surprise | `1 < x < 10` works, but `x == 1 or 2` doesn't | Write `x == 1 or x == 2` |
| Incorrect `except` clause | `except Exception, e` (old syntax) | `except Exception as e` |
| f-string in Python < 3.6 | `SyntaxError` on f-strings | Use `.format()` or upgrade Python |

---

## React

| Trap | Symptom | Fix |
|---|---|---|
| Stale closure in `useEffect` | Effect reads old value of state/prop | Include value in dependency array |
| Missing dependency array | Effect runs every render | Add `[]` (run once) or `[dep]` (on change) |
| State update not immediate | Logging state right after `setState` shows old value | State updates are async; use `useEffect` to observe |
| Direct state mutation | UI doesn't re-render | Always return new objects/arrays |
| Key prop missing in lists | React warning, wrong component reused | Add stable `key` prop to each list item |
| `useEffect` with async | `useEffect` callback can't be `async` directly | Define async function inside, call it |
| Event handler recreated on every render | Child re-renders unexpectedly | Wrap handler in `useCallback` |
| Context triggering excess re-renders | Everything re-renders on context change | Split contexts or use `useMemo` for value |

---

## SQL

| Trap | Symptom | Fix |
|---|---|---|
| `NULL` comparison with `=` | `WHERE col = NULL` returns nothing | Use `IS NULL` / `IS NOT NULL` |
| Implicit type coercion | `WHERE id = "123"` may or may not work | Match types explicitly |
| `JOIN` without condition | Cartesian product | Always specify `ON` clause |
| `GROUP BY` missing column | Aggregate query errors | All non-aggregated `SELECT` cols must be in `GROUP BY` |
| `DISTINCT` in wrong place | Unexpected duplicates or deduplication | Understand `SELECT DISTINCT` vs aggregate |
| Integer division in SQL | `10 / 3` = `3` in many DBs | Cast: `10.0 / 3` or `CAST(10 AS FLOAT) / 3` |
| Off-by-one in `LIMIT`/`OFFSET` | Pagination skips or repeats rows | Use `OFFSET (page-1) * pageSize` |

---

## CSS

| Trap | Symptom | Fix |
|---|---|---|
| `z-index` not working | Element stays behind despite high z-index | Check stacking context — parent may need `position: relative` |
| Flexbox default shrink | Items shrink unexpectedly | Add `flex-shrink: 0` or set `min-width` |
| `%` height not working | Child with `height: 100%` collapses | Parent needs explicit height |
| `margin: auto` not centering | Block not centered | Needs `display: block` and explicit width |
| Specificity war | Styles not applying | Inspect cascade; avoid `!important`, use more specific selector |
| `position: absolute` wrong anchor | Element positioned from wrong parent | Nearest `position: relative` ancestor is the reference |
| `overflow: hidden` clipping | Content cut off unexpectedly | Check if parent has explicit size constraint |
| Tailwind class not applying | Class has no effect | Check for typo, purge config, or conflicting base style |

---

## Next.js / Vercel

| Trap | Symptom | Fix |
|---|---|---|
| `useRouter` in Server Component | Error: hooks in server components | Move to Client Component (`"use client"`) |
| `params` not available | Dynamic route param undefined | Await `params` in Next.js 15+: `const { id } = await params` |
| Env var missing client-side | `undefined` in browser | Prefix with `NEXT_PUBLIC_` |
| `fetch` not revalidating | Stale data after update | Add `revalidate` option or use `cache: 'no-store'` |
| Image `src` domain blocked | Next.js Image error | Add domain to `next.config.js` `images.domains` |

---

## Supabase

| Trap | Symptom | Fix |
|---|---|---|
| RLS blocking query | Empty result with no error | Check Row Level Security policies in dashboard |
| Auth user `null` on SSR | Middleware not passing session | Use `createServerClient` with cookie adapter |
| Realtime not firing | Subscription receives nothing | Ensure `REPLICA IDENTITY FULL` on table |
| `select()` returns null | Query succeeds but data is null | Check table name spelling and RLS |
| Type mismatch on insert | Postgres error on valid-looking data | Match JS types to Postgres column types exactly |
