# 3D Plus Brand Style Guide

## Quick Reference Card

### Brand Colors (Tailwind Classes)

```jsx
// Primary Red
bg-brand-primary      text-brand-primary      border-brand-primary
hover:bg-brand-accent hover:text-brand-accent hover:border-brand-accent

// Dark/Black
bg-brand-dark         text-brand-dark         border-brand-dark
bg-brand-darker       text-brand-darker       border-brand-darker

// Text Colors
text-text-primary     (#545454 - Headings)
text-text-secondary   (#5f6973 - Body)
text-text-tertiary    (#737373 - Labels)
text-text-light       (#ffffff - Light text)
```

### Typography Classes

```jsx
// Headings (Montserrat)
font-heading font-bold          // For h1-h6
font-heading font-semibold      // For subheadings

// Body (Rubik)
font-sans                       // Default body text
font-sans font-medium           // Emphasized text
```

---

## Component Examples

### Buttons

```jsx
import Button from './ui/Button';

// Primary action (Red)
<Button variant="primary">Save Changes</Button>

// Secondary action (Gray)
<Button variant="secondary">Cancel</Button>

// Dark action (Black)
<Button variant="dark">Download</Button>

// White action
<Button variant="white">Preview</Button>

// Ghost (transparent)
<Button variant="ghost">Learn More</Button>

// Outline
<Button variant="outline">Details</Button>

// With icons
<Button variant="primary" icon={Download}>
  Download
</Button>

// Icon only
<Button variant="primary" size="icon">
  <Settings size={18} />
</Button>
```

### Logo Usage

```jsx
import Logo from './Logo';

// Full logo (default)
<Logo />

// Icon only
<Logo variant="icon" />

// Custom size
<Logo className="scale-125" />

// Different alignment
<Logo className="justify-start" />
```

### Cards & Panels

```jsx
// Brand-styled card
<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
  <h3 className="font-heading font-semibold text-text-primary mb-2">
    Card Title
  </h3>
  <p className="font-sans text-text-secondary">
    Card content goes here
  </p>
</div>

// Selected state
<div className="bg-red-50 border-2 border-brand-primary rounded-lg p-4">
  Selected item
</div>
```

### Form Inputs

```jsx
// Branded input
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-200 rounded-lg 
             focus:outline-none focus:ring-2 focus:ring-brand-primary 
             focus:border-transparent font-sans text-text-secondary"
  placeholder="Enter text..."
/>

// Branded textarea
<textarea
  className="w-full px-4 py-2 border border-gray-200 rounded-lg 
             focus:outline-none focus:ring-2 focus:ring-brand-primary 
             focus:border-transparent font-sans text-text-secondary 
             resize-none"
  rows={4}
  placeholder="Description..."
/>
```

### Toggle Switches

```jsx
// Brand toggle (on state)
<button
  className={`relative inline-flex h-6 w-11 items-center rounded-full 
              transition-colors ${isOn ? 'bg-brand-primary' : 'bg-gray-300'}`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white 
                transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`}
  />
</button>
```

### Badges

```jsx
// Primary badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-brand-primary text-white">
  New
</span>

// Secondary badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                 text-xs font-medium bg-gray-100 text-text-secondary">
  Draft
</span>
```

### Alerts & Notifications

```jsx
// Success alert
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <p className="text-green-800 font-sans text-sm">
    ✓ Changes saved successfully
  </p>
</div>

// Error alert (brand red)
<div className="bg-red-50 border border-brand-primary rounded-lg p-4">
  <p className="text-brand-dark font-sans text-sm">
    ⚠ Please fix the errors below
  </p>
</div>

// Info alert
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <p className="text-blue-800 font-sans text-sm">
    ℹ Tip: Use keyboard shortcuts for faster editing
  </p>
</div>
```

---

## Layout Patterns

### Header/TopNav

```jsx
<header className="h-16 bg-white flex items-center justify-between 
                   px-6 border-b border-gray-200 shadow-sm">
  <Logo />
  <nav className="flex items-center gap-4">
    <Button variant="ghost">Features</Button>
    <Button variant="ghost">Pricing</Button>
    <Button variant="primary">Sign Up</Button>
  </nav>
</header>
```

### Sidebar Panel

```jsx
<div className="absolute top-3 left-6 z-10 w-[280px] bg-white 
                rounded-xl shadow-lg border border-gray-100 p-4">
  <h3 className="text-xs font-bold text-gray-400 mb-3 
                 tracking-widest uppercase font-sans">
    Panel Title
  </h3>
  <div className="space-y-2">
    {/* Panel content */}
  </div>
</div>
```

### Modal/Dialog

```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                flex items-center justify-center p-6">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
    <div className="flex items-center justify-between p-6 
                    border-b border-gray-200">
      <h2 className="text-2xl font-bold font-heading text-text-primary">
        Modal Title
      </h2>
      <button className="text-gray-500 hover:text-gray-700">
        <X size={24} />
      </button>
    </div>
    <div className="p-6">
      {/* Modal content */}
    </div>
    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 
                    bg-gray-50">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  </div>
</div>
```

---

## Icon Usage

```jsx
import { Icon } from 'lucide-react';

// Standard size (18px)
<Icon size={18} className="text-gray-500" />

// Small size (14-16px)
<Icon size={14} className="text-gray-400" />

// Large size (24px)
<Icon size={24} className="text-text-primary" />

// Brand colored
<Icon size={18} className="text-brand-primary" />

// With hover
<Icon size={18} className="text-gray-500 hover:text-brand-primary 
                           transition-colors cursor-pointer" />
```

---

## Animation & Transitions

### Standard Transitions

```jsx
// Button hover
className="transition-all duration-200 hover:shadow-lg"

// Color change
className="transition-colors duration-150"

// Scale effect
className="transition-transform duration-200 hover:scale-105"

// Fade in
className="animate-in fade-in duration-300"
```

### Loading States

```jsx
// Spinner (brand primary)
<div className="w-5 h-5 border-2 border-gray-300 border-t-brand-primary 
                rounded-full animate-spin" />

// Pulse
<div className="animate-pulse bg-gray-200 rounded-lg h-20" />
```

---

## Spacing System

Follow Tailwind's spacing scale:

```jsx
// Padding
p-2   // 8px   - Tight
p-4   // 16px  - Standard
p-6   // 24px  - Comfortable
p-8   // 32px  - Spacious

// Gaps
gap-2  // 8px   - Tight
gap-3  // 12px  - Standard
gap-4  // 16px  - Comfortable
gap-6  // 24px  - Spacious

// Margins
mb-2   // 8px   - Tight
mb-4   // 16px  - Standard
mb-6   // 24px  - Comfortable
mb-8   // 32px  - Spacious
```

---

## Border Radius

```jsx
rounded-lg      // 8px  - Standard
rounded-xl      // 12px - Cards, panels
rounded-2xl     // 16px - Modals, large cards
rounded-full    // Fully rounded - Avatars, badges
```

---

## Shadow System

```jsx
shadow-sm       // Subtle - Buttons, inputs
shadow-md       // Standard - Hover states
shadow-lg       // Prominent - Cards, dropdowns
shadow-xl       // Heavy - Modals
shadow-2xl      // Maximum - Important modals
```

---

## Responsive Design

```jsx
// Mobile first approach
<div className="
  w-full          // Mobile: full width
  md:w-1/2        // Tablet: half width
  lg:w-1/3        // Desktop: third width
  p-4             // Mobile: 16px padding
  md:p-6          // Tablet: 24px padding
  lg:p-8          // Desktop: 32px padding
">
  Content
</div>
```

---

## Accessibility

### Focus States

```jsx
// Always include focus styles
className="focus:outline-none focus:ring-2 focus:ring-brand-primary 
           focus:ring-offset-2"

// For dark backgrounds
className="focus:outline-none focus:ring-2 focus:ring-white 
           focus:ring-offset-2 focus:ring-offset-brand-dark"
```

### ARIA Labels

```jsx
// Button without visible text
<button aria-label="Close modal">
  <X size={18} />
</button>

// Icon with tooltip
<button title="Settings">
  <Settings size={18} />
</button>
```

---

## Common Patterns

### List Items

```jsx
<div className="space-y-2">
  {items.map((item) => (
    <div
      key={item.id}
      className="flex items-center gap-3 p-3 rounded-lg 
                 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <Icon size={18} className="text-gray-500" />
      <span className="font-sans text-text-secondary">{item.name}</span>
    </div>
  ))}
</div>
```

### Selected State

```jsx
<div
  className={`p-4 rounded-lg border-2 transition-all ${
    isSelected
      ? 'bg-red-50 border-brand-primary shadow-md'
      : 'bg-white border-gray-200 hover:border-gray-300'
  }`}
>
  Content
</div>
```

### Hover Effects

```jsx
// Subtle lift
className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"

// Scale
className="hover:scale-105 transition-transform duration-200"

// Color shift
className="hover:bg-brand-primary hover:text-white transition-colors"
```

---

## Don't Do These ❌

```jsx
// ❌ Wrong - Mixed fonts
<h1 className="font-serif">Title</h1>

// ✅ Right - Brand font
<h1 className="font-heading font-bold">Title</h1>

// ❌ Wrong - Non-brand colors
<button className="bg-blue-500">Click</button>

// ✅ Right - Brand colors
<button className="bg-brand-primary">Click</button>

// ❌ Wrong - Inconsistent spacing
<div className="p-3 mb-5 gap-7">

// ✅ Right - Standard spacing scale
<div className="p-4 mb-6 gap-4">

// ❌ Wrong - No transitions
<button className="bg-brand-primary">Hover me</button>

// ✅ Right - Smooth transitions
<button className="bg-brand-primary hover:bg-brand-accent 
                   transition-colors">Hover me</button>
```

---

## Performance Tips

1. **Use Tailwind classes** instead of inline styles
2. **Avoid unnecessary re-renders** with proper React patterns
3. **Lazy load images** with appropriate loading states
4. **Use CSS transitions** instead of JS animations when possible
5. **Optimize font loading** (already configured in index.html)

---

## Testing Checklist

- [ ] All colors from brand palette
- [ ] Correct fonts (Montserrat + Rubik)
- [ ] Proper spacing (4, 6, 8 scale)
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Loading states shown
- [ ] Error states handled

---

**Always refer to this guide when building new components!** 🎨


