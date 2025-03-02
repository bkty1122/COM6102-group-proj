# linguasmart-frontend (has to be rename with linguosmart)

This repo is for developping the frontend for Lingua Smart - a language learning platform which allow user to train their reading, writing, speaking and listening skills with powerful AI tools.

## Project Structure

```plaintext

src/
├── api/                # Centralized API handling
│   ├── auth.js         # API methods for authentication
│   ├── user.js         # API methods for user-related operations
│   ├── config.js       # Backend server configuration (e.g., base URL)
│   └── index.js        # Central export for all API modules
├── components/         # Reusable UI components
│   ├── Basic/          # Atomic components (e.g., Button, InputField)
│   ├── Medium/         # Combined components (e.g., Card, Modal)
│   ├── layouts/        # Layout components (e.g., Header, Sidebar)
│   └── index.js        # Central export for all components
├── hooks/              # Custom React hooks for shared logic
│   ├── useAuth.js      # Hook for authentication logic
│   ├── useFetch.js     # Hook for reusable data fetching logic
│   ├── useTheme.js     # Hook for theme management
│   └── index.js        # Central export for all hooks
├── pages/              # Pages corresponding to routes
│   ├── LoginPage.js    # Login page
│   ├── Dashboard.js    # Main dashboard
│   ├── ProfilePage.js  # User profile page
│   └── index.js        # Central export for all pages
├── services/           # Business logic and API abstraction
│   ├── authService.js  # Handles login, logout, and token management
│   ├── userService.js  # Handles user-specific actions
│   └── index.js        # Central export for all services
├── state/              # Global state management (e.g., Redux, Context API)
│   ├── authContext.js  # Authentication state
│   ├── themeContext.js # Theme state
│   ├── store.js        # Redux store or Context provider setup
│   └── index.js        # Central export for all state logic
├── utils/              # Utility functions and helpers
│   ├── validation.js   # Form validation functions
│   ├── dateUtils.js    # Date and time utilities
│   ├── apiUtils.js     # Helpers for API handling (e.g., token injection)
│   └── index.js        # Central export for all utilities
└── i18n/                # Internationalization (language translations)
    ├── en/
    ├── zh/
    └── index.js
├── App.js              # Main app entry point
├── index.js            # ReactDOM render
└── assets/             # Static assets (e.g., images, fonts, styles)
    ├── images/
    ├── trainingMaterials/ # training materials for language learning, used for testing purpose
    └── styles/

```

## initial setup

npx create-react-app linguasmart-frontend
cd linguasmart-frontend
npm start

## Useful Command for branch control

git checkout main
git merge -X theirs your-branch-name
git push origin main

## Code style

Javascript: https://github.com/airbnb/javascript?tab=readme-ov-file#types
Python: https://google.github.io/styleguide/pyguide.html
React: https://github.com/airbnb/javascript/tree/master/react
