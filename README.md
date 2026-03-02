# chrome-moroccan-data

Chrome Extension (Manifest V3) that can fill web forms with **fake Moroccan test data**, and provides a simple **quick login** helper (saved users → click to fill email/password).

## Features

- 👤 Save multiple users (name / email / password) in the Options page
- ⚡ In the popup, click a user to autofill Email + Password on the current tab
- ✨ (Optional) Scans web forms and auto-fills with realistic Moroccan data
- 🎯 Smart field detection: `email`, `phone`, `name`, `address`, etc.
- 🇲🇦 Powered by [@elfedali/moroccan-data](https://npmjs.com/package/@elfedali/moroccan-data)
- 💅 Modern UI built with **Tailwind CSS**
- ⚙️ Options page for settings & persistent storage
- 🔒 Works offline; no external API calls

### Data types generated:

- **Names:** first, last, full, job title
- **Contact:** email, mobile (06/07 format), international (+212)
- **Location:** street, city, region, postal code, coordinates
- **IDs:** CIN (national), ICE (business)
- **Other:** company name, username, dates, times, text

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Build Tailwind CSS

```bash
npm run build:css
```

(Or watch during development:)

```bash
npm run watch:css
```

### 3. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this folder: `chrome-moroccan-data/`

---

## Usage

### Quick login (saved users)

1. Open the extension **Options** page
2. Add your users (example: SuperAdmin / Admin / User)
3. Navigate to a website login page
4. Click the extension icon and click a user
5. ✅ The page’s email + password inputs are populated

> Note: credentials are stored in `chrome.storage.local` (plain text).

---

## Project structure

```
.
├── manifest.json             # Extension config (MV3)
├── background.js             # Service worker + data generator
├── contentScript.js          # Form scanner & filler
├── popup.html               # Popup UI (Tailwind)
├── popup.js                 # Popup logic
├── options.html             # Settings page (Tailwind)
├── options.js               # Settings logic
├── styles/
│   ├── input.css            # Tailwind directives
│   └── output.css           # Generated CSS
├── icons/                   # Extension icons
├── scripts/
│   └── generate-icons.sh    # Icon generator (macOS sips)
└── package.json             # npm config + dependencies
```

---

## Development

**Watch CSS changes:**

```bash
npm run watch:css
```

**Generate new icons:**

```bash
./scripts/generate-icons.sh
```

**Create distributable zip:**

```bash
npm run zip
```

---

## Notes

- The extension generates **fake/test data only** — it does not validate official identifiers
- All data generation happens locally (no network requests)
- Uses `chrome.storage.local` for persistent settings
- Seeded randomization available via `createMoroccanFaker({ seed })`

---

## API reference

See [@elfedali/moroccan-data docs](https://github.com/elfedali/moroccan-data) for full API:

```js
import { morocco } from '@elfedali/moroccan-data';

morocco.person.fullName()           // "Fatima Bennani"
morocco.phone.mobile()              // "06 12 34 56 78"
morocco.location.city()             // "Casablanca"
morocco.internet.email()            // "user@example.ma"
```
