# 🎨 Trustpilot Widget Templates - Quick Reference

## Available Widget Templates

Your custom template IDs: `0bff66558872c58ed5b8b7942acc34d9`, `74ecde4d46d4b399c7295cf599d2886b`

### 1. Mini Star Widget

**Template ID**: `5419b6a8b0d04a076446a9ad`

**Best for**: Headers, footers, navigation bars

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="mini" height={24} width={150} />
```

**Features**:

-   Compact star rating
-   Small footprint (24px height)
-   Perfect for tight spaces

---

### 2. Micro Review Count

**Template ID**: `5419b6ffb0d04a076446a9b6`

**Best for**: Sidebars, badges

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="micro" height={20} width={120} />
```

**Features**:

-   Minimal size
-   Shows review count
-   Great for mobile

---

### 3. Quote Widget

**Template ID**: `0bff66558872c58ed5b8b7942acc34d9` ✨ (Your Custom ID)

**Best for**: Landing pages, hero sections, testimonials

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="quote" height={240} width="100%" theme="dark" />
```

**Features**:

-   Shows single featured review
-   Large, prominent display
-   Great for social proof

---

### 4. Carousel Widget

**Template ID**: `53aa8912dec7e10d38f59f36`

**Best for**: Homepage, about page

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="carousel" height={350} width="100%" stars="5" />
```

**Features**:

-   Rotating reviews
-   Auto-play option
-   Eye-catching animation
-   Shows only 5-star reviews

---

### 5. List Widget

**Template ID**: `539ad60defb9600b94d7df2c`

**Best for**: Reviews page, testimonials section

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="list" height={500} width="100%" />
```

**Features**:

-   Vertical list of reviews
-   Scrollable
-   Shows multiple reviews at once

---

### 6. Grid Widget

**Template ID**: `539adbd6dec7e10e686debee`

**Best for**: Wide sections, landing pages

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="grid" height={500} width="100%" />
```

**Features**:

-   Multiple columns
-   Responsive layout
-   Shows many reviews

---

### 7. Custom Template

**Template ID**: `74ecde4d46d4b399c7295cf599d2886b` ✨ (Your Custom ID)

**Best for**: Your specific design needs

**Usage**:

```tsx
<TrustpilotWidgetEmbedded template="custom" customTemplateId="74ecde4d46d4b399c7295cf599d2886b" height={300} width="100%" />
```

**Features**:

-   Your custom Trustpilot widget design
-   Fully customizable in Trustpilot portal
-   Use any template ID

---

## Props Reference

```tsx
type Props = {
  template?: "mini" | "micro" | "carousel" | "list" | "grid" | "quote" | "custom";
  customTemplateId?: string; // For custom templates
  height?: number | string; // e.g., 240, "auto"
  width?: number | string; // e.g., "100%", 300
  theme?: "light" | "dark"; // Match your site theme
  stars?: string; // Filter: "5" = only 5-star reviews
  tags?: string; // Filter by tags (optional)
  locale?: string; // Default: "en-US"
};
```

---

## Recommended Placements

### Homepage

```tsx
// Hero section - Quote or Mini
<TrustpilotWidgetEmbedded template="quote" height={240} width="100%" />

// Middle section - Carousel
<TrustpilotWidgetEmbedded template="carousel" height={350} width="100%" stars="5" />

// Footer - Mini
<TrustpilotWidgetEmbedded template="mini" height={24} width={150} />
```

### Navigation/Header

```tsx
<TrustpilotWidgetEmbedded template="mini" height={24} width={150} theme="dark" />
```

### Product/Service Page

```tsx
// Top - Mini for credibility
<TrustpilotWidgetEmbedded template="mini" height={24} width={150} />

// Bottom - Carousel for social proof
<TrustpilotWidgetEmbedded template="carousel" height={300} width="100%" />
```

### Reviews/Testimonials Page

```tsx
// Main content - List or Grid
<TrustpilotWidgetEmbedded template="list" height={600} width="100%" />
```

### Checkout/Pricing Page

```tsx
// Trust badge - Quote widget
<TrustpilotWidgetEmbedded template="quote" height={240} width="100%" />
```

---

## Theme Examples

### Dark Theme (for dark backgrounds)

```tsx
<TrustpilotWidgetEmbedded template="carousel" theme="dark" height={350} width="100%" />
```

### Light Theme (for light backgrounds)

```tsx
<TrustpilotWidgetEmbedded template="carousel" theme="light" height={350} width="100%" />
```

---

## Filtering Examples

### Show only 5-star reviews

```tsx
<TrustpilotWidgetEmbedded template="carousel" stars="5" height={350} width="100%" />
```

### Show only 5-star reviews (recommended)

```tsx
<TrustpilotWidgetEmbedded template="list" stars="5" height={500} width="100%" />
```

---

## Responsive Sizing

### Auto height (adapts to content)

```tsx
<TrustpilotWidgetEmbedded template="list" height="auto" width="100%" />
```

### Fixed height with scroll

```tsx
<TrustpilotWidgetEmbedded template="list" height={400} width="100%" />
```

### Responsive width

```tsx
<TrustpilotWidgetEmbedded
  template="carousel"
  height={350}
  width="100%"  // Full width
/>

<TrustpilotWidgetEmbedded
  template="mini"
  height={24}
  width="fit-content"  // Adapts to content
/>
```

---

## Complete Example

```tsx
import TrustpilotWidgetEmbedded from "@/components/TrustpilotWidgetEmbedded";

export default function HomePage() {
  return (
    <div className="bg-gray-900 text-white">
      {/* Header - Mini widget */}
      <header className="py-4 px-6 flex justify-between items-center">
        <div className="logo">Your Logo</div>
        <TrustpilotWidgetEmbedded template="mini" height={24} width={150} theme="dark" />
      </header>

      {/* Hero - Quote widget */}
      <section className="container mx-auto py-12 px-4">
        <h1 className="text-5xl font-bold mb-8">Welcome</h1>
        <TrustpilotWidgetEmbedded template="quote" height={240} width="100%" theme="dark" />
      </section>

      {/* Reviews - Carousel */}
      <section className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold mb-6">What Our Customers Say</h2>
        <TrustpilotWidgetEmbedded template="carousel" height={350} width="100%" stars="5" theme="dark" />
      </section>

      {/* Custom widget */}
      <section className="container mx-auto py-12 px-4">
        <TrustpilotWidgetEmbedded template="custom" customTemplateId="0bff66558872c58ed5b8b7942acc34d9" height={300} width="100%" theme="dark" />
      </section>

      {/* Footer - Mini widget */}
      <footer className="py-6 px-4 text-center">
        <TrustpilotWidgetEmbedded template="mini" height={24} width={150} theme="dark" />
      </footer>
    </div>
  );
}
```

---

## Testing Your Widgets

### View All Templates

Create a test page to see all widget options:

```tsx
import TrustpilotWidgetShowcase from "@/components/TrustpilotWidgetShowcase";

export default function WidgetTestPage() {
  return (
    <div className="container mx-auto p-8">
      <TrustpilotWidgetShowcase />
    </div>
  );
}
```

Navigate to `/widget-test` (or whatever route you create) to see:

-   All 7 widget templates
-   Live examples
-   Copy-paste ready code
-   Recommended use cases

---

## Getting Your Custom Template IDs

1. Log in to [Trustpilot Business Portal](https://businessapp.b2b.trustpilot.com/)
2. Go to **Integrations** → **Widgets**
3. Create or customize a widget
4. Copy the template ID from the embed code
5. Use it with `customTemplateId` prop

Example embed code from Trustpilot:

```html
<div class="trustpilot-widget" data-template-id="YOUR_TEMPLATE_ID_HERE"></div>
```

Your custom IDs:

-   `0bff66558872c58ed5b8b7942acc34d9`
-   `74ecde4d46d4b399c7295cf599d2886b`

---

## Troubleshooting

### Widget not showing

1. Check `NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID` is set
2. Verify template ID is correct
3. Check browser console for errors

### Widget looks wrong

1. Adjust `height` and `width` props
2. Try different `theme` ("light" or "dark")
3. Clear browser cache

### Widget not loading

1. Check internet connection (CDN loads from Trustpilot)
2. Verify no ad blockers are interfering
3. Check browser console for script errors

---

**Quick Start**: Use `template="mini"` for headers, `template="carousel"` for homepages, and your custom templates for special designs!

**Pro Tip**: Always set `stars="5"` to show only the best 5-star reviews! ⭐⭐⭐⭐⭐
