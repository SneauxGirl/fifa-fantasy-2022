# FIFA Fantasy 2022 — Design Standards

## Overview
Design principles and technical standards to maintain consistency, accessibility, and performance across the FIFA Fantasy 2022 application.

---

## Layout & Spacing

- **Edge-to-Edge Content**: Page content extends to all viewport edges unless a specific component requires internal spacing
- **Consistent Spacing System**: Use CSS custom properties (tokens) for all spacing
  - Base unit: 8px
  - Standard gap values: 8px, 12px, 16px, 20px, 24px
  - Avoid arbitrary padding/margin values
- **No Wrapper Padding**: Full-width containers should have zero padding; internal content handles its own spacing

---

## Component Standards

- **File Organization**:
  - One component per folder
  - Structure: `ComponentName/index.tsx` + `ComponentName.module.scss`
  - Naming: PascalCase for components, kebab-case for files
- **Reusable > One-Off**: Build reusable components; avoid duplicating similar UI
- **SCSS Modules**: Scope styles to components using CSS Modules
  - Avoid global styles in components (use tokens.css for globals)
  - Leverage `composes:` for style composition when appropriate

---

## Accessibility

- **Keyboard Navigation**:
  - All interactive elements must be accessible via Tab and keyboard shortcuts
  - Proper focus order (logical, top-to-bottom)
  - Test with keyboard only (no mouse) to verify usability
- **Focus States**:
  - Visible focus indicators on all focusable elements (buttons, links, inputs)
  - Use sufficient contrast (minimum 3:1 ratio) for focus outlines
  - Clear visual feedback when elements gain focus
- **Semantic HTML**:
  - Use appropriate tags: `<button>` for buttons, `<a>` for links, `<nav>` for navigation
  - Avoid `<div>` masquerading as interactive elements
- **ARIA Labels**:
  - Add ARIA labels to icons and non-obvious interactive elements
  - Example: `aria-label="Close menu"` on close buttons
  - Screen readers depend on accurate labels

---

## Responsive Design

- **Mobile-First Approach**:
  - Start with mobile styles (smallest screen)
  - Use `@media (min-width: ...)` to add/enhance styles for larger screens
  - Avoid `max-width` media queries when possible
- **Breakpoints** (from tokens):
  - 480px: Small tablets, large phones
  - 768px: Tablets
  - 1024px: Small desktops
  - 1280px: Large desktops
- **Full-Width on All Screens**: Layouts should adapt gracefully to any viewport width

---

## Performance

- **React Compiler**: Intentionally disabled (performance considerations noted in README)
- **Minimal Dependencies**: Keep external libraries to a minimum; prefer vanilla solutions
- **Lazy Loading**: Load components and assets on-demand, not upfront
- **CSS Optimization**: Minimize selectors, avoid deeply nested rules, use CSS custom properties

---

## Git & Version Control

- **Commit Messages**: Clear, descriptive, action-oriented
  - Example: `"Add keyboard navigation to roster filter"`
  - Example: `"Fix color contrast in status badges"`
- **File Organization**: Maintain folder structure consistently across pages/components
- **Dangerous Operations**: Never use `git push --force`, `git reset --hard`, etc. without explicit approval

---

## Summary Checklist

Before committing changes, verify:
- [ ] All AI created content extends edge-to-edge (no unnecessary padding)
- [ ] All AI generated content uses Global colors
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states visible on all interactive elements
- [ ] ARIA labels present for icons/complex components
- [ ] No gradients unless explicitly required
- [ ] Font weights appropriate and intentional
- [ ] Spacing values use standard units (8px, 16px, etc.)
- [ ] Component is reusable or clearly specific to one context
