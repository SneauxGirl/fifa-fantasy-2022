<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Git Safety Rules (Do Not Violate)

- Never run destructive git commands unless the user explicitly approves that exact command in the immediately preceding message.
- Treat these as destructive and blocked by default:
  - `git reset --hard`
  - `git checkout -- <path>`
  - `git restore --source ... --worktree --staged ...`
  - `git clean -fd` / `git clean -fdx`
  - any command that discards uncommitted work or rewrites history
- If user asks to "revert", "undo", or "reset", ask which safe method they want before running git commands.
- Prefer safe alternatives first:
  - edit files directly
  - `git restore <path>` only with explicit approval
  - create a new commit that reverts prior committed changes
- Before any potentially destructive action, explain exactly what data may be lost and wait for confirmation.

## File Deletion Safety Rules (Do Not Violate)

- Never delete files or directories unless the user explicitly approves deletion in the immediately preceding message.
- If deletion is requested broadly (for example, "clean up" or "remove old files"), list the exact paths first and ask for confirmation before deleting anything.
- Prefer non-destructive alternatives first:
  - keep file and deprecate it
  - rename or move file
  - comment out usage and leave file in place
- Before deleting, explain what will be removed and what behavior may be affected.

## Design and Frontend Implementation Preferences

- Layout strategy priority:
  1. Flexbox first
  2. CSS Grid second (when Flex cannot cleanly satisfy the layout)
  3. Absolute positioning only when absolutely necessary
- Build for responsiveness by default across common breakpoints.
- Build for accessibility by default:
  - use semantic HTML structure
  - use semantic interactive elements: `<a>` for navigation destinations, `<button>` for in-place actions (modals, toggles, submits)
  - use appropriate ARIA labels/attributes where needed
  - preserve logical heading order
  - ensure keyboard focus visibility and tab navigation work
  - avoid unintended keyboard traps; intentional modal focus trapping while a modal is open is required
- Prefer design tokens/CSS variables over hardcoded values.
- If hardcoded values are introduced where a variable should likely exist, explicitly warn and suggest a variable-based alternative.
- **Do not use `transform: scale()`** (or similar transforms used as a substitute for width/height) **unless the user explicitly asks for it.** Scaling changes what is painted, not the box the layout engine reserves -- so it causes overlap, clipping, and confusing spacing unless offset with explicit margins/padding or a sized wrapper.
- Typography weight defaults: prefer `400` for standard text, `500` for slightly bold text, and `700` for strong text; use `600` only when explicitly requested.

## Implementation Priorities

- Start with the simplest solution. Avoid complexity unless explicitly requested.
- Use margin, padding, and simple Flexbox solutions whenever possible.
- If the user asks for items to change places in a display, assume the actual HTML order should change rather than using visual order reversal, unless the request is only for a specific responsive width.
- If an item is removed from the UI, also remove its unused styling.
- Keep styling tied to components and global style files as much as possible.
- When moving an element into a component or modal, create it as an `index.tsx` and `ComponentName.module.scss` pair, and move the element's styling with it.
- Stylesheet organization priority:
  1. Order rules relative to HTML location (top-down, left-to-right).
  2. Group media queries at the bottom of the stylesheet.
  3. If an item is moved in HTML, ask whether related styles should also be moved or adjusted for clean code.
- Theme-variant loading priority:
  1. Any light/dark-coded assets or styles above the fold must load in sync with other theme variants.
  2. Avoid defaulting above-the-fold UI to dark (or light) first and swapping after hydration.
  3. Prefer implementations that can render both variants and reveal by theme state/tokens at first paint.
