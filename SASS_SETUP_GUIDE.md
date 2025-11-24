# 🎨 Self-Hosted Sass Project Setup

**Complete guide for Advancia Pay's custom Sass styling system**

---

## 📁 Project Structure

### Directory Layout

```text
styles/
├── main.scss                 # Main entry point (imports everything)
├── base/
│   ├── _reset.scss          # Modern CSS reset
│   └── _typography.scss     # Typography styles
├── components/
│   ├── _buttons.scss        # Button components
│   ├── _cards.scss          # Card components
│   └── _forms.scss          # Form components
├── layout/
│   ├── _header.scss         # Header & navigation
│   └── _dashboard.scss      # Dashboard layout
├── pages/
│   └── _dashboard.scss      # Dashboard page styles
└── utils/
    ├── _variables.scss      # Design system variables
    └── _mixins.scss         # Reusable mixins

public/
└── css/
    └── main.css             # Compiled output (DO NOT EDIT)
```

---

## 🚀 Quick Start

### 1. Install Sass (Local / Self-Hosted)

```powershell
# Install Sass globally
npm install -g sass

# OR install as dev dependency
npm install --save-dev sass
```

### 2. Compile Sass (One-Time)

```powershell
# Compile to CSS
npm run sass

# Output: public/css/main.css
```

### 3. Watch Mode (Auto-Compile on Save)

```powershell
# Start Sass watcher
npm run sass:watch

# Now edit any .scss file and it auto-compiles!
```

### 4. Production Build (Minified)

```powershell
# Compile + minify for production
npm run sass:build

# Output: public/css/main.css (compressed)
```

---

## 📜 Available npm Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run sass`       | Compile Sass once                            |
| `npm run sass:watch` | Watch for changes + auto-compile             |
| `npm run sass:build` | Compile + minify for production (compressed) |

---

## 🎨 Using the Compiled CSS

### In HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Advancia Pay</title>

    <!-- Link to compiled CSS -->
    <link rel="stylesheet" href="/css/main.css" />
  </head>
  <body>
    <div class="container">
      <h1 class="text-gradient">Welcome to Advancia Pay</h1>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </body>
</html>
```

### In Next.js (Frontend)

```tsx
// In _app.tsx or layout.tsx
import "../../../public/css/main.css";

// OR use Next.js public folder
// Access at: /css/main.css
```

---

## 🧩 Using Sass Utilities

### Variables Example

```scss
// In your custom .scss file:
@import "../utils/variables";

.my-component {
  background: $color-primary;
  padding: $spacing-4;
  border-radius: $border-radius-lg;
}
```

### Mixins Example

```scss
@import "../utils/mixins";

.my-card {
  @include card;
  @include hover-lift;
}

.my-button {
  @include button-base;
  @include gradient-primary;
}
```

### Responsive Design

```scss
.hero {
  font-size: $font-size-2xl;

  @include respond-to(md) {
    font-size: $font-size-4xl;
  }

  @include respond-to(lg) {
    font-size: $font-size-5xl;
  }
}
```

---

## 🎯 Utility Classes (Available Out of the Box)

### Buttons

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Loading State -->
<button class="btn btn-primary btn-loading">Processing...</button>
```

### Cards

```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">Card content goes here</div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>

<!-- Gradient Cards -->
<div class="card card-gradient">Gradient card</div>
<div class="card card-crypto">Crypto card</div>
```

### Forms

```html
<div class="form-group">
  <label class="form-label">Email Address</label>
  <input type="email" class="form-input" placeholder="you@example.com" />
  <p class="form-helper">We'll never share your email</p>
</div>

<!-- With Icon -->
<div class="input-group">
  <span class="input-group-icon">🔍</span>
  <input type="text" class="form-input" placeholder="Search..." />
</div>
```

### Spacing

```html
<div class="m-4">Margin all sides: 16px</div>
<div class="mt-8">Margin top: 32px</div>
<div class="p-6">Padding all sides: 24px</div>
<div class="mb-12">Margin bottom: 48px</div>
```

### Text Utilities

```html
<h1 class="text-gradient">Gradient Text</h1>
<h2 class="text-crypto">Crypto Gradient</h2>
<p class="text-primary">Primary color text</p>
<p class="text-muted">Muted text</p>
<p class="text-truncate">This text will truncate with ellipsis...</p>
```

### Layout

```html
<div class="flex-center">Centered content</div>
<div class="flex-between">Space between items</div>
<div class="flex-column">Column layout</div>
<div class="container">Max-width container with padding</div>
```

---

## 🔧 Customization

### Add Your Own Variables

Edit `styles/utils/_variables.scss`:

```scss
// Add custom brand colors
$color-brand: #ff6b6b;
$color-dark: #2c3e50;

// Add custom spacing
$spacing-32: 8rem;
```

### Create New Components

Create `styles/components/_my-component.scss`:

```scss
.my-component {
  @include card;
  background: $color-primary;

  &-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
  }

  &:hover {
    @include hover-lift;
  }
}
```

Then import it in `main.scss`:

```scss
@import "components/my-component";
```

---

## 🎨 Live Development Setup

### Option 1 - With Live Server (Recommended)

```powershell
# Terminal 1: Watch Sass
npm run sass:watch

# Terminal 2: Start Live Server (VS Code extension)
# Right-click index.html → "Open with Live Server"
```

### Option 2 - With npm-run-all

```powershell
# Install npm-run-all
npm install --save-dev npm-run-all

# Add to package.json scripts:
"dev:styles": "run-p sass:watch serve"

# Run both together
npm run dev:styles
```

---

## 📦 Complete package.json (Copy & Paste)

```json
{
  "name": "advancia-pay",
  "version": "1.0.0",
  "description": "Advancia Pay SaaS Platform",
  "scripts": {
    "sass": "sass styles/main.scss public/css/main.css",
    "sass:watch": "sass --watch styles/main.scss:public/css/main.css",
    "sass:build": "sass styles/main.scss public/css/main.css --style compressed",
    "serve": "live-server --port=8080 --open=public",
    "dev": "npm-run-all --parallel sass:watch serve"
  },
  "devDependencies": {
    "sass": "^1.69.5",
    "live-server": "^1.2.2",
    "npm-run-all": "^4.1.5"
  }
}
```

---

## ✅ Final Checklist

-   [x] Sass installed globally or locally
-   [x] Project structure created (`styles/` folder)
-   [x] Main entry file (`main.scss`) configured
-   [x] npm scripts added to `package.json`
-   [x] Compiled CSS output (`public/css/main.css`)
-   [ ] Sass watcher running in development
-   [ ] Production build tested (minified)
-   [ ] CSS linked in HTML/Next.js app

---

## 🚀 Common Commands Reference

```powershell
# One-time compile
npm run sass

# Development mode (auto-compile)
npm run sass:watch

# Production build (minified)
npm run sass:build

# Check Sass version
sass --version

# Manually compile with specific output style
sass styles/main.scss public/css/main.css --style=compressed

# Watch specific file
sass --watch styles/pages/_dashboard.scss:public/css/dashboard.css
```

---

## 🎯 Design System Colors

```scss
// Primary Colors
$color-primary: #3b82f6      // Blue
$color-secondary: #8b5cf6    // Purple
$color-accent: #10b981       // Green

// Crypto Colors
$color-bitcoin: #f7931a
$color-ethereum: #627eea
$color-usdt: #26a17b

// Usage
.btn-crypto {
  background: $color-bitcoin;
  color: white;
}
```

---

**🎉 You're all set! Start editing `.scss` files and watch them compile automatically.**

**Questions? Check the Sass official docs:** <https://sass-lang.com/documentation/>
