# 🏁 Kelaniya IT/MIT // GPA Dashboard

[![Vite](https://img.shields.io/badge/Vite-v8.2.2-646CFF?logo=vite&logoColor=white)](https://vite.dev)
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

## 📝 License

Distributed under the MIT License. Created with ❤️ by **Sasivarnasarma**.
