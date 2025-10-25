# ProjectPulse Theme System
## Dark Neumorphic Coral Theme - Complete Documentation

Welcome to the ProjectPulse theme system! This folder contains everything needed to create consistent, beautiful frontend pages that match the mockup designs exactly.

---

## 📁 Files in This Folder

### 🎨 **theme.css**
The main stylesheet containing all theme styles, variables, and components.

**What's inside:**
- CSS Variables (colors, spacing, shadows)
- Neumorphic effects (raised, pressed, flat)
- Glass morphism styles
- Button styles (primary, secondary, ghost)
- Card components
- Form elements (inputs, checkboxes, toggles)
- Badge styles
- Animations (heartbeat, pulse, float)
- Utility classes
- Scrollbar customization

**How to use:**
```html
<link rel="stylesheet" href="../theme/theme.css">
```

---

### ⚙️ **tailwind.config.js**
Tailwind CSS configuration with custom color extensions and animations.

**What's inside:**
- Extended color palette
- Custom shadows (neumorphic, coral, glass)
- Animation keyframes
- Backdrop blur settings
- Custom timing functions

**How to use:**
Copy and paste this config inline in your HTML:
```html
<script>
    tailwind.config = { /* config here */ }
</script>
```

---

### 📖 **THEME_GUIDE.md** ⭐ **START HERE**
Comprehensive guide for Claude Code with everything needed to build pages.

**What's inside:**
- Complete color palette with hex codes
- HTML template structure
- Core component documentation
- Layout patterns
- Common UI sections
- Design principles
- Typography guide
- Animation guide
- Pre-flight checklist
- Common mistakes to avoid

**Best for:** Understanding the theme system and design patterns

---

### 🧩 **COMPONENTS_REFERENCE.md** ⭐ **COPY FROM HERE**
Ready-to-use component code snippets for rapid development.

**What's inside:**
- Full page templates
- Navigation components
- Button variants
- Card layouts
- Badge styles
- Form elements
- Headers
- Filter sidebars
- Activity timelines
- Modals
- Stats grids
- Icon containers
- Empty states
- Loading spinners
- Pagination

**Best for:** Copy-pasting components directly into your pages

---

### ⚡ **QUICK_REFERENCE.md** ⭐ **QUICK LOOKUP**
One-page cheat sheet with essential info.

**What's inside:**
- Color codes table
- Border radius guide
- Component class lookup
- Spacing standards
- Common patterns
- Pre-flight checklist
- Most used components
- Typography scale
- Essential CDN links

**Best for:** Quick lookups while coding

---

### 📄 **README.md** (This File)
Overview of the theme system and how to use these files.

---

## 🚀 Quick Start Guide

### For Claude Code Agent:

1. **Read this first:** `THEME_GUIDE.md` - Understand the system
2. **Reference often:** `QUICK_REFERENCE.md` - Quick lookups
3. **Copy from here:** `COMPONENTS_REFERENCE.md` - Ready components
4. **Check mockups:** `../mockups/Default theme/` - See real implementations

### For Human Developers:

1. Start with `QUICK_REFERENCE.md` for overview
2. Reference `THEME_GUIDE.md` for detailed patterns
3. Copy components from `COMPONENTS_REFERENCE.md`
4. Link `theme.css` in your HTML
5. Check mockup files for real-world examples

---

## 📂 Folder Structure

```
AI_HUB/
├── theme/                          # ← You are here
│   ├── theme.css                   # Main stylesheet
│   ├── tailwind.config.js          # Tailwind configuration
│   ├── THEME_GUIDE.md              # Complete guide
│   ├── COMPONENTS_REFERENCE.md     # Component snippets
│   ├── QUICK_REFERENCE.md          # Cheat sheet
│   └── README.md                   # This file
│
└── mockups/
    └── Default theme/              # Reference implementations
        ├── 01-dashboard-dark-neumorphic-coral.html
        ├── 02-issues-dark-neumorphic-coral.html
        ├── 03-knowledge-dark-neumorphic-coral.html
        ├── 04-wiki-dark-neumorphic-coral.html
        ├── 05-security-dark-neumorphic-coral.html
        ├── 06-agent-personas-dark-neumorphic-coral.html
        └── 07-command-palette-dark-neumorphic-coral.html
```

---

## 🎯 Theme Features

### Visual Design
✅ Dark neumorphic effects (3D depth)
✅ Coral primary color (#FF8B6A)
✅ Floating hexagon backgrounds
✅ Glass morphism headers
✅ Smooth animations
✅ Custom scrollbars
✅ Consistent spacing & typography

### Components
✅ Buttons (primary, secondary, ghost)
✅ Cards (raised, pressed, flat)
✅ Badges (status, count, priority)
✅ Forms (inputs, selects, checkboxes, toggles)
✅ Icons (coral, slate, colored)
✅ Navigation (sidebar, top bar)
✅ Modals & overlays
✅ Stats grids
✅ Filter panels
✅ Activity timelines

### Interactions
✅ Hover effects
✅ Active states
✅ Smooth transitions
✅ Loading states
✅ Empty states
✅ Keyboard navigation

---

## 🎨 Core Design System

### Colors
- **Primary:** Coral (#FF8B6A) - Actions, active states
- **Background:** Dark (#1A1A1A) - Base background
- **Surface:** Dark Card (#2A2A2A) - Card backgrounds
- **Text:** Slate (#8B8B8B) - Secondary text

### Spacing
- Cards: `1.5rem` padding
- Sections: `1.5rem` gaps
- Elements: `1rem` gaps

### Typography
- Font: Inter (body) + JetBrains Mono (code)
- Title: 1.875rem bold
- Body: 0.875rem regular
- Small: 0.75rem regular

### Border Radius
- Cards: `1.5rem` (rounded-3xl)
- Buttons: `1rem` (rounded-2xl)
- Icons: `0.75rem` (rounded-xl)

---

## 🔗 Required Dependencies

All pages need these CDN links:

```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Font Awesome Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<!-- ProjectPulse Theme -->
<link rel="stylesheet" href="../theme/theme.css">
```

---

## 📋 Basic Page Template

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - ProjectPulse</title>
    
    <!-- Dependencies -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../theme/theme.css">
    
    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        dark: '#1A1A1A',
                        coral: '#FF8B6A',
                        slate: '#8B8B8B',
                    }
                }
            }
        }
    </script>
</head>
<body class="antialiased">
    <!-- Background -->
    <div class="hexagon-bg">
        <div class="hexagon hex-1"></div>
        <div class="hexagon hex-2"></div>
        <div class="hexagon hex-3"></div>
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2 bubble-coral"></div>
    </div>

    <!-- Content -->
    <div class="content-wrapper">
        <!-- Your page content here -->
    </div>
</body>
</html>
```

---

## 🎓 Learning Path

### Beginner
1. Read `QUICK_REFERENCE.md`
2. Open a mockup file from `mockups/Default theme/`
3. Copy a simple component from `COMPONENTS_REFERENCE.md`
4. Build your first page

### Intermediate
1. Study `THEME_GUIDE.md`
2. Understand layout patterns
3. Mix and match components
4. Customize colors and spacing

### Advanced
1. Deep dive into `theme.css`
2. Create custom components
3. Extend the theme
4. Optimize for performance

---

## 🛠️ Development Workflow

1. **Start:** Choose a layout pattern
2. **Structure:** Add HTML skeleton
3. **Components:** Copy from COMPONENTS_REFERENCE.md
4. **Style:** Apply theme classes
5. **Refine:** Adjust spacing and colors
6. **Test:** Check hover states and interactions
7. **Compare:** Match against mockup files

---

## ✅ Quality Checklist

Every page should have:
- [ ] All CDN links included
- [ ] theme.css linked
- [ ] Floating background (hexagons + bubbles)
- [ ] Content wrapper div
- [ ] Consistent border radius (3xl, 2xl, xl)
- [ ] smooth-transition on interactive elements
- [ ] Proper color usage (coral = primary)
- [ ] Hover states on all clickable items
- [ ] Font Awesome icons
- [ ] Proper spacing (gap-6 for sections)

---

## 🐛 Troubleshooting

### Styles not applying?
- Check if theme.css is linked correctly
- Verify Tailwind CDN is loaded
- Ensure proper path to theme.css

### Colors look wrong?
- Verify Tailwind config is inline
- Check hex codes in QUICK_REFERENCE.md
- Use exact class names from theme.css

### Components look different?
- Compare with mockup files
- Check border radius values
- Verify spacing (p-6 for cards)

### Animations not working?
- Add smooth-transition class
- Check theme.css is loaded
- Verify class names are correct

---

## 📞 Support Resources

1. **Mockup Files:** `mockups/Default theme/` - See real examples
2. **Theme Guide:** `THEME_GUIDE.md` - Complete documentation
3. **Components:** `COMPONENTS_REFERENCE.md` - Copy-paste snippets
4. **Quick Lookup:** `QUICK_REFERENCE.md` - Cheat sheet

---

## 🎉 You're Ready!

Everything you need to build pixel-perfect ProjectPulse pages is in this folder. Start with the guides, reference the components, and check the mockups when in doubt.

**Remember:** The mockup files in `../mockups/Default theme/` show exactly how everything should look and work. When in doubt, copy from them!

---

## 📝 Version History

- **v1.0.0** - Initial theme system release
  - Complete color palette
  - All core components
  - Full documentation
  - 7 mockup reference pages

---

## 🙏 Credits

**Theme Design:** Dark Neumorphic Coral
**Brand:** ProjectPulse
**Created for:** AI_HUB Project
**Documentation:** Comprehensive guides for AI agents & developers

---

**Happy Building! 🚀**
