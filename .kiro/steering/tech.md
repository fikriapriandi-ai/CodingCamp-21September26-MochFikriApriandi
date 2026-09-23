# Tech Stack

## Runtime & Build
- **No build system** — plain HTML/CSS/JS, runs directly in the browser
- No npm, no bundler, no transpilation, no TypeScript
- Open `index.html` directly in a browser to run the app

## Languages & Standards
- HTML5 (semantic elements, ARIA attributes)
- CSS3 (custom properties / CSS variables, Grid, Flexbox, `clamp()`)
- JavaScript ES5-style (`var`, `function`, no classes, no modules) with `'use strict'`

## External Libraries
- **Chart.js** — loaded via CDN (`https://cdn.jsdelivr.net/npm/chart.js`) for the pie chart
- **Google Fonts** — Inter font loaded via CSS `@import`

## Data Persistence
- All state stored in `localStorage`
- Storage keys are prefixed `ebv_` (defined as constants at the top of `app.js`)
- Data serialized/deserialized with `JSON.stringify` / `JSON.parse` via `saveJSON`/`loadJSON` helpers

## Formatting
- Currency: Indonesian Rupiah (`Rp`) formatted with `Intl.NumberFormat('id-ID')`

## Common Commands
There is no build step. To run the project:
```
# Just open the file in a browser
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

To serve with a simple local server (optional, for dev convenience):
```
npx serve .
# or
python -m http.server
```
