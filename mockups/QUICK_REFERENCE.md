# ProjectPulse Design System - Quick Reference Card

**Print this page for easy reference while coding!** 📋

---

## 🎨 Color Tokens

### Backgrounds
```css
#0A0118  /* bg-background-darkest - Page background */
#150828  /* bg-background-dark     - Sidebar, header */
#1F0D3A  /* bg-background-medium   - Cards, surfaces */
#2A1548  /* bg-background-light    - Hover states */
```

### Neon Colors
```css
#FF0080  /* text-neon-pink   - Primary brand */
#B721FF  /* text-neon-purple - Secondary */
#00F5FF  /* text-neon-cyan   - Focus/active */
#21D4FD  /* text-neon-blue   - Info */
#E91E63  /* text-neon-magenta */
```

### Text
```css
#FFFFFF  /* text-text-primary   - Headings, important */
#E0B3FF  /* text-text-secondary - Body text */
#9D7FB8  /* text-text-tertiary  - Less important */
#6B5B7A  /* text-text-muted     - Disabled, hints */
```

### Semantic
```css
#00FF88  /* Green  - Success */
#FFD600  /* Yellow - Warning */
#FF0055  /* Red    - Error */
#00D4FF  /* Cyan   - Info */
```

---

## ✍️ Typography

### Fonts
```css
font-sans  /* Inter - All UI text */
font-mono  /* JetBrains Mono - Code, numbers */
```

### Sizes
```css
text-xs    /* 12px - Labels */
text-sm    /* 14px - Small text */
text-base  /* 16px - Body */
text-lg    /* 18px - Large body */
text-xl    /* 20px - Subheadings */
text-2xl   /* 24px - Card headings */
text-3xl   /* 30px - Section headings */
text-4xl   /* 36px - Page headings */
```

### Weights
```css
font-normal    /* 400 - Body text */
font-medium    /* 500 - Emphasis */
font-semibold  /* 600 - Headings */
font-bold      /* 700 - Strong emphasis */
```

---

## 📐 Spacing

```css
space-1  /* 4px  */   space-2  /* 8px  */   space-3  /* 12px */
space-4  /* 16px */   space-5  /* 20px */   space-6  /* 24px */
space-8  /* 32px */   space-10 /* 40px */   space-12 /* 48px */
```

### Common Uses
```css
p-6         /* Card padding (24px) */
gap-6       /* Grid gaps (24px) */
px-4 py-3   /* Button padding */
px-3 py-1   /* Badge padding */
```

---

## 🔲 Border Radius

```css
rounded-sm   /* 4px  - Small elements */
rounded-md   /* 8px  - Buttons, inputs */
rounded-lg   /* 12px - Cards */
rounded-xl   /* 16px - Large cards */
rounded-2xl  /* 24px - Hero sections */
rounded-full /* 9999px - Pills, circles */
```

---

## 🌟 Effects

### Glows
```css
/* Pink Glow */
box-shadow: 0 0 20px rgba(255, 0, 128, 0.4);

/* Purple Glow */
box-shadow: 0 0 20px rgba(183, 33, 255, 0.4);

/* Cyan Glow */
box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
```

### Borders
```css
/* Neon Border */
border: 1px solid rgba(255, 0, 128, 0.3);

/* Active Border */
border-color: #FF0080;
```

### Transitions
```css
transition: all 0.2s ease-in-out;  /* Default */
```

---

## 🔘 Buttons

### Primary
```html
<button class="pulse-gradient text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform">
  Primary Action
</button>
```

### Secondary
```html
<button class="bg-transparent border-2 border-neon-pink text-neon-pink px-6 py-3 rounded-lg hover:bg-neon-pink/10">
  Secondary
</button>
```

### Ghost
```html
<button class="text-text-tertiary hover:text-neon-pink transition-colors">
  Ghost Button
</button>
```

---

## 📦 Cards

### Basic Card
```html
<div class="bg-background-medium rounded-xl border border-[rgba(255,0,128,0.3)] p-6 hover:border-neon-pink transition-all">
  Content
</div>
```

### Card with Glow
```html
<div class="bg-background-medium rounded-xl border border-[rgba(255,0,128,0.3)] p-6 hover:shadow-[0_0_20px_rgba(255,0,128,0.4)] transition-all">
  Content
</div>
```

---

## 📝 Inputs

```html
<input 
  type="text"
  placeholder="Search..."
  class="bg-background-medium border-2 border-background-light rounded-lg px-4 py-3 text-text-primary
         focus:border-neon-cyan focus:outline-none focus:shadow-[0_0_20px_rgba(0,245,255,0.3)]
         transition-all"
>
```

---

## 🏷️ Badges

### Priority Badges
```html
<!-- Critical -->
<span class="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold border border-red-500/30">
  Critical
</span>

<!-- High -->
<span class="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-400/30">
  High
</span>

<!-- Medium -->
<span class="bg-cyan-500/20 text-cyan-500 px-3 py-1 rounded-full text-xs font-semibold border border-cyan-500/30">
  Medium
</span>

<!-- Low -->
<span class="bg-purple-500/20 text-purple-500 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/30">
  Low
</span>
```

---

## 💫 Animations

### Pulse Indicator
```html
<div class="relative w-3 h-3">
  <div class="absolute inset-0 bg-neon-pink rounded-full animate-ping"></div>
  <div class="absolute inset-0 bg-neon-pink rounded-full"></div>
</div>
```

### Heartbeat
```css
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.heartbeat {
  animation: heartbeat 2s infinite;
}
```

### Glow Pulse
```css
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 128, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 0, 128, 0.8); }
}

.pulse-animate {
  animation: glow-pulse 2s infinite;
}
```

---

## 🎯 Priority Colors

| Priority | Color | Class |
|----------|-------|-------|
| Critical | Red (#FF0055) | `bg-red-500/20 text-red-400 border-red-500/30` |
| High | Yellow (#FFD600) | `bg-yellow-400/20 text-yellow-400 border-yellow-400/30` |
| Medium | Cyan (#00D4FF) | `bg-cyan-500/20 text-cyan-500 border-cyan-500/30` |
| Low | Purple (#9D7FB8) | `bg-purple-500/20 text-purple-500 border-purple-500/30` |

---

## 🗂️ Module Colors

| Module | Color | Class |
|--------|-------|-------|
| Combat | Pink (#FF0080) | `bg-neon-pink/20 text-neon-pink border-neon-pink/30` |
| Animation | Purple (#B721FF) | `bg-neon-purple/20 text-neon-purple border-neon-purple/30` |
| Core | Green (#00FF88) | `bg-green-400/20 text-green-400 border-green-400/30` |
| UI | Coral (#FF4D6D) | `bg-pink-400/20 text-pink-400 border-pink-400/30` |
| Networking | Blue (#21D4FD) | `bg-blue-400/20 text-blue-400 border-blue-400/30` |
| Security | Yellow (#FFD600) | `bg-yellow-400/20 text-yellow-400 border-yellow-400/30` |

---

## 🤖 Agent Persona Colors

| Agent | Color | Emoji |
|-------|-------|-------|
| Code Reviewer | Cyan (#00F5FF) | 🔍 |
| Bug Hunter | Purple (#B721FF) | 🐛 |
| Feature Architect | Purple (#B721FF) | 🏗️ |
| Security Auditor | Yellow (#FFD600) | 🛡️ |
| Tester | Green (#00FF88) | ✅ |

---

## 📱 Responsive Classes

```css
sm:  /* 640px+ */
md:  /* 768px+ */
lg:  /* 1024px+ */
xl:  /* 1280px+ */
2xl: /* 1536px+ */
```

### Example
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- 1 column mobile, 2 tablet, 4 desktop -->
</div>
```

---

## ♿ Accessibility

### Focus States
```css
focus:outline-none
focus:ring-2
focus:ring-neon-cyan
focus:border-neon-cyan
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🔗 Gradients

### Primary Gradient (Hero)
```css
background: linear-gradient(135deg, #FF0080 0%, #FF4D6D 50%, #FF8C42 100%);
```

### Secondary Gradient
```css
background: linear-gradient(135deg, #B721FF 0%, #FF0080 100%);
```

### Tailwind Class
```html
<div class="bg-gradient-to-r from-neon-pink via-[#FF4D6D] to-[#FF8C42]">
  Content
</div>
```

---

## 🎨 Common Patterns

### Sidebar Nav Item
```html
<a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-text-tertiary hover:bg-background-medium hover:text-white transition-all">
  <i class="fas fa-home w-5"></i>
  <span>Dashboard</span>
</a>
```

### Active Sidebar Item
```html
<a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-neon-pink/10 border-l-3 border-neon-pink text-white">
  <i class="fas fa-home w-5"></i>
  <span>Dashboard</span>
</a>
```

### Stat Card
```html
<div class="bg-background-medium rounded-xl border border-[rgba(255,0,128,0.3)] p-6 hover:border-neon-pink transition-all">
  <div class="flex items-center justify-between mb-4">
    <div class="w-12 h-12 bg-neon-pink/20 rounded-lg flex items-center justify-center">
      <i class="fas fa-tasks text-neon-pink text-xl"></i>
    </div>
    <span class="text-green-400 text-sm font-semibold">+2 today</span>
  </div>
  <h3 class="text-3xl font-bold text-white mb-1">12</h3>
  <p class="text-text-tertiary text-sm">Open Issues</p>
</div>
```

---

## 🚀 Quick Start Template

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProjectPulse</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            background: {
              darkest: '#0A0118',
              dark: '#150828',
              medium: '#1F0D3A',
              light: '#2A1548',
            },
            neon: {
              pink: '#FF0080',
              purple: '#B721FF',
              cyan: '#00F5FF',
            },
            text: {
              primary: '#FFFFFF',
              secondary: '#E0B3FF',
              tertiary: '#9D7FB8',
              muted: '#6B5B7A',
            }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body { 
      background: #0A0118;
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body>
  <!-- Your content here -->
</body>
</html>
```

---

**Save this reference card for quick access while coding!** 🎯

For complete documentation, see `DESIGN_DIRECTION.md`
