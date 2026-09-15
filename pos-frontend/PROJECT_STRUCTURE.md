# Coffee Shop POS Frontend - Project Structure

## Overview

This document explains the architecture and structure of the Coffee Shop POS frontend application.

## Directory Structure

```
pos-frontend/
├── src/
│   ├── api/                 # API Layer - HTTP requests to backend
│   │   ├── client.ts       # Axios client with auth & error handling
│   │   ├── auth.api.ts     # Authentication endpoints
│   │   ├── product.api.ts  # Product & category endpoints
│   │   ├── order.api.ts    # Order management endpoints
│   │   ├── payment.api.ts  # Payment processing endpoints
│   │   ├── shift.api.ts    # Shift management endpoints
│   │   └── customer.api.ts # Customer endpoints
│   │
│   ├── stores/              # Zustand Stores - Local State
│   │   ├── auth.store.ts   # User authentication state
│   │   ├── cart.store.ts   # Shopping cart state
│   │   ├── pos.store.ts    # POS UI state (filters, search)
│   │   └── shift.store.ts  # Current shift state
│   │
│   ├── components/          # Reusable Components
│   │   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   ├── product/        # Product-related components
│   │   ├── cart/           # Cart components
│   │   ├── payment/        # Payment components
│   │   ├── customer/       # Customer selection components
│   │   ├── receipt/        # Receipt display/print components
│   │   └── shift/          # Shift management components
│   │
│   ├── features/            # Feature Modules (organized by domain)
│   │   ├── auth/           # Authentication flows
│   │   ├── pos/            # POS sale workflow
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Payment processing
│   │   ├── refunds/        # Refund workflows
│   │   └── shifts/         # Shift operations
│   │
│   ├── pages/               # Page Components (Route targets)
│   │   ├── LoginPage.tsx
│   │   ├── OpenShiftPage.tsx
│   │   ├── PosPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── ShiftPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── types/               # TypeScript Types
│   │   └── index.ts        # All shared types
│   │
│   ├── utils/               # Utility Functions
│   │   ├── format.ts       # Formatting (currency, dates)
│   │   ├── error.ts        # Error handling utilities
│   │   └── idempotency.ts  # Idempotency key management
│   │
│   ├── hooks/               # Custom React Hooks
│   │   └── (future hooks)
│   │
│   ├── App.tsx              # Main App with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles (Tailwind)
│
├── public/                  # Static assets
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── tailwind.config.js       # Tailwind config
└── README.md                # Project documentation
```

## Architecture Layers

### 1. API Layer (`src/api/`)

**Purpose**: Centralized HTTP communication with the Spring Boot backend.

**Key Files**:
- `client.ts` - Axios instance with:
  - JWT token injection
  - Automatic token refresh
  - Request/response interceptors
  - Error handling

**Pattern**:
```typescript
// Example: product.api.ts
export const productApi = {
  async getProducts(params) {
    return apiClient.get('/api/v1/products', { params });
  }
};
```

**Why**:
- Single source of truth for API calls
- Type-safe requests and responses
- Easy to mock for testing
- Consistent error handling

---

### 2. State Management

#### Zustand Stores (`src/stores/`)

**Purpose**: Local application state (client-side only).

**What Goes Here**:
- Shopping cart (temporary)
- UI state (selected category, search query)
- Current shift info
- User authentication status

**Example**:
```typescript
// cart.store.ts
export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
}));
```

**Why Zustand**:
- Lightweight (< 1KB)
- No boilerplate
- Simple API
- No React Context overhead

#### TanStack Query (React Query)

**Purpose**: Server state management (data from API).

**What Goes Here**:
- Products list
- Orders list
- Customer data
- Any data from the backend

**Example**:
```typescript
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: productApi.getProducts
});
```

**Why React Query**:
- Automatic caching
- Background refetching
- Loading/error states
- Optimistic updates

**Rule**: Never duplicate server data in Zustand!

---

### 3. Components (`src/components/`)

**Purpose**: Reusable, presentational UI components.

**Organization**:
- `layout/` - App structure (Header, Sidebar, Layout)
- `ui/` - Base components (Button, Input, Card)
- Domain folders - Feature-specific components

**Example**:
```typescript
// components/cart/CartItem.tsx
export function CartItem({ item, onUpdateQuantity }) {
  return (
    <div className="...">
      {/* Component UI */}
    </div>
  );
}
```

---

### 4. Features (`src/features/`)

**Purpose**: Complex feature workflows combining multiple components.

**Example**: `features/payments/`
```
payments/
├── CashPayment.tsx
├── KhqrPayment.tsx
├── CardPayment.tsx
├── PaymentStatusModal.tsx
└── usePaymentFlow.ts (custom hook)
```

---

### 5. Pages (`src/pages/`)

**Purpose**: Top-level route components.

**Characteristics**:
- One page per route
- Compose features and components
- Handle data fetching
- Minimal logic

**Example**:
```typescript
export default function PosPage() {
  return (
    <div>
      <CategorySidebar />
      <ProductGrid />
      <CartPanel />
    </div>
  );
}
```

---

### 6. Types (`src/types/`)

**Purpose**: Shared TypeScript type definitions.

**What Goes Here**:
- API request/response types
- Domain models (Product, Order, Payment, etc.)
- Enums (OrderType, PaymentStatus, etc.)

**Rule**: Types must match the backend API contract.

---

### 7. Utils (`src/utils/`)

**Purpose**: Pure utility functions.

**Examples**:
- `format.ts` - Currency, date formatting
- `error.ts` - Error message mapping
- `idempotency.ts` - Generate unique keys

**Rule**: No React dependencies, must be testable in isolation.

---

## State Management Philosophy

### Local State (Zustand)
```
Cart
↓
Temporary
↓
Fast, Optimistic
↓
Cleared after payment
```

### Server State (React Query)
```
Products/Orders
↓
Authoritative
↓
Cached, Refetched
↓
Source of truth
```

### Key Principle: Cart ≠ Order

- **Cart**: UI state, client-side only
- **Order**: Server entity, persisted
- Cart is optimistic, backend validates and creates authoritative order

---

## Data Flow

```
User Action
    ↓
React Component
    ↓
Zustand Store (if local state)
    or
TanStack Query mutation (if server action)
    ↓
API Client (axios)
    ↓
Spring Boot API
    ↓
Database
```

**Example: Add to Cart**
```
Click Product
    ↓
cartStore.addItem()
    ↓
Update local state
    ↓
UI re-renders
(No API call - cart is local!)
```

**Example: Create Order**
```
Click "Pay"
    ↓
useMutation(orderApi.createOrder)
    ↓
POST /api/v1/orders
    ↓
Backend creates order
    ↓
Return order data
    ↓
Clear cart
```

---

## Routing Structure

```
/login                   - Public
/open-shift              - Protected (requires auth)
/                        - Redirect to /pos
/pos                     - Main POS screen
/orders                  - Orders list
/shift                   - Shift management
/settings                - Settings
```

---

## Authentication Flow

```
1. Login
   ↓
2. Receive JWT tokens (access + refresh)
   ↓
3. Store in localStorage
   ↓
4. API client injects token in headers
   ↓
5. If 401, try refresh token
   ↓
6. If refresh fails, redirect to login
```

---

## Payment Safety

### Idempotency Key Flow

```
1. Generate unique key: crypto.randomUUID()
2. Send in header: Idempotency-Key: <key>
3. Backend checks if key was used
4. If used, return cached response
5. If new, process and cache result
```

**Purpose**: Prevent double charges on network retry.

---

## Error Handling

### Backend Error Codes → User Messages

```typescript
INVENTORY_INSUFFICIENT → "Not enough stock available"
PAYMENT_UNKNOWN → "Payment status could not be confirmed"
UNAUTHORIZED → "Invalid username or password"
```

**Rule**: Never show raw backend errors to cashiers.

---

## Development Workflow

### 1. Create New Feature

```bash
# Example: Add discount feature

# 1. Add types
src/types/index.ts

# 2. Add API endpoint
src/api/discount.api.ts

# 3. Create components
src/components/discount/DiscountSelector.tsx

# 4. Add to cart store if needed
src/stores/cart.store.ts

# 5. Integrate in POS page
src/pages/PosPage.tsx
```

### 2. Add New API Endpoint

```typescript
// 1. Define type
export interface NewFeature {
  id: string;
  name: string;
}

// 2. Create API function
export const featureApi = {
  async getFeatures() {
    return apiClient.get<NewFeature[]>('/api/v1/features');
  }
};

// 3. Use with React Query
const { data } = useQuery({
  queryKey: ['features'],
  queryFn: featureApi.getFeatures
});
```

---

## Best Practices

### 1. Component Organization
- Keep components small (< 200 lines)
- One component per file
- Co-locate related components

### 2. State Management
- Local UI state → Zustand
- Server data → React Query
- Never duplicate server data in Zustand

### 3. Type Safety
- All API responses typed
- No `any` types
- Use strict TypeScript

### 4. Error Handling
- User-friendly messages
- Never expose technical details
- Handle offline gracefully

### 5. Performance
- Debounce search inputs
- Lazy load heavy components
- Cache API responses

---

## Next Implementation Steps

1. **POS Sale Screen** (Phase 2)
   - Product grid component
   - Category filter
   - Search bar
   - Cart panel

2. **Payment Flow** (Phase 3)
   - Payment method selector
   - Cash payment modal
   - KHQR payment modal
   - Payment status handling

3. **Orders** (Phase 4)
   - Orders list with filters
   - Order details modal
   - Refund flow

4. **Shift Management** (Phase 5)
   - Current shift display
   - Cash in/out modals
   - Close shift with reconciliation

---

## Questions & Decisions

### Q: Why separate API files?
**A**: Each domain (product, order, payment) has its own API file for organization and discoverability.

### Q: Why not Redux?
**A**: Zustand is simpler, smaller, and sufficient for POS needs. React Query handles server state.

### Q: Where do computed values go?
**A**: In the store itself (e.g., `getSubtotal()` in cart store).

### Q: How to handle offline?
**A**: Phase 9 will add SQLite + sync queue for offline resilience.

---

## Resources

- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [TanStack Query Docs](https://tanstack.com/query)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
