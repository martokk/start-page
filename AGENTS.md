# AGENTS.md - Development Guide for AI Coding Agents

## Project Overview

**Type**: Vanilla JavaScript static web application
**Tech Stack**: HTML5, CSS3, ES6+ JavaScript (no frameworks, no build process)
**Deployment**: Docker (nginx:alpine)
**Storage**: Browser LocalStorage
**External API**: Reddit public JSON endpoints

This is a lightweight, dependency-free start page for aggregating Reddit feeds.

---

## Build, Lint, and Test Commands

### Local Development
```bash
# Serve locally (Python)
python -m http.server 8080

# Access at http://localhost:8080
```

### Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f start-page

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Testing
**NO test framework exists.** All testing is manual in browser.

To test changes:
1. Serve locally or rebuild Docker container
2. Open browser to http://localhost:8080
3. Open DevTools Console for errors
4. Test features manually (add column, drag/drop, mark read, etc.)

### Linting
**NO linter configured.** Follow the style guide below manually.

---

## File Structure

```
/
├── index.html          # Entry point
├── app.js              # All JavaScript logic
├── styles.css          # All styles
├── Dockerfile          # Container definition
├── docker-compose.yml  # Container orchestration
├── nginx.conf          # Web server config
└── README.md           # User documentation
```

**IMPORTANT**: This is a single-page application with ALL code in 3 files. No src/ directory, no components/ folder.

---

## Code Style Guidelines

### JavaScript (app.js)

#### Module Organization
- Use **object-based namespacing** (not ES6 modules)
- Group related functions into namespace objects

```javascript
// ✅ CORRECT - Namespace pattern used throughout
const Storage = {
    getColumns() { /* ... */ },
    saveColumns(columns) { /* ... */ }
};

const RedditAPI = {
    fetchSubreddit(subreddit) { /* ... */ }
};

// ❌ WRONG - Don't use ES6 modules
export const getColumns = () => { /* ... */ };
import { getColumns } from './storage.js';
```

#### Constants
- Define at **top of file**
- Use **UPPERCASE_WITH_UNDERSCORES**
- Group related constants in objects when appropriate

```javascript
// ✅ CORRECT
const STORAGE_KEYS = {
    COLUMNS: 'startpage_columns',
    READ: 'startpage_read'
};
const CACHE_DURATION = 2 * 60 * 60 * 1000;

// ❌ WRONG
const cacheTime = 7200000;
```

#### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Namespace objects | PascalCase | `Storage`, `RedditAPI`, `Render` |
| Functions | camelCase | `fetchSubreddit`, `renderItem` |
| Variables | camelCase | `readItems`, `columnId` |
| DOM elements | camelCase + `El` suffix | `itemEl`, `columnBodyEl`, `containerEl` |
| Constants | UPPERCASE_SNAKE_CASE | `STORAGE_KEYS`, `CACHE_DURATION` |
| Event handlers | `handle` + action | `handleItemClick`, `handleRefresh` |
| Boolean flags | Prefix with `is`/`has`/`should` | `isValid`, `hasItems`, `shouldRefresh` |

#### Functions
- Prefer **arrow functions** for callbacks and simple functions
- Use **async/await** for asynchronous code (not `.then()`)
- Keep functions focused and small

```javascript
// ✅ CORRECT
async fetchSubreddit(subreddit, sort, timeframe) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Reddit API Error:', error);
        throw error;
    }
}

// ❌ WRONG - Don't use .then() chains
fetch(url).then(res => res.json()).then(data => /* ... */);
```

#### Error Handling
- Always wrap async operations in **try/catch**
- Log errors with **console.error** (include context)
- Rethrow errors unless you can meaningfully recover
- Show user-friendly error messages in UI

```javascript
// ✅ CORRECT
try {
    const items = await RedditAPI.fetchSubreddit(column.subreddit, column.sort, column.timeframe);
    // ... render items
} catch (error) {
    columnBodyEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff6b6b;">Error: ${error.message}</div>`;
}

// ❌ WRONG - Silent failures
try {
    await fetch(url);
} catch (e) {}  // Never do this!
```

#### DOM Manipulation
- Use **vanilla DOM APIs** (no jQuery)
- Cache DOM queries in variables ending with `El`
- Use **template literals** for HTML generation
- Prefer **event delegation** over individual listeners

```javascript
// ✅ CORRECT - Event delegation
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-refresh')) {
        this.handleRefresh(e.target.dataset.columnId);
    }
});

// ✅ CORRECT - Template literals for HTML
itemEl.innerHTML = `
    <div class="item-title">${item.title}</div>
    <div class="item-meta">
        <span class="item-score">↑${item.score}</span>
    </div>
`;

// ❌ WRONG - Individual listeners
document.querySelectorAll('.btn-refresh').forEach(btn => {
    btn.addEventListener('click', /* ... */);
});
```

#### Data Attributes
- Use `data-*` attributes to store metadata on DOM elements
- Access via `element.dataset.propertyName`

```javascript
// ✅ CORRECT
columnEl.dataset.columnId = column.id;
const columnId = e.target.dataset.columnId;

// ❌ WRONG
columnEl.setAttribute('id', column.id);  // Don't overload 'id' for data
```

#### LocalStorage
- Always parse/stringify JSON
- Handle missing keys gracefully (return defaults)
- Check storage usage proactively

```javascript
// ✅ CORRECT
getColumns() {
    const data = localStorage.getItem(STORAGE_KEYS.COLUMNS);
    return data ? JSON.parse(data) : [];
}

// ❌ WRONG - No error handling
getColumns() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COLUMNS));
}
```

### CSS (styles.css)

#### Conventions
- Use **kebab-case** for class names
- Group related styles together
- Follow **mobile-first** approach (this app is desktop-focused, but be responsive)
- Use CSS custom properties for theming (currently hardcoded colors)

```css
/* ✅ CORRECT */
.column-header {
    padding: 15px;
    border-bottom: 1px solid #333;
}

/* ❌ WRONG */
.ColumnHeader {
    padding: 15px;
}
```

#### Color Palette
Maintain consistency with existing dark theme:

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark gray | `#1a1a1a` |
| Cards | Medium gray | `#242424` |
| Borders | Border gray | `#333` |
| Text | Light gray | `#e0e0e0` |
| Accent | Orange | `#ff6b35` |
| Muted text | Gray | `#888` |

### HTML (index.html)

- Use **semantic HTML5** elements where appropriate
- Keep structure minimal (dynamic content via JavaScript)
- Use `id` for unique elements, `class` for styling
- Include `data-*` attributes for JavaScript hooks

---

## Development Guidelines

### Making Changes

1. **Read existing code first** - Understand patterns before adding new code
2. **Follow existing conventions** - Match the style already in use
3. **Test in browser** - No automated tests exist, so manual testing is critical
4. **Keep it simple** - This is a vanilla JS project, don't introduce frameworks

### Common Tasks

#### Adding a New Feature
1. Identify which namespace object it belongs to (Storage, RedditAPI, Render, Events, etc.)
2. Add function to appropriate namespace
3. Hook up event listeners if needed (in Events.init())
4. Update rendering logic if UI changes (in Render)
5. Test manually in browser

#### Modifying Styles
1. Find existing CSS rules (everything is in styles.css)
2. Follow existing naming conventions
3. Maintain dark theme colors
4. Test responsive behavior

#### API Changes
- All Reddit API logic lives in `RedditAPI` namespace
- Respect 2-hour cache (don't spam Reddit's API)
- Handle errors gracefully (network issues, rate limits)

### What NOT to Do

❌ **Don't** introduce npm, webpack, or any build tools
❌ **Don't** split code into multiple JS files
❌ **Don't** add frameworks (React, Vue, etc.)
❌ **Don't** use TypeScript (this is vanilla JS)
❌ **Don't** use ES6 modules (import/export)
❌ **Don't** add external dependencies
❌ **Don't** ignore browser console errors
❌ **Don't** break existing localStorage data structure
❌ **Don't** make API calls without caching
❌ **Don't** forget to test drag-and-drop functionality after DOM changes
❌ **Don't** clear LocalStorage (e.g. localStorage.clear()) during automated testing or debugging; it destroys user data that cannot be recovered

### Browser Compatibility

Target: **Modern browsers only** (Chrome, Firefox, Safari, Edge)

Required features:
- ES6 (arrow functions, template literals, const/let, async/await)
- LocalStorage
- Fetch API
- CSS Grid/Flexbox

No need for polyfills or IE11 support.

---

## Debugging

### Console Errors
Open DevTools Console and look for:
- Reddit API errors (network, rate limiting)
- LocalStorage quota exceeded
- JavaScript runtime errors

### Common Issues
- **Posts not loading**: Check Network tab for Reddit API responses
- **Drag-and-drop broken**: Ensure `.column` class and draggable attribute present
- **Storage warning**: LocalStorage near 5MB limit, clear read items

### Useful Debug Commands
```javascript
// In browser console:
localStorage.clear()  // Reset everything
console.log(Storage.getColumns())  // Inspect columns
console.log(Storage.getReadItems().length)  // Count read items
```

---

## Deployment

Changes automatically reflect when:
- **Local dev**: Refresh browser
- **Docker**: Volumes are mounted, so edit source files and refresh browser (no rebuild needed)

Full rebuild only needed if:
- Dockerfile changes
- nginx.conf changes

---

## Additional Notes

- **No cursor/copilot rules exist** - Follow this document as the source of truth
- **No .gitignore** - Be careful not to commit sensitive data
- **No CI/CD** - Manual deployment only
- **This document (AGENTS.md) is for AI agents** - Keep README.md for human users
