# Coffee Shop POS Frontend

A production-grade Point of Sale (POS) frontend application for coffee shops built with React, TypeScript, and modern web technologies.

## Tech Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### State Management
- **Zustand** - Local application state (cart, POS settings, shift)
- **TanStack Query (React Query)** - Server state management and caching

### Routing & HTTP
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors

## Project Structure

```
src/
├── api/                    # API integration layer
│   ├── client.ts          # Axios client with auth interceptors
│   ├── auth.api.ts        # Authentication endpoints
│   ├── product.api.ts     # Product endpoints
│   ├── order.api.ts       # Order endpoints
│   ├── payment.api.ts     # Payment endpoints
│   ├── shift.api.ts       # Shift management endpoints
│   └── customer.api.ts    # Customer endpoints
│
├── stores/                 # Zustand stores for local state
│   ├── auth.store.ts      # Authentication state
│   ├── cart.store.ts      # Shopping cart state
│   ├── pos.store.ts       # POS UI state (category, search)
│   └── shift.store.ts     # Current shift state
│
├── components/             # Reusable UI components
│   ├── layout/            # Layout components
│   ├── ui/                # Base UI components
│   ├── product/           # Product-related components
│   ├── cart/              # Cart components
│   ├── payment/           # Payment components
│   ├── customer/          # Customer components
│   ├── receipt/           # Receipt components
│   └── shift/             # Shift components
│
├── features/               # Feature-based modules
│   ├── auth/              # Authentication features
│   ├── pos/               # POS sale features
│   ├── orders/            # Order management features
│   ├── payments/          # Payment features
│   ├── refunds/           # Refund features
│   └── shifts/            # Shift management features
│
├── pages/                  # Page components (routes)
│   ├── LoginPage.tsx      # Login screen
│   ├── OpenShiftPage.tsx  # Open shift screen
│   ├── PosPage.tsx        # Main POS sale screen
│   ├── OrdersPage.tsx     # Orders list screen
│   ├── ShiftPage.tsx      # Shift management screen
│   └── SettingsPage.tsx   # Settings screen
│
├── types/                  # TypeScript type definitions
│   └── index.ts           # Shared types matching backend API
│
├── utils/                  # Utility functions
│   ├── format.ts          # Currency, date formatting
│   ├── error.ts           # Error handling utilities
│   └── idempotency.ts     # Idempotency key generation
│
├── hooks/                  # Custom React hooks
│
├── App.tsx                # Main app component with routing
└── main.tsx               # Application entry point
```

## Features

### Phase 1: Authentication & Shift Management ✅
- [x] Login screen
- [x] JWT token management with refresh
- [x] Protected routes
- [x] Open shift screen
- [x] Shift state management

### Phase 2: POS Sale Screen (In Progress)
- [ ] Product grid display
- [ ] Category filtering
- [ ] Product search
- [ ] Barcode scanner support
- [ ] Shopping cart
- [ ] Quantity management
- [ ] Order type selection (Dine-in/Takeaway)

### Phase 3: Checkout & Payment
- [ ] Create order
- [ ] Cash payment flow
- [ ] KHQR payment flow
- [ ] Card payment flow
- [ ] Payment status handling (Pending/Success/Unknown)
- [ ] Idempotency key implementation

### Phase 4: Orders & Refunds
- [ ] Orders list
- [ ] Order details
- [ ] Order search and filtering
- [ ] Refund flow

### Phase 5: Shift Management
- [ ] Current shift display
- [ ] Cash in/out operations
- [ ] Close shift with reconciliation

### Phase 6: Advanced Features
- [ ] Offline mode with SQLite
- [ ] Sync queue for offline operations
- [ ] Receipt printing
- [ ] Keyboard shortcuts
- [ ] Touch-optimized UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Spring Boot backend running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Configure the following in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=Coffee Shop POS
VITE_APP_VERSION=1.0.0
```

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

## Architecture Decisions

### Why Zustand for Local State?
- Simple, lightweight (< 1KB)
- No boilerplate
- Perfect for cart and UI state
- Better performance than Context API

### Why TanStack Query for Server State?
- Automatic caching and refetching
- Background updates
- Optimistic updates
- Error retry logic
- Perfect separation from local state

### Why Separate API Layer?
- Centralized HTTP logic
- Easy to mock for testing
- Type-safe API calls
- Consistent error handling
- Token refresh logic in one place

### Cart vs Order Distinction
- **Cart**: Local UI state (temporary)
- **Order**: Server entity (authoritative)
- Cart is optimistic, server validates and creates official order

## Key Principles

1. **Speed First**: POS must feel instant for cashiers
2. **Offline Ready**: Design for intermittent connectivity
3. **Safety**: Prevent double payments with idempotency keys
4. **Touch Friendly**: 44-48px minimum touch targets
5. **Error Resilience**: Handle unknown payment states gracefully
6. **Type Safety**: TypeScript for catching errors at compile time

## API Integration

All API calls go through the centralized `apiClient`:

```typescript
// Automatic token injection
// Automatic token refresh on 401
// Centralized error handling
import { apiClient } from './api/client';

const products = await apiClient.get('/api/v1/products');
```

## State Management Pattern

```typescript
// Local state (fast, optimistic)
const { items, addItem } = useCartStore();

// Server state (authoritative)
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: productApi.getProducts
});
```

## Contributing

1. Follow the existing code structure
2. Keep components small and focused
3. Use TypeScript strictly (no `any`)
4. Write user-friendly error messages
5. Test payment flows thoroughly
6. Consider offline scenarios

## Next Steps

1. Implement POS Sale screen with product grid
2. Build cart panel with quantity controls
3. Create payment flow with all methods
4. Add receipt printing capability
5. Implement offline sync queue
6. Add keyboard shortcuts for power users

## License

Proprietary - Coffee Shop Management System
