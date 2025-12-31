# Frontend Rules (Vite + React + Tailwind)

**Scope**: `frontend/**/*.{js,jsx,ts,tsx}`

## Build System & Framework

- **Vite only**: Do NOT introduce Next.js, CRA, or other build tools
- React 19+ with Hooks (no class components)
- React Router DOM for routing
- ESLint + Prettier for code quality

## Styling

- **Tailwind CSS only**: Use utility classes exclusively
- **3D Plus Brand**: Follow `docs/BRAND_STYLE_GUIDE.md` religiously
- **No custom CSS frameworks**: Don't add Bootstrap, Material-UI, etc. unless explicitly requested
- Brand colors defined in `tailwind.config.js`:
  - Primary: `bg-brand-primary` (#e20b0b)
  - Dark: `bg-brand-dark` (#121212)
  - Text: `text-text-primary`, `text-text-secondary`
- Typography: `font-heading` (Montserrat), `font-sans` (Rubik)

## Component Structure

- **Small, focused components**: One responsibility per component
- Components in `frontend/src/components/`
- Pages in `frontend/src/pages/`
- UI primitives in `frontend/src/components/ui/`
- Keep components under 200 lines (split if larger)

## State Management

- **Zustand** for global state (already in use)
- React hooks for local state
- **Do NOT add** Redux, MobX, or other state libraries without discussion
- Store in `frontend/src/store/`

## Code Style & Comments

- **NO comments** except those containing "TODO" or "NOT IMPLEMENTED"
- ESLint enforced rules (see `eslint.config.js`)
- Prettier formatting: single quotes, 2 spaces, 80 char width
- Use Prettier and ESLint auto-fix before committing

## Important Documentation (READ BEFORE CHANGES)

Before implementing features, **always** read these docs:

1. **`docs/BRAND_STYLE_GUIDE.md`** - Colors, buttons, typography
2. **`docs/ROUTING.md`** - Navigation system
3. **`docs/FEATURE_FLAGS.md`** - Feature flag system
4. **`features/README.md`** - Feature flag implementation

**If docs conflict with code**: Raise the conflict explicitly and follow code unless told otherwise

## Routing System

- React Router with UUID-based projects
- Routes:
  - `/projects` - Project list page
  - `/project/:uuid` - Individual project canvas
  - `/` - Redirects to `/projects`
- Use `useNavigate()` for navigation
- Use `useParams()` for route params

## Feature Flags

- Use `useFeatureFlagStore()` hook
- Check features with `isEnabled(FEATURES.FEATURE_NAME)`
- Add new flags to `featureFlags.js`
- Never hard-code feature availability

## Component Patterns

### Buttons
```jsx
<Button variant="primary|secondary|dark|ghost|outline">
```

### Icons
- Use `lucide-react` only (size 14-24px)
- Common sizes: 18px standard, 14px small, 24px large

### Spacing
- Stick to Tailwind scale: `p-2`, `p-4`, `p-6`, `p-8`
- Gaps: `gap-2`, `gap-3`, `gap-4`, `gap-6`

### Transitions
- Always add transitions to interactive elements
- `transition-colors duration-150`
- `transition-all duration-200`

## File Naming

- Components: PascalCase (`Button.jsx`, `TopNav.jsx`)
- Utilities: camelCase (`featureFlags.js`, `useStore.js`)
- Folders: kebab-case when needed

## Accessibility

- Include focus states: `focus:ring-2 focus:ring-brand-primary`
- Use semantic HTML
- Add `aria-label` for icon-only buttons
- Keyboard navigation support

## Performance

- Lazy load images
- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Keep bundle size minimal

## Dependencies

- Current stack: React, React Router, Zustand, Fabric.js, Lucide React, Tailwind
- **Always update** `frontend/package.json` when adding dependencies
- Justify new dependencies before adding

## Testing

- Component functionality before committing
- Mobile responsive (test at 320px, 768px, 1024px)
- Cross-browser basics (Chrome, Firefox, Safari)
- Keyboard navigation
- Screen reader friendliness