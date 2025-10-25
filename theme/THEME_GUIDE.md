# ProjectPulse Theme System Guide
## Dark Neumorphic Coral Theme

This guide provides everything Claude Code needs to create frontend pages that match the mockup designs exactly.

---

## 📁 File Structure

```
AI_HUB/
├── theme/
│   ├── theme.css              # Main theme stylesheet
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── THEME_GUIDE.md         # This file
│   └── COMPONENTS_REFERENCE.md # Component examples
├── mockups/
│   └── Default theme/
│       ├── 01-dashboard-dark-neumorphic-coral.html
│       ├── 02-issues-dark-neumorphic-coral.html
│       ├── 03-knowledge-dark-neumorphic-coral.html
│       ├── 04-wiki-dark-neumorphic-coral.html
│       ├── 05-security-dark-neumorphic-coral.html
│       ├── 06-agent-personas-dark-neumorphic-coral.html
│       └── 07-command-palette-dark-neumorphic-coral.html
```

---

## 🎨 Color Palette

### Base Colors
```css
--dark: #1A1A1A           /* Primary background */
--dark-lighter: #242424    /* Secondary background */
--dark-card: #2A2A2A      /* Card background */
--dark-pressed: #1F1F1F   /* Pressed/inset elements */
```

### Coral (Primary Brand Color)
```css
--coral: #FF8B6A          /* Main coral */
--coral-light: #FFB299    /* Light coral */
--coral-dark: #E67759     /* Dark coral */
```

### Slate (Secondary/Text)
```css
--slate: #8B8B8B          /* Secondary text */
--slate-light: #A5A5A5    /* Lighter text */
--slate-dark: #6B6B6B     /* Muted text */
```

### Accent Colors
```css
--accent-green: #4ADE80   /* Success states */
--accent-blue: #60A5FA    /* Info states */
--accent-yellow: #FBBF24  /* Warning states */
--accent-red: #EF4444     /* Error/Critical states */
--accent-purple: #A78BFA  /* Special features */
```

---

## 🏗️ HTML Template Structure

Every page should follow this basic structure:

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - ProjectPulse</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Theme CSS -->
    <link rel="stylesheet" href="../theme/theme.css">
    
    <!-- Tailwind Config (inline) -->
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        dark: '#1A1A1A',
                        darkLighter: '#242424',
                        darkCard: '#2A2A2A',
                        coral: '#FF8B6A',
                        coralLight: '#FFB299',
                        coralDark: '#E67759',
                        slate: '#8B8B8B',
                        slateLight: '#A5A5A5',
                    }
                }
            }
        }
    </script>
</head>
<body class="antialiased">
    <!-- Floating Hexagons Background -->
    <div class="hexagon-bg">
        <div class="hexagon hex-1"></div>
        <div class="hexagon hex-2"></div>
        <div class="hexagon hex-3"></div>
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2 bubble-coral"></div>
    </div>

    <!-- Content -->
    <div class="content-wrapper">
        <!-- Your content here -->
    </div>
</body>
</html>
```

---

## 🎯 Core Components

### 1. Neumorphic Card (Raised)
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition">
    <!-- Card content -->
</div>
```

**When to use:**
- Main content cards
- Navigation items
- Feature containers
- Stats displays

### 2. Neumorphic Pressed (Inset)
```html
<div class="neu-pressed rounded-2xl p-4">
    <!-- Pressed content -->
</div>
```

**When to use:**
- Input fields
- Search bars
- Inner containers
- Metric displays inside cards

### 3. Primary Button (Coral Gradient)
```html
<button class="px-6 py-3 coral-gradient text-white font-semibold rounded-2xl smooth-transition shadow-lg">
    <i class="fas fa-plus mr-2"></i>
    Create New
</button>
```

**When to use:**
- Primary actions
- CTA buttons
- Submit buttons
- Active/selected states

### 4. Secondary Button (Neumorphic)
```html
<button class="px-6 py-3 neu-raised text-white rounded-2xl smooth-transition">
    <i class="fas fa-cog mr-2"></i>
    Settings
</button>
```

**When to use:**
- Secondary actions
- Navigation buttons
- Cancel buttons
- Non-primary interactions

### 5. Icon Container
```html
<!-- Coral Icon (Primary) -->
<div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg">
    <i class="fas fa-heartbeat text-white text-xl"></i>
</div>

<!-- Slate Icon (Secondary) -->
<div class="w-12 h-12 rounded-2xl icon-slate flex items-center justify-center">
    <i class="fas fa-tasks text-slate text-xl"></i>
</div>

<!-- Colored Icon -->
<div class="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
    <i class="fas fa-check text-green-400 text-xl"></i>
</div>
```

### 6. Badges
```html
<!-- Status Badge - Active -->
<span class="badge badge-coral">Active</span>

<!-- Status Badge - Success -->
<span class="badge badge-green">Completed</span>

<!-- Priority Badge - Critical -->
<span class="badge badge-red">Critical</span>

<!-- Count Badge -->
<span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-500 text-white shadow-md">
    3
</span>
```

### 7. Input Fields
```html
<!-- Text Input -->
<input 
    type="text" 
    placeholder="Search..." 
    class="w-full neu-pressed rounded-2xl px-4 py-3 text-white focus:outline-none smooth-transition"
>

<!-- Search with Icon -->
<div class="relative">
    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate"></i>
    <input 
        type="text" 
        placeholder="Search issues..." 
        class="w-full neu-pressed rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none smooth-transition"
    >
</div>
```

### 8. Toggle Switch
```html
<input type="checkbox" checked class="toggle-checkbox">
```

### 9. Checkbox
```html
<input type="checkbox" checked>
<!-- Automatically styled by theme.css -->
```

---

## 🎭 Layout Patterns

### Pattern 1: Sidebar + Main Content
```html
<div class="content-wrapper flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 p-4 flex flex-col gap-4">
        <!-- Logo -->
        <div class="neu-raised rounded-3xl p-6 smooth-transition">
            <!-- Logo content -->
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 flex flex-col gap-2">
            <!-- Nav items -->
        </nav>
        
        <!-- User Profile -->
        <div class="neu-raised rounded-3xl p-4 smooth-transition">
            <!-- Profile content -->
        </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        <!-- Header -->
        <header class="neu-raised rounded-3xl px-8 py-5 smooth-transition">
            <!-- Header content -->
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto">
            <!-- Main content -->
        </main>
    </div>
</div>
```

### Pattern 2: Header + Content
```html
<div class="content-wrapper">
    <!-- Sticky Header -->
    <header class="glass-dark sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <!-- Header content -->
        </div>
    </header>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- Page content -->
    </div>
</div>
```

### Pattern 3: Modal/Command Palette
```html
<!-- Backdrop -->
<div class="backdrop fixed inset-0 z-40"></div>

<!-- Modal -->
<div class="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4">
    <div class="w-full max-w-2xl command-palette rounded-3xl overflow-hidden">
        <!-- Modal content -->
    </div>
</div>
```

---

## 📊 Common UI Sections

### Stats Grid (4 columns)
```html
<div class="grid grid-cols-4 gap-6 mb-8">
    <div class="neu-raised rounded-3xl p-6 smooth-transition">
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg">
                <i class="fas fa-robot text-white text-xl"></i>
            </div>
            <span class="w-2 h-2 bg-coral rounded-full pulse-glow"></span>
        </div>
        <div class="text-3xl font-bold text-coral mb-1">4</div>
        <div class="text-sm text-slate">Active Agents</div>
    </div>
    <!-- More stats... -->
</div>
```

### Navigation Sidebar
```html
<nav class="flex-1 flex flex-col gap-2">
    <!-- Active Item -->
    <a href="#" class="coral-gradient rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-white">
        <i class="fas fa-home w-5"></i>
        <span class="font-medium">Dashboard</span>
        <div class="ml-auto w-2 h-2 rounded-full bg-white pulse-glow"></div>
    </a>
    
    <!-- Regular Item -->
    <a href="#" class="neu-raised rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-slate hover:text-white">
        <i class="fas fa-tasks w-5"></i>
        <span class="font-medium">Issues</span>
    </a>
    
    <!-- Item with Badge -->
    <a href="#" class="neu-raised rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-slate hover:text-white">
        <i class="fas fa-shield-alt w-5"></i>
        <span class="font-medium">Security</span>
        <span class="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold bg-red-500 text-white shadow-md">3</span>
    </a>
</nav>
```

### Page Header with Actions
```html
<header class="neu-raised rounded-3xl px-8 py-5 smooth-transition">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white mb-1">Page Title</h2>
            <p class="text-slate text-sm">Page description</p>
        </div>
        <button class="coral-gradient px-6 py-3 rounded-2xl font-semibold smooth-transition text-white flex items-center gap-2 shadow-lg">
            <i class="fas fa-plus"></i>
            <span>New Item</span>
        </button>
    </div>
</header>
```

### Filter Sidebar
```html
<div class="w-72 flex flex-col gap-4 overflow-auto">
    <div class="neu-raised rounded-3xl p-6 smooth-transition">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Filters</h3>
            <button class="text-coral text-xs hover:text-coralLight smooth-transition font-semibold">Clear All</button>
        </div>
        
        <!-- Filter Section -->
        <div class="mb-6">
            <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
                <i class="fas fa-circle-notch text-coral text-sm"></i>
                Status
            </h4>
            <div class="space-y-3">
                <label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer group smooth-transition">
                    <input type="checkbox" checked>
                    <span class="flex-1">Open</span>
                    <span class="badge badge-green">12</span>
                </label>
                <!-- More checkboxes... -->
            </div>
        </div>
    </div>
</div>
```

### List Items / Cards
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition hover:transform hover:-translate-y-1">
    <div class="flex items-start gap-4">
        <!-- Checkbox -->
        <input type="checkbox" class="mt-1 flex-shrink-0">
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
            <!-- Header with badges -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-slate font-mono text-sm font-semibold">#42</span>
                    <span class="badge badge-red">Critical</span>
                    <span class="badge badge-coral">Combat</span>
                    <span class="badge badge-green">Open</span>
                </div>
                <button class="text-slate hover:text-coral smooth-transition">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            
            <!-- Title -->
            <h3 class="text-white font-bold text-lg mb-2">Item Title</h3>
            
            <!-- Description -->
            <p class="text-slate text-sm mb-4 leading-relaxed">
                Item description goes here...
            </p>
            
            <!-- Meta Info -->
            <div class="flex items-center gap-6 text-sm text-slate">
                <span class="flex items-center gap-2">
                    <i class="fas fa-user"></i>User Name
                </span>
                <span class="flex items-center gap-2">
                    <i class="fas fa-clock"></i>2 hours ago
                </span>
                <span class="flex items-center gap-2">
                    <i class="fas fa-comment"></i>3 comments
                </span>
            </div>
        </div>
    </div>
</div>
```

---

## 🎬 Animations & Interactions

### Hover Effects
- **Cards**: `transform: translateY(-2px)` on hover
- **Buttons**: Elevated shadow and slight lift
- **Nav items**: Background color change + text color change

### Common Animation Classes
```html
<!-- Smooth transition (all properties) -->
<div class="smooth-transition">

<!-- Heartbeat (for logo) -->
<div class="heartbeat">

<!-- Pulse glow (for active indicators) -->
<span class="pulse-glow">

<!-- Hover lift -->
<div class="hover-lift">

<!-- Hover scale -->
<div class="hover-scale">
```

---

## 🔍 Key Design Principles

### 1. **Consistency**
- Always use `rounded-3xl` (1.5rem) for main cards
- Always use `rounded-2xl` (1rem) for buttons and smaller elements
- Always use `rounded-xl` (0.75rem) for icons and badges

### 2. **Spacing**
- Card padding: `p-6` (1.5rem)
- Section gaps: `gap-6` (1.5rem)
- Element gaps inside cards: `gap-4` (1rem)
- Grid columns: 2-4 columns depending on content

### 3. **Typography**
- Page titles: `text-3xl font-bold text-white`
- Section titles: `text-xl font-bold text-white`
- Body text: `text-sm text-slate`
- Meta text: `text-xs text-slate`
- Code/Monospace: Use `font-mono` class

### 4. **Icons**
- Always use Font Awesome
- Default size: `text-xl` for main icons
- Small size: `text-sm` for inline icons
- Always pair with descriptive text

### 5. **Colors Usage**
- **Coral**: Primary actions, active states, key metrics
- **Slate**: Secondary text, icons, inactive states
- **Green**: Success, completed, positive metrics
- **Red**: Errors, critical issues, warnings
- **Yellow**: Warnings, security issues, important notices
- **Blue**: Information, medium priority

---

## 🛠️ Component Checklist

When creating a new page, ensure you have:

- [ ] Floating hexagon background
- [ ] Floating bubbles (at least one coral)
- [ ] Content wrapper div
- [ ] Consistent border radius (3xl for cards, 2xl for buttons)
- [ ] Smooth transitions on interactive elements
- [ ] Proper color usage (coral for primary, slate for secondary)
- [ ] Font Awesome icons
- [ ] Proper hover states
- [ ] Responsive considerations
- [ ] Custom scrollbar (automatic via theme.css)

---

## 📝 Quick Start Checklist for Claude Code

1. **Start with the HTML template** (copy from this guide)
2. **Add floating background** (hexagons + bubbles)
3. **Choose layout pattern** (sidebar, header, or modal)
4. **Use neumorphic cards** for all containers
5. **Apply coral gradient** to primary buttons/actions
6. **Use proper badges** for status indicators
7. **Add smooth-transition** class to interactive elements
8. **Test hover states** on all clickable elements
9. **Ensure consistent spacing** (gap-6 for sections)
10. **Verify icon usage** (Font Awesome + proper sizing)

---

## 🎯 Common Mistakes to Avoid

❌ **Don't**: Use flat backgrounds without neumorphic effects
✅ **Do**: Always use `neu-raised` or `neu-pressed` for surfaces

❌ **Don't**: Use random border radius values
✅ **Do**: Stick to `rounded-3xl`, `rounded-2xl`, or `rounded-xl`

❌ **Don't**: Mix different shadow styles
✅ **Do**: Use consistent neumorphic shadows from theme.css

❌ **Don't**: Forget the floating background elements
✅ **Do**: Always include hexagons and bubbles

❌ **Don't**: Use too many colors
✅ **Do**: Stick to coral for primary, slate for secondary

❌ **Don't**: Forget hover states
✅ **Do**: Add `smooth-transition` and hover effects

---

## 📚 Additional Resources

- **Reference Mockups**: See `mockups/Default theme/` folder
- **Theme CSS**: `theme/theme.css` - All styles defined here
- **Tailwind Config**: `theme/tailwind.config.js` - Color extensions
- **Font Awesome**: https://fontawesome.com/icons
- **Google Fonts**: Inter (sans) + JetBrains Mono (mono)

---

## 💡 Pro Tips

1. **Use the mockups as reference** - When in doubt, check the existing mockup pages
2. **Start with structure** - Get the layout right before styling
3. **Copy component patterns** - Reuse existing patterns from mockups
4. **Test interactions** - Hover, click, and scroll to ensure smoothness
5. **Keep it consistent** - Match the exact styling from mockups

---

## 🚀 Ready to Build!

With this theme system, Claude Code can create pixel-perfect pages that match the mockup designs. Every component, color, and interaction is documented and ready to use.

**Remember**: When in doubt, refer to the mockup files in `mockups/Default theme/` - they contain the exact implementation you need!
