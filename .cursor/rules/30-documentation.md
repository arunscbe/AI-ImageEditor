# Documentation Standards

**Scope**: All documentation files (`*.md`)

## Source of Truth

- **Local markdown docs are authoritative**: Always read before implementing related features
- Existing documentation files (all in `frontend/docs/`):
  - `docs/README.md` - Frontend documentation index
  - `docs/BRAND_STYLE_GUIDE.md` - Colors, buttons, typography
  - `docs/ROUTING.md` - Navigation system
  - `docs/FEATURE_FLAGS.md` - Feature flag system
  - `features/README.md` - Feature flag implementation details

## When to Read Documentation

**Before** making changes to:
- Routing or navigation (`docs/ROUTING.md`)
- UI components or styling (`docs/BRAND_STYLE_GUIDE.md`)
- Feature flags (`docs/FEATURE_FLAGS.md`)
- Brand colors or typography (`docs/BRAND_STYLE_GUIDE.md`)

## Handling Conflicts

If documentation conflicts with actual code:
1. **Call out the conflict explicitly**
2. **Follow the code** (code is usually more up-to-date)
3. Ask whether documentation should be updated
4. Never silently ignore conflicts

## Documentation Maintenance

- **Update docs when making architectural changes**
- Keep quick reference guides in sync with detailed docs
- Add timestamps to major documentation updates
- Use clear, concise language

## Don't Create Unless Asked

- **NEVER proactively create** `.md` files or documentation
- **NEVER create** README, guides, or summary files unless explicitly requested
- Only update existing docs when making relevant changes
- User will request documentation when needed

## When User Requests Documentation

If user asks for documentation at the end of a feature:

1. **Keep it beginner-friendly** - Write for first-time users
2. **Be concise** - Show essentials only, no verbose explanations
3. **Focus on "how to use"** - Not implementation details
4. **Use examples** - Show quick code snippets
5. **No summaries** - No "what we built" sections

**Good Example:**
```markdown
# Feature Name

Quick description.

## Usage
[code example]

## Common Patterns
[2-3 examples]
```

**Bad Example:**
```markdown
# Feature Implementation Summary

## What Was Built
[long list of files and changes]

## Architecture Details
[implementation specifics]
```

## Documentation Style

When updating or creating documentation (only if user explicitly requests):

- **Beginner-friendly**: Write for someone seeing the project for the first time
- **Concise**: Keep docs short (aim for under 100 lines)
- **Practical**: Focus on "how to use", not "what we built"
- **Examples over explanation**: Show code snippets instead of lengthy descriptions
- **No implementation summaries**: Don't document what files were changed or created
- Use clear headings and sections
- Keep examples up-to-date with actual code

