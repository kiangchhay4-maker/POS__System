import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UploadCloud,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  LayoutGrid,
  Table as TableIcon,
  Coffee,
  DollarSign,
  Layers,
} from 'lucide-react';
import { productApi } from '../api/product.api';
import type { Product, CreateProductInput, UpdateProductInput } from '../types';
import { formatCurrency } from '../utils/format';

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  available: boolean;
  initialStock: string;
  imageUrl: string;
}

const INITIAL_FORM: ProductFormData = {
  name: '',
  description: '',
  category: 'COFFEE',
  price: '',
  currency: 'USD',
  available: true,
  initialStock: '25',
  imageUrl: '',
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch products
  const { data: pageResponse, isLoading } = useQuery({
    queryKey: ['admin-products', selectedCategory, searchTerm],
    queryFn: () =>
      productApi.getProducts({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchTerm || undefined,
        size: 100,
      }),
  });

  const products: Product[] = pageResponse?.content || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateProductInput) => productApi.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData(INITIAL_FORM);
      showFeedback('success', 'Product created successfully!');
    },
    onError: () => {
      showFeedback('error', 'Failed to create product. Please try again.');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productApi.updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData(INITIAL_FORM);
      showFeedback('success', 'Product updated successfully!');
    },
    onError: () => {
      showFeedback('error', 'Failed to update product.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteConfirmId(null);
      showFeedback('success', 'Product deleted successfully.');
    },
  });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: (product.category || 'COFFEE').toString(),
      price: product.price.toString(),
      currency: product.currency || 'USD',
      available: product.available,
      initialStock: (product.stockQuantity ?? 20).toString(),
      imageUrl: product.imageUrl || '',
    });
    setIsModalOpen(true);
  };

  // Image upload via local file reader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid positive price.');
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        input: {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: priceNum,
          available: formData.available,
          imageUrl: formData.imageUrl,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: priceNum,
        currency: formData.currency,
        available: formData.available,
        initialStock: parseInt(formData.initialStock, 10) || 0,
        imageUrl: formData.imageUrl,
      });
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Items' },
    { id: 'COFFEE', label: 'Coffee' },
    { id: 'ESPRESSO', label: 'Espresso' },
    { id: 'COLD_BREW', label: 'Cold Brew' },
    { id: 'TEA', label: 'Tea & Matcha' },
    { id: 'PASTRY', label: 'Pastries' },
    { id: 'SNACK', label: 'Snacks' },
    { id: 'COFFEE_BEANS', label: 'Beans' },
    { id: 'MERCHANDISE', label: 'Merchandise' },
  ];

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.available).length;
  const inactiveProducts = totalProducts - activeProducts;

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Top Banner & Stats */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Admin Center
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Add new coffee drinks, edit prices, upload product images, and manage availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
              <div className="text-xs font-medium text-amber-900">Total Products</div>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeProducts}</div>
              <div className="text-xs font-medium text-emerald-900">Available / In Stock</div>
            </div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{inactiveProducts}</div>
              <div className="text-xs font-medium text-rose-900">Hidden / Out of Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`mx-8 mt-4 p-4 rounded-xl flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            {feedback.message}
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-8 flex-1">
        {/* Filters & View Switches */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>

          {/* View mode buttons */}
          <div className="flex items-center gap-2 bg-white p-1 border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-700 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Display */}
        {isLoading ? (
          <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Loading product catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              No products matched your search or category filter. You can add a new product using the button above.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 shadow-sm"
            >
              Add First Product
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-100 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {product.description || 'No description provided'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {product.category || 'COFFEE'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          product.available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.available ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        {product.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
                    {product.category || 'COFFEE'}
                  </span>
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                      product.available
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {product.available ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {product.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-amber-800">
                      {formatCurrency(product.price)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(product.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter product details, price, category, and upload an image.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Product Image Section */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Product Image
                </label>

                <div className="flex gap-4 items-start">
                  {/* Image Preview Box */}
                  <div className="relative w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 group">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-[10px] text-gray-400 font-medium">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setImageTab('upload')}
                        className={`flex-1 py-1.5 font-medium text-center transition-colors ${
                          imageTab === 'upload'
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Upload Local File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageTab('url')}
                        className={`flex-1 py-1.5 font-medium text-center transition-colors ${
                          imageTab === 'url'
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {imageTab === 'upload' ? (
                      <div>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors">
                          <UploadCloud className="w-4 h-4 text-amber-600" />
                          <span>Choose Image (JPG, PNG, WEBP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Images will be stored and previewed automatically on this POS device.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/coffee.jpg"
                          value={formData.imageUrl}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Caramel Macchiato"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <div className="relative">
                    <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                    >
                      <option value="COFFEE">Coffee</option>
                      <option value="ESPRESSO">Espresso</option>
                      <option value="COLD_BREW">Cold Brew</option>
                      <option value="TEA">Tea & Matcha</option>
                      <option value="PASTRY">Pastries & Bakery</option>
                      <option value="SNACK">Snacks</option>
                      <option value="COFFEE_BEANS">Coffee Beans</option>
                      <option value="MERCHANDISE">Merchandise</option>
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="3.50"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Stock (Only for Create) */}
              {!editingProduct && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={formData.initialStock}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, initialStock: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Sets the initial available units in inventory for this product.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Ingredients, tasting notes, roast level..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Availability Switch */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Available for Sale</div>
                  <div className="text-xs text-gray-500">
                    If disabled, cashiers cannot add this item to the POS cart.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, available: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Product</h3>
            <p className="text-xs text-gray-500 mb-6">
              Are you sure you want to remove this product from the menu? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                className="flex-1 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
