import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { agentLoader } from './agentLoader.js';
import { stateMachine } from './stateMachine.js';
import { fallbackManager } from './fallback.js';
import { TaskQueue } from './queue.js';
import { UniversalApiClient } from './universalApiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_SITE_DIR = path.resolve(__dirname, '../generated-site');

/**
 * Helper to strip markdown code fences from LLM responses
 */
function cleanCodeFence(text, defaultLang = '') {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  const match = cleaned.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```$/);
  if (match) {
    return match[1].trim();
  }
  // Try without strict end if truncated
  const partialMatch = cleaned.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)(?:```)?$/);
  if (partialMatch) {
    return partialMatch[1].trim();
  }
  return cleaned;
}

export class PipelineManager {
  constructor(options = {}) {
    this.outputDir = options.outputDir || GENERATED_SITE_DIR;
    this.queue = new TaskQueue();
    this.isRunning = false;
    this.siteFiles = new Map(); // filename -> string content
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Write generated file to disk and record in memory
   */
  saveFile(filename, content) {
    this.ensureOutputDir();
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    this.siteFiles.set(filename, content);
    console.log(`\x1b[32m[Pipeline] Generated & Saved:\x1b[0m ${filename} (${content.length} bytes)`);
  }

  /**
   * Generate subtasks from brief (PM stage)
   */
  createTaskPlan(brief) {
    return [
      {
        id: 'task_pm',
        role: 'pm',
        title: `Plan site architecture for brief: "${brief.slice(0, 40)}..."`,
        dependsOn: [],
      },
      {
        id: 'task_idea',
        role: 'idea',
        title: 'Generate site concept, copywriting, and sections',
        dependsOn: ['task_pm'],
      },
      {
        id: 'task_design',
        role: 'designer',
        title: 'Create color palette, typography & layout grid',
        dependsOn: ['task_idea'],
      },
      {
        id: 'task_html',
        role: 'html_dev',
        title: 'Write semantic HTML markup',
        dependsOn: ['task_design'],
      },
      {
        id: 'task_css',
        role: 'css_dev',
        title: 'Implement responsive CSS styling with theme tokens',
        dependsOn: ['task_html'],
      },
      {
        id: 'task_js',
        role: 'js_dev',
        title: 'Implement interactive features & form logic',
        dependsOn: ['task_html', 'task_css'],
      },
      {
        id: 'task_anim',
        role: 'animation_dev',
        title: 'Add smooth scroll, hero entrance & hover animations',
        dependsOn: ['task_js'],
      },
      {
        id: 'task_backend',
        role: 'backend_dev',
        title: 'Build Express backend for inquiries & newsletter',
        dependsOn: ['task_js'],
      },
      {
        id: 'task_db',
        role: 'db_dev',
        title: 'Create database schema for persistence',
        dependsOn: ['task_backend'],
      },
      {
        id: 'task_debug1',
        role: 'debugger_1',
        title: 'Review HTML/CSS/JS for syntax errors and layout bugs',
        dependsOn: ['task_anim', 'task_css'],
      },
      {
        id: 'task_debug2',
        role: 'debugger_2',
        title: 'Final QA review comparing output against user brief',
        dependsOn: ['task_debug1', 'task_db'],
      },
      {
        id: 'task_docs',
        role: 'docs_writer',
        title: 'Generate project README documentation',
        dependsOn: ['task_debug2'],
      },
    ];
  }

  /**
   * Build role-specific prompt for real LLM execution
   */
  buildUserPrompt(role, context) {
    const brief = context.brief || 'Build a modern responsive website';
    const conceptStr = context.concept ? JSON.stringify(context.concept, null, 2) : 'None';
    const designStr = context.design ? JSON.stringify(context.design, null, 2) : 'None';

    switch (role) {
      case 'pm':
        return `Project Brief: "${brief}".
Decompose this website brief into a clear development plan covering idea, UI design, semantic HTML structure, CSS styling, client-side JS interactivity, micro-animations, Express backend endpoint, SQLite DB schema, and QA requirements. Output strict JSON with keys: { "summary": "...", "subtasks": [...] }`;

      case 'idea':
        return `User Website Brief: "${brief}".
Generate the core concept, catchy title, tagline, sitemap sections, and realistic placeholder copywriting.
Output strict JSON with keys:
{
  "title": "Site Name / Brand",
  "tagline": "Short memorable tagline",
  "sections": ["Hero", "Section 1", "Section 2", "Section 3", "Contact"],
  "sampleCopy": {
    "heroHeading": "...",
    "heroSubheading": "...",
    "about": "..."
  }
}`;

      case 'designer':
        return `User Brief: "${brief}".
Site Concept: ${conceptStr}.
Define a complete design spec: primary background, surface color, accent color, text colors (in hex), and font pairing.
Output strict JSON with format:
{
  "colors": {
    "bg": "#...",
    "surface": "#...",
    "accent": "#...",
    "accentGlow": "rgba(...)",
    "text": "#...",
    "textMuted": "#..."
  },
  "fontFamily": "..."
}`;

      case 'html_dev':
        return `User Brief: "${brief}".
Site Concept: ${conceptStr}.
Design Spec: ${designStr}.
Write a complete, single-file semantic HTML5 page (\`index.html\`).
Requirements:
- Must link to \`styles.css\`, \`script.js\`, and \`animations.js\`.
- Use semantic tags (<header>, <nav>, <main>, <section>, <form>, <footer>).
- Include navbar, hero section, feature/content gallery or cards, inquiry form, and footer.
- Return ONLY the clean HTML5 code.`;

      case 'css_dev':
        return `User Brief: "${brief}".
Design Spec: ${designStr}.
Generated HTML:
${context.html ? context.html.slice(0, 1500) : 'Standard semantic HTML structure with .navbar, .hero, .container, .section, .btn-cta, .contact-form'}
Write a complete, modern, responsive CSS stylesheet (\`styles.css\`).
Requirements:
- Use CSS custom properties (:root) for color tokens and typography.
- Modern flexbox and grid layouts.
- Mobile-first, responsive media queries.
- Clean button hover states, form styles, and dark-mode glassmorphic aesthetics.
- Return ONLY the raw CSS code.`;

      case 'js_dev':
        return `User Brief: "${brief}".
Generated HTML:
${context.html ? context.html.slice(0, 1500) : 'Standard HTML layout with buttons, filters, and forms'}
Write the vanilla JavaScript code (\`script.js\`) implementing client-side interactivity:
- Filter buttons / tabs logic.
- Contact / inquiry form submission handling with real-time DOM feedback.
- Mobile nav toggle or interactive elements.
- Wrap in DOMContentLoaded.
- Return ONLY the raw JavaScript code.`;

      case 'animation_dev':
        return `User Brief: "${brief}".
Write tasteful micro-interactions and scroll reveal animations (\`animations.js\`):
- Use IntersectionObserver to animate cards, headers, and sections into view on scroll.
- Smooth transitions on interactive elements.
- Wrap in DOMContentLoaded.
- Return ONLY the raw JavaScript code.`;

      case 'backend_dev':
        return `User Brief: "${brief}".
Write a minimal Node.js Express server (\`server.js\`) to handle website API requests:
- Express app with JSON body parser.
- POST /api/inquire or relevant API endpoints.
- Proper JSON responses and status codes.
- Return ONLY the raw JavaScript code.`;

      case 'db_dev':
        return `User Brief: "${brief}".
Write a minimal SQLite/SQL database schema (\`schema.sql\`) for the website:
- Tables for inquiries/submissions, users/catalog if applicable.
- Clean column types, primary keys, timestamps.
- Return ONLY the raw SQL schema code.`;

      case 'debugger_1':
        return `Review the generated website code:
HTML: ${(context.html || '').slice(0, 500)}...
CSS: ${(context.css || '').slice(0, 500)}...
JS: ${(context.js || '').slice(0, 500)}...
Inspect for broken tags, undefined variables, and layout bugs. Provide a concise QA pass summary.`;

      case 'debugger_2':
        return `Final QA Review comparing the generated website against the original brief: "${brief}".
Check if all requested sections, interactive elements, and requirements are satisfied. Provide a concise final QA summary.`;

      case 'docs_writer':
        return `User Brief: "${brief}".
Site Concept: ${conceptStr}.
Write a complete, professional \`README.md\` for the generated project:
- Title and project overview.
- Tech stack and features.
- Generated file structure.
- How to run instructions.
- Return ONLY the Markdown text.`;

      default:
        return `Execute development task "${role}" for brief: "${brief}".`;
    }
  }

  /**
   * Execute task (Mock runner or Real API caller)
   */
  async executeAgentTask(task, context, isMock = true) {
    const agentId = task.role;
    stateMachine.transition(agentId, 'working', { currentTask: task.title });

    if (isMock) {
      // Simulate realistic thinking / execution delay
      await new Promise((r) => setTimeout(r, 200));

      const result = this.generateMockArtifacts(task, context);
      
      // If task generates files, save them
      if (result.files) {
        for (const [filename, content] of Object.entries(result.files)) {
          this.saveFile(filename, content);
        }
      }

      stateMachine.transition(agentId, 'done', {
        currentTask: `Finished: ${task.title}`,
        tokensUsed: result.tokensUsed || 450,
      });

      return result;
    }

    // --- REAL API EXECUTION BRANCH ---
    const agent = agentLoader.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent definition not found for role: ${agentId}`);
    }

    const userPrompt = this.buildUserPrompt(agentId, context);
    console.log(`\x1b[36m[Real API Call] Sending task "${task.id}" to Agent "${agent.name}" (${agent.api}/${agent.model})...\x1b[0m`);

    const response = await UniversalApiClient.executeAgentCall(agent, userPrompt);
    const rawText = response.text || '';
    const tokensUsed = response.tokensUsed || 500;

    console.log(`\x1b[32m[Real API Success] ${agent.id} (${agent.api}) responded with ${tokensUsed} tokens.\x1b[0m`);
    console.log(`\x1b[90m  Raw preview (first 100 chars): "${rawText.slice(0, 100).replace(/\n/g, ' ')}..."\x1b[0m`);

    const result = {
      status: 'success',
      tokensUsed,
      files: {},
    };

    // Parse role-specific output into context and generated files
    switch (agentId) {
      case 'pm':
        try {
          const cleaned = cleanCodeFence(rawText, 'json');
          context.plan = JSON.parse(cleaned);
        } catch {
          context.plan = { summary: rawText.slice(0, 200) };
        }
        result.summary = rawText.slice(0, 200);
        break;

      case 'idea':
        try {
          const cleaned = cleanCodeFence(rawText, 'json');
          context.concept = JSON.parse(cleaned);
        } catch {
          context.concept = {
            title: context.brief || 'Generated Site',
            tagline: rawText.slice(0, 100),
            sections: ['Hero', 'About', 'Gallery', 'Contact'],
          };
        }
        result.concept = context.concept;
        break;

      case 'designer':
        try {
          const cleaned = cleanCodeFence(rawText, 'json');
          context.design = JSON.parse(cleaned);
        } catch {
          context.design = {
            colors: {
              bg: '#0f172a',
              surface: '#1e293b',
              accent: '#38bdf8',
              accentGlow: 'rgba(56, 189, 248, 0.25)',
              text: '#f8fafc',
              textMuted: '#94a3b8',
            },
            fontFamily: "'Inter', system-ui, sans-serif",
          };
        }
        result.design = context.design;
        break;

      case 'html_dev': {
        const html = cleanCodeFence(rawText, 'html');
        context.html = html;
        result.files['index.html'] = html;
        this.saveFile('index.html', html);
        break;
      }

      case 'css_dev': {
        const css = cleanCodeFence(rawText, 'css');
        context.css = css;
        result.files['styles.css'] = css;
        this.saveFile('styles.css', css);
        break;
      }

      case 'js_dev': {
        const js = cleanCodeFence(rawText, 'js');
        context.js = js;
        result.files['script.js'] = js;
        this.saveFile('script.js', js);
        break;
      }

      case 'animation_dev': {
        const anim = cleanCodeFence(rawText, 'js');
        context.animations = anim;
        result.files['animations.js'] = anim;
        this.saveFile('animations.js', anim);
        break;
      }

      case 'backend_dev': {
        const server = cleanCodeFence(rawText, 'js');
        context.server = server;
        result.files['server.js'] = server;
        this.saveFile('server.js', server);
        break;
      }

      case 'db_dev': {
        const sql = cleanCodeFence(rawText, 'sql');
        context.db = sql;
        result.files['schema.sql'] = sql;
        this.saveFile('schema.sql', sql);
        break;
      }

      case 'debugger_1':
      case 'debugger_2':
        result.summary = rawText.slice(0, 300);
        break;

      case 'docs_writer': {
        const readme = cleanCodeFence(rawText, 'markdown');
        context.readme = readme;
        result.files['README.md'] = readme;
        this.saveFile('README.md', readme);
        break;
      }

      default:
        break;
    }

    stateMachine.transition(agentId, 'done', {
      currentTask: `Finished: ${task.title}`,
      tokensUsed,
    });

    return result;
  }

  /**
   * Mock artifact generator producing authentic, working static website files
   */
  generateMockArtifacts(task, context) {
    switch (task.role) {
      case 'pm':
        return {
          status: 'success',
          summary: 'Subtasks decomposed and assigned across 12 agents',
          tokensUsed: 380,
        };

      case 'idea':
        context.concept = {
          title: 'LUMEN - Wildlife & Nature Photography',
          tagline: 'Capturing Earth in its rawest, most breathtaking moments.',
          sections: ['Hero', 'Featured Expeditions', 'Gallery', 'About the Artist', 'Contact & Prints'],
        };
        return { status: 'success', concept: context.concept, tokensUsed: 490 };

      case 'designer':
        context.design = {
          colors: {
            bg: '#0f172a',
            surface: '#1e293b',
            accent: '#38bdf8',
            accentGlow: 'rgba(56, 189, 248, 0.25)',
            text: '#f8fafc',
            textMuted: '#94a3b8',
          },
          fontFamily: "'Inter', system-ui, sans-serif",
        };
        return { status: 'success', design: context.design, tokensUsed: 520 };

      case 'html_dev': {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${context.concept?.title || 'LUMEN Photography'}</title>
  <link rel="stylesheet" href="styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Navigation -->
  <header class="navbar">
    <div class="logo">LUMEN <span>STUDIO</span></div>
    <nav class="nav-links">
      <a href="#gallery">Gallery</a>
      <a href="#expeditions">Expeditions</a>
      <a href="#about">About</a>
      <a href="#contact" class="btn-primary">Order Prints</a>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">${context.concept?.title || 'LUMEN PHOTOGRAPHY'}</h1>
      <p class="hero-tagline">${context.concept?.tagline || 'Capturing raw nature moments.'}</p>
      <div class="hero-actions">
        <a href="#gallery" class="btn-cta">Explore Works</a>
        <a href="#contact" class="btn-outline">Inquire Booking</a>
      </div>
    </div>
  </section>

  <!-- Gallery Section -->
  <section id="gallery" class="section gallery-section">
    <div class="container">
      <h2 class="section-title">Selected Works</h2>
      <div class="filter-tabs">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="wildlife">Wildlife</button>
        <button class="filter-btn" data-filter="landscape">Landscapes</button>
        <button class="filter-btn" data-filter="aerial">Aerial</button>
      </div>
      <div class="gallery-grid">
        <div class="gallery-item" data-category="wildlife">
          <div class="image-box" style="background: linear-gradient(135deg, #1e3a8a, #0f172a);">
            <div class="overlay">
              <h3>Arctic Monarch</h3>
              <p>Svalbard Archipelago</p>
            </div>
          </div>
        </div>
        <div class="gallery-item" data-category="landscape">
          <div class="image-box" style="background: linear-gradient(135deg, #065f46, #0f172a);">
            <div class="overlay">
              <h3>Emerald Fjords</h3>
              <p>Western Norway</p>
            </div>
          </div>
        </div>
        <div class="gallery-item" data-category="aerial">
          <div class="image-box" style="background: linear-gradient(135deg, #9a3412, #0f172a);">
            <div class="overlay">
              <h3>Sahara Ridges</h3>
              <p>Erg Chebbi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact & Newsletter -->
  <section id="contact" class="section contact-section">
    <div class="container">
      <h2>Inquiries & Limited Edition Prints</h2>
      <form id="inquiryForm" class="contact-form">
        <input type="text" id="name" placeholder="Your Name" required />
        <input type="email" id="email" placeholder="Your Email Address" required />
        <textarea id="message" placeholder="Details about print or commercial licensing..." rows="4" required></textarea>
        <button type="submit" class="btn-cta">Submit Inquiry</button>
      </form>
      <div id="formFeedback" class="form-feedback"></div>
    </div>
  </section>

  <footer>
    <p>&copy; ${new Date().getFullYear()} LUMEN Photography. Handcrafted by 12 AI Agents.</p>
  </footer>

  <script src="script.js"></script>
  <script src="animations.js"></script>
</body>
</html>`;
        return {
          status: 'success',
          files: { 'index.html': html },
          tokensUsed: 890,
        };
      }

      case 'css_dev': {
        const css = `/* LUMEN Studio Stylesheet - Generated by CSS Agent */
:root {
  --bg-color: #0b0f19;
  --surface-color: #151d30;
  --surface-hover: #1e293b;
  --accent-color: #38bdf8;
  --accent-glow: rgba(56, 189, 248, 0.35);
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --radius-sm: 6px;
  --radius-lg: 12px;
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-color);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1.2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(12px);
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--text-primary);
}

.logo span {
  color: var(--accent-color);
}

.nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  margin-left: 2rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-links a:hover {
  color: var(--accent-color);
}

.btn-primary, .btn-cta {
  background: var(--accent-color);
  color: #04101e !important;
  font-weight: 600 !important;
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  box-shadow: 0 0 18px var(--accent-glow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 28px var(--accent-glow);
}

.btn-outline {
  border: 1px solid var(--accent-color);
  color: var(--accent-color) !important;
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  margin-left: 1rem;
}

.hero {
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 1.5rem;
  background: radial-gradient(circle at center, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
}

.hero-title {
  font-size: 3.8rem;
  font-weight: 800;
  letter-spacing: -1px;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 40%, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-tagline {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto 2rem auto;
}

.section {
  padding: 6rem 0;
}

.section-title {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 2.5rem;
}

.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.filter-btn {
  background: var(--surface-color);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn.active, .filter-btn:hover {
  background: var(--accent-color);
  color: #000;
  font-weight: 600;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.gallery-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  height: 280px;
  cursor: pointer;
}

.image-box {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 1.5rem;
  transition: transform 0.3s ease;
}

.gallery-item:hover .image-box {
  transform: scale(1.03);
}

.overlay h3 {
  font-size: 1.3rem;
}

.overlay p {
  color: var(--accent-color);
  font-size: 0.9rem;
}

.contact-section {
  background: var(--surface-color);
  text-align: center;
}

.contact-form {
  max-width: 550px;
  margin: 2rem auto 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-form input, .contact-form textarea {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: inherit;
}

.form-feedback {
  margin-top: 1rem;
  font-weight: 600;
}

footer {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
`;
        return {
          status: 'success',
          files: { 'styles.css': css },
          tokensUsed: 920,
        };
      }

      case 'js_dev': {
        const js = `// LUMEN Interactive Behavior - Generated by JS Developer
document.addEventListener('DOMContentLoaded', () => {
  // 1. Gallery category filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      galleryItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // 2. Inquiry form submission
  const inquiryForm = document.getElementById('inquiryForm');
  const feedback = document.getElementById('formFeedback');

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;

      feedback.style.color = '#38bdf8';
      feedback.textContent = 'Processing inquiry...';

      setTimeout(() => {
        feedback.style.color = '#4ade80';
        feedback.textContent = \`Thank you \${name}! We received your inquiry and sent confirmation to \${email}.\`;
        inquiryForm.reset();
      }, 700);
    });
  }
});
`;
        return {
          status: 'success',
          files: { 'script.js': js },
          tokensUsed: 620,
        };
      }

      case 'animation_dev': {
        const animJs = `// LUMEN Animation & Scroll Reveals - Generated by Animation Agent
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.gallery-item, .contact-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    revealObserver.observe(el);
  });
});
`;
        return {
          status: 'success',
          files: { 'animations.js': animJs },
          tokensUsed: 480,
        };
      }

      case 'backend_dev': {
        const serverCode = `// Generated Backend API Server
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/inquire', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  return res.status(200).json({
    success: true,
    message: 'Inquiry received. A representative will contact you shortly.'
  });
});

export default app;
`;
        return {
          status: 'success',
          files: { 'server.js': serverCode },
          tokensUsed: 430,
        };
      }

      case 'db_dev': {
        const sql = `-- Database Schema for LUMEN Studio Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prints_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  edition_limit INTEGER DEFAULT 50,
  price_usd REAL NOT NULL
);
`;
        return {
          status: 'success',
          files: { 'schema.sql': sql },
          tokensUsed: 390,
        };
      }

      case 'debugger_1':
        return {
          status: 'success',
          summary: 'HTML markup validated (zero unclosed tags). CSS variable references verified. JS syntax checked.',
          tokensUsed: 510,
        };

      case 'debugger_2':
        return {
          status: 'success',
          summary: 'QA pass complete: All sections from brief (Gallery, Contact, Responsive nav) verified.',
          tokensUsed: 550,
        };

      case 'docs_writer': {
        const readme = `# LUMEN - Wildlife & Nature Photography Portfolio

> Autonomously generated by **The Office** 12-Agent Multi-LLM Web Dev Team.

## About the Project
A minimalist, high-impact photography portfolio designed for showcasing fine art wildlife and landscape prints with interactive category filtering, responsive dark-mode aesthetics, and inquiry handling.

## Team Output & Structure
- \`index.html\` - Semantic HTML5 layout (HTML Developer)
- \`styles.css\` - Responsive CSS3 styling & dark glassmorphic theme tokens (CSS Developer)
- \`script.js\` - Dynamic client-side category filtering and form validations (JS Developer)
- \`animations.js\` - Intersection-observer powered scroll reveals (Animation Developer)
- \`server.js\` - Express API endpoint for print licensing inquiries (Backend Developer)
- \`schema.sql\` - SQLite schema for persistent inquiry tracking (DB Developer)

## How to Run
Open \`index.html\` directly in any modern browser, or run:
\`\`\`bash
npx serve .
\`\`\`
`;
        return {
          status: 'success',
          files: { 'README.md': readme },
          tokensUsed: 620,
        };
      }

      default:
        return { status: 'success', tokensUsed: 200 };
    }
  }

  /**
   * Run the full pipeline for a given user brief
   */
  async runPipeline(userBrief, isMock = true) {
    if (this.isRunning) throw new Error('Pipeline is already running');
    this.isRunning = true;
    this.queue.clear();

    console.log(`\n\x1b[35m===============================================================\x1b[0m`);
    console.log(`\x1b[35m       STARTING PIPELINE EXECUTION (Mode: ${isMock ? 'MOCK' : 'REAL API'})   \x1b[0m`);
    console.log(`\x1b[36m       Brief: "${userBrief}"\x1b[0m`);
    console.log(`\x1b[35m===============================================================\x1b[0m\n`);

    const subtasks = this.createTaskPlan(userBrief);
    subtasks.forEach((st) => this.queue.enqueue(st));

    const context = { brief: userBrief };

    while (!this.queue.isPipelineComplete()) {
      const readyTasks = this.queue.getReadyTasks();
      if (readyTasks.length === 0) {
        // No ready tasks remaining, break if deadlocked
        break;
      }

      // Execute ready tasks in parallel or sequentially based on DAG
      await Promise.all(
        readyTasks.map(async (task) => {
          this.queue.claimTask(task.id, task.role);
          try {
            const result = await this.executeAgentTask(task, context, isMock);
            this.queue.completeTask(task.id, result);
          } catch (err) {
            console.error(`\x1b[31m[Pipeline Error] Task ${task.id} failed on ${task.role}:\x1b[0m`, err.message || err);
            const fallback = fallbackManager.handleAgentFailure(task.role, task, err);
            if (fallback && fallback.success) {
              try {
                console.log(`\x1b[33m[Fallback Retry] Retrying task ${task.id} with fallback agent: ${fallback.assignedAgentId}...\x1b[0m`);
                const retryResult = await this.executeAgentTask({ ...task, role: fallback.assignedAgentId }, context, isMock);
                this.queue.completeTask(task.id, retryResult);
              } catch (retryErr) {
                console.error(`\x1b[31m[Fallback Error] Fallback agent ${fallback.assignedAgentId} also failed for task ${task.id}:\x1b[0m`, retryErr.message || retryErr);
                this.queue.failTask(task.id, retryErr);
              }
            } else {
              this.queue.failTask(task.id, err);
            }
          }
        })
      );
    }

    this.isRunning = false;
    console.log(`\n\x1b[32m===============================================================\x1b[0m`);
    console.log(`\x1b[32m       PIPELINE EXECUTION COMPLETED! (${isMock ? 'MOCK' : 'REAL API'})          \x1b[0m`);
    console.log(`\x1b[32m       Generated files saved in: /generated-site/              \x1b[0m`);
    console.log(`\x1b[32m===============================================================\x1b[0m\n`);

    return {
      status: 'completed',
      brief: userBrief,
      isMock,
      filesGenerated: Array.from(this.siteFiles.keys()),
    };
  }
}

export const pipelineManager = new PipelineManager();
