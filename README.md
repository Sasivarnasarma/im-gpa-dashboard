# 🏁 Kelaniya IT/MIT // GPA Dashboard

[![Vite](https://img.shields.io/badge/Vite-v8.3.4-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-v19.0.0-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind--v4.3.3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Oxlint](https://img.shields.io/badge/Oxlint-verified-green?logo=lightning&logoColor=white)](https://oxc.rs)

A high-performance, responsive GPA calculator and academic curriculum tracker custom-tailored for B.Sc. (Hons) in Information Technology (**IT**) and Management and Information Technology (**MIT**) degree programmes at the University of Kelaniya.

---

## ⚡ Core Features

- **Dual-Degree Specialization Pathways:** Supports dynamic curriculum sorting and requirements grouping for both **IT** and **MIT** degrees.
- **MIT Year 3 Streams Onboarding:** Built-in support for the three core MIT Year 3 specialization pathways:
  - Business Systems Consulting (**BSC**)
  - Operations & Supply Chain Management (**OSCM**)
  - Information Systems (**IS**)
- **Target GPA Planner:** Interactive target forecaster calculates the average grade weight needed in all remaining semesters to hit your graduation CGPA goals.
- **Results Image Export:** Preview, download, or share a high-resolution PNG of all entered results, a year, or a semester, with GPA and credit totals for the selected period. Include or hide your profile name and overall honours badge using accessible custom checkboxes. Images are generated locally on your device. Native image sharing is available on supported devices, with PNG download as a fallback.
- **Executive Summary & Honors Tracking:** Live display of current Cumulative GPA, total completed credits, and real-time Honours standing forecasts.
- **Interactive Recharts Telemetry:** Visualizes GPA progress across semesters with interactive, animated SVG trend charts.
- **Onboarding Privacy Safeguard:** Standalone onboarding flow ensuring all student grade records are persisted locally inside the device's `localStorage` for 100% data privacy.
- **Mobile-Optimized Layouts:** Fully responsive with dedicated top selector cards for smaller touch targets and line-locked mobile metric headers.

---

## 🎨 Design System

Styled directly around motorsport design telemetry aesthetics:

- **Sharp Aesthetics:** Binary radius structure (`rounded-none` for layouts/inputs, `rounded-full` exclusively for circular dashboard buttons).
- **Tricolor Accents:** Highlights layout edges with signature tricolor stripes:
  - 🔵 Light Blue (`#0066b1`)
  - 🔵 Dark Blue (`#1c69d4`)
  - 🔴 Red (`#e22718`)
- **Visual Indicators:** C+ and C grades are styled in cockpit instrument **Amber Orange** (`#ff7b00`) inside selectors and scales to immediately isolate borderline modules.
- **Micro-Animations:** Fluid layout entries, modal transitions, and smooth count-up/count-down statistics updates powered by **Framer Motion**.

---

## 📂 Code Architecture

The codebase has been refactored from a single monolithic file into a highly modular, readable, and clean folder structure:

```text
src/
├── components/          # Isolated, reusable React components
│   ├── AnalyticsChart   # Render engine for SVG GPA telemetry line charts (Lazy)
│   ├── AnimatedCounter  # Reactive scroll and numeric value counter triggers
│   ├── ExecutiveSummary # CGPA stats, credit widgets, and Honours calculators
│   ├── MobileSelector   # Dropdown panel for mobile screen targets
│   ├── Navbar           # Sticky navigation header and desktop select targets
│   ├── ResetModal       # Erase and reset dashboard configuration overlay (Lazy)
│   ├── SecurityModal    # Onboarding local storage privacy agreement
│   ├── SemesterCard     # Module selector grid and optional/compulsory labels
│   ├── SystemCreator    # Centered profile panel with professional links (Lazy)
│   └── WelcomeModal     # Onboarding stream and pathway selection overlay
├── data/
│   ├── constants.js     # Single source of truth for localStorage storage keys
│   └── modules.js       # Complete curriculum database (Common & Specialization modules)
├── App.jsx              # Orchestrator and central state manager
├── main.jsx             # React client bootstrap entry point
└── index.css            # Tailwind directives, fonts, and custom animations
```

---

## 🚀 Tech Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS v4 (built with `@tailwindcss/vite` plugin compilation)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Linter:** Oxlint (super-fast parser running on Oxc)
- **Formatting:** Prettier

---

## 🛠️ Local Development

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Sasivarnasarma/im-gpa-dashboard.git

# Enter the project directory
cd im-gpa-dashboard

# Install packages
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to test the local workspace.

### 4. Format & Validate Code

```bash
# Run prettier code formatting
pnpm run format

# Run oxlint linter
pnpm run lint
```

### 5. Production Build

```bash
pnpm run build
```

---

## Announcement popup

Edit `ANNOUNCEMENT` in `src/data/constants.js` to set the popup's `id`, `title`,
`message`, and `buttonText`. Change the ID whenever you want users to see it
again, even if they dismissed the previous announcement. Set `id: null` to
disable it. Messages support line breaks and are displayed as plain text.

To show an extra URL button, set `link: { url: 'https://example.com', text: 'Learn more' }`
in the same announcement. Both fields must be filled in, and the URL must use
HTTP or HTTPS. Leave them empty (or set `link: null`) to hide the button. The
link opens in a new tab and does not dismiss the announcement.

The popup appears after onboarding. Dismissing it with the button or Escape saves
its ID in localStorage, shared by all profiles in that browser. Editing text
without changing the ID does not show it again to users who already dismissed it.
If storage is unavailable, dismissal lasts for the current app session only.

## 📝 License

Distributed under the MIT License. Created with ❤️ by **Sasivarnasarma**.
