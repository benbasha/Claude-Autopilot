# Claude Autopilot Landing Page - React Version

This is a React conversion of the original vanilla JavaScript landing page for Claude Autopilot. The React version maintains all original functionality while providing better component organization, state management, and maintainability.

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd landingpage-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📦 Project Structure

```
src/
├── components/           # React components
│   ├── HeroSection.jsx
│   ├── ProblemSection.jsx
│   ├── FeaturesSection.jsx
│   ├── MobileControlSection.jsx
│   ├── DemoSection.jsx
│   ├── SocialProofSection.jsx
│   ├── TechnicalSection.jsx
│   ├── InstallationSection.jsx
│   ├── FinalCTASection.jsx
│   ├── Footer.jsx
│   ├── Button.jsx           # Reusable button component
│   ├── GitHubStarsBadge.jsx # GitHub stars display
│   ├── FloatingCodeLines.jsx # Animated background effect
│   └── ProgressCircle.jsx   # Animated progress circle
├── hooks/                # Custom React hooks
│   ├── useIntersectionObserver.js
│   ├── useCounter.js
│   └── useGitHubStars.js
├── utils/                # Utility functions
│   ├── formatters.js
│   └── tracking.js
├── App.jsx               # Main app component
├── App.css               # Global styles
└── index.js              # React entry point
```

## 🎯 Key Features Converted

### ✅ Animations & Effects
- **Counter animations** using `useCounter` hook
- **Intersection Observer** animations with `useIntersectionObserver`
- **Floating code lines** background effect
- **Progress circles** with SVG animations
- **Terminal typing effect** in demo section
- **Button ripple effects** on click

### ✅ Interactive Elements
- **GitHub stars fetching** with `useGitHubStars` hook
- **Video placeholder interaction** in demo section
- **Mobile mockup interactions** with progress updates
- **Smooth scrolling** to sections
- **Hover effects** on buttons and cards

### ✅ State Management
- **React hooks** for all state management
- **useEffect** for lifecycle events
- **useState** for component state
- **Custom hooks** for reusable logic

### ✅ Performance Optimizations
- **Intersection Observer** for scroll-triggered animations
- **CSS animations** with proper cleanup
- **Optimized re-renders** with proper dependency arrays
- **Responsive design** with CSS Grid and Flexbox

## 🔧 Component Architecture

### Main Sections
Each major section is a separate component:
- `HeroSection` - Landing hero with animated background
- `ProblemSection` - Problem statement with before/after comparison
- `FeaturesSection` - Feature grid with hover effects
- `MobileControlSection` - Mobile control demo with progress circle
- `DemoSection` - Interactive terminal and phone mockup
- `SocialProofSection` - Testimonials and animated statistics
- `TechnicalSection` - Technical details and code preview
- `InstallationSection` - Step-by-step installation guide
- `FinalCTASection` - Final call-to-action with multiple buttons
- `Footer` - Links and company information

### Reusable Components
- `Button` - Configurable button with ripple effects
- `GitHubStarsBadge` - GitHub stars counter with GitHub API integration
- `FloatingCodeLines` - Animated background code snippets
- `ProgressCircle` - SVG-based animated progress indicator

### Custom Hooks
- `useIntersectionObserver` - Trigger animations on scroll
- `useCounter` - Animated number counting
- `useGitHubStars` - Fetch GitHub repository stats

## 🎨 Styling

The project uses CSS custom properties (CSS variables) for consistent theming:

```css
:root {
  --primary-cyan: #00D4FF;
  --secondary-orange: #FF6B35;
  --accent-purple: #7B68EE;
  --bg-dark: #0D1117;
  --text-light: #F0F6FC;
  /* ... more variables */
}
```

Each component has its own CSS file for better organization and maintainability.

## 📱 Responsive Design

The landing page is fully responsive with breakpoints at:
- **Desktop:** 1200px+
- **Tablet:** 768px - 1199px
- **Mobile:** 767px and below

## 🔗 External Dependencies

The React version has minimal dependencies:
- **React 18** - Core framework
- **React DOM** - DOM rendering
- **React Scripts** - Build tooling

## 🌐 External API Integration

### GitHub Stars
The landing page fetches real GitHub stars from the GitHub API:
```javascript
const { stars, loading, error } = useGitHubStars('benbasha/Claude-Autopilot');
```

### Analytics
Placeholder analytics tracking is included in `utils/tracking.js`. Replace with your preferred analytics provider:
```javascript
export const trackEvent = (eventName, properties = {}) => {
  // Replace with your analytics implementation
  console.log('Event tracked:', eventName, properties);
};
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify, Vercel, or GitHub Pages
The build output in the `build/` directory can be deployed to any static hosting service.

## 🔄 Conversion Notes

### What Was Converted
1. **All vanilla JavaScript** → React components with hooks
2. **DOM manipulation** → React state and props
3. **Event listeners** → React event handlers
4. **CSS animations** → React-triggered CSS classes
5. **Global state** → Component state and custom hooks

### What Was Preserved
1. **All original functionality** and interactions
2. **Identical visual design** and animations
3. **Same performance characteristics**
4. **All external links** and integrations
5. **Responsive behavior** on all devices

### Improvements Made
1. **Better code organization** with component separation
2. **Reusable components** for common UI elements
3. **Custom hooks** for shared logic
4. **Type-safe event handling** with React
5. **Easier testing** with component isolation

## 🛠 Development Commands

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (irreversible)
```

## 📄 License

This project maintains the same license as the original Claude Autopilot project.

## 🤝 Contributing

When contributing to this React version:
1. Maintain component isolation
2. Use custom hooks for reusable logic
3. Follow the existing CSS variable system
4. Ensure responsive design works on all devices
5. Test animations and interactions thoroughly

---

**Note:** This React conversion maintains 100% feature parity with the original vanilla JavaScript version while providing better maintainability and development experience.