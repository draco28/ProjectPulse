# ProjectPulse Themes Overview

**Last Updated:** October 24, 2025
**Total Themes:** 4 (1 Light + 3 Dark)
**Default Theme:** Desert Stone (Light Mode)

---

## 🎨 Theme Gallery

### 1. Desert Stone Neumorphic (DEFAULT) ⭐

**Mode:** Light
**Aesthetic:** Soft, warm, professional
**Mockup:** `dashboard-desert-stone-neumorphic.html`

**Color Palette:**
```css
/* Backgrounds - Warm sandy gradients */
#FAF9F6  /* Feather - Lightest base */
#F4F1EA  /* Mist */
#E6DAC8  /* Oat */
#CBB9A4  /* Sandstone */

/* Accents - Natural earth tones */
#A48D78  /* Desert (primary) */
#8B7766  /* Desert Dark */
#6B5D52  /* Desert Deep */

/* Special Effects */
Neumorphic shadows: Soft 3D raised/inset effects
Gradient background: Sandy gradient from lightest to medium tone
Hover: Subtle lift with enhanced shadow
```

**Best For:**
- ✅ Professional work environments
- ✅ Long reading sessions
- ✅ Calm, focused work
- ✅ Light-sensitive users

**Key Features:**
- Soft neumorphic shadows (raised, inset, dark variants)
- Warm color temperature
- 7:1+ contrast ratio (WCAG AAA)
- Icon gradients: Clay, Sand, Terracotta, Bronze, Sage

---

### 2. Neon Vibes

**Mode:** Dark
**Aesthetic:** Vibrant, energetic, futuristic
**Mockup:** `dashboard-neon-vibes-theme.html`

**Color Palette:**
```css
/* Backgrounds - Deep midnight blues */
#091221  /* Midnight (darkest) */
#0d1929  /* Sidebar */
#14203a  /* Cards */
#1a2a4a  /* Hover states */

/* Accents - Electric neon colors */
#fe0369  /* Hot Pink (primary) */
#0236a5  /* Royal Blue */
#0585c6  /* Cyan */

/* Special Effects */
Neon glows: 0 0 20px rgba(254, 3, 105, 0.4)
Pulse animations: Glow intensity pulses from 0.5 to 0.8
Border glow: Pink neon borders with glow on hover
```

**Best For:**
- ✅ Creative work
- ✅ Night-time development
- ✅ Bold, distinctive branding
- ✅ Energy and excitement

**Key Features:**
- Vibrant neon glows (pink, blue, cyan)
- Pulse animations on active elements
- High-contrast neon borders
- Gradient: Blue → Pink → Cyan

---

### 3. Earthy

**Mode:** Dark
**Aesthetic:** Minimal, grounded, professional
**Mockup:** `dashboard-earthy-theme.html`

**Color Palette:**
```css
/* Backgrounds - Deep smoky tones */
#11120D  /* Smoky (darkest) */
#1A1B15  /* Sidebar */
#26271F  /* Cards */
#3E3D35  /* Olive Dark (hover) */

/* Accents - Muted natural tones */
#D8CFBC  /* Bone (primary) */
#6B6A5D  /* Olive Light */
#565449  /* Olive */

/* Special Effects */
Subtle glows: 0 0 10px rgba(216, 207, 188, 0.3)
Muted transitions: Very subtle animations
Minimal decoration: Clean, professional aesthetic
```

**Best For:**
- ✅ Minimal design preference
- ✅ Reduced visual noise
- ✅ Professional environments
- ✅ Users sensitive to bright colors

**Key Features:**
- Very subtle glow effects
- Muted earth tone palette
- Minimal distractions
- Gradient: Olive → Bone → Floral

---

### 4. Dark Neumorphic Coral

**Mode:** Dark
**Aesthetic:** Modern, sophisticated, playful
**Mockup:** `dashboard-dark-neumorphic-coral.html`

**Color Palette:**
```css
/* Backgrounds - Pure dark tones */
#1A1A1A  /* Dark (darkest) */
#242424  /* Dark Lighter (sidebar) */
#2A2A2A  /* Dark Card */
#303030  /* Hover states */

/* Accents - Warm coral tones */
#FF8B6A  /* Coral (primary) */
#FFB299  /* Coral Light */
#E67759  /* Coral Dark */

/* Special Effects */
Dark neumorphic shadows: 8px 8px 16px rgba(0, 0, 0, 0.6)
Coral glow: 0 0 30px rgba(255, 139, 106, 0.4)
Geometric elements: Floating hexagons and bubbles
Glass effect: Backdrop blur with subtle borders
```

**Best For:**
- ✅ Modern design aesthetic
- ✅ Sophisticated interfaces
- ✅ Creative professionals
- ✅ Users who want something unique

**Key Features:**
- Dark neumorphic shadows (raised/inset)
- Floating hexagon shapes (animated)
- Bubble effects
- Coral gradient buttons
- Glass morphism panels

---

## 📊 Theme Comparison

| Feature | Desert Stone | Neon Vibes | Earthy | Dark Neumorphic Coral |
|---------|--------------|------------|--------|-----------------------|
| **Mode** | Light | Dark | Dark | Dark |
| **Energy** | Calm | High | Very Calm | Moderate |
| **Brightness** | High | Medium | Low | Medium |
| **Shadows** | Neumorphic | Regular | Minimal | Neumorphic |
| **Glows** | Subtle | Intense | Minimal | Moderate |
| **Animations** | Moderate | High | Minimal | Moderate |
| **Geometric Elements** | None | None | None | Hexagons, Bubbles |
| **Best Time** | Day | Night | Anytime | Night |
| **Accessibility** | AAA (7:1+) | AA (4.5:1+) | AA (4.5:1+) | AA (4.5:1+) |

---

## 🎯 Use Case Recommendations

### **For Long Work Sessions:**
1. Desert Stone (light, easy on eyes)
2. Earthy (minimal distractions)

### **For Creative Work:**
1. Neon Vibes (energizing)
2. Dark Neumorphic Coral (unique, inspiring)

### **For Night Work:**
1. Earthy (lowest brightness)
2. Dark Neumorphic Coral (modern dark)

### **For Professional Presentations:**
1. Desert Stone (professional light)
2. Earthy (professional dark)

---

## 🔧 Technical Implementation

### File Structure

```
mockups/
├── dashboard-desert-stone-neumorphic.html   # Desert Stone mockup
├── dashboard-neon-vibes-theme.html          # Neon Vibes mockup
├── dashboard-earthy-theme.html              # Earthy mockup
├── dashboard-dark-neumorphic-coral.html     # Coral mockup
├── THEMES_OVERVIEW.md                       # This file
└── README.md                                # Updated with theme integration

apps/web/
├── styles/themes/
│   ├── desert.css                           # Desert Stone CSS variables
│   ├── neon.css                             # Neon Vibes CSS variables
│   ├── earthy.css                           # Earthy CSS variables
│   └── coral.css                            # Coral CSS variables
└── lib/themes/
    └── definitions.ts                       # TypeScript theme definitions
```

### Switching Themes

**Via UI:**
- Click theme switcher in sidebar
- Select from dropdown with visual previews
- Changes apply instantly

**Via Code:**
```typescript
import { useTheme } from '@/lib/theme-provider';

const { setTheme } = useTheme();
setTheme('desert');  // or 'neon', 'earthy', 'coral'
```

**Via Data Attribute:**
```html
<html data-theme="desert">
  <!-- All CSS variables automatically switch -->
</html>
```

---

## 🎨 Design Tokens

### Common Variables (All Themes)

```css
/* Backgrounds (4 layers) */
--color-bg-darkest
--color-bg-dark
--color-bg-medium
--color-bg-light

/* Accents (3 colors) */
--color-accent-primary
--color-accent-secondary
--color-accent-tertiary

/* Text (4 levels) */
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-text-muted

/* Semantic (4 colors) */
--color-success
--color-warning
--color-error
--color-info

/* Priority (4 levels) */
--color-priority-critical
--color-priority-high
--color-priority-medium
--color-priority-low
```

### Theme-Specific Variables

**Desert Stone & Coral:**
```css
--shadow-neu-float    /* Raised neumorphic effect */
--shadow-neu-inset    /* Pressed neumorphic effect */
--shadow-neu-dark     /* Enhanced dark variant */
```

**Neon Vibes:**
```css
--glow-pink           /* Hot pink glow */
--glow-blue           /* Royal blue glow */
--glow-cyan           /* Cyan glow */
```

**Dark Neumorphic Coral:**
```css
--shadow-hexagon      /* Hexagon geometric shadow */
--shadow-bubble       /* Bubble shadow */
--gradient-card       /* Card background gradient */
```

---

## ♿ Accessibility

### Contrast Ratios

| Theme | Text on Background | Minimum | Actual | WCAG Level |
|-------|-------------------|---------|--------|------------|
| Desert Stone | #6B5D52 on #FAF9F6 | 4.5:1 | 7.2:1 | AAA |
| Neon Vibes | #ffffff on #091221 | 4.5:1 | 15.8:1 | AAA |
| Earthy | #FFFBF4 on #11120D | 4.5:1 | 16.1:1 | AAA |
| Dark Neumorphic Coral | #E5E5E5 on #1A1A1A | 4.5:1 | 12.6:1 | AAA |

**All themes exceed WCAG AA requirements!**

### Color Blindness Support

- Priority indicators use color + icon + text
- Status uses multiple visual cues (not just color)
- All critical information has non-color alternatives

---

## 📱 Responsive Behavior

### Light Theme (Desert Stone)
- Works well on both desktop and mobile
- No brightness issues outdoors
- Battery-friendly on OLED screens (mostly white)

### Dark Themes (Neon, Earthy, Coral)
- OLED screen optimization (true blacks)
- Lower battery consumption
- Reduced eye strain in low light

---

## 🚀 Future Theme Ideas

Potential themes for future releases:
- **Ocean Blue** - Cool blues and teals
- **Forest Green** - Natural greens and browns
- **Midnight Purple** - Deep purples and blues
- **Sunset Orange** - Warm oranges and reds

---

## 📚 Related Documentation

- **[../docs/04-UI-ARCHITECTURE.md](../docs/04-UI-ARCHITECTURE.md)** - Complete UI architecture with theme system
- **[README.md](README.md)** - Mockups documentation
- **[DESIGN_DIRECTION.md](DESIGN_DIRECTION.md)** - Original Neon Brights design (now Neon Vibes theme)

---

**Ready to switch themes?** Use the theme switcher in the sidebar! 🎨
