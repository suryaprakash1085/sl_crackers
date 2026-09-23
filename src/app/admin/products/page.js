'use client';

import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import { Snackbar, Alert, IconButton, Switch } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

const celebrationCategories = [
  'ROCKETS',
  'SPARKLERS',
  'GARLANDS',
  'SPINNING',
  'FOUNTAINS',
  'STRING CRACKERS',
  'BOMBS',
];

const normalizeCategoryImages = (storedImages = {}) => {
  const images = Object.entries(storedImages).reduce((result, [category, value]) => {
    const normalizedCategory = category.trim().toUpperCase();
    if (!normalizedCategory) return result;
    const image = typeof value === 'string' ? value : value?.image || '';
    result[normalizedCategory] = {
      image,
      enabled: typeof value === 'string' ? Boolean(image) : value?.enabled !== false,
    };
    return result;
  }, {});

  celebrationCategories.forEach((category) => {
    if (!images[category]) images[category] = { image: '', enabled: true };
  });

  return images;
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    price80: '',
    description: '',
    category: '',
    image: null,
    quantity: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineFormData, setInlineFormData] = useState(null);
  const [inlineImageFile, setInlineImageFile] = useState(null);
  const [inlineImagePreview, setInlineImagePreview] = useState(null);
  const [inlineImageRemoved, setInlineImageRemoved] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [categoryImages, setCategoryImages] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const categoryImagesRef = useRef({});
  const [savingCategoryImages, setSavingCategoryImages] = useState(false);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showAlert = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch products from database on mount
  useEffect(() => {
    fetchProducts();
    fetchCategoryImages();
  }, []);

  const fetchCategoryImages = async () => {
    try {
      const response = await fetch('/api/settings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();
      const images = normalizeCategoryImages(data.categoryImages);
      categoryImagesRef.current = images;
      setCategoryImages(images);
      setCategoryOrder(Array.isArray(data.categoryOrder) ? data.categoryOrder : []);
    } catch (error) {
      console.error('Error fetching category images:', error);
      showAlert(`Error fetching category images: ${error.message}`, 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products from /api/products...');
      const response = await fetch('/api/products?imageSize=thumb', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      const data = await response.json();
      const productList = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);
      console.log('Fetched products:', data);
      console.log('Total products:', productList.length);
      setProducts(productList);
      if (!response.ok) {
        showAlert(data?.error || 'Failed to fetch products', 'error');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      showAlert(`Error fetching products: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    const basePrice = Number(product.price) || 0;
    const calculated80Price = Number(product.price_80 ?? (basePrice * 0.8));

    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      price80: Number.isFinite(calculated80Price) ? calculated80Price.toFixed(2) : '',
      description: product.description || '',
      category: product.category || '',
      image: null,
      quantity: product.quantity || '',
    });
    setImagePreview(product.image_full || product.image || null);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInlineEdit = (product) => {
    setInlineEditingId(product.id);
    setInlineFormData({
      name: product.name || '',
      price: product.price || '',
      price80: product.price_80 ?? '',
      category: product.category || '',
      quantity: product.quantity ?? 0,
      description: product.description || '',
    });
    setInlineImageFile(null);
    setInlineImagePreview(product.image_full || product.image || null);
    setInlineImageRemoved(false);
  };

  const handleInlineImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInlineImageFile(file);
    setInlineImageRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => setInlineImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineFormData(null);
    setInlineImageFile(null);
    setInlineImagePreview(null);
    setInlineImageRemoved(false);
  };

  const handleRemoveInlineImage = () => {
    setInlineImageFile(null);
    setInlineImagePreview(null);
    setInlineImageRemoved(true);
  };

  const handleSaveInlineEdit = async (e) => {
    e.preventDefault();
    if (!inlineFormData.name || !inlineFormData.price) {
      showAlert('Product name and price are required', 'warning');
      return;
    }

    try {
      setInlineSaving(true);
      const payload = new FormData();
      payload.append('name', inlineFormData.name);
      payload.append('price', parseFloat(inlineFormData.price));
      payload.append('price_80', inlineFormData.price80 === ''
        ? (parseFloat(inlineFormData.price) * 0.8).toFixed(2)
        : parseFloat(inlineFormData.price80));
      payload.append('description', inlineFormData.description);
      payload.append('category', inlineFormData.category);
      payload.append('quantity', parseInt(inlineFormData.quantity, 10) || 0);
      if (inlineImageFile) payload.append('image', inlineImageFile);
      if (inlineImageRemoved) payload.append('remove_image', 'true');

      const response = await fetch(`/api/products/${inlineEditingId}`, {
        method: 'PATCH',
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update product');

      showAlert('Product updated successfully', 'success');
      handleCancelInlineEdit();
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showAlert(`Error updating product: ${error.message}`, 'error');
    } finally {
      setInlineSaving(false);
    }
  };

  const saveCategoryImages = async (images, category) => {
    try {
      setSavingCategoryImages(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryImageUpdate: {
            category,
            value: images[category],
          },
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        console.error('Category image save failed:', response.status, data);
        throw new Error(data.error || `Failed to save category images (${response.status})`);
      }

      showAlert('Category image saved successfully', 'success');
    } catch (error) {
      console.error('Error saving category images:', error);
      showAlert(`Error saving category images: ${error.message}`, 'error');
    } finally {
      setSavingCategoryImages(false);
    }
  };

  const updateCategoryImages = (nextImages, category) => {
    categoryImagesRef.current = nextImages;
    setCategoryImages(nextImages);
    saveCategoryImages(nextImages, category);
  };

  const handleCategoryImageChange = (category, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const current = categoryImagesRef.current[category] || { image: '', enabled: true };
        updateCategoryImages({
          ...categoryImagesRef.current,
          [category]: {
            ...current,
            image: canvas.toDataURL('image/jpeg', 0.82),
          },
        }, category);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleCategory = (category, enabled) => {
    const current = categoryImagesRef.current[category] || { image: '', enabled: true };
    updateCategoryImages({
      ...categoryImagesRef.current,
      [category]: { ...current, enabled },
    }, category);
  };

  const handleRemoveCategoryImage = (category) => {
    const current = categoryImagesRef.current[category] || { image: '', enabled: true };
    updateCategoryImages({
      ...categoryImagesRef.current,
      [category]: { ...current, image: '' },
    }, category);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      showAlert('Product name and price are required', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = editingId !== null;
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('price', parseFloat(formData.price));
      payload.append('price_80', formData.price80 === '' ? (parseFloat(formData.price) * 0.8).toFixed(2) : parseFloat(formData.price80));
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('quantity', parseInt(formData.quantity) || 0);

      // Add image if selected
      if (formData.image instanceof File) {
        payload.append('image', formData.image);
      }

      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `/api/products/${editingId}` : '/api/products';

      console.log(`${isEditing ? 'Updating' : 'Submitting'} product to database`);

      const response = await fetch(url, {
        method,
        body: payload,
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        showAlert(`✓ Product ${isEditing ? 'updated' : 'added'} successfully to database!`, 'success');

        // Reset form
        setFormData({
          name: '',
          price: '',
                    price80: '',
          description: '',
          category: '',
          image: null,
          quantity: '',
        });
        setImagePreview(null);
        setShowForm(false);
        setEditingId(null);

        // Fetch fresh data from database
        await fetchProducts();
      } else {
        showAlert(`Failed to ${isEditing ? 'update' : 'add'} product: ${responseData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert(`Error: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setDeleting(id);
      console.log('=== DELETE START ===');
      console.log('Deleting product with ID:', id);
      console.log('ID type:', typeof id);
      console.log('URL:', `/api/products/${id}`);

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      console.log('Response statusText:', response.statusText);

      const responseData = await response.json();
      console.log('Delete response data:', responseData);
      console.log('=== DELETE END ===');

      if (response.ok) {
        showAlert('✓ Product deleted successfully', 'success');
        await fetchProducts();
      } else {
        const errorMsg = responseData.error || 'Unknown error';
        console.error('Delete failed with error:', errorMsg);
        showAlert(`Failed to delete product: ${errorMsg}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      showAlert(`Error deleting product: ${error.message}`, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteImage = async (id) => {
    if (!confirm('Are you sure you want to delete this product image?')) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: null }),
      });

      if (response.ok) {
        showAlert('✓ Image deleted successfully', 'success');
        await fetchProducts();
      } else {
        const data = await response.json();
        showAlert(`Failed to delete image: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert(`Error deleting image: ${error.message}`, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleExportProducts = async () => {
    try {
      const response = await fetch('/api/products/export');

      if (!response.ok) {
        throw new Error('Failed to export products');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showAlert('✓ Products exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting products:', error);
      showAlert(`Error exporting products: ${error.message}`, 'error');
    }
  };

  const handleImportProducts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(
          `✓ Import completed! Added ${data.successCount} product(s)${data.errorCount > 0 ? `, ${data.errorCount} error(s)` : ''}`,
          data.errorCount > 0 ? 'warning' : 'success'
        );

        if (data.errors && data.errors.length > 0) {
          console.warn('Import errors:', data.errors);
        }

        // Refresh products list
        await fetchProducts();
      } else {
        showAlert(`Failed to import products: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error importing products:', error);
      showAlert(`Error importing products: ${error.message}`, 'error');
    } finally {
      setImporting(false);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
    }
  };

  const formatCurrency = (value) => {
    const amount = Number.parseFloat(String(value ?? '').replace(/[₹,\s]/g, ''));
    return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : '—';
  };

  const getBasePrice = (product) => {
    const amount = Number.parseFloat(String(product.price ?? '').replace(/[₹,\s]/g, ''));
    return Number.isFinite(amount) ? amount : 0;
  };

  const getOfferPrice = (product) => {
    const basePrice = getBasePrice(product);
    const explicitOfferPrice = Number.parseFloat(String(product.price_80 ?? '').replace(/[₹,\s]/g, ''));
    return Number.isFinite(explicitOfferPrice) && explicitOfferPrice > 0 ? explicitOfferPrice : basePrice * 0.8;
  };

  const productsByCategory = useMemo(() => {
    const groups = products.reduce((result, product) => {
      const category = product.category?.trim().replace(/\s+/g, ' ').toUpperCase() || 'UNCATEGORIZED';
      (result[category] ??= []).push(product);
      return result;
    }, {});

    Object.values(groups).forEach((categoryProducts) => {
      categoryProducts.sort((first, second) => {
        const firstPrice = Number.parseFloat(first.price);
        const secondPrice = Number.parseFloat(second.price);
        return (Number.isFinite(firstPrice) ? firstPrice : Number.POSITIVE_INFINITY)
          - (Number.isFinite(secondPrice) ? secondPrice : Number.POSITIVE_INFINITY);
      });
    });

    return groups;
  }, [products]);

  const categoriesToDisplay = Array.from(new Set(
    products.map((product) => product.category?.trim().replace(/\s+/g, ' ').toUpperCase() || 'UNCATEGORIZED')
  ));

  const orderedCategories = [
    ...categoryOrder.filter((category) => categoriesToDisplay.includes(category)),
    ...categoriesToDisplay.filter((category) => !categoryOrder.includes(category)),
  ];

  const moveCategory = async (category, direction) => {
    const currentOrder = [...orderedCategories];
    const currentIndex = currentOrder.indexOf(category);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    [currentOrder[currentIndex], currentOrder[nextIndex]] = [currentOrder[nextIndex], currentOrder[currentIndex]];
    setCategoryOrder(currentOrder);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryOrder: currentOrder }),
      });
      if (!response.ok) throw new Error('Failed to save category order');
      showAlert('Category order saved successfully', 'success');
    } catch (error) {
      setCategoryOrder(categoryOrder);
      showAlert(`Error saving category order: ${error.message}`, 'error');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center">
        <h2 className="text-3xl font-bold text-gray-800">Products</h2>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            onClick={handleExportProducts}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 sm:flex-none"
            title="Export products to Excel"
          >
            <FileDownloadIcon fontSize="small" />
            Export
          </button>
          <button
            onClick={() => importFileInputRef.current?.click()}
            disabled={importing}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-orange-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-700 disabled:bg-gray-400 sm:flex-none"
            title="Import products from Excel"
          >
            <FileUploadIcon fontSize="small" />
            {importing ? 'Importing...' : 'Import'}
          </button>
          <input
            ref={importFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportProducts}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => {
              setShowForm(!showForm);
              setImagePreview(null);
              if (showForm) {
                setEditingId(null);
                setFormData({
                  name: '',
                  price: '',
                  description: '',
                  category: '',
                  image: null,
                  quantity: '',
                });
              }
            }}
            className="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 sm:flex-none sm:px-6"
          >
            {showForm ? '✕ Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-gray-800">Celebration Category Images</h3>
          <p className="text-sm text-gray-500">These images are separate from product images and appear on the homepage category cards. Changes save automatically.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
          {categoriesToDisplay.map((category) => {
            const setting = categoryImages[category] || { image: '', enabled: false };
            return (
              <div key={category} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-800">{category}</h4>
                  <Switch
                    size="small"
                    checked={setting.enabled}
                    onChange={(event) => handleToggleCategory(category, event.target.checked)}
                    inputProps={{ 'aria-label': `${category} category visibility` }}
                  />
                </div>
                <div className="rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-4 w-full" style={{ height: '280px' }}>
                  {setting.image ? (
                    <img
                      src={setting.image}
                      alt={`${category} category`}
                      loading="lazy"
                      decoding="async"
                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                    />
                  ) : (
                    <span className="text-sm text-gray-400">No image uploaded</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer bg-blue-600 text-white text-center px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleCategoryImageChange(category, event)}
                      className="hidden"
                    />
                  </label>
                  {setting.image && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryImage(category)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Product Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., 2½ Kuruvi"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">75% Price (₹)</label>
                <input
                  type="number"
                  name="price80"
                  value={formData.price80}
                  onChange={handleInputChange}
                  placeholder="Defaults to 75% of price"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Sparklers, Bombs"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product description"
                  rows="3"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-600 text-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload JPG, PNG, or GIF (Max 5MB)</p>
                  </div>
                  {imagePreview && (
                    <div className="flex-shrink-0 relative group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-700 transition-colors"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Product' : 'Add Product to Database')}
            </button>
          </form>
        </div>
      )}

      {/* Products */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">
            <p className="text-lg">Loading products from database...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p className="text-lg">No products in database yet. Click &quot;Add Product&quot; to create one.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Category</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Price</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">75% Price</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quantity</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Description</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Image</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedCategories.filter((category) => productsByCategory[category]).map((category) => {
                    const categoryProducts = productsByCategory[category];
                    const categoryIndex = orderedCategories.indexOf(category);
                    return (
                    <Fragment key={category}>
                      <tr className="border-b border-gray-300 bg-gray-100"><th colSpan="8" scope="rowgroup" className="px-6 py-3 text-left text-sm font-bold text-gray-800"><div className="flex items-center justify-between"><span>{category}</span><span className="flex gap-1"><button type="button" onClick={() => moveCategory(category, -1)} disabled={categoryIndex === 0} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Move ${category} up`}>↑</button><button type="button" onClick={() => moveCategory(category, 1)} disabled={categoryIndex === orderedCategories.length - 1} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Move ${category} down`}>↓</button></span></div></th></tr>
                      {categoryProducts.map((product) => {
                        const isInlineEditing = inlineEditingId === product.id;
                        return <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">{isInlineEditing ? <><td className="px-3 py-3"><input value={inlineFormData.name} onChange={(e) => setInlineFormData({ ...inlineFormData, name: e.target.value })} className="w-40 border rounded px-2 py-1 text-sm text-black" /></td><td className="px-3 py-3"><input value={inlineFormData.category} onChange={(e) => setInlineFormData({ ...inlineFormData, category: e.target.value })} className="w-32 border rounded px-2 py-1 text-sm text-black" /></td><td className="px-3 py-3"><input type="number" step="0.01" value={inlineFormData.price} onChange={(e) => setInlineFormData({ ...inlineFormData, price: e.target.value })} className="w-24 border rounded px-2 py-1 text-sm text-black" /></td><td className="px-3 py-3"><input type="number" step="0.01" value={inlineFormData.price80} onChange={(e) => setInlineFormData({ ...inlineFormData, price80: e.target.value })} className="w-24 border rounded px-2 py-1 text-sm text-black" /></td><td className="px-3 py-3"><input type="number" value={inlineFormData.quantity} onChange={(e) => setInlineFormData({ ...inlineFormData, quantity: e.target.value })} className="w-20 border rounded px-2 py-1 text-sm text-black" /></td><td className="px-3 py-3"><input value={inlineFormData.description} onChange={(e) => setInlineFormData({ ...inlineFormData, description: e.target.value })} className="w-40 border rounded px-2 py-1 text-sm text-black" /></td><td className="px-3 py-3"><label className="cursor-pointer text-blue-600 text-xs font-semibold">{inlineImagePreview ? <img src={inlineImagePreview} alt={product.name} className="w-12 h-12 object-cover rounded border mb-1" /> : 'No image'}<span className="block">Change image</span><input type="file" accept="image/*" onChange={handleInlineImageChange} className="hidden" /></label>{inlineImagePreview && <button type="button" onClick={handleRemoveInlineImage} className="text-red-600 text-xs font-semibold">Remove image</button>}</td><td className="px-3 py-3 text-sm whitespace-nowrap"><button onClick={handleSaveInlineEdit} disabled={inlineSaving} className="bg-green-600 text-white px-2 py-1 rounded mr-1 disabled:bg-gray-400">{inlineSaving ? 'Saving...' : 'Save'}</button><button onClick={handleCancelInlineEdit} disabled={inlineSaving} className="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button></td></> : <><td className="px-6 py-3 text-sm font-semibold text-gray-800">{product.name}</td><td className="px-6 py-3 text-sm text-gray-600">{product.category || '-'}</td><td className="px-6 py-3 text-sm text-gray-800">{formatCurrency(getBasePrice(product))}</td><td className="px-6 py-3 text-sm text-gray-800">{formatCurrency(getOfferPrice(product))}</td><td className="px-6 py-3 text-sm text-gray-800">{product.quantity}</td><td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">{product.description || '-'}</td><td className="px-6 py-3">{product.image ? <div className="relative group w-fit"><img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded border border-gray-200" /><button onClick={() => handleDeleteImage(product.id)} disabled={deleting === product.id} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Image">✕</button></div> : <span className="text-gray-400">-</span>}</td><td className="px-6 py-3 text-sm whitespace-nowrap"><IconButton onClick={() => handleInlineEdit(product)} color="primary" size="small" title="Edit Product"><EditIcon /></IconButton><IconButton onClick={() => handleDeleteProduct(product.id)} disabled={deleting === product.id} color="error" size="small" title="Delete Product"><DeleteIcon /></IconButton></td></>}</tr>;
                      })}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-gray-200">
              {orderedCategories.filter((category) => productsByCategory[category]).map((category) => <section key={category}><h3 className="flex items-center justify-between bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800"><span>{category}</span><span className="flex gap-1"><button type="button" onClick={() => moveCategory(category, -1)} disabled={orderedCategories.indexOf(category) === 0} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-40" aria-label={`Move ${category} up`}>↑</button><button type="button" onClick={() => moveCategory(category, 1)} disabled={orderedCategories.indexOf(category) === orderedCategories.length - 1} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-40" aria-label={`Move ${category} down`}>↓</button></span></h3><div className="space-y-3 p-3">{productsByCategory[category].map((product) => {
                const isInlineEditing = inlineEditingId === product.id;
                return <article key={product.id} className="rounded-lg border border-gray-200 p-4 shadow-sm"><div className="flex gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">{(isInlineEditing ? inlineImagePreview : product.image) ? <img src={isInlineEditing ? inlineImagePreview : product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" decoding="async" width="64" height="64" /> : <span className="flex h-full items-center justify-center text-xs text-gray-400">No image</span>}</div><div className="min-w-0 flex-1"><h4 className="font-semibold text-gray-800">{product.name}</h4><p className="mt-1 text-sm text-gray-600">{product.category || 'Uncategorized'}</p><div className="mt-2 flex gap-3 text-sm"><span>Price: <strong>{formatCurrency(getBasePrice(product))}</strong></span><span>75%: <strong>{formatCurrency(getOfferPrice(product))}</strong></span></div><p className="mt-1 text-sm text-gray-600">Quantity: {product.quantity}</p></div></div>{isInlineEditing ? <form onSubmit={handleSaveInlineEdit} className="mt-4 space-y-3"><input aria-label="Product name" value={inlineFormData.name} onChange={(e) => setInlineFormData({ ...inlineFormData, name: e.target.value })} className="w-full rounded border px-3 py-2 text-black" /><div className="grid grid-cols-2 gap-3"><input aria-label="Category" value={inlineFormData.category} onChange={(e) => setInlineFormData({ ...inlineFormData, category: e.target.value })} className="w-full rounded border px-3 py-2 text-black" /><input aria-label="Quantity" type="number" value={inlineFormData.quantity} onChange={(e) => setInlineFormData({ ...inlineFormData, quantity: e.target.value })} className="w-full rounded border px-3 py-2 text-black" /><input aria-label="Price" type="number" step="0.01" value={inlineFormData.price} onChange={(e) => setInlineFormData({ ...inlineFormData, price: e.target.value })} className="w-full rounded border px-3 py-2 text-black" /><input aria-label="80 percent price" type="number" step="0.01" value={inlineFormData.price80} onChange={(e) => setInlineFormData({ ...inlineFormData, price80: e.target.value })} className="w-full rounded border px-3 py-2 text-black" /></div><textarea aria-label="Description" value={inlineFormData.description} onChange={(e) => setInlineFormData({ ...inlineFormData, description: e.target.value })} className="w-full rounded border px-3 py-2 text-black" rows="3" /><label className="block cursor-pointer text-sm font-semibold text-blue-600">Change image<input type="file" accept="image/*" onChange={handleInlineImageChange} className="hidden" /></label>{inlineImagePreview && <button type="button" onClick={handleRemoveInlineImage} className="text-sm font-semibold text-red-600">Remove image</button>}<div className="flex gap-2"><button type="submit" disabled={inlineSaving} className="flex-1 rounded bg-green-600 px-3 py-2 font-semibold text-white disabled:bg-gray-400">{inlineSaving ? 'Saving...' : 'Save'}</button><button type="button" onClick={handleCancelInlineEdit} disabled={inlineSaving} className="flex-1 rounded bg-gray-500 px-3 py-2 font-semibold text-white">Cancel</button></div></form> : <><p className="mt-3 text-sm text-gray-600">{product.description || 'No description'}</p><div className="mt-4 flex gap-2"><button onClick={() => handleInlineEdit(product)} className="flex-1 rounded bg-blue-600 px-3 py-2 font-semibold text-white">Edit</button><button onClick={() => handleDeleteProduct(product.id)} disabled={deleting === product.id} className="flex-1 rounded bg-red-600 px-3 py-2 font-semibold text-white disabled:bg-gray-400">{deleting === product.id ? 'Deleting...' : 'Delete'}</button></div></>}</article>;
              })}</div></section>)}
            </div>
          </>
        )}
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
