'use client';

import { useState, useEffect, useRef } from 'react';
import InvoicePrint from './InvoicePrint';

export default function OrderDetailsModal({ orderId, isOpen, onClose, editMode = false }) {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    customerDetails: {
      customer_name: '',
      phone: '',
      email: '',
      address: ''
    },
    items: [],
    paymentStatus: 'Unpaid',
    status: 'not packing'
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      if (orderId) {
        fetchOrderDetails();
      }
    }
  }, [isOpen, orderId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    if (orderData && isEditing) {
      setEditFormData({
        customerDetails: {
          customer_name: orderData.order.customer_name,
          phone: orderData.order.phone,
          email: orderData.order.email,
          address: orderData.order.address
        },
        items: orderData.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          discount: parseFloat(item.discount) || 0
        })),
        paymentStatus: orderData.order.payment_status || 'Unpaid',
        status: orderData.order.status || 'not packing'
      });
    }
  }, [isEditing, orderData]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/orders?id=${orderId}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrderData(data);
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

  const handleDownloadImage = async () => {
    try {
      if (!invoiceRef.current) return;
      setDownloading(true);

      // Dynamically import html2pdf only when needed
      const html2pdf = (await import('html2pdf.js')).default;

      const element = invoiceRef.current;
      const filename = `Invoice-${orderData.order.invoice_number || orderId}.pdf`;

      const options = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error occurred while downloading PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        orderId,
        customerDetails: editFormData.customerDetails,
        paymentStatus: editFormData.paymentStatus,
        status: editFormData.status,
        items: editFormData.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          discount: parseFloat(item.discount) || 0
        }))
      };

      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsEditing(false);
        await fetchOrderDetails();
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
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddItem = () => {
    setEditFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: null,
        product_id: null,
        product_name: '',
        quantity: 1,
        price: 0,
        discount: 0
      }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    setEditFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });

    // Show suggestions when typing in product name field
    if (field === 'product_name') {
      setSearchQuery(prev => ({ ...prev, [index]: value }));
      setShowSuggestions(prev => ({ ...prev, [index]: value.length > 0 }));
    }
  };

  const handleSelectProduct = (index, product) => {
    setEditFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1
      };
      return { ...prev, items: newItems };
    });
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
    setSearchQuery(prev => ({ ...prev, [index]: '' }));
  };

  const getFilteredProducts = (index) => {
    const query = searchQuery[index] || '';
    if (!query) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const handleCustomerChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      customerDetails: { ...prev.customerDetails, [field]: value }
    }));
  };

  if (!isOpen) return null;

  const calculateTotal = () => {
    return editFormData.items.reduce((sum, item) => {
      const price = parseFloat(item.price);
      const discountPercent = parseFloat(item.discount) || 0;
      const quantity = parseInt(item.quantity);
      const discountedPrice = price * (1 - discountPercent / 100);
      return sum + (discountedPrice * quantity);
    }, 0).toFixed(2);
  };

  const currentTotal = orderData ? parseFloat(orderData.order.total_amount).toFixed(2) : '0.00';
  const displayTotal = isEditing ? calculateTotal() : currentTotal;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Order' : 'Order Details - Invoice'}</h2>
          <div className="header-actions">
            {!isEditing && (
              <button 
                className="icon-button edit-button" 
                onClick={() => setIsEditing(true)}
                title="Edit order"
              >
                ✏️
              </button>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <p>Loading order details...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button onClick={fetchOrderDetails} className="retry-button">Retry</button>
            </div>
          ) : orderData ? (
            <div className="invoice-container a4-sheet">
              {/* Original Invoice Modal View */}
              {isEditing ? (
                <div className="edit-view-content">
                  <div className="customer-section">
                    <div className="customer-block">
                      <h4 className="section-title">Order Status & Payment:</h4>
                      <div className="edit-customer-form grid-cols-2">
                        <div className="form-group">
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Payment Status</label>
                          <select
                            value={editFormData.paymentStatus}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                            className="form-input w-full"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="text-xs font-bold text-gray-600 mb-1 block">Order Status</label>
                          <select
                            value={editFormData.status}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="form-input w-full"
                          >
                            <option value="not packing">Not Packing</option>
                            <option value="packed">Packed</option>
                            <option value="on the way">On The Way</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="customer-section">
                    <div className="customer-block">
                      <h4 className="section-title">Billed To:</h4>
                      <div className="edit-customer-form">
                        <input
                          type="text"
                          placeholder="Customer Name"
                          value={editFormData.customerDetails.customer_name}
                          onChange={(e) => handleCustomerChange('customer_name', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={editFormData.customerDetails.phone}
                          onChange={(e) => handleCustomerChange('phone', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={editFormData.customerDetails.email}
                          onChange={(e) => handleCustomerChange('email', e.target.value)}
                          className="form-input"
                        />
                        <textarea
                          placeholder="Address"
                          value={editFormData.customerDetails.address}
                          onChange={(e) => handleCustomerChange('address', e.target.value)}
                          className="form-textarea"
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="items-table-wrapper">
                    <div className="edit-items-form">
                      <h4 className="section-title">Order Items:</h4>
                      <table className="items-table edit-table">
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
                            const price = parseFloat(item.price);
                            const discountPercent = parseFloat(item.discount) || 0;
                            const quantity = parseInt(item.quantity);
                            const discountedPrice = price * (1 - discountPercent / 100);
                            const itemAmount = (discountedPrice * quantity).toFixed(2);
                            return (
                              <tr key={index}>
                                <td>
                                  <div className="autocomplete-wrapper">
                                    <input
                                      type="text"
                                      value={item.product_name}
                                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                                      className="form-input"
                                      placeholder="Product name"
                                    />
                                    {showSuggestions[index] && (
                                      <div className="autocomplete-suggestions">
                                        {getFilteredProducts(index).length > 0 ? (
                                          getFilteredProducts(index).map(product => (
                                            <div
                                              key={product.id}
                                              className="autocomplete-item"
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
                      <button onClick={handleAddItem} className="add-item-button">
                        + Add Item
                      </button>
                    </div>
                  </div>

                  <div className="total-section">
                    <div className="total-row">
                      <span>Total Items:</span>
                      <span>{editFormData.items.length}</span>
                    </div>
                    <div className="total-row total-amount">
                      <span>Total Amount:</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Use the specific design from InvoicePrint in the modal too if not editing */
                <InvoicePrint orderData={orderData} company={orderData.company} containerRef={invoiceRef} />
              )}
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
              <button onClick={handleSaveChanges} className="save-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="close-modal-button">Close</button>
              <button onClick={handleDownloadImage} className="save-button" disabled={downloading}>
                {downloading ? 'Preparing...' : 'Download PDF'}
              </button>
              <button onClick={() => window.print()} className="print-button">Print A4</button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: #e5e7eb;
          border-radius: 8px;
          max-width: 950px;
          width: 95%;
          max-height: 95vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .icon-button {
          background: none;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .icon-button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #111827;
        }

        .modal-body {
          padding: 40px 20px;
          background: #374151;
          display: flex;
          justify-content: center;
          min-height: 600px;
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 40px 20px;
          width: 100%;
        }

        .error-message {
          color: #dc2626;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        .invoice-container {
          width: 800px;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          padding: 0;
        }

        .edit-view-content {
          width: 100%;
          background: white;
          padding: 20px;
          border-radius: 4px;
        }

        .customer-section {
          margin-bottom: 20px;
        }

        .customer-block {
          background: #f9fafb;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid #0f766e;
        }

        .section-title {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6b7280;
        }

        .edit-customer-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .grid-cols-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-input,
        .form-textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          width: 100%;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .items-table th {
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          background: #f3f4f6;
          border-bottom: 2px solid #111827;
        }

        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .amount-cell {
          text-align: right;
          font-weight: 600;
          color: #047857;
        }

        .total-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-top: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          width: 200px;
          margin-bottom: 5px;
        }

        .total-amount {
          font-weight: 700;
          border-top: 1px solid #000;
          padding-top: 5px;
        }

        .add-item-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }

        .remove-item-btn {
          background: #fee2e2;
          color: #991b1b;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        }

        .autocomplete-wrapper {
          position: relative;
        }

        .autocomplete-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          z-index: 10;
          max-height: 150px;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .autocomplete-item {
          padding: 8px 12px;
          cursor: pointer;
        }

        .autocomplete-item:hover {
          background: #f3f4f6;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .close-modal-button,
        .print-button,
        .save-button,
        .cancel-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }

        .close-modal-button {
          background: #e5e7eb;
          color: #1f2937;
        }

        .close-modal-button:hover {
          background: #d1d5db;
        }

        .print-button {
          background: #047857;
          color: white;
        }

        .print-button:hover {
          background: #065f46;
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

        .cancel-button {
          background: #e5e7eb;
          color: #1f2937;
        }

        .cancel-button:hover {
          background: #d1d5db;
        }

        @media print {
          .modal-overlay {
            background: transparent;
          }

          .modal-content {
            max-width: 100%;
            width: 100%;
            max-height: 100%;
            box-shadow: none;
            border-radius: 0;
          }

          .modal-header,
          .modal-footer {
            display: none;
          }

          .modal-body {
            padding: 0;
          }

          .a4-sheet {
            padding: 20px;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
