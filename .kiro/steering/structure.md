# Project Structure

```
Expense-Budget-Visualizer/
├── index.html          # Single-page app shell; all sections and modals defined here
├── css/
│   └── style.css       # All styles; uses CSS custom properties for theming
└── js/
    └── app.js          # All application logic (state, rendering, event handling)
```

## index.html
- Single HTML file; no routing
- Sections use `id="sec-*"` for in-page anchor navigation
- Modals (edit transaction, manage categories) are hidden `div.modal-overlay` elements at the bottom of `<body>`
- The `<select id="category">` and budget selects are populated entirely by JS
- Chart.js `<canvas id="pie-chart">` is in the right column

## css/style.css
- **Theme tokens** defined as CSS custom properties on `:root` (dark, default) and `[data-theme="light"]`
- Token categories: backgrounds (`--bg`, `--surface-*`), borders, brand/accent, semantic colors (`--income`, `--expense`, `--warn`), text scale (`--text-1` through `--text-4`), radii, shadows
- Layout: `.main-grid` is a two-column CSS Grid (left content + right sticky column); collapses to single column below 900 px
- No external CSS framework; all utility classes are hand-written

## js/app.js
- **Single file**, no modules
- Structure (top to bottom): storage keys → SVG icon strings → built-in categories → state variables → DOM refs → theme init → event listeners → handler functions → render functions → utility functions
- **State**: `transactions[]`, `customCats[]`, `budgets{}`, `currentSort`, `currentMonth`, `budgetOverall`, `dateFilter`
- **Render pipeline**: `render()` calls `renderSummary()`, `renderList()`, `renderChart()`, `renderMonthlySummary()`, `renderBudgets()`, `renderOverallProgress()`
- Built-in categories are defined in `BUILTIN_CATEGORIES`; custom categories are persisted to `localStorage`. `allCategories()` merges both
- HTML for list items and budget rows is built via string concatenation and set with `innerHTML`. Always use `escapeHtml()` on user-supplied strings before inserting into HTML
- Chart.js instance is held in a module-level variable and destroyed/recreated on each `renderChart()` call

## Conventions
- User-facing strings (labels, error messages, placeholders) are in **Bahasa Indonesia**
- Code (variable names, function names, comments) is in **English**
- Avoid adding external dependencies; keep the zero-build-step constraint
- When adding new UI sections, follow the existing card/section pattern with `aria-labelledby` for accessibility
- Use existing CSS custom properties for all colors and spacing — do not hardcode hex values outside of `style.css`
