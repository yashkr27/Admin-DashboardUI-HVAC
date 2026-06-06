Build a full-stack Admin Dashboard for a Supabase-backed HVAC business project.
The app should allow admins to view, add, edit, delete, and filter data across
all tables in the Supabase `public` schema.

---

## TECH STACK
- Framework: Next.js 14+ (App Router) or Vite + React — pick whichever fits the existing project
- Styling: Tailwind CSS + shadcn/ui components
- Supabase: @supabase/supabase-js client
- Auth: Supabase Auth (email/password) — protect all admin routes
- State: React Query (TanStack Query) for data fetching + cache invalidation
- Tables/Grids: TanStack Table v8
- Forms: React Hook Form + Zod validation
- Notifications: Sonner (toast notifications)

---

## KNOWN TABLES (from schema `public`)
1. chatbot_leads     — id (uuid), name (text), phone (text), email (text)
2. appointments      — infer columns from Supabase, likely: id, lead_id/name, date, time, status, notes
3. estimates         — id, client info, service type, amount, status
4. gallery           — id, image_url, title, description, created_at
5. gemini_usage_log  — id, prompt, response, tokens_used, created_at
6. profiles          — id (uuid, FK to auth.users), name, role, avatar_url, etc.
7. reviews           — id, author, rating, content, created_at

On app load, dynamically fetch the actual columns for each table using Supabase's
introspection or by doing a `.select('*').limit(1)` per table and inferring schema.
This ensures the UI adapts if columns change.

---

## LAYOUT & NAVIGATION
- Left sidebar with nav links for each table (icon + label)
- Top bar: project name "HVAC Admin", logged-in user avatar + logout button
- Main content area: renders the selected table's management UI
- Responsive: sidebar collapses to icon-only on smaller screens
- Color scheme: dark sidebar (#0f172a), white main content, accent color #3b82f6 (blue)

---

## PER-TABLE FEATURES (apply to ALL tables)

### Table View
- Full data table with:
  - Sortable columns (click header to sort asc/desc)
  - Pagination (25 rows/page default, configurable)
  - Global search/filter input (searches across all text columns)
  - Column visibility toggle
  - Row count display ("Showing X of Y records")
- Each row has:
  - Edit button → opens inline row editor or slide-over panel
  - Delete button → confirmation dialog before delete
- "Add New" button → opens a form modal/slide-over

### Add / Edit Form
- Auto-generate form fields based on column types:
  - text/varchar → <Input>
  - uuid (non-PK) → <Input> with UUID format hint
  - timestamp/date → <DatePicker>
  - boolean → <Switch>
  - numeric/int → <Input type="number">
  - enum → <Select> with options
- Skip `id` (auto-generated) and `created_at` (auto-set) in create forms
- Zod schema validation — required fields, email format, phone format
- On submit: Supabase `.insert()` or `.update()` → toast success/error → refetch table

### Delete
- Show confirmation dialog: "Are you sure you want to delete this record? This cannot be undone."
- On confirm: Supabase `.delete().eq('id', row.id)` → toast → refetch

---

## TABLE-SPECIFIC EXTRAS

### chatbot_leads
- Status badges (if status column exists)
- "Copy email" and "Copy phone" icon buttons per row
- Bulk export to CSV button

### appointments
- Calendar view toggle (list view + monthly calendar using a library like react-big-calendar)
- Status column rendered as colored badge (Scheduled=blue, Completed=green, Cancelled=red)
- Quick status update dropdown directly in table row

### estimates
- Amount column formatted as currency (₹ or $ based on locale)
- Status badge (Draft, Sent, Accepted, Rejected)
- Total estimates value shown in a summary card above the table

### gallery
- Card/grid view toggle instead of table (show image thumbnails)
- Image upload via Supabase Storage (bucket: 'gallery')
- Click thumbnail to preview full image in a lightbox

### gemini_usage_log
- Read-only table (no add/edit/delete)
- Token usage chart (bar chart, daily aggregation) using Recharts
- Total tokens used shown in summary card

### profiles
- Avatar displayed in table rows (circular image or initials fallback)
- Role column as editable badge/select
- Cannot delete own profile (disable delete for logged-in user's row)

### reviews
- Star rating rendered as ⭐ icons (not raw number)
- Average rating shown in summary card above table
- Moderation: "Approve / Hide" toggle if a `visible` column exists

---

## DASHBOARD HOME PAGE (default route `/admin`)
Show summary cards for each table:
- chatbot_leads: total leads count
- appointments: upcoming appointments count (date >= today)
- estimates: total estimate value (sum of amount)
- reviews: average rating
- gemini_usage_log: total tokens used this month

Below cards: recent activity feed showing last 5 rows from chatbot_leads +
appointments combined, sorted by created_at desc.

---

## AUTH & ROUTE PROTECTION
- `/admin/login` — email + password login form using Supabase Auth
- All `/admin/*` routes protected: redirect to login if no session
- Use Supabase `onAuthStateChange` to manage session
- Store session in context, not localStorage directly

---

## SUPABASE CLIENT SETUP
Create `lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
Use `.env.local` for keys — never hardcode them.

---

## ERROR HANDLING
- All Supabase calls wrapped in try/catch
- Network errors → toast with message
- RLS policy violations → toast "Permission denied. Check RLS policies."
- Empty tables → show empty state illustration + "Add your first record" CTA

---

## FILE STRUCTURE
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Dashboard home
│   │   ├── login/page.tsx
│   │   └── [table]/page.tsx      # Dynamic table route
├── components/
│   ├── layout/Sidebar.tsx
│   ├── layout/TopBar.tsx
│   ├── tables/DataTable.tsx      # Reusable TanStack table
│   ├── tables/TableToolbar.tsx
│   ├── forms/AutoForm.tsx        # Auto-generated form from schema
│   ├── forms/ConfirmDialog.tsx
│   └── ui/                       # shadcn components
├── hooks/
│   ├── useTableData.ts           # Generic fetch/mutate hook per table
│   └── useSupabaseSchema.ts      # Introspect table columns
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── types/
    └── database.ts               # Generated or manual Supabase types

---

## FINAL NOTES
- Use TypeScript throughout
- Generate Supabase types with: `npx supabase gen types typescript --project-id <id> > types/database.ts`
- All tables use `id` as primary key (uuid)
- RLS policies are already set on the Supabase side — the anon key is used for reads, service role key (server-side only) for admin writes if RLS blocks them
- The DataTable and AutoForm components must be fully generic/reusable — do NOT write per-table UI manually