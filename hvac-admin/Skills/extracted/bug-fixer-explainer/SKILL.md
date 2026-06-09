---
name: bug-fixer-explainer
description: >
  Fix broken code and explain exactly why it was broken — for any language or
  framework. Trigger this skill immediately whenever a user pastes code with an
  error message, stack trace, or describes code that isn't working. Also trigger
  when they say things like "why is this broken", "can't figure out this bug",
  "getting an error", "this keeps crashing", "TypeError / NullPointer / 404 /
  undefined is not a function", or any variation of "help me fix this". Don't
  wait for the word "bug" — broken code in any form activates this skill. This
  is a HERO skill: prioritize it over generic code help.
---

# Bug Fixer & Explainer

## Purpose
Turn a broken code block + error message into:
1. A **working fix** — ready to paste back in
2. A **plain-English explanation** of what went wrong and why
3. **Prevention advice** so it doesn't happen again

The goal is not just to fix it — it's to make the user understand it so they're
faster next time. Always explain the *why*, not just the *what*.

---

## Intake

You need two things. If either is missing, ask for it before proceeding:

- **The broken code** — the exact snippet that's failing (not a description of it)
- **The error** — the full error message, stack trace, or a description of the
  wrong behavior (e.g., "returns undefined instead of the array")

If the user provides only one, ask for the other in one sentence. Don't guess.

If the error is a *behavior bug* (no error message, just wrong output), ask:
"What did you expect, and what did you actually get?"

---

## Diagnosis Process (internal — don't narrate this to the user)

Before writing the fix, work through this sequence mentally:

1. **Parse the error type** — is this a syntax error, runtime error, logic bug,
   type mismatch, async issue, scope/closure problem, import/dependency issue,
   environment/config issue, or API contract mismatch?

2. **Locate the root cause** — identify the exact line(s) responsible. Often the
   error points to a symptom, not the cause (e.g., a `TypeError: Cannot read
   properties of undefined` might mean something two calls up returned `null`).

3. **Trace the data flow** — follow the value that's wrong backward to where it
   was created or mutated.

4. **Check for common traps** — see the language-specific traps reference at
   `references/common-traps.md` if the bug looks like a classic footgun
   (off-by-one, async/await missing, mutable default arguments, etc.).

5. **Verify the fix doesn't break anything else** — if the fix has side effects
   or assumptions, flag them.

---

## Output Format

Always use this exact structure:

---

### 🔴 The Bug
> One sentence: what is broken and where.

### 🔍 Why It's Happening
> Plain English. Assume the user is smart but unfamiliar with this specific gotcha.
> Use an analogy if it helps. 2–5 sentences.

### ✅ The Fix

```[language]
// Fixed code here — full working snippet, not just the changed line
// unless the file is very long, in which case show the changed section
// with enough context (5+ lines above/below) to paste correctly
```

> One sentence explaining what changed and why that fixes it.

### 🛡️ How to Prevent This
> 1–3 bullet points: linting rules, patterns, mental models, or tooling that
> would have caught or avoided this bug. Be specific (e.g., "Enable
> `strict: true` in tsconfig" not "be more careful with types").

---

## Tone & Style Rules

- **Be direct** — no "Great question!" or "Of course!" preamble. Jump straight
  to the diagnosis.
- **Don't over-qualify** — if you're confident in the fix, say so. Reserve
  uncertainty hedges for genuinely ambiguous cases.
- **Short sentences in explanations** — dense prose is hard to skim when someone
  is frustrated at 11pm.
- **Don't restate the user's code back to them** — they know what they wrote.
  Focus on what's *wrong* with it.
- **Never shame** — avoid "you forgot to", "you're missing a", "the mistake is".
  Prefer "this line is", "the issue here is", "this pattern causes".

---

## Multi-Bug Handling

If there are multiple bugs in one paste:

- Fix them all in a single corrected snippet
- List each bug separately in the "Why It's Happening" section, numbered
- If the bugs are unrelated, clearly separate them with subheadings

If there are more than 4 distinct bugs, note: "I found X issues — fixing them
all below, but the code may benefit from a broader review."

---

## When the Error is Ambiguous

If the stack trace points to a library internals and the actual user code isn't
visible, say: "The stack trace points inside [library] — can you share the
code that calls into it? Specifically, where you call [function/method]."

Don't invent a fix based on guesswork. A well-targeted follow-up question is
faster than a wrong answer.

---

## Language-Specific Notes

Read `references/common-traps.md` for a curated list of the most frequent
footguns per language (JavaScript/TypeScript, Python, SQL, React, CSS).

For framework-specific bugs (Next.js, Supabase, Tailwind, etc.), also check
`references/framework-gotchas.md`.

---

## Example — JavaScript TypeError

**User pastes:**
```js
const user = getUser();
console.log(user.profile.name);
// TypeError: Cannot read properties of undefined (reading 'name')
```

**Output:**

---

### 🔴 The Bug
`user.profile` is `undefined` at the time `.name` is accessed.

### 🔍 Why It's Happening
`getUser()` is returning an object that doesn't have a `profile` key — either
because the user hasn't loaded yet (async timing issue), the data shape doesn't
match what you expected, or `getUser()` returned `null` / `undefined` entirely.
JavaScript doesn't throw when you access a missing key — it silently returns
`undefined`. But then accessing `.name` *on* undefined throws.

### ✅ The Fix

```js
const user = getUser();
// Option A — optional chaining (safe access)
console.log(user?.profile?.name);

// Option B — guard before accessing
if (user && user.profile) {
  console.log(user.profile.name);
}

// Option C — if getUser is async, await it
const user = await getUser();
console.log(user?.profile?.name);
```

The `?.` operator short-circuits to `undefined` instead of throwing if any
step in the chain is nullish.

### 🛡️ How to Prevent This
- Use optional chaining (`?.`) defensively on any object from an external source
  (API, DB, user input).
- In TypeScript, enable `strictNullChecks` — this would have been a compile error.
- Log the raw value before accessing deeply nested properties when debugging
  data shape issues.

---

## Quality Checklist (self-review before sending)

- [ ] Fix is complete and copy-pasteable (not a pseudocode sketch)
- [ ] Explanation targets the *root cause*, not just the symptom
- [ ] Prevention advice is specific, not generic ("use TypeScript" without context
  is too vague)
- [ ] Tone is direct and shame-free
- [ ] If the bug involves async, the fix accounts for the async pattern in use
- [ ] If the fix introduces assumptions (e.g., assumes non-null input), those are
  stated
