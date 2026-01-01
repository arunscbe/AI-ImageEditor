# Cursor Rules

Project-specific rules for the AI Image Editor.

## 📁 Rule Files

| File | Applies To | Purpose |
|------|-----------|---------|
| `00-global.md` | All files | Security, boundaries, no .md files |
| `10-backend-python.md` | `backend/**/*.py` | Python 3.12, FastAPI, type hints |
| `20-frontend-vite-tailwind.md` | `frontend/**/*.{js,jsx}` | React 19, Tailwind, 3D Plus branding |
| `30-documentation.md` | `*.md` files | Docs standards, beginner-friendly |

## 🚀 Quick Examples

### Backend
```python
# ✅ Good
def process_image(file: UploadFile) -> dict:
    return {"status": "success"}

# ❌ Bad - no type hints
def process_image(file):
    return {"status": "success"}
```

### Frontend
```jsx
// ✅ Good
<Button variant="primary" className="transition-colors">
  Save
</Button>

// ❌ Bad - inline styles
<Button style={{backgroundColor: 'blue'}}>Save</Button>
```

### Brand Colors
```jsx
bg-brand-primary      // #e20b0b (red)
bg-brand-dark         // #121212 (black)
text-text-primary     // #545454 (gray)
```

## 📚 Read Before Changing

| Changing... | Read... |
|------------|---------|
| UI/Styling | `docs/BRAND_STYLE_GUIDE.md` |
| Routing | `docs/ROUTING.md` |
| Feature Flags | `docs/FEATURE_FLAGS.md` |

## 🔒 Key Rules

- ❌ Never commit API keys or secrets
- ❌ Never create `.md` files unless user asks
- ✅ Use type hints (Python)
- ✅ Use Tailwind only (no inline styles)
- ✅ Read docs before implementing features
- ✅ Minimal, targeted changes

## 📖 Full Details

See individual rule files (`00-global.md`, `10-backend-python.md`, etc.) for complete guidelines.
