# ROAST Artisanal Coffee

> **Precision Roasted. Ethically Sourced. Unapologetically Bold.**

## Project Overview

This project delivers a modern, fully responsive landing page for **ROAST**, an artisanal coffee roastery dedicated to small-batch excellence. The site showcases the brand's commitment to direct-trade, single-origin beans and meticulous roasting craftsmanship.

The landing page is designed to engage visitors with a bold aesthetic and clear user journeys, featuring the following core sections:

- **Hero:** High-impact introduction with the tagline and call-to-action.
- **Our Process:** Details the journey from sustainable micro-lot farms to custom vintage roasting.
- **Featured Roasts:** Highlights specific single-origin beans and their flavor profiles.
- **Subscriptions:** Promotes recurring delivery options for coffee enthusiasts.
- **Visit Us:** Location details and community engagement information.

## Tech Stack & Features

### Technologies
- **HTML5:** Semantic markup for improved accessibility and SEO.
- **CSS3:** Modern styling using Flexbox and Grid for layout, CSS variables for theming, and media queries for responsiveness.
- **JavaScript:** Vanilla JS for interactivity, smooth scrolling, and dynamic content handling.
- **Assets:** Optimized images and web fonts for performance.

### Key Features
- **Fully Responsive:** Adapts seamlessly to desktop, tablet, and mobile devices.
- **Performance Optimized:** Lightweight code structure for fast load times.
- **Accessibility:** ARIA labels, semantic structure, and keyboard navigation support.
- **SEO Ready:** Meta tags, descriptive headings, and alt text implemented.
- **Modular Design:** Clean separation of concerns between structure, style, and behavior.

## Generated File Structure

```text
roast-landing-page/
├── README.md
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css          # Main stylesheet
│   │   └── responsive.css     # Media queries and breakpoints
│   ├── js/
│   │   ├── main.js            # Core logic and interactivity
│   │   └── components/        # Modular JS components
│   │       ├── navbar.js
│   │       └── animations.js
│   └── images/
│       ├── hero-bg.jpg        # Hero section background
│       ├── process-roast.jpg  # Image for Our Process
│       ├── roast-1.jpg        # Featured roast image
│       ├── roast-2.jpg        # Featured roast image
│       └── subscribe-banner.jpg
└── favicon.ico
```

## How to Run

### Prerequisites
No build tools or dependencies are required. This is a static site that runs directly in any modern web browser.

### Local Development

1. **Clone or Download the Project**
   ```bash
   git clone <repository-url>
   cd roast-landing-page
   ```

2. **Open in Browser**
   Double-click `index.html` to view the site locally.

3. **Run a Local Server (Recommended)**
   For the best development experience (including proper asset loading and JS behavior), use a local server.

   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   Visit `http://localhost:8000` in your browser.

   **Using VS Code Live Server:**
   1. Install the "Live Server" extension.
   2. Right-click `index.html` and select "Open with Live Server".

### Deployment
The project is ready for deployment to any static hosting service, including:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

Simply upload the contents of the project root directory to your hosting provider.