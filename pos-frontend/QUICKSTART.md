# Quick Start Guide

## Prerequisites

1. **Node.js 18+** and npm installed
2. **Spring Boot backend** running on `http://localhost:8080`

## Setup

```bash
# 1. Navigate to frontend directory
cd pos-frontend

# 2. Install dependencies (already done)
npm install

# 3. Configure environment variables
# The .env file is already created with default values
# Update if your backend is running on a different URL

# 4. Start development server
npm run dev
```

The application will open at **http://localhost:5173**

## Default Login Credentials

Use the credentials from your Spring Boot backend:

```
Username: staff / admin
Password: (your backend password)
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript type checking
```

## Project Structure (Quick Overview)

```
src/
├── api/           # Backend API calls
├── stores/        # Local state (Zustand)
├── components/    # Reusable UI components
├── pages/         # Route pages
├── types/         # TypeScript types
└── utils/         # Helper functions
```

## Current Implementation Status

### ✅ Completed (Phase 1)
- Project scaffolding
- Authentication flow
- API client with token refresh
- Login page
- Open shift page
- Protected routes
- Basic layout (Header + Sidebar)
- State management setup
- Type definitions

### 🚧 In Progress
- POS Sale screen (placeholder)
- Product grid
- Shopping cart
- Payment flow

### 📋 Todo
- Orders management
- Refunds
- Shift management
- Settings
- Offline mode
- Receipt printing

## Development Workflow

### Adding a New Component

1. Create component file:
```typescript
// src/components/product/ProductCard.tsx
export function ProductCard({ product }) {
  return <div>...</div>;
}
```

2. Use in page:
```typescript
import { ProductCard } from '../components/product/ProductCard';
```

### Making API Calls

```typescript
// Using React Query
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product.api';

const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: productApi.getProducts
});
```

### Using Stores

```typescript
// Using Zustand
import { useCartStore } from '../stores/cart.store';

function Cart() {
  const { items, addItem } = useCartStore();
  // ...
}
```

## Testing the Application

### 1. Test Login
1. Start the application
2. Navigate to http://localhost:5173
3. You should be redirected to `/login`
4. Enter credentials and login
5. Should redirect to `/open-shift`

### 2. Test Shift Opening
1. After login, enter opening cash amount
2. Click "Open Shift"
3. Should redirect to `/pos` (POS Sale screen)

### 3. Test Navigation
1. Use sidebar to navigate between pages
2. Check network status indicator (top right)
3. Check user info and logout button

## API Integration

The frontend expects these backend endpoints:

```
POST   /api/v1/auth/login         # Login
POST   /api/v1/auth/refresh       # Refresh token
POST   /api/v1/auth/logout        # Logout

GET    /api/v1/products           # List products
GET    /api/v1/categories         # List categories

POST   /api/v1/orders             # Create order
GET    /api/v1/orders             # List orders

POST   /api/v1/payments           # Create payment
GET    /api/v1/payments/:id       # Get payment status

POST   /api/v1/shifts/open        # Open shift
GET    /api/v1/shifts/current     # Get current shift
POST   /api/v1/shifts/:id/close   # Close shift
```

## Common Issues

### Port Already in Use
```bash
# If port 5173 is busy, Vite will try the next available port
# Or specify a different port in vite.config.ts
```

### Backend Connection Failed
```bash
# Check if Spring Boot is running on http://localhost:8080
# Check CORS configuration in Spring Boot
# Update VITE_API_BASE_URL in .env if needed
```

### Token Expired
```bash
# The app automatically refreshes tokens
# If refresh fails, you'll be redirected to login
```

## Next Steps

1. **Implement POS Sale Screen** (Phase 2)
   - Build product grid with categories
   - Add search functionality
   - Create cart panel
   - Add quantity controls

2. **Add Payment Flow** (Phase 3)
   - Cash payment modal
   - KHQR payment modal
   - Payment status handling

3. **Build Orders Screen** (Phase 4)
   - Orders list with filters
   - Order details view
   - Refund functionality

## Resources

- **Backend API**: http://localhost:8080
- **Frontend Dev**: http://localhost:5173
- **Documentation**: See README.md and PROJECT_STRUCTURE.md

## Need Help?

Check these files:
- `README.md` - Full project documentation
- `PROJECT_STRUCTURE.md` - Architecture guide
- `src/types/index.ts` - API types and interfaces
- `src/api/` - API integration examples

## What's Working Now

✅ Login and authentication
✅ Token management and refresh
✅ Protected routing
✅ Shift opening
✅ Layout and navigation
✅ Online/offline status
✅ User session display

## What's Next

The foundation is complete. Now we build the core POS functionality:
1. Product display and selection
2. Shopping cart
3. Checkout and payment
4. Orders management

Start by implementing the POS Sale screen in `src/pages/PosPage.tsx`!
