# Trustpilot Widget Integration Guide

## 🌟 Simple Trustpilot Widget Embed

Since you only need a 5-star display widget on your project page, here's the simple frontend-only solution:

### **Frontend Widget Code**

Add this to your project page where you want the Trustpilot widget:

```html
<!-- Trustpilot Widget -->
<div
  class="trustpilot-widget"
  data-locale="en-US"
  data-template-id="5419b6a8b0d04a076446a9ad"
  data-businessunit-id="YOUR_BUSINESS_UNIT_ID"
  data-style-height="24px"
  data-style-width="100%"
  data-theme="light"
  data-stars="5"
>
  <a
    href="https://www.trustpilot.com/review/YOUR-DOMAIN.com"
    target="_blank"
    rel="noopener"
    >Trustpilot</a
  >
</div>

<!-- Trustpilot Script -->
<script
  type="text/javascript"
  src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
  async
></script>
```

### **React/Next.js Component**

```jsx
// components/TrustpilotWidget.jsx
import { useEffect } from "react";

const TrustpilotWidget = ({ businessUnitId, domain }) => {
  useEffect(() => {
    // Load Trustpilot widget script
    if (window.Trustpilot) {
      window.Trustpilot.loadFromElement(
        document.getElementById("trustpilot-widget")
      );
    }
  }, []);

  return (
    <div
      id="trustpilot-widget"
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="5419b6a8b0d04a076446a9ad"
      data-businessunit-id={businessUnitId}
      data-style-height="24px"
      data-style-width="100%"
      data-theme="light"
      data-stars="5"
    >
      <a
        href={`https://www.trustpilot.com/review/${domain}`}
        target="_blank"
        rel="noopener"
      >
        Trustpilot Reviews
      </a>
    </div>
  );
};

export default TrustpilotWidget;
```

### **Setup Steps**

1. **Get Business Unit ID**: Visit [Trustpilot Business](https://business.trustpilot.com) and get your business unit ID
2. **Add to Frontend**: Place the widget component on your project page
3. **Style as Needed**: Customize the appearance with CSS
4. **No Backend Required**: This is purely frontend - no database or API needed

### **Benefits of Widget-Only Approach**

- ✅ **Simple**: Just embed code, no complex backend
- ✅ **Fast**: No database queries or API calls
- ✅ **Reliable**: Hosted by Trustpilot, always up-to-date
- ✅ **SEO Friendly**: Shows real reviews from Trustpilot
- ✅ **Zero Maintenance**: No code to maintain

---

## 🔍 Scam Adviser Check Required

You mentioned checking Scam Adviser. Let me check the current status...
