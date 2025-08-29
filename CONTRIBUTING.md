# Contributing to Dopamine Detox App

Thank you for your interest in contributing to the Dopamine Detox App! We welcome contributions from the community and are excited to work with you.

## 🚀 Getting Started

### Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dopamine-detox-app.git
   cd dopamine-detox-app
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

### Project Overview

This is a privacy-first React application built with:
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB wrapper)
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## 📋 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**: Fix existing issues
- ✨ **New features**: Implement features from our roadmap
- 📚 **Documentation**: Improve docs, add examples
- 🧪 **Tests**: Add test coverage
- 🎨 **UI/UX**: Improve design and user experience
- ♿ **Accessibility**: Make the app more accessible
- 🔧 **Tooling**: Improve development experience

### Before You Start

1. **Check existing issues** to see if your idea is already being worked on
2. **Create an issue** for new features or significant changes
3. **Comment on the issue** to let others know you're working on it

### Development Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add weekly calendar view"
   git commit -m "fix: resolve checklist completion calculation"
   git commit -m "docs: update README with new features"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 🎯 Development Guidelines

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
npm run lint          # Check for linting errors
npm run lint --fix    # Auto-fix linting issues
```

### TypeScript

- **Use strict types**: Avoid `any`, prefer specific interfaces
- **Export types**: Make reusable type definitions
- **Document complex types**: Add JSDoc comments for clarity

### React Components

- **Use functional components** with hooks
- **Follow naming conventions**: PascalCase for components, camelCase for functions
- **Keep components focused**: Single responsibility principle
- **Use TypeScript interfaces** for props

### State Management

- **Use Zustand store** for global state
- **Keep derived data in selectors** for performance
- **Use local state** for component-specific data

### Database

- **Use the repository pattern** for data access
- **Handle errors gracefully** with try/catch
- **Maintain data consistency** with transactions when needed

### Testing

- **Write tests for new features**
- **Test user interactions**, not implementation details
- **Use descriptive test names**
- **Mock external dependencies**

Example test structure:
```typescript
describe('DayChecklist', () => {
  it('should update completion percentage when items are checked', () => {
    // Test implementation
  });
});
```

### Accessibility

- **Use semantic HTML** elements
- **Add ARIA labels** where needed
- **Ensure keyboard navigation** works
- **Test with screen readers**
- **Maintain color contrast** ratios

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base design system components
│   └── [Feature].tsx   # Feature-specific components
├── pages/              # Top-level page components
├── data/               # Database and repository layer
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test utilities and setup
```

### Component Organization

- **ui/**: Reusable, unstyled components (Button, Card, Input)
- **components/**: Feature-specific components (DayChecklist, FastLogPanel)
- **pages/**: Top-level route components (DayPage, WeekPage)

### Naming Conventions

- **Components**: PascalCase (e.g., `DayChecklist.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase interfaces (e.g., `UserSettings`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_CATEGORIES`)

## 🧪 Testing Guidelines

### What to Test

- **User interactions**: Clicking, typing, navigation
- **Data flow**: Store updates, API calls
- **Edge cases**: Empty states, error conditions
- **Accessibility**: Keyboard navigation, screen readers

### Testing Tools

- **Vitest**: Unit and integration tests
- **React Testing Library**: Component testing
- **MSW** (future): API mocking
- **Playwright** (future): E2E testing

### Test File Naming

```
src/
├── components/
│   ├── DayChecklist.tsx
│   └── __tests__/
│       └── DayChecklist.test.tsx
└── utils/
    ├── dates.ts
    └── __tests__/
        └── dates.test.ts
```

## 🚫 What NOT to Do

- **Don't add external API calls** - This is a privacy-first local app
- **Don't use heavy dependencies** - Keep the bundle size small
- **Don't break existing functionality** - Ensure backward compatibility
- **Don't skip tests** - Maintain test coverage for new features
- **Don't ignore accessibility** - The app should be usable by everyone

## 🎨 Design Principles

### Privacy First
- No external API calls
- Local data storage only
- Optional encryption for exports

### Positive Psychology
- Celebrate achievements
- Avoid shame-based language
- Focus on progress, not perfection

### Performance
- 60fps interactions
- Minimal re-renders
- Efficient data structures

### Accessibility
- WCAG AA compliance
- Keyboard navigation
- Screen reader support

## 📋 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] **Tests pass**: `npm test` completes successfully
- [ ] **Linting passes**: `npm run lint` shows no errors
- [ ] **Build works**: `npm run build` completes successfully
- [ ] **Type checking**: TypeScript compilation succeeds
- [ ] **Accessibility**: New UI is keyboard navigable
- [ ] **Documentation**: README updated if needed
- [ ] **Commit messages**: Follow conventional commit format
- [ ] **Description**: PR describes what, why, and how

### PR Description Template

```markdown
## What
Brief description of the changes

## Why
Explanation of the motivation/problem being solved

## How
Technical details of the implementation

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Accessibility tested

## Screenshots
(If UI changes) Before/after screenshots

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
```

## 🤝 Code Review Process

1. **Automated checks** must pass (tests, linting, build)
2. **Manual review** by maintainers
3. **Testing** of new functionality
4. **Feedback incorporation** if needed
5. **Merge** when approved

### Review Criteria

- **Functionality**: Does it work as intended?
- **Code quality**: Is it readable and maintainable?
- **Performance**: Does it impact app performance?
- **Security**: No security vulnerabilities?
- **Accessibility**: Is it accessible to all users?

## 🎯 Roadmap Priorities

Current focus areas where contributions are especially welcome:

### High Priority
1. **Week View**: Calendar grid with weekly tracking
2. **Month View**: Monthly overview with heatmap
3. **Export/Import**: Data portability features
4. **PWA Setup**: Offline functionality

### Medium Priority
1. **Stats Dashboard**: Charts and analytics
2. **Settings Page**: User configuration
3. **Accessibility Improvements**: WCAG compliance
4. **Performance Optimization**: Bundle size, loading

### Low Priority
1. **Advanced Features**: Smart notifications
2. **Desktop App**: Tauri integration
3. **Visual Enhancements**: Animations, themes

## 💬 Communication

- **GitHub Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions
- **Discussions**: For questions and general discussion

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to the Dopamine Detox App! Your efforts help make digital wellbeing tools more accessible to everyone. 🎉
