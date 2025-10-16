# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for KO Ho Tin (BlackCat), built with vanilla HTML, CSS, and JavaScript. The site showcases an AI researcher's profile, GitHub projects, research publications, certificates, and contact information. It is deployed as a static site on GitHub Pages at https://B143KC47.github.io.

## Technology Stack

- **HTML5**: Single-page application structure
- **CSS3**: Modular CSS architecture with 50+ component files following iOS 18 design system
- **Vanilla JavaScript**: Module-based architecture using global objects (no build tools)
- **GitHub API**: Dynamically fetches and displays user repositories
- **OpenReview API**: Fetches research publications dynamically
- **Font Awesome 6.0.0**: Icon library
- **Google Fonts**: Inter font family

## Architecture

### Module System

This project uses a **global object pattern** instead of ES modules to avoid CORS issues when running locally. All JavaScript modules are loaded via `<script>` tags in the following order:

1. `modules/ui.js` - UI initialization, loading indicators, lazy loading
2. `modules/navigation.js` - Smooth scroll, navbar behavior, mobile menu
3. `modules/certificates.js` - Certificate modal and 3D hover effects
4. `modules/github.js` - GitHub API integration, project cards
5. `modules/openreview.js` - OpenReview API integration, fetches publications
6. `modules/touch.js` - Touch gesture handling for mobile
7. `modules/performance.js` - Performance optimization, scroll throttling, image optimization
8. `script.js` - Main initialization that calls all module `init()` methods

Each module exposes a global object (e.g., `UIModule`, `NavigationModule`) with an `init()` method called on DOMContentLoaded.

**Module Load Order is Critical**: Modules must be loaded in the exact order shown above. `script.js` must always be last as it initializes all modules.

### CSS Architecture - iOS 18 Design System

CSS follows a highly modular architecture with imports organized in `styles/main.css`. The design system is based on **iOS 18 principles** with strict spacing hierarchy and glassmorphism effects.

**Import Structure:**
- **Base**: `reset.css`, `variables.css` (iOS 18 design tokens), `typography.css`, `responsive.css`, `layout.css`
- **Layout**: Grid systems, containers, sections (files in `layout/`)
- **Components**: 30+ component files including navbar, hero, cards, tech-stack, research, publications, github-projects, certificates
- **Utilities**: Helper classes and layout utilities
- **Animations**: Transitions and animation effects

Mobile-specific styles are in `styles/mobile.css` (loaded separately).

**iOS 18 Design System (`styles/base/variables.css`):**
- **Spacing Hierarchy**: 8pt grid system (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px)
- **Section Spacing**: 48px desktop, 32px mobile (optimized from 64px to reduce empty space)
- **Typography**: iOS Dynamic Type scale (12px caption to 34px large-title)
- **Border Radius**: 8px, 12px, 16px, 20px, 24px (iOS style)
- **Colors**: Dark theme with glassmorphism (rgba-based with backdrop-filter)
- **Animations**: iOS spring curves and timing (0.1s, 0.15s, 0.2s, 0.35s)

**Critical Spacing Rules:**
- Hero height: 65vh desktop, 60vh mobile (not full viewport to avoid excessive empty space)
- Section padding: Handled by `var(--section-spacing)` in layout system
- Component gaps: Maximum 32px for internal components, 48px between major sections
- Never override section margins in individual components (causes cumulative spacing bugs)

### Key Components

**GitHub Integration (`modules/github.js`)**
- Fetches top 16 repositories from GitHub API (`https://api.github.com/users/B143KC47/repos`)
- Filters out forked repositories
- Creates dynamic project cards with language indicators, stars, forks, watchers
- Updates navigation dropdown with top 5 popular projects
- Includes progressive loading with staggered animations
- Error handling for API failures with user-friendly messages

**OpenReview Integration (`modules/openreview.js`)**
- Fetches publications from OpenReview API (`https://api2.openreview.net/notes`)
- Searches for author profile and associated publications
- Displays publication cards with title, authors, venue, year, abstract
- Includes skeleton loading states and error handling
- Falls back gracefully if API is unavailable

**Certificate System (`modules/certificates.js`)**
- Manages certificate data in a centralized object (`certificateData`)
- Implements modal popup for certificate details
- Adds 3D hover effects using mouse position tracking
- Certificate IDs: `ja`, `mit`, `ieee`, `hkujsi`, `econ_workshop`, `cityu_ai`, `space_tech`

**Performance Optimization (`modules/performance.js`)**
- Browser feature detection (WebP, IntersectionObserver, passive events)
- Scroll throttling and debouncing (uses requestAnimationFrame)
- Lazy image loading with IntersectionObserver
- Parallax effects (disabled on mobile for performance)
- Progressive image loading with placeholders
- Network-aware loading based on connection quality

**Navigation (`modules/navigation.js`)**
- Smooth scrolling to sections with hash update and offset for fixed navbar
- Mobile hamburger menu with ARIA attributes for accessibility
- Auto-hide navbar on scroll down, show on scroll up (threshold-based)
- Menu closes on link click, ESC key, or outside click
- Touch-friendly with 44px minimum tap targets

### HTML Structure

Single-page layout with sections (all use `.section` class with automatic spacing):
- Hero section with gradient text and CTA buttons (65vh height)
- About Me section with profile image, expertise list, and skills grid
- Tech Stack section with categorized icons (Programming, AI/ML, DevOps, Cloud)
- Research & Achievements section highlighting internships and focus areas
- Publications section (dynamically populated from OpenReview API)
- GitHub Projects section (dynamically populated, 16 repos)
- Certificates section with 7 hardcoded certificate cards
- Contact section with social links and blog CTA
- Footer with quick links and social icons

**Section Structure Pattern:**
```html
<section id="section-id" class="section section-name reveal-up">
    <div class="section-container">
        <h2 class="section-title gradient-text">Title</h2>
        <!-- Content -->
    </div>
</section>
```

## Development Guidelines

### No Build Process
This is a static site with no build tools, bundlers, or package managers. All code runs directly in the browser.

### Code Style
- **JavaScript**: Use global object pattern for modules. Each module should have an `init()` method.
- **No comments**: Code should be self-documenting (per existing convention)
- **CSS**: Follow BEM-like naming conventions (e.g., `.certificate-item`, `.project-card`)
- **Imports**: Add new CSS imports to `styles/main.css` in the appropriate section
- **Spacing**: Always use CSS variables from `variables.css` (never hardcode spacing values)
- **iOS Design Compliance**: Follow the spacing hierarchy strictly (4-8-12-16-24-32-48-64-96px only)

### Performance Considerations
- Images use `loading="lazy"` attribute
- Critical resources are preloaded in `<head>` (fonts, main CSS, key images)
- DNS prefetch for external domains (GitHub API, CDNs)
- Use `passive: true` for scroll event listeners
- Throttle high-frequency events (scroll, mousemove)

### External APIs

**GitHub API**
- Username: `B143KC47`
- Endpoint: `https://api.github.com/users/B143KC47/repos`
- No authentication required (public API)
- Rate limit: 60 requests/hour for unauthenticated requests
- Always check response status and handle errors gracefully

**OpenReview API**
- Base URL: `https://api2.openreview.net/notes`
- Search query: `content.authors=~.*Ko_Ho_Tin.*`
- No authentication required
- Returns publication data with abstracts, venues, authors
- Handle missing fields gracefully (some papers may lack abstracts or venues)

### Adding New Modules
1. Create new file in `modules/` directory
2. Export a global object with `init()` method
3. Add script tag to `index.html` before `script.js`
4. Call `YourModule.init()` in `script.js` DOMContentLoaded handler

### Mobile Responsiveness
- Primary breakpoint: 768px (defined in `styles/base/variables.css` and `styles/mobile.css`)
- Additional breakpoints: 640px (sm), 1024px (lg), 1280px (xl)
- Hamburger menu appears below 768px with ARIA attributes
- Parallax effects disabled on mobile for performance
- Touch gestures supported for certificate cards
- Hero height reduces from 65vh to 60vh on mobile
- Section spacing reduces from 48px to 32px on mobile
- Grid gaps reduce from 24px to 16px on mobile
- Minimum tap target size: 44px (iOS standard)

## File Locations

- **Main HTML**: `index.html`
- **Entry JavaScript**: `script.js`
- **Modules**: `modules/` (7 files: ui, navigation, certificates, github, openreview, touch, performance)
- **Styles**: `styles/` (50+ CSS files organized in subdirectories)
  - `styles/base/` - Design system, variables, reset, typography, responsive
  - `styles/layout/` - Grid systems, containers, sections
  - `styles/components/` - Individual component styles (30+ files)
  - `styles/animations/` - Transitions and animations
  - `styles/utils/` - Helper utilities
- **Assets**: `assets/` (images, `assets/Certificates/` for certificate images)
- **Sitemap**: `sitemap.xml`

## Common Tasks

### Testing Locally
Open `index.html` directly in a browser. No local server required, but GitHub API calls work without CORS restrictions.

### Adding a Certificate
1. Add image to `assets/Certificates/`
2. Add certificate data to `certificateData` object in `modules/certificates.js`
3. Add HTML card in the certificates section of `index.html` with `onclick="showCertificateDetails('id')"`

### Adding a CSS Component
1. Create new CSS file in appropriate subdirectory (e.g., `styles/components/new-component.css`)
2. Add `@import 'components/new-component.css';` to `styles/main.css`

### Modifying GitHub Display
Edit `modules/github.js`:
- `fetchGitHubProjects()` - Controls main project grid (currently 16 repos)
- `fetchTopRepositories()` - Controls navbar dropdown (currently 5 repos)
- `createProjectCard()` - Customize card HTML/styling
- `getLanguageColor()` - Add new language colors

### Modifying Publications Display
Edit `modules/openreview.js`:
- `fetchPublications()` - Fetches from OpenReview API
- `createPublicationCard()` - Customize publication card HTML
- Author search query currently searches for "Ko_Ho_Tin"

### Modifying Spacing/Layout
**CRITICAL**: When adjusting spacing, always:
1. Modify `styles/base/variables.css` to change CSS variables
2. Never add margins to individual section components (causes cumulative bugs)
3. Use the 8pt grid system: `--space-1` through `--space-9`
4. Section spacing controlled by `--section-spacing` (48px desktop, 32px mobile)
5. Test on both desktop and mobile to ensure no excessive empty space

## Important Notes

- Site uses Chinese and English content intermixed
- Owner: KO Ho Tin (BlackCat)
- Email: s20200057@ylmass.edu.hk
- All JavaScript uses strict equality (`===`) and modern ES6+ syntax
- No jQuery or other frameworks - pure vanilla JavaScript throughout
