// ============================================================================
// TEMPLATE README - Quick Start Guide
// ============================================================================

# 🚀 Responsive Starter Template

A production-ready, fully responsive HTML/CSS/TypeScript template with:

-   ✅ **Dark mode** with localStorage persistence
-   ✅ **Mobile navigation** with smooth animations
-   ✅ **Accessibility** (ARIA labels, keyboard nav, skip links)
-   ✅ **SEO optimized** semantic HTML5
-   ✅ **Performance** optimized (preload, lazy load, async)
-   ✅ **TypeScript** type-safe utilities
-   ✅ **Sass integration** with design system

---

## 📁 File Structure

```
templates/
├── index.html          # Main template (hero, features, CTA, footer)
├── template.css        # Compiled CSS (use this or compile from Sass)
├── template.ts         # TypeScript utilities (compile to .js)
└── template.js         # Compiled JavaScript (auto-generated)

styles/
├── utils/
│   ├── _variables.scss         # Design tokens (updated with theme vars)
│   ├── _template-mixins.scss   # Template-specific mixins (NEW)
│   └── _mixins.scss            # Existing mixins
└── components/
    └── _template.scss          # Template integration (NEW)
```

---

## ⚡ Quick Start (3 Steps)

### 1. Compile TypeScript

```bash
# From project root
npx tsc templates/template.ts --outDir templates --lib es2015,dom

# Or add to package.json scripts:
"scripts": {
  "template:build": "tsc templates/template.ts --outDir templates --lib es2015,dom"
}
```

### 2. Open in Browser

```bash
# Option 1: Direct file
# Just open templates/index.html in your browser

# Option 2: Live server (recommended)
npx live-server templates

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### 3. Integrate with Sass (Optional)

```bash
# Import template styles into your main.scss
@import 'components/template';

# Then compile
npm run sass:build
```

---

## 🎨 Features Included

### ✅ Header

-   **Sticky navigation** with blur backdrop
-   **Logo** with SVG gradient
-   **Desktop menu** with 5 nav links
-   **Mobile hamburger** with smooth animation
-   **Theme toggle** (sun/moon icons)
-   **CTA buttons** (Login + Get Started)

### ✅ Hero Section

-   **Gradient background** with overlay
-   **Responsive typography** (5xl → 3xl on mobile)
-   **CTA buttons** with icons
-   **Stats display** (3 metrics: $2.4M, 10k, 99.9%)

### ✅ Features Grid

-   **6 feature cards** with icons
-   **Responsive layout** (1 col → 2 col → 3 col)
-   **Hover effects** with transform + shadow
-   **SVG icons** from Feather Icons

### ✅ CTA Section

-   **Gradient card** with call-to-action
-   **Centered layout** with button

### ✅ Footer

-   **4-column grid** (responsive: 1 col → 4 col)
-   **Social links** (Twitter, GitHub, LinkedIn)
-   **Footer links** (Product, Resources, Company)
-   **Badges** (SOC 2, 256-bit encryption)
-   **Copyright** with current year

### ✅ Dark Mode

-   **Toggle button** in header (auto-save to localStorage)
-   **System preference** detection (prefers-color-scheme)
-   **Smooth transitions** (250ms cubic-bezier)
-   **48 CSS variables** with theme overrides

### ✅ Mobile Navigation

-   **Hamburger animation** (3-bar → X)
-   **Slide-down menu** with opacity fade
-   **Body scroll lock** when menu open
-   **Click outside** to close
-   **Escape key** to close
-   **Auto-close** on link click

### ✅ Accessibility

-   **ARIA labels** on all interactive elements
-   **Keyboard navigation** (Tab, Escape, Enter)
-   **Skip to main content** link
-   **Focus-visible** polyfill
-   **Screen reader** friendly
-   **Semantic HTML5** (header, main, footer, nav, section, article)

### ✅ Performance

-   **Preconnect** to Google Fonts
-   **Async font loading** with display=swap
-   **Scroll throttling** (100ms debounce)
-   **Lazy animations** (only on visible elements)
-   **Reduced motion** support (@media prefers-reduced-motion)

---

## 🛠️ Customization Guide

### Change Colors

Edit CSS variables in `template.css` (or Sass variables):

```css
:root {
  --color-primary: #4f46e5; /* Change to your brand color */
  --color-secondary: #7c3aed; /* Secondary brand color */
  --gradient-primary: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}
```

### Change Fonts

Replace Google Fonts link in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT:wght@300;400;600;700&display=swap" rel="stylesheet" />
```

Update CSS variable:

```css
:root {
  --font-sans: "Your Font", -apple-system, sans-serif;
}
```

### Change Logo

Replace SVG in header (line 29):

```html
<svg width="32" height="32" viewBox="0 0 32 32">
  <!-- Your logo SVG path here -->
</svg>
```

### Add New Sections

Copy existing section structure:

```html
<section class="your-section">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">Your Title</h2>
      <p class="section-description">Description</p>
    </div>
    <!-- Your content -->
  </div>
</section>
```

### Modify Breakpoints

Edit responsive breakpoints in `template.css`:

```css
/* Current breakpoints:
   - Mobile: 0-767px
   - Tablet: 768px-1023px
   - Desktop: 1024px+
   - Large: 1280px+
*/

@media (min-width: 768px) {
  /* Tablet styles */
}
@media (min-width: 1024px) {
  /* Desktop styles */
}
```

---

## 🎯 Usage Scenarios

### Scenario 1: Standalone Landing Page

1. Copy `templates/index.html` to your project
2. Copy `templates/template.css` and `templates/template.js`
3. Update content, colors, and images
4. Deploy to static hosting (Vercel, Netlify, GitHub Pages)

### Scenario 2: Integrate with Next.js

```tsx
// app/landing/page.tsx
import "@/templates/template.css";

export default function Landing() {
  return <div dangerouslySetInnerHTML={{ __html: templateHTML }} />;
}
```

### Scenario 3: WordPress Theme

1. Convert HTML to PHP template parts:
   -   `header.php` → site-header
   -   `footer.php` → site-footer
   -   `front-page.php` → hero + features + CTA
2. Enqueue styles in `functions.php`:

   ```php
   wp_enqueue_style('template', get_template_directory_uri() . '/template.css');
   wp_enqueue_script('template', get_template_directory_uri() . '/template.js');
   ```

### Scenario 4: React Component Library

Convert sections to components:

```tsx
// components/Header.tsx
export function Header() {
  const { theme, toggleTheme } = useTheme();
  return <header className="site-header">...</header>;
}

// components/Hero.tsx
export function Hero({ title, description }) {
  return <section className="hero-section">...</section>;
}
```

---

## 📊 Browser Support

| Browser        | Version | Dark Mode | Mobile Nav | Animations |
| -------------- | ------- | --------- | ---------- | ---------- |
| Chrome         | 90+     | ✅        | ✅         | ✅         |
| Firefox        | 88+     | ✅        | ✅         | ✅         |
| Safari         | 14+     | ✅        | ✅         | ✅         |
| Edge           | 90+     | ✅        | ✅         | ✅         |
| Opera          | 76+     | ✅        | ✅         | ✅         |
| iOS Safari     | 14+     | ✅        | ✅         | ✅         |
| Chrome Android | 90+     | ✅        | ✅         | ✅         |

**IE11**: Not supported (no CSS variables, no grid layout)

---

## 🔧 TypeScript API

### `themeManager`

```typescript
themeManager.init(); // Initialize theme system
themeManager.toggle(); // Toggle light/dark
themeManager.setTheme("dark"); // Set specific theme
themeManager.getTheme(); // Get current theme
```

### `mobileMenuManager`

```typescript
mobileMenuManager.init(); // Initialize mobile menu
mobileMenuManager.toggle(); // Toggle menu open/close
mobileMenuManager.close(); // Force close menu
```

### `scrollManager`

```typescript
scrollManager.init(); // Initialize smooth scrolling
scrollManager.smoothScrollTo("#features"); // Scroll to element
```

### `accessibilityManager`

```typescript
accessibilityManager.init(); // Initialize a11y features
// - Adds skip-to-main-content link
// - Adds focus-visible polyfill
// - Adds keyboard navigation
```

---

## 🎨 Sass Integration

### Using Template Mixins

```scss
// Import in your component
@import "../utils/template-mixins";

.my-header {
  @include sticky-header(80px, true); // Custom height + blur
}

.my-card {
  @include feature-card-hover; // Hover animation
  @include glass-morphism(0.9); // Glass effect
}

.my-title {
  @include text-gradient(135deg, #ff0080, #7928ca);
}
```

### Responsive Utilities

```scss
.my-component {
  @include respond-to(xs) {
    font-size: 14px; // Mobile
  }

  @include respond-to(md) {
    font-size: 16px; // Tablet
  }

  @include respond-to(lg) {
    font-size: 18px; // Desktop
  }
}
```

### Theme-Aware Components

```scss
.my-element {
  @include theme-aware(background-color, #ffffff, #0f172a);
  @include theme-aware(color, #111827, #f1f5f9);
}
```

---

## 📦 Production Checklist

Before deploying:

-   [ ] **Compile TypeScript**: `tsc templates/template.ts`
-   [ ] **Minify CSS**: Use `sass --style=compressed` or PostCSS
-   [ ] **Optimize images**: Compress hero images, convert to WebP
-   [ ] **Update meta tags**: Title, description, Open Graph
-   [ ] **Add favicon**: Generate all sizes (16x16, 32x32, 180x180)
-   [ ] **Test dark mode**: Toggle and refresh page
-   [ ] **Test mobile nav**: Open, close, click links
-   [ ] **Test accessibility**: Tab through page, use screen reader
-   [ ] **Lighthouse audit**: Target 90+ scores
-   [ ] **Cross-browser test**: Chrome, Firefox, Safari, Edge
-   [ ] **Mobile test**: iOS Safari, Chrome Android

---

## 🐛 Troubleshooting

### Dark mode not persisting

-   Check localStorage: `localStorage.getItem('theme')`
-   Verify TypeScript compiled: `templates/template.js` exists
-   Check console for errors

### Mobile menu not animating

-   Ensure `aria-expanded` attribute toggles
-   Check `.active` class added to `#navMenu`
-   Verify CSS transition properties present

### Sticky header not sticking

-   Check `position: sticky` support in browser
-   Ensure header has `top: 0` and `z-index: 1000`
-   Verify no parent has `overflow: hidden`

### Fonts not loading

-   Check Google Fonts link in `<head>`
-   Verify network tab shows fonts downloaded
-   Use `font-display: swap` for FOUT prevention

### Theme toggle not working

-   Check `#themeToggle` element exists
-   Verify TypeScript compiled and loaded
-   Check console for `initTemplate()` logs

---

## 📚 Resources

-   **Feather Icons**: <https://feathericons.com/> (used for all icons)
-   **Google Fonts**: <https://fonts.google.com/> (Inter font family)
-   **CSS Variables**: <https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties>
-   **ARIA**: <https://www.w3.org/WAI/ARIA/apg/> (accessibility patterns)
-   **Lighthouse**: <https://developers.google.com/web/tools/lighthouse> (performance audit)

---

## 🎉 Credits

Created for **Advancia Pay** platform.  
Template follows [Advancia Copilot Instructions](../.github/copilot-instructions.md).

Built with ❤️ using:

-   HTML5 semantic elements
-   CSS Grid + Flexbox
-   CSS Custom Properties (variables)
-   TypeScript with strict types
-   Sass with BEM methodology
-   Mobile-first responsive design

---

## 📝 License

This template is part of the Advancia Pay project.  
See main project LICENSE file for details.

---

**Questions?** Check `PR_GUIDE.md` for contribution guidelines or open an issue.
