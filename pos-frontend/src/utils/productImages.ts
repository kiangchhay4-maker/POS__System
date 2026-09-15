// Product images helper and local storage persistence for user-uploaded images

const LOCAL_STORAGE_KEY = 'coffee_pos_product_images';
const LOCAL_PRODUCTS_KEY = 'coffee_pos_local_products';

export function getStoredImages(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProductImage(productId: string, imageUrl: string): void {
  try {
    const current = getStoredImages();
    current[productId] = imageUrl;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save product image to local storage', e);
  }
}

export function removeProductImage(productId: string): void {
  try {
    const current = getStoredImages();
    delete current[productId];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to remove product image from local storage', e);
  }
}

// Local mock products storage to persist newly added products even if backend server is not currently running
export function getLocalCustomProducts(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomProduct(product: any): void {
  try {
    const current = getLocalCustomProducts();
    const index = current.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      current[index] = { ...current[index], ...product };
    } else {
      current.unshift(product);
    }
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save local product', e);
  }
}

export function deleteLocalCustomProduct(id: string): void {
  try {
    const current = getLocalCustomProducts().filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to delete local product', e);
  }
}

// High-quality category stock photo fallbacks
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  COFFEE: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  ESPRESSO: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
  COLD_BREW: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
  TEA: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  PASTRY: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
  SNACK: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
  MERCHANDISE: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  COFFEE_BEANS: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80',
};

// Default seed products to show if backend has no products yet
export const SEED_PRODUCTS = [
  {
    id: 'seed-1',
    name: 'Iced Americano',
    description: 'Double shot rich espresso poured over ice and cold filtered water.',
    category: 'COFFEE',
    price: 3.25,
    currency: 'USD',
    available: true,
    stockQuantity: 45,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-2',
    name: 'Vanilla Latte',
    description: 'Freshly steamed whole milk with bold espresso and Madagascar vanilla.',
    category: 'COFFEE',
    price: 4.50,
    currency: 'USD',
    available: true,
    stockQuantity: 38,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-3',
    name: 'Classic Espresso',
    description: 'Full-bodied single shot with rich crema and dark chocolate aroma.',
    category: 'ESPRESSO',
    price: 2.75,
    currency: 'USD',
    available: true,
    stockQuantity: 60,
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-4',
    name: 'Nitro Cold Brew',
    description: '18-hour cold steeped coffee infused with nitrogen for velvety microfoam.',
    category: 'COLD_BREW',
    price: 4.75,
    currency: 'USD',
    available: true,
    stockQuantity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-5',
    name: 'Matcha Green Tea Latte',
    description: 'Ceremonial grade Japanese Uji matcha with micro-foamed oat milk.',
    category: 'TEA',
    price: 4.25,
    currency: 'USD',
    available: true,
    stockQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-6',
    name: 'Butter Croissant',
    description: 'Golden flaky French pastry baked fresh daily with pure butter layers.',
    category: 'PASTRY',
    price: 3.50,
    currency: 'USD',
    available: true,
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-7',
    name: 'Chocolate Chip Cookie',
    description: 'Chewy artisan cookie loaded with 70% dark Belgian chocolate chunks.',
    category: 'SNACK',
    price: 2.50,
    currency: 'USD',
    available: true,
    stockQuantity: 22,
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-8',
    name: 'Signature Coffee Beans 250g',
    description: 'Medium-dark roast single-origin Arabica beans with hazelnut notes.',
    category: 'COFFEE_BEANS',
    price: 12.00,
    currency: 'USD',
    available: true,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80',
  },
];
