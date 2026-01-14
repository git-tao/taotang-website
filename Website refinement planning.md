# Website Refinement Planning

**Project:** taotang.io UI/UX Improvements
**Created:** January 12, 2026
**Last Updated:** January 12, 2026
**Status:** Ready for Implementation (Smith-validated)
**Reference Documentation:** `/Users/taotang/Downloads/UI Improvement Suggestions for Personal AI Engineer Website/`

---

## Executive Summary

This document outlines a concrete implementation plan to transform taotang.io from a functional but static website into a polished, world-class portfolio that builds trust and converts visitors. The plan synthesizes recommendations from three audit documents and incorporates the owner's specific decisions about photo placement and hero optimization.

### Key Owner Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Photo Placement | About section | Contextually supports credibility claims |
| Photo Style | Rounded Rectangle (16px radius) | Modern, professional aesthetic |
| Case Studies | Dedicated pages (`/case-study/[slug]`) | Shareable URLs (client-side meta only, not crawler SEO) |
| Motion Preference | Respect `prefers-reduced-motion` | Accessibility compliance |
| Case Study Content | Placeholder text initially | Owner will fill in later |
| Hosting Platform | Vercel | Automatic SPA routing support |
| Animation Approach | Global Observer | Single observer, simpler implementation |
| SEO Meta Management | Lightweight (document.title) | UX only - crawlers won't see client-side updates |
| Scroll Restoration | ScrollToTop on every route | Consistent UX when navigating |

---

## Phase 0: Project Setup & Dependencies

**Goal:** Install required dependencies and configure deployment before implementation.

### 0.1 Install React Router

**Priority:** HIGH (Blocking for Phase 1.2)

```bash
npm install react-router-dom
```

**TypeScript types are included in react-router-dom v6+.**

### 0.2 Configure Vercel for SPA Routing

**Priority:** HIGH (Required for direct URL access to case study pages)

**File:** `vercel.json` (create in project root)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Why:** Without this, direct navigation to `/case-study/compliantphotos` returns 404. Vercel needs to route all paths to `index.html` for client-side routing to work.

**Verification:**
1. Deploy to Vercel
2. Navigate directly to `https://taotang.io/case-study/compliantphotos`
3. Page should load (not 404)

---

## Phase 1: Foundation & Quick Wins

**Goal:** Immediate improvements with minimal code changes.

### 1.1 Enable Smooth Scrolling ✅ (Already Done)

**File:** `index.html:29`
**Status:** Already implemented via `scroll-behavior: smooth` on body.

### 1.2 Implement Case Study Pages

**Priority:** HIGH
**Issue:** Case study cards link to `href="#"` which scrolls to page top.
**Files:**
- `src/components/sections/CaseStudies.tsx` - Update links
- `src/pages/CaseStudyPage.tsx` - New file
- `src/pages/NotFound.tsx` - New file
- `src/App.tsx` - Add routes
- `vercel.json` - SPA rewrites (see Phase 0.2)

**Decision:** Dedicated pages (not modals) for SEO and shareability.

**Implementation:**

**Step 1: Create Case Study Data Structure**
```tsx
// src/data/caseStudies.ts
export interface CaseStudy {
  slug: string;
  title: string;
  category: string;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  technologies: string[];
  metrics?: { label: string; value: string }[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'compliantphotos',
    title: 'CompliantPhotos.com',
    category: 'Full Stack AI System',
    summary: 'End-to-end vision AI system for passport photo regulatory compliance.',
    challenge: '[PLACEHOLDER: Describe the client challenge]',
    solution: '[PLACEHOLDER: Describe technical approach and architecture]',
    results: [
      'Automated 90% of manual quality control',
      'Sub-second latency for compliance checks',
      '[PLACEHOLDER: Additional metric]'
    ],
    technologies: ['Python', 'OpenCV', 'Google Gemini', 'FastAPI', 'React'],
    metrics: [
      { label: 'Automation Rate', value: '90%' },
      { label: 'Latency', value: '<1s' }
    ]
  },
  {
    slug: 'agent-orchestration',
    title: 'Agent Orchestration',
    category: 'Infrastructure & Scale',
    summary: 'High-concurrency autonomous agent platform at Meta.',
    challenge: '[PLACEHOLDER: Describe the engineering challenge]',
    solution: '[PLACEHOLDER: Describe technical approach]',
    results: [
      'Thousands of concurrent dynamic tool-use workflows',
      'Guaranteed state consistency',
      '[PLACEHOLDER: Additional metric]'
    ],
    technologies: ['Python', 'Distributed Systems', 'State Machines'],
    metrics: [
      { label: 'Concurrency', value: '1000s' },
      { label: 'Consistency', value: '100%' }
    ]
  }
];
```

**Step 2: Create NotFound Component**
```tsx
// src/pages/NotFound.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  // Set 404-specific title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '404 - Page Not Found | Tao Tang';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#212529] mb-4">404</h1>
        <p className="text-xl text-[#6C757D] mb-8">Page not found</p>
        <Link
          to="/"
          className="btn-primary inline-block px-8 py-3 rounded-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
```

**Step 3: Create Case Study Page Component with SEO**
```tsx
// src/pages/CaseStudyPage.tsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { caseStudies } from '../data/caseStudies';
import NotFound from './NotFound';

const CaseStudyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const study = caseStudies.find(s => s.slug === slug);

  // Update document title and meta description (UX only, not crawler SEO)
  useEffect(() => {
    if (study) {
      // Capture original values before modifying
      const originalTitle = document.title;
      const metaDescription = document.querySelector('meta[name="description"]');
      const originalDescription = metaDescription?.getAttribute('content') || '';

      // Update title
      document.title = `${study.title} - Case Study | Tao Tang`;

      // Update meta description
      if (metaDescription) {
        metaDescription.setAttribute('content', study.summary);
      }

      // Cleanup: restore original values on unmount
      return () => {
        document.title = originalTitle;
        if (metaDescription) {
          metaDescription.setAttribute('content', originalDescription);
        }
      };
    }
  }, [study]);

  if (!study) {
    return <NotFound />;
  }

  // Handle back navigation with location state (HomePage handles the scroll)
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/', { state: { scrollTo: 'case-studies' } });
  };

  return (
    <article className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb for SEO */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <a
            href="/#case-studies"
            onClick={handleBackClick}
            className="text-sm text-[#6C757D] hover:text-[#FFBF00] transition-colors"
          >
            ← Back to Case Studies
          </a>
        </nav>

        <header className="mb-12">
          <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest">
            {study.category}
          </span>
          <h1 className="text-4xl font-bold text-[#212529] mt-2 mb-4">
            {study.title}
          </h1>
          <p className="text-xl text-[#6C757D]">{study.summary}</p>
        </header>

        {/* Metrics Grid */}
        {study.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {study.metrics.map(m => (
              <div key={m.label} className="bg-[#F8F9FA] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#212529]">{m.value}</div>
                <div className="text-xs text-[#6C757D] uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#212529] mb-4">The Challenge</h2>
          <p className="text-[#212529] leading-relaxed">{study.challenge}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#212529] mb-4">The Solution</h2>
          <p className="text-[#212529] leading-relaxed">{study.solution}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#212529] mb-4">Results</h2>
          <ul className="space-y-2">
            {study.results.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFBF00] mt-2" />
                <span className="text-[#212529]">{r}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#212529] mb-4">Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {study.technologies.map(t => (
              <span key={t} className="px-3 py-1 bg-[#F8F9FA] rounded-full text-sm text-[#212529]">
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
};

export default CaseStudyPage;
```

**Step 4: Update CaseStudies.tsx to Map from Data**

**Important:** Cards must map from `caseStudies` array to prevent drift between card content and detail pages.

```tsx
// src/components/sections/CaseStudies.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { caseStudies } from '../../data/caseStudies';

const CaseStudies: React.FC = () => {
  return (
    <section id="case-studies" className="section-padding px-6 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-12 text-center animate-on-scroll">
          Case Studies
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {caseStudies.map((study, index) => (
            <Link
              key={study.slug}
              to={`/case-study/${study.slug}`}
              className={`card-hover group block p-8 rounded-xl animate-on-scroll stagger-${index + 1}`}
            >
              <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest">
                {study.category}
              </span>
              <h3 className="text-xl font-bold text-[#212529] mt-2 mb-3 group-hover:text-[#FFBF00] transition-colors">
                {study.title}
              </h3>
              <p className="text-[#6C757D] mb-4">{study.summary}</p>
              <div className="flex flex-wrap gap-2">
                {study.technologies.slice(0, 4).map(tech => (
                  <span key={tech} className="px-2 py-1 bg-[#E9ECEF] rounded text-xs text-[#212529]">
                    {tech}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
```

**Why this matters:** Single source of truth prevents title/summary drift between homepage cards and detail pages.

**Step 5: Create ScrollToTop Component**
```tsx
// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top on every route change.
 * Must be rendered inside BrowserRouter.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
```

**Step 6: Update App.tsx with Router**
```tsx
// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import CaseStudyPage from './pages/CaseStudyPage';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import { useGlobalScrollAnimation } from './hooks/useGlobalScrollAnimation';

// HomePage component wraps existing sections and preserves semantics
const HomePage: React.FC = () => {
  const location = useLocation();

  // Re-run animation observer on mount (handles returning from case study)
  useGlobalScrollAnimation();

  // Handle scroll-to from location state (e.g., back from case study)
  useEffect(() => {
    if (location.state?.scrollTo) {
      // Small delay to ensure DOM is ready after route transition
      requestAnimationFrame(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
      // Clear the state to prevent re-scrolling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Services />
        <AboutSnippet />
        <CaseStudies />
        <Process />
        <IntakeWizard />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/case-study/:slug" element={<CaseStudyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
```

**Key Changes from Original:**
- `ScrollToTop` component scrolls to top on every route change
- `useGlobalScrollAnimation` moved INTO `HomePage` so it re-runs on mount
- Wrapper preserves `min-h-screen bg-white` and `<main>` semantics
- Location state handler uses `requestAnimationFrame` instead of `setTimeout`
- State cleared after scroll to prevent re-scroll on refresh

**Meta Handling (UX only, not crawler SEO):**
- `document.title` updated per page in useEffect
- Original values captured and restored on unmount
- No additional dependencies required

**Analytics:**
- Track page views per case study
- Add UTM support for shared links

### 1.3 Add CSS Custom Properties for Spacing System

**Priority:** HIGH
**File:** `index.html` (add to `<style>` block)
**Reference:** `taotang_io_ui_audit_report.md` Recommendation 3

**Add to CSS:**
```css
:root {
    /* Existing variables... */

    /* 8-Point Grid Spacing System */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 16px;
    --space-4: 24px;
    --space-5: 32px;
    --space-6: 48px;
    --space-7: 64px;
    --space-8: 80px;
    --space-9: 96px;

    /* Shadows - REPLACE existing shadow definitions */
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.12);
    --shadow-amber: 0 8px 24px rgba(255, 191, 0, 0.15);
}
```

---

## Phase 2: Hero & About Section Restructure

**Goal:** Remove placeholder from hero, add professional photo to About section.

### 2.1 Simplify Hero Section

**Priority:** CRITICAL
**File:** `src/components/sections/Hero.tsx`

**Current State:**
- Two-column layout with text left, placeholder image right
- Placeholder shows generic person icon with "PROFESSIONAL PORTRAIT" label
- Desktop only (hidden on mobile)

**Target State:**
- Full-width, text-centered hero
- No image element
- Stronger visual impact with typography
- More compact vertical space

**Implementation:**
```tsx
// Hero.tsx - Simplified structure
const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-28 px-6 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl text-[#212529] leading-[1.05] mb-6 font-bold animate-hero">
          I help teams ship and stabilize production AI systems.
        </h1>
        <p className="text-lg md:text-xl text-[#6C757D] mb-10 max-w-2xl mx-auto leading-relaxed animate-hero animate-hero-delay-1">
          Hands-on, project-based work for engineering and product leaders who need to unblock delivery, audit complex systems, or move from prototype to production.
        </p>
        <a
          href="#services"
          className="btn-primary inline-block px-10 py-4 rounded-md animate-hero animate-hero-delay-2"
        >
          View Services
        </a>
      </div>
    </section>
  );
};
```

**Note:** Hero copy matches current site. If PRD specifies different copy, update accordingly.

### 2.2 Add Professional Photo to About Section

**Priority:** CRITICAL
**File:** `src/components/sections/AboutSnippet.tsx`
**Photo Location:** `/public/images/tao-portrait.jpg`

**Photo Asset Requirements:**
| Property | Specification |
|----------|---------------|
| Source dimensions | 1080x1080px (from provided image) |
| Display size | max-width: 320px |
| Format | JPEG (current), consider WebP conversion |
| Loading | `loading="lazy"` for below-fold |
| Aspect ratio | Square (1:1), displayed as rounded rectangle |
| Border radius | 16px (rounded rectangle per owner preference) |
| LCP consideration | Below fold, lazy loading appropriate |

**Implementation:**
```tsx
// AboutSnippet.tsx - With photo
const AboutSnippet: React.FC = () => {
  return (
    <section className="section-padding px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Photo Column */}
          <div className="md:col-span-4 animate-on-scroll">
            <div className="relative max-w-[320px] mx-auto">
              <img
                src="/images/tao-portrait.jpg"
                alt="Tao Tang - AI Systems Engineer"
                width="320"
                height="320"
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl shadow-lg object-cover aspect-square"
              />
              {/* Subtle border overlay */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 pointer-events-none" />
            </div>
          </div>

          {/* Content Column */}
          <div className="md:col-span-8">
            <h2 className="text-3xl font-bold text-[#212529] mb-6 animate-on-scroll">
              A Hands-On Partner for Technical Leaders
            </h2>
            <p className="text-lg text-[#212529] leading-relaxed mb-8 animate-on-scroll">
              I work as a focused, senior-level individual contributor to solve
              complex AI systems problems. My background includes shipping production
              systems at <span className="font-semibold">Meta</span> and multiple
              venture-backed startups, combined with a foundational computer science
              education from <span className="font-semibold">Stanford University</span>.
            </p>

            {/* Enhanced Credentials */}
            <div className="flex flex-wrap gap-4 animate-on-scroll">
              <div className="credential-badge">Meta</div>
              <div className="credential-badge">Stanford University</div>
              <div className="credential-badge">Venture-backed Startups</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
```

**Note:** Changed from `py-20 md:py-28` to `section-padding` for consistency with other sections.

**Credential Badge CSS (add to index.html):**
```css
.credential-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background-color: #F8F9FA;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    color: #212529;
}
```

---

## Phase 3: Animation System

**Goal:** Add scroll-triggered animations and micro-interactions with accessibility support.
**Reference:** `taotang_io_ui_audit_report.md` Section 4.5

**Decision:** Use Global Observer approach (single observer for all `.animate-on-scroll` elements).

### 3.1 Animation Accessibility & Fallback Strategy

**Critical Requirement:** Content must be visible even if:
1. JavaScript fails to load
2. User has `prefers-reduced-motion: reduce` set
3. Intersection Observer is not supported

**CSS-First Approach (add to index.html `<style>` block):**
```css
/* ===========================================
   ANIMATION SYSTEM
   - Visible by default (no-JS fallback)
   - Animations only apply when JS adds .js-enabled to html
   - Respects prefers-reduced-motion
   =========================================== */

/* Default: Content is visible */
.animate-on-scroll {
    opacity: 1;
    transform: none;
}

/* Only apply initial hidden state when JS is enabled */
html.js-enabled .animate-on-scroll {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

/* Visible state when intersection observer triggers */
html.js-enabled .animate-on-scroll.is-visible {
    opacity: 1;
    transform: translateY(0);
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    html.js-enabled .animate-on-scroll {
        opacity: 1;
        transform: none;
        transition: none;
    }

    .animate-hero,
    .animate-hero-delay-1,
    .animate-hero-delay-2,
    .animate-hero-delay-3 {
        animation: none;
        opacity: 1;
    }
}

/* Staggered animations for lists (supports up to 8 items) */
html.js-enabled .stagger-1 { transition-delay: 0ms; }
html.js-enabled .stagger-2 { transition-delay: 100ms; }
html.js-enabled .stagger-3 { transition-delay: 200ms; }
html.js-enabled .stagger-4 { transition-delay: 300ms; }
html.js-enabled .stagger-5 { transition-delay: 400ms; }
html.js-enabled .stagger-6 { transition-delay: 500ms; }
html.js-enabled .stagger-7 { transition-delay: 600ms; }
html.js-enabled .stagger-8 { transition-delay: 700ms; }

/* Hero entrance animation */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-hero {
    animation: fadeInUp 0.8s ease-out forwards;
}

.animate-hero-delay-1 { animation-delay: 0.1s; opacity: 0; }
.animate-hero-delay-2 { animation-delay: 0.2s; opacity: 0; }
.animate-hero-delay-3 { animation-delay: 0.3s; opacity: 0; }
```

**JavaScript Initialization - INLINE SCRIPT (add to index.html `<head>`):**

**Important:** Must be inline script, not in React, to prevent flash of hidden content.

```html
<!-- Add BEFORE </head> in index.html -->
<script>
  // Enable animations before first paint to prevent flash
  // Check for reduced motion preference and IntersectionObserver support
  (function() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIntersectionObserver = 'IntersectionObserver' in window;

    if (!prefersReducedMotion && hasIntersectionObserver) {
      document.documentElement.classList.add('js-enabled');
    }
  })();
</script>
```

### 3.2 Global Scroll Animation Observer

**Decision:** Use this approach (not per-element hook) for simplicity.

**File:** `src/hooks/useGlobalScrollAnimation.ts` (new file)

```tsx
import { useEffect } from 'react';

/**
 * Observes all .animate-on-scroll elements and adds .is-visible when in viewport.
 * Call once in App.tsx.
 *
 * Includes:
 * - IntersectionObserver feature detection with fallback
 * - Reduced motion preference check
 * - Cleanup on unmount
 */
export function useGlobalScrollAnimation() {
  useEffect(() => {
    // Feature detection: if IntersectionObserver not supported, show all content
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    // Skip animations if reduced motion is preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all animated elements
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
```

**Usage in App.tsx:**
```tsx
import { useGlobalScrollAnimation } from './hooks/useGlobalScrollAnimation';

const App: React.FC = () => {
  useGlobalScrollAnimation();
  // ...
};
```

### 3.3 Consolidated Hover Effects

**Important:** These styles REPLACE existing hover definitions in `index.html`. Remove duplicates.

**Replace existing `.card-hover` and `.btn-primary` rules with:**

```css
/* ===========================================
   INTERACTIVE ELEMENTS - CONSOLIDATED
   Replace all existing .card-hover, .btn-primary rules
   =========================================== */

/* Card hover effect - single definition */
.card-hover {
    background-color: #FFFFFF;
    border: 1px solid var(--light-gray);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.3s ease;
}

.card-hover:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg), var(--shadow-amber);
    border-color: var(--amber);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
    .card-hover:hover {
        transform: none;
    }
}

/* Primary button - single definition */
.btn-primary {
    background-color: var(--amber);
    color: var(--charcoal);
    font-weight: 600;
    transition: background-color 0.2s ease,
                transform 0.2s ease,
                box-shadow 0.2s ease;
}

.btn-primary:hover {
    background-color: var(--deep-amber);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(255, 191, 0, 0.25);
}

.btn-primary:active {
    background-color: var(--dark-amber);
    transform: translateY(0);
    box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
    .btn-primary:hover,
    .btn-primary:active {
        transform: none;
    }
}

/* Navigation link underline animation */
.nav-link {
    position: relative;
    color: var(--charcoal);
    transition: color 0.2s ease;
}

.nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--amber);
    transition: width 0.3s ease;
}

.nav-link:hover {
    color: var(--charcoal);
}

.nav-link:hover::after {
    width: 100%;
}

@media (prefers-reduced-motion: reduce) {
    .nav-link::after {
        transition: none;
    }
}
```

---

## Phase 4: Spacing & Layout Normalization

**Goal:** Implement consistent 8-point grid system.
**Reference:** `technical_improvement_plan.md` Section 3.2.1

### 4.1 Section-by-Section Spacing Map

**Current vs Target spacing for each component:**

| Component | File | Current Classes | Target Classes | Notes |
|-----------|------|-----------------|----------------|-------|
| Hero | `Hero.tsx` | `pt-40 pb-20 md:pt-60 md:pb-32` | `pt-32 pb-20 md:pt-48 md:pb-28` | Reduce top padding |
| Services | `Services.tsx` | `section-padding` | `section-padding` | Keep, update CSS |
| About | `AboutSnippet.tsx` | `section-padding` | `section-padding` | Keep consistent |
| Case Studies | `CaseStudies.tsx` | `section-padding` | `section-padding` | Keep, update CSS |
| Process | `Process.tsx` | `section-padding` | `section-padding` | Keep, update CSS |
| Intake Form | `IntakeWizard.tsx` | `section-padding` | `section-padding` | Keep, update CSS |

**Decision:** Use `.section-padding` CSS class as single source of truth for all sections.

### 4.2 Update Section Padding CSS

**File:** `index.html` - Replace existing `.section-padding`

```css
/* Section padding - REPLACE existing definition */
.section-padding {
    padding-top: var(--space-8);  /* 80px */
    padding-bottom: var(--space-8);
}

@media (min-width: 768px) {
    .section-padding {
        padding-top: var(--space-9);  /* 96px */
        padding-bottom: var(--space-9);
    }
}
```

### 4.3 Component Internal Spacing Updates

| Element | Current | Target | File |
|---------|---------|--------|------|
| Section title margin | `mb-16` (64px) | `mb-12` (48px) | Services, CaseStudies |
| Card grid gap | `gap-8` (32px) | `gap-6` (24px) | Services, CaseStudies |
| Card padding | `p-10` (40px) | `p-8` (32px) | Services, CaseStudies |
| Process list gap | `space-y-8` | `space-y-6` | Process.tsx |

---

## Phase 5: Form UX Enhancements

**Goal:** Improve intake form polish and usability.
**Reference:** `taotang_io_ui_audit_report.md` Section 4.7

### 5.1 Form Focus States (Already Implemented)

**File:** `index.html:73-77` - Current implementation is adequate.

**Minor enhancement:**
```css
input:focus, select:focus, textarea:focus {
    border-color: var(--amber) !important;
    box-shadow: 0 0 0 3px rgba(255, 191, 0, 0.15) !important;
    outline: none !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
```

### 5.2 Form Step Transition Animation

**File:** `src/components/intake/IntakeWizard.tsx`

**State Management for Transitions:**
```tsx
// Add state for transition direction
const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
const [isTransitioning, setIsTransitioning] = useState(false);

// Helper to get transition class
const getTransitionClass = () => {
  if (!isTransitioning) return '';
  return transitionDirection === 'forward'
    ? 'transitioning-out-forward'
    : 'transitioning-out-backward';
};

// Update step change handlers
const goToNextStep = () => {
  setTransitionDirection('forward');
  setIsTransitioning(true);
  setTimeout(() => {
    setCurrentStep(prev => prev + 1);
    setIsTransitioning(false);
  }, 300); // Match CSS transition duration
};

const goToPrevStep = () => {
  setTransitionDirection('backward');
  setIsTransitioning(true);
  setTimeout(() => {
    setCurrentStep(prev => prev - 1);
    setIsTransitioning(false);
  }, 300);
};
```

**CSS for Step Transitions (add to index.html):**
```css
/* Form step transitions */
.form-step-container {
    position: relative;
    overflow: hidden;
}

.form-step {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.form-step.transitioning-out-forward {
    opacity: 0;
    transform: translateX(-20px);
}

.form-step.transitioning-out-backward {
    opacity: 0;
    transform: translateX(20px);
}

@media (prefers-reduced-motion: reduce) {
    .form-step {
        transition: none;
    }
}
```

**Component Usage:**
```tsx
<div className="form-step-container">
  <div className={`form-step ${getTransitionClass()}`}>
    {renderCurrentStep()}
  </div>
</div>
```

### 5.3 Button State Enhancement

**Current Issue:** Button appears disabled even when fields are filled.

**CSS (add to index.html):**
```css
/* Form submit button states */
.form-button {
    background-color: #E9ECEF;
    color: #6C757D;
    cursor: not-allowed;
    transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
}

.form-button:not(:disabled) {
    background-color: var(--amber);
    color: var(--charcoal);
    cursor: pointer;
}

.form-button:not(:disabled):hover {
    background-color: var(--deep-amber);
    transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
    .form-button:not(:disabled):hover {
        transform: none;
    }
}
```

---

## Phase 6: Service Card Enhancements

**Goal:** Add visual depth and interactivity to service cards.
**Reference:** `taotang_io_ui_audit_report.md` Recommendation 8

### 6.1 Icon Background Enhancement

**File:** `src/components/sections/Services.tsx`

**Current:** Icon with no background
**Target:** Icon in colored background container

```tsx
// Update icon wrapper in serviceData map
<div className="w-14 h-14 flex items-center justify-center bg-amber-50 rounded-xl mb-6">
  {s.icon}
</div>
```

### 6.2 Card Shadow Enhancement

Cards already use `.card-hover` class which has been updated in Phase 3.3.

---

## Implementation Order

| # | Priority | Phase | Tasks | Est. Effort |
|---|----------|-------|-------|-------------|
| 0 | BLOCKING | 0.1-0.2 | Install react-router-dom, create vercel.json | 10 min |
| 1 | CRITICAL | 2.1 | Simplify Hero (remove placeholder) | 30 min |
| 2 | CRITICAL | 2.2 | Add photo to About section | 45 min |
| 3 | HIGH | 1.2 | Create case study pages + router + NotFound | 2 hours |
| 4 | HIGH | 1.3 | Add CSS spacing variables | 15 min |
| 5 | HIGH | 3.1 | Add animation CSS with fallbacks + inline script | 30 min |
| 6 | HIGH | 3.2 | Implement global scroll animation hook | 30 min |
| 7 | HIGH | 3.3 | Consolidate hover effects CSS | 30 min |
| 8 | MEDIUM | 4.1-4.3 | Normalize spacing across sections | 1 hour |
| 9 | MEDIUM | 5.1-5.3 | Form UX improvements | 45 min |
| 10 | LOW | 6.1-6.2 | Service card enhancements | 30 min |

**Total Estimated Effort:** 7-9 hours

---

## Files to Create

| File | Purpose |
|------|---------|
| `vercel.json` | SPA routing configuration |
| `src/data/caseStudies.ts` | Case study data (single source of truth for cards + detail pages) |
| `src/pages/CaseStudyPage.tsx` | Case study detail page |
| `src/pages/NotFound.tsx` | 404 page with title management |
| `src/components/ScrollToTop.tsx` | Scroll to top on every route change |
| `src/hooks/useGlobalScrollAnimation.ts` | Global scroll animation observer |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add react-router-dom dependency |
| `index.html` | Add inline JS-enabled script, CSS variables, animation classes, hover effects |
| `src/App.tsx` | Add BrowserRouter, Routes, ScrollToTop, HomePage with semantics preserved |
| `src/components/sections/Hero.tsx` | Remove image column, center layout |
| `src/components/sections/AboutSnippet.tsx` | Add photo, restructure grid, use section-padding |
| `src/components/sections/Services.tsx` | Add animations, icon backgrounds, adjust spacing |
| `src/components/sections/CaseStudies.tsx` | Map cards from `caseStudies` data, use `<Link>`, add animations |
| `src/components/sections/Process.tsx` | Add animations, adjust spacing |
| `src/components/intake/IntakeWizard.tsx` | Step transitions |

---

## Verification Plan

### Pre-Implementation Checklist
- [ ] Back up current working state (git commit)
- [ ] Run `npm install react-router-dom`
- [ ] Create `vercel.json`
- [ ] Document current section padding values
- [ ] Screenshot current state for comparison

### Post-Implementation Testing

**Routing Tests:**
| Test | Expected Result | Status |
|------|-----------------|--------|
| Direct URL `/case-study/compliantphotos` | Page loads (not 404) | |
| Invalid URL `/case-study/invalid` | Shows NotFound page | |
| Invalid URL `/random-page` | Shows NotFound page | |
| Back button from case study | Returns to homepage | |
| Back link scrolls to #case-studies | Smooth scroll to section | |

**Functional Tests:**
| Test | Expected Result | Status |
|------|-----------------|--------|
| Hero displays without image column | Text centered, no placeholder | |
| Photo appears in About section | 320px max, rounded-2xl, lazy loaded | |
| Case study cards link correctly | Navigate to detail page | |
| All nav anchor links scroll smoothly | Smooth animation to section | |

**Animation Tests:**
| Test | Expected Result | Status |
|------|-----------------|--------|
| Page load with JS enabled | Elements animate in on scroll | |
| Page load with JS disabled | All content visible immediately | |
| Page load with `prefers-reduced-motion` | No animations, content visible | |
| Card hover shows lift effect | translateY(-8px), shadow | |
| No flash of hidden content | Content doesn't disappear then reappear | |

**SEO Tests:**
| Test | Expected Result | Status |
|------|-----------------|--------|
| Case study page title | "CompliantPhotos.com - Case Study \| Tao Tang" | |
| Case study meta description | Updates to study.summary | |
| Navigate away restores default | Title reverts to default | |

**Responsive Tests:**
| Breakpoint | Tests | Status |
|------------|-------|--------|
| Mobile (<768px) | Hero stacks, photo full width, cards stack | |
| Tablet (768-1024px) | Grid layouts work, spacing consistent | |
| Desktop (>1024px) | Full layout, all animations work | |

**Accessibility Tests:**
| Test | Expected Result | Status |
|------|-----------------|--------|
| Keyboard navigation | All interactive elements focusable | |
| Tab order | Logical flow through page | |
| Case study page has breadcrumb | Back link visible and functional | |
| Images have alt text | Descriptive alt on photo | |

**Performance Tests:**
| Metric | Target | Status |
|--------|--------|--------|
| Portrait image lazy loads | `loading="lazy"` on img | |
| No layout shift on image load | Width/height attributes set | |
| CSS transitions GPU-accelerated | Using transform, opacity | |

**Deployment Tests (Vercel):**
| Test | Expected Result | Status |
|------|-----------------|--------|
| Build succeeds | No errors | |
| Direct URL access works | SPA rewrites functioning | |
| Preview deployment | All routes accessible | |

---

## Reference Documents

- `taotang_io_ui_audit_report.md` - Comprehensive 25-point audit
- `taotang_website_audit.md` - Current state assessment and benchmarking
- `technical_improvement_plan.md` - Condensed technical recommendations

---

## Smith Validation (January 12, 2026)

All findings from code review validated and addressed:

| Finding | Severity | Resolution |
|---------|----------|------------|
| Route changes don't reset scroll/animations | HIGH | Added `ScrollToTop` component; moved `useGlobalScrollAnimation` into `HomePage` |
| SEO claim relies on client-side only | MEDIUM | Clarified as "shareable URLs only, not crawler SEO" in decisions table |
| Meta cleanup hardcodes defaults | MEDIUM | Changed to capture/restore original values |
| NotFound missing title | MEDIUM | Added `useEffect` to set 404-specific title |
| setTimeout(100ms) racey | MEDIUM | Replaced with `requestAnimationFrame` + location state |
| HomePage drops wrapper semantics | LOW | Preserved `min-h-screen bg-white` and `<main>` in HomePage |
| Card content drift risk | LOW | Updated `CaseStudies.tsx` to map from `caseStudies` data array |

**Owner Decisions:**
- SEO: Client-side meta is acceptable (shareable URLs, not crawler indexing)
- Scroll: Scroll to top on every route change

---

*Document generated: January 12, 2026*
*Last updated: January 12, 2026 - Smith-validated, all findings addressed*
