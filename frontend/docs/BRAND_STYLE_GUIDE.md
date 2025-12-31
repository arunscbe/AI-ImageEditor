# 3D Plus Brand Guide

## Colors

**Primary**: Red `#e20b0b` → `bg-brand-primary`  
**Dark**: Black `#121212` → `bg-brand-dark`  
**Text**: Gray `#545454` → `text-text-primary`

## Typography

**Headings**: Montserrat → `font-heading`  
**Body**: Rubik → `font-sans`

## Buttons

```jsx
<Button variant="primary">Save</Button>     // Red
<Button variant="secondary">Cancel</Button>  // Gray
<Button variant="dark">Download</Button>     // Black
<Button variant="ghost">More</Button>        // Transparent
<Button variant="outline">Details</Button>   // Bordered
<Button variant="white">Preview</Button>     // White
```

Sizes: `sm`, `md` (default), `lg`, `icon`

## Common Patterns

### Card
```jsx
<div className="bg-white rounded-xl shadow-lg p-6">
  <h3 className="font-heading font-semibold">Title</h3>
  <p className="font-sans text-text-secondary">Content</p>
</div>
```

### Panel
```jsx
<div className="bg-white border-l border-gray-200 p-4">
  {/* Panel content */}
</div>
```

### Input
```jsx
<input 
  className="border border-gray-200 rounded-lg px-3 py-2 
             focus:ring-2 focus:ring-brand-primary"
/>
```

## Spacing

Use Tailwind scale: `p-2`, `p-4`, `p-6`, `gap-4`

## Transitions

Always add to interactive elements:
```jsx
className="transition-colors duration-150"
```

## Icons

Use `lucide-react` at 18px (standard) or 14px (small)
