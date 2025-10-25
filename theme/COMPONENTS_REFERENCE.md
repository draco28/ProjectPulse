# ProjectPulse Component Library
## Ready-to-Use Component Snippets

This file contains copy-paste ready components for rapid development.

---

## 🎯 Page Templates

### Full Page Template with Sidebar
```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - ProjectPulse</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../theme/theme.css">
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
    <div class="hexagon-bg">
        <div class="hexagon hex-1"></div>
        <div class="hexagon hex-2"></div>
        <div class="hexagon hex-3"></div>
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2 bubble-coral"></div>
    </div>

    <div class="content-wrapper flex h-screen overflow-hidden">
        <!-- SIDEBAR -->
        <aside class="w-64 p-4 flex flex-col gap-4">
            <!-- Logo Card -->
            <div class="neu-raised rounded-3xl p-6 smooth-transition">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg heartbeat">
                        <i class="fas fa-heartbeat text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white">ProjectPulse</h1>
                        <p class="text-xs text-slate">v1.0.0</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 flex flex-col gap-2">
                <!-- NAV ITEMS GO HERE -->
            </nav>

            <!-- User Profile -->
            <div class="neu-raised rounded-3xl p-4 smooth-transition">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl icon-coral shadow-lg"></div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-white">User Name</p>
                        <p class="text-xs text-slate">Role</p>
                    </div>
                </div>
            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <div class="flex-1 flex flex-col overflow-hidden p-4 gap-4">
            <!-- Header -->
            <header class="neu-raised rounded-3xl px-8 py-5 smooth-transition">
                <!-- HEADER CONTENT -->
            </header>

            <!-- Page Content -->
            <main class="flex-1 overflow-hidden flex gap-4">
                <!-- MAIN CONTENT -->
            </main>
        </div>
    </div>
</body>
</html>
```

### Full Page Template with Header Only
```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <!-- Same head as above -->
</head>
<body class="antialiased">
    <div class="hexagon-bg">
        <div class="hexagon hex-1"></div>
        <div class="hexagon hex-2"></div>
        <div class="hexagon hex-3"></div>
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2 bubble-coral"></div>
    </div>

    <div class="content-wrapper">
        <!-- Sticky Header -->
        <header class="glass-dark sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <!-- HEADER CONTENT -->
            </div>
        </header>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- PAGE CONTENT -->
        </div>
    </div>
</body>
</html>
```

---

## 🧭 Navigation Components

### Active Navigation Item
```html
<a href="#" class="coral-gradient rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-white">
    <i class="fas fa-home w-5"></i>
    <span class="font-medium">Dashboard</span>
    <div class="ml-auto w-2 h-2 rounded-full bg-white pulse-glow"></div>
</a>
```

### Regular Navigation Item
```html
<a href="#" class="neu-raised rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-slate hover:text-white">
    <i class="fas fa-tasks w-5"></i>
    <span class="font-medium">Issues</span>
</a>
```

### Navigation Item with Badge
```html
<a href="#" class="neu-raised rounded-2xl px-5 py-4 flex items-center gap-3 smooth-transition text-slate hover:text-white">
    <i class="fas fa-shield-alt w-5"></i>
    <span class="font-medium">Security</span>
    <span class="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold bg-red-500 text-white shadow-md">3</span>
</a>
```

### Top Navigation Bar
```html
<nav class="flex items-center gap-1 ml-8">
    <a href="#" class="px-4 py-2 rounded-2xl text-slate hover:text-white hover:bg-[#2A2A2A] smooth-transition">
        <i class="fas fa-home mr-2"></i>Dashboard
    </a>
    <a href="#" class="px-4 py-2 rounded-2xl coral-gradient text-white shadow-lg">
        <i class="fas fa-tasks mr-2"></i>Issues
    </a>
    <a href="#" class="px-4 py-2 rounded-2xl text-slate hover:text-white hover:bg-[#2A2A2A] smooth-transition">
        <i class="fas fa-robot mr-2"></i>Agents
    </a>
</nav>
```

---

## 🔘 Button Components

### Primary Button (Coral)
```html
<button class="px-6 py-3 coral-gradient text-white font-semibold rounded-2xl smooth-transition shadow-lg">
    <i class="fas fa-plus mr-2"></i>Create New
</button>
```

### Secondary Button (Neumorphic)
```html
<button class="px-6 py-3 neu-raised text-white font-medium rounded-2xl smooth-transition">
    <i class="fas fa-download mr-2"></i>Import Config
</button>
```

### Small Button
```html
<button class="px-4 py-2 coral-gradient text-white rounded-2xl text-sm smooth-transition">
    <i class="fas fa-cog mr-2"></i>Configure
</button>
```

### Icon Button
```html
<button class="w-12 h-12 coral-gradient rounded-2xl flex items-center justify-center smooth-transition text-white shadow-lg">
    <i class="fas fa-th-list"></i>
</button>
```

### Ghost Button
```html
<button class="px-4 py-2 text-coral hover:text-coralLight smooth-transition text-sm font-semibold">
    Clear All
</button>
```

---

## 📊 Card Components

### Basic Stats Card
```html
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
```

### Info Card with Header
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition">
    <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-white">Card Title</h3>
        <button class="text-slate hover:text-coral smooth-transition">
            <i class="fas fa-ellipsis-v"></i>
        </button>
    </div>
    <p class="text-slate text-sm leading-relaxed">
        Card content goes here...
    </p>
</div>
```

### Agent/Feature Card
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition">
    <div class="flex items-start justify-between mb-6">
        <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-2xl icon-coral flex items-center justify-center text-3xl shadow-lg">
                🔍
            </div>
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-xl font-bold text-white">Feature Name</h3>
                    <span class="badge badge-coral">Active</span>
                </div>
                <p class="text-sm text-slate mb-3">Feature description goes here</p>
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="skill-badge px-2 py-1 neu-pressed text-slate rounded text-xs">Tag 1</span>
                    <span class="skill-badge px-2 py-1 neu-pressed text-slate rounded text-xs">Tag 2</span>
                </div>
            </div>
        </div>
        <input type="checkbox" checked class="toggle-checkbox">
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="neu-pressed rounded-2xl p-3">
            <div class="text-2xl font-bold text-coral mb-1">38</div>
            <div class="text-xs text-slate">Metric 1</div>
        </div>
        <div class="neu-pressed rounded-2xl p-3">
            <div class="text-2xl font-bold text-white mb-1">156</div>
            <div class="text-xs text-slate">Metric 2</div>
        </div>
        <div class="neu-pressed rounded-2xl p-3">
            <div class="text-2xl font-bold text-green-400 mb-1">12h</div>
            <div class="text-xs text-slate">Metric 3</div>
        </div>
    </div>

    <div class="flex items-center gap-3">
        <button class="flex-1 px-4 py-2 coral-gradient text-white rounded-2xl smooth-transition text-sm font-medium shadow-lg">
            <i class="fas fa-cog mr-2"></i>Configure
        </button>
        <button class="flex-1 px-4 py-2 neu-raised rounded-2xl smooth-transition text-sm text-white">
            <i class="fas fa-chart-bar mr-2"></i>View Analytics
        </button>
    </div>
</div>
```

### List Item Card
```html
<div class="neu-raised rounded-3xl p-6 smooth-transition hover:transform hover:-translate-y-1">
    <div class="flex items-start gap-4">
        <input type="checkbox" class="mt-1 flex-shrink-0">
        <div class="flex-1 min-w-0">
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
            <h3 class="text-white font-bold text-lg mb-2">Item Title Here</h3>
            <p class="text-slate text-sm mb-4 leading-relaxed">
                Item description goes here with all the details...
            </p>
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

## 🎨 Badge Components

### Status Badges
```html
<!-- Active/Success -->
<span class="badge badge-coral">Active</span>
<span class="badge badge-green">Completed</span>

<!-- Warning/Info -->
<span class="badge badge-yellow">Pending</span>
<span class="badge badge-blue">In Progress</span>

<!-- Error/Critical -->
<span class="badge badge-red">Critical</span>

<!-- Inactive -->
<span class="badge badge-slate">Inactive</span>
```

### Count Badges
```html
<!-- Success count -->
<span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-500 text-white shadow-md">12</span>

<!-- Warning count -->
<span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-orange-500 text-white shadow-md">5</span>

<!-- Error count -->
<span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-500 text-white shadow-md">3</span>

<!-- Neutral count -->
<span class="text-xs px-2.5 py-1 rounded-full font-semibold neu-pressed text-slate">8</span>
```

### Priority Indicators
```html
<span class="flex items-center gap-2">
    <span class="w-2 h-2 bg-red-500 rounded-full"></span>
    Critical
</span>

<span class="flex items-center gap-2">
    <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
    High
</span>

<span class="flex items-center gap-2">
    <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
    Medium
</span>

<span class="flex items-center gap-2">
    <span class="w-2 h-2 bg-slate rounded-full"></span>
    Low
</span>
```

---

## 📝 Form Components

### Text Input
```html
<input 
    type="text" 
    placeholder="Enter text..." 
    class="w-full neu-pressed rounded-2xl px-4 py-3 text-white focus:outline-none smooth-transition"
>
```

### Search Input with Icon
```html
<div class="relative">
    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate"></i>
    <input 
        type="text" 
        placeholder="Search..." 
        class="w-full neu-pressed rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none smooth-transition"
    >
</div>
```

### Select Dropdown
```html
<select class="neu-pressed rounded-2xl px-4 py-3 text-white focus:outline-none smooth-transition cursor-pointer">
    <option>Sort: Newest</option>
    <option>Sort: Oldest</option>
    <option>Sort: Priority</option>
</select>
```

### Checkbox with Label
```html
<label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer smooth-transition">
    <input type="checkbox" checked>
    <span class="flex-1">Option Label</span>
</label>
```

### Toggle Switch with Label
```html
<label class="flex items-center justify-between">
    <span class="text-white font-semibold">Enable Feature</span>
    <input type="checkbox" checked class="toggle-checkbox">
</label>
```

### Textarea
```html
<textarea 
    rows="4" 
    placeholder="Enter description..." 
    class="w-full neu-pressed rounded-2xl px-4 py-3 text-white focus:outline-none smooth-transition resize-none"
></textarea>
```

---

## 🎭 Header Components

### Page Header with Title and Action
```html
<header class="neu-raised rounded-3xl px-8 py-5 smooth-transition">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-white mb-1">Page Title</h2>
            <p class="text-slate text-sm">Page description goes here</p>
        </div>
        <button class="coral-gradient px-6 py-3 rounded-2xl font-semibold smooth-transition text-white flex items-center gap-2 shadow-lg">
            <i class="fas fa-plus"></i>
            <span>New Item</span>
        </button>
    </div>
</header>
```

### Sticky Glass Header
```html
<header class="glass-dark sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
            <!-- Logo -->
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl icon-coral flex items-center justify-center shadow-lg heartbeat">
                    <i class="fas fa-heartbeat text-white text-xl"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-white">ProjectPulse</h1>
                    <p class="text-xs text-slate">v1.0.0</p>
                </div>
            </div>

            <!-- Nav + Actions -->
            <div class="flex items-center gap-4">
                <!-- Navigation here -->
                
                <!-- User Avatar -->
                <div class="w-10 h-10 icon-coral rounded-2xl flex items-center justify-center text-sm font-bold cursor-pointer shadow-lg">
                    SK
                </div>
            </div>
        </div>
    </div>
</header>
```

---

## 📂 Filter Sidebar Component

```html
<div class="w-72 flex flex-col gap-4 overflow-auto">
    <div class="neu-raised rounded-3xl p-6 smooth-transition">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Filters</h3>
            <button class="text-coral text-xs hover:text-coralLight smooth-transition font-semibold">Clear All</button>
        </div>
        
        <!-- Status Filter -->
        <div class="mb-6">
            <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
                <i class="fas fa-circle-notch text-coral text-sm"></i>
                Status
            </h4>
            <div class="space-y-3">
                <label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer smooth-transition">
                    <input type="checkbox" checked>
                    <span class="flex-1">Open</span>
                    <span class="badge badge-green">12</span>
                </label>
                <label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer smooth-transition">
                    <input type="checkbox">
                    <span class="flex-1">In Progress</span>
                    <span class="text-xs px-2.5 py-1 rounded-full font-semibold neu-pressed text-slate">5</span>
                </label>
                <label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer smooth-transition">
                    <input type="checkbox">
                    <span class="flex-1">Closed</span>
                    <span class="text-xs px-2.5 py-1 rounded-full font-semibold neu-pressed text-slate">28</span>
                </label>
            </div>
        </div>

        <!-- Priority Filter -->
        <div class="mb-6">
            <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
                <i class="fas fa-exclamation-circle text-coral text-sm"></i>
                Priority
            </h4>
            <div class="space-y-3">
                <label class="flex items-center gap-3 text-slate hover:text-white cursor-pointer smooth-transition">
                    <input type="checkbox">
                    <span class="flex items-center gap-2 flex-1">
                        <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                        Critical
                    </span>
                    <span class="badge badge-red">2</span>
                </label>
                <!-- More priority options... -->
            </div>
        </div>
    </div>
</div>
```

---

## 🎬 Activity Timeline Component

```html
<div class="neu-raised rounded-3xl p-6 smooth-transition">
    <h3 class="text-xl font-bold mb-6 text-white">Recent Activity</h3>
    
    <div class="space-y-4">
        <!-- Activity Item -->
        <div class="flex items-start gap-4 p-4 neu-pressed rounded-2xl smooth-transition hover:bg-coral/5">
            <div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                🔍
            </div>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <h4 class="font-semibold text-white">Activity Title</h4>
                        <p class="text-sm text-slate">Activity description</p>
                    </div>
                    <span class="text-xs text-slate">5 minutes ago</span>
                </div>
                <div class="flex items-center gap-4 text-xs">
                    <span class="text-coral">
                        <i class="fas fa-check mr-1"></i>12 items
                    </span>
                    <span class="text-green-400">
                        <i class="fas fa-thumbs-up mr-1"></i>3 likes
                    </span>
                </div>
            </div>
            <button class="px-4 py-2 coral-gradient text-white rounded-2xl text-sm smooth-transition shadow-lg">
                View
            </button>
        </div>

        <!-- More activity items... -->
    </div>

    <div class="mt-6 pt-6 border-t border-[#2A2A2A] text-center">
        <button class="text-sm text-coral hover:text-coralLight smooth-transition font-medium">
            View All Activity →
        </button>
    </div>
</div>
```

---

## 🎯 Modal/Command Palette Component

```html
<!-- Backdrop -->
<div class="backdrop fixed inset-0 z-40"></div>

<!-- Modal -->
<div class="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4">
    <div class="w-full max-w-2xl command-palette rounded-3xl overflow-hidden">
        <!-- Search Input -->
        <div class="p-6 border-b border-[#1F1F1F]">
            <div class="flex items-center gap-4">
                <i class="fas fa-search text-coral text-xl"></i>
                <input 
                    type="text" 
                    placeholder="Type a command or search..." 
                    class="command-input flex-1 text-white text-xl"
                    autofocus
                >
                <kbd class="px-3 py-1.5 text-xs text-slate rounded font-mono">ESC</kbd>
            </div>
        </div>

        <!-- Command List -->
        <div class="max-h-96 overflow-y-auto">
            <div class="p-4">
                <div class="section-header px-3 py-2 flex items-center gap-2">
                    <i class="fas fa-bolt text-coral"></i>
                    Quick Actions
                </div>
                <div class="space-y-1">
                    <div class="command-item selected flex items-center gap-4 px-3 py-3 rounded-2xl">
                        <div class="w-10 h-10 icon-coral rounded-xl flex items-center justify-center">
                            <i class="fas fa-plus text-white"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-white font-semibold">Create New Issue</p>
                            <p class="text-slate text-sm">Open issue creation form</p>
                        </div>
                        <kbd class="px-2 py-1 text-xs text-slate rounded font-mono">⌘N</kbd>
                    </div>
                    <!-- More commands... -->
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="command-footer p-4">
            <div class="flex items-center justify-between text-xs text-slate">
                <div class="flex items-center gap-4">
                    <span>
                        <kbd class="px-1.5 py-0.5 rounded font-mono">↑</kbd>
                        <kbd class="px-1.5 py-0.5 rounded ml-1 font-mono">↓</kbd> 
                        to navigate
                    </span>
                    <span>
                        <kbd class="px-1.5 py-0.5 rounded font-mono">↵</kbd> 
                        to select
                    </span>
                </div>
                <span class="text-coral">Type to search...</span>
            </div>
        </div>
    </div>
</div>
```

---

## 📈 Stats Grid (4 Columns)

```html
<div class="grid grid-cols-4 gap-6 mb-8">
    <!-- Stat Card 1 -->
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

    <!-- Stat Card 2 -->
    <div class="neu-raised rounded-3xl p-6 smooth-transition">
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl icon-slate flex items-center justify-center">
                <i class="fas fa-tasks text-slate text-xl"></i>
            </div>
        </div>
        <div class="text-3xl font-bold text-white mb-1">127</div>
        <div class="text-sm text-slate">Tasks Completed</div>
    </div>

    <!-- Stat Card 3 -->
    <div class="neu-raised rounded-3xl p-6 smooth-transition">
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl icon-slate flex items-center justify-center">
                <i class="fas fa-clock text-slate text-xl"></i>
            </div>
        </div>
        <div class="text-3xl font-bold text-white mb-1">32h</div>
        <div class="text-sm text-slate">Time Saved</div>
    </div>

    <!-- Stat Card 4 -->
    <div class="neu-raised rounded-3xl p-6 smooth-transition">
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <i class="fas fa-chart-line text-green-400 text-xl"></i>
            </div>
        </div>
        <div class="text-3xl font-bold text-green-400 mb-1">94%</div>
        <div class="text-sm text-slate">Success Rate</div>
    </div>
</div>
```

---

## 🎨 Icon Containers

```html
<!-- Coral Icon (Primary/Active) -->
<div class="w-12 h-12 rounded-2xl icon-coral flex items-center justify-center shadow-lg">
    <i class="fas fa-heartbeat text-white text-xl"></i>
</div>

<!-- Slate Icon (Secondary/Inactive) -->
<div class="w-12 h-12 rounded-2xl icon-slate flex items-center justify-center">
    <i class="fas fa-tasks text-slate text-xl"></i>
</div>

<!-- Green Icon (Success) -->
<div class="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
    <i class="fas fa-check text-green-400 text-xl"></i>
</div>

<!-- Yellow Icon (Warning) -->
<div class="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center">
    <i class="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
</div>

<!-- Red Icon (Error/Critical) -->
<div class="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
    <i class="fas fa-times text-red-400 text-xl"></i>
</div>

<!-- Emoji Icon -->
<div class="w-16 h-16 rounded-2xl icon-coral flex items-center justify-center text-3xl shadow-lg">
    🔍
</div>
```

---

## ⚡ Quick Copy Snippets

### Empty State
```html
<div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-24 h-24 rounded-3xl icon-slate flex items-center justify-center text-4xl mb-6">
        📭
    </div>
    <h3 class="text-xl font-bold text-white mb-2">No Items Found</h3>
    <p class="text-slate text-sm mb-6 max-w-md">
        There are no items to display. Create your first item to get started.
    </p>
    <button class="coral-gradient px-6 py-3 rounded-2xl font-semibold text-white shadow-lg">
        <i class="fas fa-plus mr-2"></i>Create First Item
    </button>
</div>
```

### Loading Spinner
```html
<div class="flex items-center justify-center py-16">
    <div class="w-12 h-12 rounded-full border-4 border-coral/20 border-t-coral spin"></div>
</div>
```

### Pagination
```html
<div class="neu-raised rounded-3xl p-4 smooth-transition">
    <div class="flex items-center justify-between">
        <p class="text-slate text-sm font-medium">Showing 1-10 of 45 items</p>
        <div class="flex gap-2">
            <button class="px-4 py-2 neu-raised rounded-xl text-slate hover:text-white smooth-transition font-medium">
                Previous
            </button>
            <button class="px-4 py-2 coral-gradient rounded-xl text-white smooth-transition font-medium shadow-lg">1</button>
            <button class="px-4 py-2 neu-raised rounded-xl text-slate hover:text-white smooth-transition font-medium">2</button>
            <button class="px-4 py-2 neu-raised rounded-xl text-slate hover:text-white smooth-transition font-medium">3</button>
            <button class="px-4 py-2 neu-raised rounded-xl text-slate hover:text-white smooth-transition font-medium">
                Next
            </button>
        </div>
    </div>
</div>
```

---

## 🚀 That's It!

All components are ready to copy and paste. Just grab what you need and build amazing pages!

**Pro Tip**: Always refer to the actual mockup files in `mockups/Default theme/` for real-world implementations of these components working together.
