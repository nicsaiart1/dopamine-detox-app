# Dopamine Detox App

A privacy-first local web app for daily dopamine detox tracking with checklist management, activity logging, and progress visualization.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### ✅ **Day View (MVP Complete)**
- **Daily Checklist**: Customizable morning, daytime, and evening routines with progress tracking
- **Fast-Dopamine Logging**: Track minutes spent on dopamine-heavy activities with categories, triggers, and replacements
- **Real-time Cap Tracking**: Visual progress indicators showing daily allowance usage
- **Quick-Add Buttons**: Fast logging with 5m, 10m, 15m preset buttons
- **Reflection Notes**: End-of-day journaling for mindfulness
- **Motivational Feedback**: Positive reinforcement based on daily performance

### 🚧 **Coming Soon**
- **Week View**: Calendar grid with weekly cap tracking and streak visualization
- **Month View**: Monthly calendar overview with heatmap visualization
- **Stats View**: Charts showing trends, category breakdowns, and moving averages
- **Export/Import**: Markdown, CSV, and JSON export with Obsidian compatibility
- **PWA Support**: Offline functionality and installable app experience

## 🏗️ Architecture

**Tech Stack**: Vite + React + TypeScript + Tailwind + Zustand + Dexie

```
[UI React] ─ components/pages
   │
   ├── [Zustand store] ─ derived selectors (totals, streaks, caps)
   │
   ├── [Data Repo] ─ Dexie (IndexedDB) adapter
   │
   └── [Service Worker] ─ PWA caching (coming soon)
```

### Core Components
- **Database**: Dexie-powered IndexedDB with schema versioning
- **State Management**: Zustand store with derived selectors
- **UI Components**: Custom component library built with Tailwind
- **Repository Pattern**: Clean data layer with async/await API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nicsaiart1/dopamine-detox-app.git
cd dopamine-detox-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## 📖 Usage

### Setting Up Your Daily Routine

1. **Configure Settings**: Set your weekly dopamine allowance (default: 4 hours)
2. **Customize Checklist**: Modify the morning, daytime, and evening routine items
3. **Define Categories**: Add your specific fast-dopamine activities (scrolling, gaming, etc.)
4. **Set Triggers & Replacements**: Configure trigger tags and healthy replacement activities

### Daily Workflow

1. **Morning**: Check off your morning routine items
2. **Throughout Day**: Log dopamine activities as they happen using quick-add buttons
3. **Monitor Progress**: Watch your cap usage with real-time visual indicators  
4. **Evening**: Complete evening checklist and add reflection notes

### Data Privacy

- **100% Local**: All data stays in your browser's IndexedDB
- **No Cloud**: Zero external API calls or data transmission
- **Encryption Ready**: Optional passphrase encryption (coming soon)
- **Export Control**: Manual backup/restore with multiple formats

## 🔧 Development

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base components (Button, Card, Input, etc.)
│   ├── DayChecklist.tsx # Daily routine checklist component
│   ├── FastLogPanel.tsx # Dopamine activity logging
│   └── Layout.tsx       # Main app layout with navigation
├── pages/               # View components
│   ├── DayPage.tsx      # ✅ Complete day view
│   ├── WeekPage.tsx     # 🚧 Week calendar view  
│   ├── MonthPage.tsx    # 🚧 Month overview
│   └── StatsPage.tsx    # 🚧 Analytics dashboard
├── data/                # Data layer
│   ├── db.ts           # Dexie database schema
│   └── repository.ts   # Repository pattern implementation
├── store/               # State management
│   └── index.ts        # Zustand store with selectors
├── types/               # TypeScript definitions
│   └── index.ts        # Core entity types
└── utils/               # Utility functions
    ├── dates.ts        # Date manipulation helpers
    └── export.ts       # Export/import functionality
```

### Key Design Principles

- **Privacy-First**: Local storage with no external dependencies
- **Performance**: 60fps interactions with optimized re-renders
- **Accessibility**: WCAG AA compliance with keyboard navigation
- **Progressive Enhancement**: Works offline, installable as PWA
- **Positive Psychology**: Celebrate wins, avoid shame language

### Database Schema

```typescript
// Core entities
UserSettings {
  weeklyAllowanceMinutes: number;
  checklistTemplate: ChecklistTemplate;
  categories: string[];
  replacementCategories: string[];
  triggerPresets: string[];
}

DayLog {
  id: string; // YYYY-MM-DD
  checklist: { itemId: string; checked: boolean }[];
  reflections?: string;
  totalFastMinutes: number;
}

ActivityEntry {
  id: string;
  dayId: string;
  minutes: number;
  category: string;
  triggers: string[];
  replacement?: string;
}
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Run tests with UI
```

## 🧪 Testing

The app includes a comprehensive testing setup:

- **Unit Tests**: Vitest for store logic and utilities
- **Component Tests**: React Testing Library for UI components
- **E2E Tests**: Playwright for full user workflows (coming soon)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run specific test file
npm test -- DayPage.test.tsx
```

## 📊 Data Model

### Weekly Allowance System
- Set weekly fast-dopamine budget (e.g., 4 hours out of 40 leisure hours)
- Daily cap automatically calculated (weekly ÷ 7)
- Visual indicators show usage percentage
- Streak tracking for weeks under cap

### Derived Metrics
- **Daily Total**: Sum of activity minutes per day
- **Weekly Total**: Sum of daily totals in Monday-Sunday window
- **Cap Usage %**: Weekly total ÷ cap minutes × 100
- **Streak**: Consecutive weeks with usage ≤ 100%
- **MA7**: 7-day moving average (coming soon)

## 🎨 Design System

### Color Palette
- **Accent**: Configurable hue slider (90° green → 48° gold for positive trends)
- **Success**: Green tones for achievements and within-cap usage
- **Warning**: Amber for approaching cap limits
- **Neutral**: Grays for secondary information

### Component Library
- **Button**: 4 variants × 3 sizes with loading states
- **Card**: Elevation-based hierarchy with consistent spacing
- **Input**: Form controls with validation and error states
- **Badge**: Category and status indicators with semantic colors

## 🔮 Roadmap

### Phase 1: Core MVP ✅
- [x] Day view with checklist and logging
- [x] Database setup with Dexie
- [x] Basic UI component library
- [x] Real-time cap tracking

### Phase 2: Views & Analytics 🚧
- [ ] Week view with calendar grid
- [ ] Month view with heatmap
- [ ] Stats dashboard with charts
- [ ] Streak calculation system

### Phase 3: Data & PWA 📋
- [ ] Export/import (Markdown, CSV, JSON)
- [ ] PWA with offline support
- [ ] Obsidian template integration
- [ ] Data encryption options

### Phase 4: Advanced Features 🔬
- [ ] Smart notifications
- [ ] Habit insights and suggestions
- [ ] Desktop app with Tauri
- [ ] Advanced analytics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Product Inspiration**: Digital wellbeing research and dopamine detox methodologies
- **Technical Stack**: Built with modern React ecosystem best practices
- **Design Philosophy**: Positive psychology principles and privacy-first development

---

**Note**: This app is designed for personal use and self-tracking. It is not a substitute for professional medical or psychological advice.
