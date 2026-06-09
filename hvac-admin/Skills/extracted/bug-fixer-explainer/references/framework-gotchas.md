# Framework & Tooling Gotchas

Deep-dive traps for specific frameworks commonly encountered in modern web stacks.
Read this file when the bug is clearly framework-specific and `common-traps.md`
doesn't have enough detail.

---

## Next.js 14+ App Router

### Server vs Client Component confusion
The single biggest source of Next.js bugs in 2024–2025.

**Rules:**
- Default: every component is a **Server Component** (no hooks, no browser APIs)
- Add `"use client"` at the top to make it a Client Component
- Hooks (`useState`, `useEffect`, `useRouter`, `useContext`) → Client only
- `fetch`, `async/await` at component level, `cookies()`, `headers()` → Server only
- You cannot import a Server Component *into* a Client Component (but reverse is OK)

**Common error:** `Error: useState can only be used in a Client Component`
→ Add `"use client"` as the very first line of the file

### `params` and `searchParams` are async in Next.js 15
```ts
// Next.js 14
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>  // sync, fine
}

// Next.js 15 — params is now a Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params  // must await
  return <div>{id}</div>
}
```

### Environment Variables
- Server-only vars: `SUPABASE_SERVICE_KEY`, `DATABASE_URL` — never exposed to browser
- Client-safe vars: must be prefixed `NEXT_PUBLIC_` — bundled into client JS
- In App Router, `process.env.MY_VAR` in Server Components works fine
- In Client Components, only `NEXT_PUBLIC_*` vars are available

### `useRouter` for navigation (App Router)
```ts
// Pages Router (old)
import { useRouter } from 'next/router'

// App Router (new) — different import!
import { useRouter } from 'next/navigation'
```

---

## Tailwind CSS

### Class not applying — checklist
1. Typo in class name (use Tailwind CSS IntelliSense extension)
2. Dynamic class not in safelist — Tailwind purges classes not found as complete
   strings in source. `text-${color}-500` won't work; use full class names.
3. `content` config doesn't include the file — check `tailwind.config.js`
4. Conflicting utility — two classes targeting same property (last wins in source order)
5. Base/reset style overriding — check browser devtools for crossed-out rule

### Responsive prefix order matters
```html
<!-- Wrong — mobile-first means sm: overrides base, md: overrides sm: -->
<div class="md:flex sm:block hidden">  <!-- confusing order -->

<!-- Right -->
<div class="hidden sm:block md:flex">  <!-- base → sm → md -->
```

### `group` and `peer` modifiers
```html
<!-- group: style child based on parent hover -->
<div class="group">
  <span class="opacity-0 group-hover:opacity-100">Shows on parent hover</span>
</div>

<!-- peer: style sibling based on sibling state -->
<input class="peer" type="checkbox">
<label class="peer-checked:text-green-500">Checked!</label>
```

---

## Supabase (expanded)

### Row Level Security (RLS) — the silent killer
RLS enabled + no policy = **zero rows returned, no error thrown**.
This is intentional security behavior, but looks like a bug.

Debug steps:
1. Open Supabase dashboard → Table Editor → check if RLS is on
2. Go to Authentication → Policies — check if a policy exists for the operation
3. Temporarily disable RLS to confirm it's the issue
4. Write a policy: `CREATE POLICY "Users see own rows" ON table USING (auth.uid() = user_id);`

### Auth session in SSR (Next.js)
```ts
// Wrong — anon client doesn't have access to cookies
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

// Right — use SSR package with cookie-based session
import { createServerClient } from '@supabase/ssr'
// (full setup in Supabase docs — requires cookie get/set/remove helpers)
```

### Type generation
Run `supabase gen types typescript --project-id YOUR_ID > types/supabase.ts`
after schema changes, or types will be stale.

---

## React Query / TanStack Query

### Stale cache masking bugs
```ts
// Query appears to "work" but shows old data
// Check: is the queryKey changing when it should?
useQuery({ queryKey: ['user', userId], ... })
// If userId doesn't change, cache is returned even after mutation

// Force refetch after mutation:
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['user'] })
```

### `enabled` flag for dependent queries
```ts
// Wrong — query fires even when userId is undefined
useQuery({ queryKey: ['profile', userId], queryFn: fetchProfile })

// Right
useQuery({
  queryKey: ['profile', userId],
  queryFn: fetchProfile,
  enabled: !!userId  // only fires when userId is truthy
})
```

---

## Prisma

### N+1 query problem
```ts
// Wrong — fires one query per post to get author
const posts = await prisma.post.findMany()
for (const post of posts) {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } })
}

// Right — eager load with include
const posts = await prisma.post.findMany({
  include: { author: true }
})
```

### Schema change not reflected
After editing `schema.prisma`, you must:
1. `npx prisma migrate dev` — apply changes to dev DB
2. `npx prisma generate` — regenerate the Prisma Client types

If types still seem wrong: delete `node_modules/.prisma` and regenerate.

---

## Vite

### Env variables
- Must be prefixed `VITE_` to be available in client code
- Access via `import.meta.env.VITE_MY_VAR` (not `process.env`)
- `.env.local` takes precedence over `.env`

### Absolute imports not resolving
Add to `vite.config.ts`:
```ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

---

## Node.js / Express

### Async error not caught by Express
```ts
// Wrong — async errors bypass Express error handler
app.get('/route', async (req, res) => {
  const data = await riskyOperation()  // throws → unhandled
  res.json(data)
})

// Right — wrap or use express-async-errors package
app.get('/route', async (req, res, next) => {
  try {
    const data = await riskyOperation()
    res.json(data)
  } catch (err) {
    next(err)  // passes to error middleware
  }
})
```

### `__dirname` undefined in ESM
ESM modules don't have `__dirname`. Use:
```ts
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
```
