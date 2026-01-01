# Visual User Flow Comparison

## Before (v1.0) - Canvas-First ❌

```
┌─────────────────────────────────────────┐
│         Projects Page                   │
│                                         │
│  [+] Create New Project                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Empty Canvas                    │
│                                         │
│    [Gray infinite void]                 │
│                                         │
│    🤔 "What do I do?"                   │
│    😰 Decision paralysis                │
│    ⏱️  ~5 minutes to first action       │
│                                         │
│  Sidebar: [15 tools]                    │
│  Bottom: [Prompt input]                 │
└─────────────────────────────────────────┘
                  ↓
         User explores manually
                  ↓
         Eventually creates something
```

**Problems**:
- Blank canvas anxiety
- No guidance
- All tools shown at once
- Assumes design expertise

---

## After (v2.0) - Intent-First ✅

```
┌─────────────────────────────────────────┐
│         Projects Page                   │
│                                         │
│  [+] Create New Project                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    🎯 What do you want to create?       │
│                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ 🎨 Logo│  │🔲 Icons│  │📱 Mockup│   │
│  │ Create │  │Generate│  │ Product │   │
│  │  a logo│  │icon set│  │ mockup  │   │
│  └────────┘  └────────┘  └────────┘   │
│                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │📱Social│  │⚙️Vector│  │🎯 Blank │   │
│  │ Media  │  │  ize   │  │ Canvas  │   │
│  │ assets │  │ image  │  │         │   │
│  └────────┘  └────────┘  └────────┘   │
│                                         │
│  ✨ Clear outcome-focused options       │
│  ⏱️  < 10 seconds to decision           │
└─────────────────────────────────────────┘
                  ↓
        User selects "Logo Creation"
                  ↓
┌─────────────────────────────────────────┐
│         Canvas Editor                   │
│                                         │
│  💡 Let's create your logo              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Suggested Prompts:                │ │
│  │ • Minimalist tech startup logo    │ │
│  │ • Modern luxury brand logo        │ │
│  │ • Playful children's brand logo   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Quick Actions:                         │
│  [🌟 AI] [📤 Upload] [✍️ Text] [⬜ Shape]│
│                                         │
│  💡 Tip: Use AI prompt box below        │
│                                         │
│  ⏱️  < 2 minutes to first result        │
└─────────────────────────────────────────┘
                  ↓
         User creates with guidance
```

**Solutions**:
- ✅ Clear starting point
- ✅ Contextual guidance
- ✅ Filtered tools
- ✅ Suggested prompts
- ✅ Non-designer friendly

---

## Key Interactions

### Intent Selection (New Screen)

```
╔═══════════════════════════════════════════╗
║  What do you want to create today?        ║
║  Choose a template or start from scratch  ║
╚═══════════════════════════════════════════╝

┌──────────────────┐  ┌──────────────────┐
│  [🎨 Icon]       │  │  [🔲 Icon]       │
│                  │  │                  │
│  Create a Logo   │  │  Generate Icons  │
│  Professional    │  │  5-20 consistent │
│  brand identity  │  │  icons for UI    │
│                  │  │                  │
│  #Branding       │  │  #UI Design      │
│  #Identity       │  │  #Icons          │
└──────────────────┘  └──────────────────┘

     [Hover Effect: Border changes to brand color]
     [Click: Navigate to canvas with context]
```

### Empty State (Replaces Blank Canvas)

```
┌─────────────────────────────────────────┐
│                                         │
│      Let's create your logo             │
│      Choose a tool or type a prompt     │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│
│  │  🌟  │  │  📤  │  │  ✍️   │  │  ⬜  ││
│  │Generate│ │Upload│  │ Text │  │Shape ││
│  │with AI │ │Image │  │      │  │     ││
│  └──────┘  └──────┘  └──────┘  └──────┘│
│                                         │
│  💡 Tip: Use AI prompt box below        │
│                                         │
└─────────────────────────────────────────┘

[Shows when: canvas.objects.length === 0]
[Hides when: First object added]
```

### Suggested Prompts (AI Chat Enhancement)

```
┌─────────────────────────────────────────┐
│  SUGGESTED PROMPTS                      │
│                                         │
│  [A minimalist tech startup logo...]    │
│  [Modern luxury brand with gold...]     │
│  [Playful children's brand logo...]     │
│                                         │
│  ────────────────────────────────────   │
│                                         │
│  [Text input: Describe what you want]   │
│  [Send button]                          │
└─────────────────────────────────────────┘

[Shows when: prompt is empty & intent has suggestions]
[Hides when: User starts typing]
[One-click: Populates prompt field]
```

---

## State Flow Diagram

```
┌──────────────┐
│ ProjectsPage │
└──────┬───────┘
       │
       │ Click "Create New Project"
       │
       ↓
┌──────────────────┐
│ IntentSelector   │  ← NEW in v2.0
│                  │
│ User selects:    │
│ "Logo Creation"  │
└──────┬───────────┘
       │
       │ navigate('/project/:id', { state: { intent } })
       │
       ↓
┌──────────────────┐
│ ProjectPage      │
│                  │
│ useEffect:       │
│ - setIntent()    │
│ - setPrompts()   │
└──────┬───────────┘
       │
       ├─→ EmptyStateGuidance (if canvas empty)
       ├─→ AIChatPanel (with suggested prompts)
       └─→ Canvas (ready for creation)
```

---

## Component Hierarchy

```
App
├── ProjectsPage
│   └── [Create Button] → navigates to /intent
│
├── IntentSelector (NEW)
│   ├── Header
│   ├── Title & Description
│   └── Intent Cards (6)
│       ├── Logo Creation
│       ├── Icon Set
│       ├── Product Mockup
│       ├── Social Media
│       ├── Vectorize
│       └── Blank Canvas
│
└── ProjectPage
    ├── TopNav
    ├── Sidebar (contextual)
    ├── EmptyStateGuidance (NEW, conditional)
    │   ├── Intent-aware title
    │   └── Quick Actions (4)
    ├── AIChatPanel (enhanced)
    │   ├── Suggested Prompts (NEW)
    │   ├── Selected Image Indicator
    │   └── Prompt Input
    ├── LayersPanel
    └── CanvasArea
```

---

## User Journey Comparison

### Scenario: Create a Logo

**v1.0 (Canvas-First)**:
1. ⏱️ 0:00 - Land on empty canvas
2. 😕 0:05 - "What do I do?"
3. 🔍 0:30 - Explore sidebar tools
4. 📝 2:00 - Find AI generation
5. 💭 3:00 - Think of prompt
6. ✍️ 4:00 - Type prompt
7. ✨ 5:00 - Generate first image
8. **Total: 5+ minutes**

**v2.0 (Intent-First)**:
1. ⏱️ 0:00 - See intent selector
2. 🎯 0:05 - Click "Create a Logo"
3. 💡 0:10 - See suggested prompts
4. 👆 0:15 - Click "Minimalist tech startup logo"
5. ✨ 0:20 - Generate image
6. **Total: < 30 seconds**

**Improvement**: **10x faster** ⚡

---

## Mental Model Shift

### Before: Tool-Centric 🛠️

User thinks:
- "How do I use this tool?"
- "What does this button do?"
- "Where is the AI feature?"
- **Focus: Learning the interface**

### After: Outcome-Centric 🎯

User thinks:
- "I need a logo"
- "I need icons"
- "I need a mockup"
- **Focus: What I want to create**

---

## Design System Integration

### Intent Cards Style

```css
.intent-card {
  background: white;
  border: 2px solid gray-200;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.intent-card:hover {
  border-color: brand-primary;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.intent-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, [color-start], [color-end]);
  transition: transform 0.3s ease;
}

.intent-card:hover .intent-icon {
  transform: scale(1.1);
}
```

### Color Coding

- 🎨 Logo: Purple gradient
- 🔲 Icons: Blue gradient
- 📱 Mockup: Green gradient
- 📱 Social: Pink gradient
- ⚙️ Vectorize: Orange gradient
- 🎯 Blank: Gray gradient

---

## Accessibility

### Keyboard Navigation

```
Intent Selector:
- Tab: Navigate between intent cards
- Enter/Space: Select intent
- Escape: Cancel and return to projects

Empty State:
- Tab: Navigate quick action buttons
- Enter: Trigger action
- Focus visible on all interactive elements
```

### Screen Reader

```html
<button aria-label="Create a logo - Professional brand identity">
  <div role="img" aria-hidden="true">🎨</div>
  <h3>Create a Logo</h3>
  <p>Professional brand identity</p>
</button>
```

---

## Performance

### Intent Selector
- **Load Time**: < 100ms (static content)
- **Interaction**: < 16ms (smooth 60fps animations)
- **Navigation**: Instant (React Router)

### Empty State
- **Conditional Render**: O(1) check
- **No Performance Impact**: Only shows when needed

### Suggested Prompts
- **Data Source**: Pre-loaded in intent object
- **No API Calls**: Instant display

---

## Summary

The v2.0 UX transformation shifts the entire product experience:

**From**: "Here's a canvas. Figure it out."  
**To**: "What do you want to create? Let me help."

This is not just visual polish - it's a fundamental rethinking of how users interact with AI design tools.

**Result**: A product that feels like a **service**, not just a **tool**.

