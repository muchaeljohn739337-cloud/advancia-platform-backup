/**
 * TEMPLATE UTILITIES - TypeScript
 * Handles theme switching, mobile menu, smooth scrolling, and accessibility
 */

// ===== Type Definitions =====
type Theme = "light" | "dark";

interface ThemeManager {
  init(): void;
  toggle(): void;
  setTheme(theme: Theme): void;
  getTheme(): Theme;
}

interface MobileMenuManager {
  init(): void;
  toggle(): void;
  close(): void;
}

interface ScrollManager {
  init(): void;
  smoothScrollTo(target: string): void;
}

// ===== Theme Manager =====
const themeManager: ThemeManager = {
  init() {
    // Get saved theme or use system preference
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    const theme = savedTheme || systemTheme;
    this.setTheme(theme);

    // Listen for theme toggle clicks
    const toggleButton = document.getElementById("themeToggle");
    if (toggleButton) {
      toggleButton.addEventListener("click", () => this.toggle());
    }

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          this.setTheme(e.matches ? "dark" : "light");
        }
      });

    console.log("✅ Theme Manager initialized:", theme);
  },

  toggle() {
    const currentTheme = this.getTheme();
    const newTheme: Theme = currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);

    // Provide haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  },

  setTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#0f172a" : "#4F46E5",
      );
    }

    console.log("🎨 Theme changed to:", theme);
  },

  getTheme(): Theme {
    return (
      (document.documentElement.getAttribute("data-theme") as Theme) || "light"
    );
  },
};

// ===== Mobile Menu Manager =====
const mobileMenuManager: MobileMenuManager = {
  init() {
    const toggleButton = document.getElementById("mobileMenuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!toggleButton || !navMenu) {
      console.warn("⚠️ Mobile menu elements not found");
      return;
    }

    // Toggle menu on button click
    toggleButton.addEventListener("click", () => this.toggle());

    // Close menu when clicking nav links
    const navLinks = navMenu.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => this.close());
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!toggleButton.contains(target) && !navMenu.contains(target)) {
        this.close();
      }
    });

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("active")) {
        this.close();
        toggleButton.focus();
      }
    });

    // Close menu on window resize (above mobile breakpoint)
    let resizeTimer: number;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (window.innerWidth >= 768) {
          this.close();
        }
      }, 250);
    });

    console.log("✅ Mobile Menu Manager initialized");
  },

  toggle() {
    const toggleButton = document.getElementById("mobileMenuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!toggleButton || !navMenu) return;

    const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("active");

    // Lock body scroll when menu is open
    if (!isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    console.log("📱 Mobile menu toggled:", !isExpanded ? "open" : "closed");
  },

  close() {
    const toggleButton = document.getElementById("mobileMenuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!toggleButton || !navMenu) return;

    toggleButton.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("active");
    document.body.style.overflow = "";
  },
};

// ===== Smooth Scroll Manager =====
const scrollManager: ScrollManager = {
  init() {
    // Handle all anchor links with smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const href = (anchor as HTMLAnchorElement).getAttribute("href");
        if (href && href !== "#") {
          e.preventDefault();
          this.smoothScrollTo(href);
        }
      });
    });

    // Add scroll-to-top button (optional)
    this.initScrollToTop();

    console.log("✅ Scroll Manager initialized");
  },

  smoothScrollTo(target: string) {
    const element = document.querySelector(target);
    if (!element) return;

    const headerOffset = 80; // Account for sticky header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    // Update URL without triggering navigation
    history.pushState(null, "", target);
  },

  initScrollToTop() {
    // Create scroll-to-top button
    const button = document.createElement("button");
    button.className = "scroll-to-top";
    button.setAttribute("aria-label", "Scroll to top");
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    `;

    // Add button styles
    const style = document.createElement("style");
    style.textContent = `
      .scroll-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--gradient-primary);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-lg);
        z-index: 999;
      }
      .scroll-to-top.visible {
        opacity: 1;
        pointer-events: all;
      }
      .scroll-to-top:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(button);

    // Show/hide button based on scroll position
    let scrollTimer: number;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        if (window.pageYOffset > 300) {
          button.classList.add("visible");
        } else {
          button.classList.remove("visible");
        }
      }, 100);
    });

    // Scroll to top on click
    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  },
};

// ===== Accessibility Enhancements =====
const accessibilityManager = {
  init() {
    // Add focus-visible polyfill behavior
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.add("user-is-tabbing");
      }
    });

    document.addEventListener("mousedown", () => {
      document.body.classList.remove("user-is-tabbing");
    });

    // Add skip to main content link
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.className = "skip-to-main";
    skipLink.textContent = "Skip to main content";

    const skipStyle = document.createElement("style");
    skipStyle.textContent = `
      .skip-to-main {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--color-primary);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 10000;
      }
      .skip-to-main:focus {
        top: 0;
      }
    `;
    document.head.appendChild(skipStyle);
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content id if not exists
    const mainContent = document.querySelector("main");
    if (mainContent && !mainContent.id) {
      mainContent.id = "main-content";
      mainContent.setAttribute("tabindex", "-1");
    }

    console.log("✅ Accessibility Manager initialized");
  },
};

// ===== Performance Monitor (Development Only) =====
const performanceMonitor = {
  init() {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      window.addEventListener("load", () => {
        const perfData = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;

        console.log("📊 Performance Metrics:");
        console.log(
          "  - DOM Content Loaded:",
          Math.round(perfData.domContentLoadedEventEnd),
          "ms",
        );
        console.log(
          "  - Load Complete:",
          Math.round(perfData.loadEventEnd),
          "ms",
        );
        console.log(
          "  - Time to Interactive:",
          Math.round(perfData.domInteractive),
          "ms",
        );
      });
    }
  },
};

// ===== Initialize Everything =====
function initTemplate() {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    console.log("🚀 Initializing template...");

    themeManager.init();
    mobileMenuManager.init();
    scrollManager.init();
    accessibilityManager.init();
    performanceMonitor.init();

    console.log("✨ Template initialized successfully!");
  }
}

// ===== Export for Module Systems =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    themeManager,
    mobileMenuManager,
    scrollManager,
    initTemplate,
  };
}

// ===== Auto-initialize =====
initTemplate();
