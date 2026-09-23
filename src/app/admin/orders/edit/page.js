'use client';

import { useState, useEffect } from 'react';

const createEmptyItem = () => ({
  id: null,
  product_id: null,
  product_name: '',
  quantity: 1,
  price: 0,
  discount: 0,
});

const createInitialFormData = (includeStarterItem = false) => ({
  customerDetails: {
    customer_name: '',
    phone: '',
    email: '',
    address: '',
  },
  items: includeStarterItem ? [createEmptyItem()] : [],
  paymentStatus: 'Unpaid',
  status: 'not packing',
});

export default function EditOrderPage({ orderId: propOrderId, mode = 'edit' }) {
  const isCreateMode = mode === 'create';
  const [orderId, setOrderId] = useState(isCreateMode ? null : propOrderId || null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [searchQuery, setSearchQuery] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [editFormData, setEditFormData] = useState(createInitialFormData(isCreateMode));

  useEffect(() => {
    fetchProducts();

    if (isCreateMode) {
      setOrderId(null);
      setOrderData(null);
      setError(null);
      setSuccessMessage('');
      setEditFormData(createInitialFormData(true));
      setSearchQuery({});
      setShowSuggestions({});
      return;
    }

    const finalId = propOrderId || new URLSearchParams(window.location.search).get('id');
    if (finalId) {
      setOrderId(finalId);
      fetchOrderDetails(finalId);
    } else {
      setOrderId(null);
    }
  }, [propOrderId, isCreateMode]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      const response = await fetch('/api/products', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setProducts([]);
      setProductsError(err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/orders?id=${id}`);
      const data = await response.json();

      if (response.ok) {
        setOrderData(data);
        setEditFormData({
          customerDetails: {
            customer_name: data.order.customer_name,
            phone: data.order.phone,
            email: data.order.email,
            address: data.order.address,
          },
          items: data.items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            discount: parseFloat(item.discount) || 0,
          })),
          paymentStatus: data.order.payment_status || 'Unpaid',
          status: data.order.status || 'not packing',
        });
      } else {
        setError(data.error || 'Failed to fetch order details');
      }
    } catch (err) {
      setError(err.message || 'Error fetching order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      const validItems = editFormData.items.filter((item) => item.product_name.trim().length > 0);

      if (!editFormData.customerDetails.customer_name?.trim() || !editFormData.customerDetails.phone?.trim() || !editFormData.customerDetails.email?.trim() || !editFormData.customerDetails.address?.trim()) {
        setError('Please fill in all customer details');
        return;
      }

      if (editFormData.customerDetails.phone.replace(/\D/g, '').length !== 10) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      if (validItems.length === 0) {
        setError('Add at least one order item');
        return;
      }

      if (validItems.some((item) => !item.quantity || Number(item.quantity) <= 0)) {
        setError('Each item must have a valid quantity');
        return;
      }

      if (validItems.some((item) => Number(item.price) < 0)) {
        setError('Item price cannot be negative');
        return;
      }

      if (isCreateMode) {
        const payload = {
          customerName: editFormData.customerDetails.customer_name,
          phone: editFormData.customerDetails.phone,
          email: editFormData.customerDetails.email,
          address: editFormData.customerDetails.address,
          paymentStatus: editFormData.paymentStatus,
          status: editFormData.status,
          totalAmount: Number(calculateTotal()),
          itemCount: validItems.length,
          items: validItems.map((item) => ({
            id: item.product_id || null,
            name: item.product_name,
            quantity: parseInt(item.quantity, 10),
            price: parseFloat(item.price),
            discountPercent: parseFloat(item.discount) || 0,
          })),
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccessMessage('Order created successfully!');
          setTimeout(() => {
            window.location.hash = '#/admin/orders';
          }, 1500);
        } else {
          setError(data.error || 'Failed to create order');
        }

        return;
      }

      const payload = {
        orderId,
        customerDetails: editFormData.customerDetails,
        paymentStatus: editFormData.paymentStatus,
        status: editFormData.status,
        items: validItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: parseInt(item.quantity, 10),
          price: parseFloat(item.price),
          discount: parseFloat(item.discount) || 0,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage('Order updated successfully!');
        await fetchOrderDetails(orderId);
        setTimeout(() => {
          window.location.hash = '#/admin/orders';
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      setError(err.message || 'Error saving changes');
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setSearchQuery((prev) => {
      const nextQueries = { ...prev };
      delete nextQueries[index];
      return nextQueries;
    });
    setShowSuggestions((prev) => {
      const nextSuggestions = { ...prev };
      delete nextSuggestions[index];
      return nextSuggestions;
    });
  };

  const handleAddItem = () => {
    setEditFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const ensureEmptyItemRow = () => {
    setEditFormData((prev) => {
      const lastItem = prev.items[prev.items.length - 1];
      return lastItem?.product_name.trim()
        ? { ...prev, items: [...prev.items, createEmptyItem()] }
        : prev;
    });
  };

  const handleItemChange = (index, field, value) => {
    setEditFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        ...(field === 'product_name' ? { product_id: null } : {}),
      };
      return { ...prev, items: newItems };
    });

    if (field === 'product_name') {
      setSearchQuery((prev) => ({ ...prev, [index]: value }));
      setShowSuggestions((prev) => ({ ...prev, [index]: value.length > 0 }));
    }
  };

  const handleSelectProduct = (index, product) => {
    setEditFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
      };
      return {
        ...prev,
        items: newItems[newItems.length - 1].product_name.trim()
          ? [...newItems, createEmptyItem()]
          : newItems,
      };
    });
    setShowSuggestions((prev) => ({ ...prev, [index]: false }));
    setSearchQuery((prev) => ({ ...prev, [index]: '' }));
  };

  const handleProductKeyDown = (event, index, filteredProducts) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const matchingProduct = filteredProducts[0];

    if (matchingProduct) {
      handleSelectProduct(index, matchingProduct);
    } else if (editFormData.items[index].product_id) {
      ensureEmptyItemRow();
    }
  };

  const handleQuantityKeyDown = (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    ensureEmptyItemRow();
  };

  const getFilteredProducts = (index) => {
    const query = searchQuery[index] || '';
    if (!query) return [];
    return products
      .filter((product) => product?.name?.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  };

  const handleCustomerChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      customerDetails: { ...prev.customerDetails, [field]: value },
    }));
  };

  const handleCancel = () => {
    window.location.hash = '#/admin/orders';
  };

  const handleApplyDiscount = () => {
    if (discountPercentage === '' || Number.isNaN(Number(discountPercentage))) {
      setError('Please enter a valid discount percentage');
      return;
    }

    const percentage = parseFloat(discountPercentage);
    if (percentage < 0 || percentage > 100) {
      setError('Discount percentage must be between 0 and 100');
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        discount: percentage,
      })),
    }));

    setError(null);
    setSuccessMessage('Discount applied to all items!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const calculateTotal = () => {
    return editFormData.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const discountPercent = parseFloat(item.discount) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      const discountedPrice = price * (1 - discountPercent / 100);
      return sum + discountedPrice * quantity;
    }, 0).toFixed(2);
  };

  if (!isCreateMode && !orderId) {
    return (
      <div className="edit-order-container">
        <p className="error-message">Order ID not found in URL</p>
      </div>
    );
  }

  return (
    <div className="edit-order-container">
      <div className="edit-page-header">
        <div className="header-top">
          <button onClick={handleCancel} className="back-button">
            ← Back to Orders
          </button>
        </div>
        <h2>{isCreateMode ? 'Create New Order' : `Edit Order #${orderId}`}</h2>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading order details...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="error-banner">
          <p className="error-message">{error}</p>
          {!isCreateMode && !orderData ? (
            <button onClick={() => fetchOrderDetails(orderId)} className="retry-button">Retry</button>
          ) : null}
        </div>
      ) : null}

      {!loading && successMessage ? (
        <div className="success-banner">
          <p className="success-message">{successMessage}</p>
        </div>
      ) : null}

      {!loading && (isCreateMode || orderData) ? (
        <div className="edit-form-wrapper">
          <section className="form-section">
            <h3 className="section-title">Customer Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  value={editFormData.customerDetails.customer_name || ''}
                  onChange={(e) => handleCustomerChange('customer_name', e.target.value)}
                  className="form-input"
                  placeholder="Customer name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={editFormData.customerDetails.phone || ''}
                  onChange={(e) => handleCustomerChange('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  className="form-input"
                  placeholder="Phone number"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={editFormData.customerDetails.email || ''}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  className="form-input"
                  placeholder="Email address"
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <textarea
                  value={editFormData.customerDetails.address || ''}
                  onChange={(e) => handleCustomerChange('address', e.target.value)}
                  className="form-textarea"
                  placeholder="Address"
                  rows="3"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title">Order Status</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select
                  value={editFormData.paymentStatus}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                  className="form-input"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Order Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="form-input"
                >
                  <option value="not packing">Not Packing</option>
                  <option value="packed">Packed</option>
                  <option value="on the way">On The Way</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="order-items-toolbar">
              <div>
                <h3 className="section-title order-items-title">Order Items</h3>
                <p className="search-help-text">Type the item name to search and select products.</p>
              </div>
              <div className="discount-actions">
                <div className="discount-input-group">
                  <label className="discount-input-label" htmlFor="discountPercentage">
                    Discount percentage
                  </label>
                  <input
                    id="discountPercentage"
                    type="number"
                    className="discount-input-field"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <button type="button" onClick={handleApplyDiscount} className="apply-discount-button">
                  Apply
                </button>
              </div>
            </div>
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Discount</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editFormData.items.map((item, index) => {
                    const price = parseFloat(item.price) || 0;
                    const discountPercent = parseFloat(item.discount) || 0;
                    const quantity = parseInt(item.quantity, 10) || 0;
                    const discountedPrice = price * (1 - discountPercent / 100);
                    const itemAmount = (discountedPrice * quantity).toFixed(2);
                    const filteredProducts = getFilteredProducts(index);

                    return (
                      <tr key={index}>
                        <td>
                          <div className="autocomplete-wrapper">
                            <input
                              type="text"
                              value={item.product_name}
                              onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                              onKeyDown={(event) => handleProductKeyDown(event, index, filteredProducts)}
                              onFocus={() => setShowSuggestions((prev) => ({ ...prev, [index]: item.product_name.length > 0 }))}
                              className="form-input"
                              placeholder="Product name"
                              autoComplete="off"
                            />
                            {showSuggestions[index] && (
                              <div className="autocomplete-suggestions">
                                {productsLoading ? (
                                  <div className="autocomplete-item no-results">Loading products...</div>
                                ) : productsError ? (
                                  <div className="autocomplete-item no-results">Unable to load products</div>
                                ) : filteredProducts.length > 0 ? (
                                  filteredProducts.map((product) => (
                                    <div
                                      key={product.id}
                                      className="autocomplete-item"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => handleSelectProduct(index, product)}
                                    >
                                      <span className="item-name">{product.name}</span>
                                      <span className="item-price">₹{parseFloat(product.price).toFixed(2)}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="autocomplete-item no-results">
                                    No products found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            onKeyDown={handleQuantityKeyDown}
                            className="form-input"
                            min="1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="form-input"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.discount || 0}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            className="form-input"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="amount-cell">₹{itemAmount}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="remove-item-btn"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={handleAddItem} className="add-item-button">
              + Add Item
            </button>
          </section>

          <section className="form-section">
            <div className="total-display">
              <div className="total-row">
                <span>Total Items:</span>
                <span>{editFormData.items.filter((item) => item.product_name.trim().length > 0).length}</span>
              </div>
              <div className="total-row total-amount">
                <span>Total Amount:</span>
                <span>₹{calculateTotal()}</span>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button onClick={handleCancel} className="cancel-button">Cancel</button>
            <button onClick={handleSaveChanges} className="save-button" disabled={saving}>
              {saving ? 'Saving...' : isCreateMode ? 'Create Order' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .edit-order-container {
          padding: 30px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .edit-page-header {
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }

        .header-top {
          margin-bottom: 15px;
        }

        .back-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          font-size: 15px;
          transition: color 0.2s;
        }

        .back-button:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .edit-page-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #1f2937;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          background: #f9fafb;
          border-radius: 8px;
          color: #6b7280;
        }

        .error-banner,
        .success-banner {
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner {
          background: #fee2e2;
          border: 1px solid #fecaca;
        }

        .success-banner {
          background: #d1fae5;
          border: 1px solid #a7f3d0;
        }

        .error-message {
          color: #991b1b;
          margin: 0;
          font-weight: 500;
        }

        .success-message {
          color: #065f46;
          margin: 0;
          font-weight: 500;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          white-space: nowrap;
        }

        .retry-button:hover {
          background: #991b1b;
        }

        .edit-form-wrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          padding: 25px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 20px 0;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .order-items-title {
          margin-bottom: 6px;
        }

        .search-help-text {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #374151;
        }

        .form-input,
        .form-textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          color: #1f2937;
          background: #f9fafb;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .order-items-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .discount-actions {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .discount-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .discount-input-label {
          color: #374151;
          font-size: 13px;
          font-weight: 500;
        }

        .discount-input-field {
          width: 200px;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #1f2937;
          background: #ffffff;
        }

        .discount-input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .apply-discount-button {
          min-width: 88px;
          height: 42px;
          padding: 0 16px;
          border: none;
          border-radius: 6px;
          background: #1976d2;
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .apply-discount-button:hover {
          background: #1565c0;
        }

        .items-table-wrapper {
          overflow-x: auto;
          margin-bottom: 20px;
        }

        .items-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
          font-size: 14px;
        }

        .items-table thead {
          background: #f3f4f6;
          border-top: 1px solid #d1d5db;
          border-bottom: 2px solid #111827;
        }

        .items-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
          border-right: 1px solid #e5e7eb;
        }

        .items-table th:last-child {
          border-right: none;
        }

        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #f3f4f6;
        }

        .items-table td:last-child {
          border-right: none;
        }

        .items-table tbody tr:hover {
          background: #f9fafb;
        }

        .items-table input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
          background: white;
        }

        .items-table input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .amount-cell {
          text-align: right;
          font-weight: 600;
          color: #047857;
        }

        .remove-item-btn {
          background: #fee2e2;
          border: none;
          color: #991b1b;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .remove-item-btn:hover {
          background: #fecaca;
        }

        .add-item-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: background 0.2s;
        }

        .add-item-button:hover {
          background: #2563eb;
        }

        .autocomplete-wrapper {
          position: relative;
        }

        .autocomplete-suggestions {
          margin-top: 6px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .autocomplete-item {
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #f3f4f6;
        }

        .autocomplete-item:hover:not(.no-results) {
          background: #f3f4f6;
        }

        .autocomplete-item:last-child {
          border-bottom: none;
        }

        .autocomplete-item.no-results {
          color: #9ca3af;
          cursor: default;
          justify-content: center;
        }

        .item-name {
          font-weight: 500;
          color: #1f2937;
          flex: 1;
        }

        .item-price {
          color: #047857;
          font-weight: 600;
          white-space: nowrap;
        }

        .total-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 20px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          width: 280px;
          margin-bottom: 8px;
          font-size: 15px;
        }

        .total-amount {
          font-weight: 700;
          font-size: 18px;
          color: #047857;
          border-top: 2px solid #111827;
          padding-top: 12px;
          margin-bottom: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 25px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          border-radius: 0 0 8px 8px;
        }

        .cancel-button,
        .save-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 15px;
          transition: all 0.2s;
        }

        .cancel-button {
          background: #e5e7eb;
          color: #1f2937;
        }

        .cancel-button:hover {
          background: #d1d5db;
        }

        .save-button {
          background: #3b82f6;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .save-button:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .edit-order-container {
            padding: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-section {
            padding: 20px;
          }

          .order-items-toolbar,
          .discount-actions,
          .form-actions {
            flex-direction: column;
          }

          .discount-actions,
          .discount-input-group {
            width: 100%;
          }

          .discount-input-field,
          .apply-discount-button,
          .cancel-button,
          .save-button {
            width: 100%;
          }

          .error-banner,
          .success-banner {
            align-items: stretch;
            flex-direction: column;
            gap: 12px;
          }

          .total-row {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .edit-order-container {
            padding: 12px;
          }

          .edit-page-header {
            margin-bottom: 20px;
            padding-bottom: 14px;
          }

          .edit-page-header h2 {
            font-size: 24px;
          }

          .form-section {
            padding: 16px;
          }

          .form-actions {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
