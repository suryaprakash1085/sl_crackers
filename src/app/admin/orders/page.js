'use client';

import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import OrderDetailsModal from '../components/OrderDetailsModal';
import InvoicePrint from '../components/InvoicePrint';
import { openWhatsAppPopup, closeWhatsAppPopup, sendOrderWhatsApp } from '@/lib/whatsappNotify';

// html2pdf cannot repeat table headers or close table borders at a page end.
// So the invoice DOM (a detached copy, never the live React tree) is split into
// page-sized blocks: each page gets its own bordered box and table header, and
// the totals / words / footer stay together on the last page.
function paginateInvoice(root) {
  const outer = root.querySelector('.invoice-outer-border');
  const table = outer?.querySelector('.items-table');
  if (!outer || !table || !table.tBodies[0]) return;

  const rows = Array.from(table.tBodies[0].rows);
  const count = rows.length;
  // Capacities in rows (measured from real PDFs, each with ~1 row of safety space)
  const CAP_FIRST = 39; // page 1 also holds the company + billing blocks
  const CAP_MIDDLE = 47; // a full middle page
  const CAP_LAST = 32; // last page also holds totals + words + footer
  const MIN_LAST = 1; // rows that must stay on the last page (small = fuller pages before it)
  const SINGLE_PAGE = 27; // everything fits on one page up to this many rows
  const FIRST_EXTRA = CAP_MIDDLE - CAP_FIRST; // page 1 holds this many rows less than a middle page

  if (count <= SINGLE_PAGE) return;

  // Fewest pages that can hold everything
  let pages = 2;
  while (CAP_FIRST + (pages - 2) * CAP_MIDDLE + CAP_LAST < count) pages += 1;

  // Rows on the last page, then spread the rest so every page before it
  // ends with the same empty space at the bottom
  const nonLast = pages - 1;
  const lastRows = Math.max(MIN_LAST, count - (CAP_FIRST + (nonLast - 1) * CAP_MIDDLE));
  const beforeLast = count - lastRows;
  const firstRows = Math.min(CAP_FIRST, Math.max(1, Math.round((beforeLast + FIRST_EXTRA) / nonLast - FIRST_EXTRA)));

  const sizes = [firstRows];
  let remaining = beforeLast - firstRows;
  for (let page = 1; page < nonLast; page += 1) {
    const pagesLeft = nonLast - page;
    const take = Math.ceil(remaining / pagesLeft);
    sizes.push(take);
    remaining -= take;
  }
  sizes.push(lastRows);

  const ranges = [];
  let start = 0;
  sizes.forEach((size) => {
    ranges.push([start, start + size]);
    start += size;
  });

  const thead = table.tHead;
  const tfoot = table.tFoot;
  const tail = ['.words-section', '.summary-section', '.invoice-footer']
    .map((selector) => outer.querySelector(selector))
    .filter(Boolean);

  let previousOuter = outer;
  let lastOuter = outer;
  let lastTable = table;

  ranges.slice(1).forEach(([from, to]) => {
    const pageOuter = outer.cloneNode(false);
    pageOuter.style.marginTop = '3px'; // keeps this page's top border off the previous page
    const pageTable = table.cloneNode(false);
    if (thead) pageTable.appendChild(thead.cloneNode(true));
    const body = document.createElement('tbody');
    rows.slice(from, to).forEach((row) => body.appendChild(row));
    pageTable.appendChild(body);
    pageOuter.appendChild(pageTable);

    const pageBreak = document.createElement('div');
    pageBreak.className = 'html2pdf__page-break';

    previousOuter.after(pageBreak, pageOuter);
    previousOuter = pageOuter;
    lastOuter = pageOuter;
    lastTable = pageTable;
  });

  if (tfoot) lastTable.appendChild(tfoot);
  tail.forEach((node) => lastOuter.appendChild(node));
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [companyName, setCompanyName] = useState('');

  // Inline editing state
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editedStatus, setEditedStatus] = useState('');
  const [editedPaymentStatus, setEditedPaymentStatus] = useState('');
  const [savingOrderId, setSavingOrderId] = useState(null);

  // Download related state
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [downloadOrderData, setDownloadOrderData] = useState(null);
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const invoiceRef = useRef(null);

  // Load orders from database
  useEffect(() => {
    fetchOrders();
    fetch('/api/company-info?fields=company_name')
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => setCompanyName(info?.company_name || ''))
      .catch(() => {});
  }, []);

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditDetails = (orderId) => {
    window.location.hash = `#/admin/orders/${orderId}`;
  };

  const handleCreateOrder = () => {
    window.location.hash = '#/admin/orders/new';
  };

  const handleCreateGstInvoice = () => {
    window.location.hash = '#/admin/gst-invoice';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
    setEditMode(false);
    // Refresh orders after closing modal (in case changes were made)
    fetchOrders();
  };

  // Builds the SAME PDF as the checkout page (repeated header on each page,
  // closed borders, "Page x of y" footer). Used by both Download and Print.
  const buildInvoicePdf = async (orderId) => {
    const response = await fetch(`/api/orders?id=${orderId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load order');

    const paymentResponse = await fetch('/api/payments-info', { cache: 'no-store' });
    const paymentMethods = paymentResponse.ok ? await paymentResponse.json() : null;

    // Same number format as the checkout page
    const items = (data.items || []).map((item) => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
      discount_price: Number(item.discount_price) || 0,
    }));

    flushSync(() => {
      setDownloadOrderData({
        ...data,
        order: { ...data.order, total_amount: Number(data.order.total_amount) || 0 },
        items,
        paymentMethods,
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const element = invoiceRef.current;
    if (!element) throw new Error('Invoice could not be rendered');

    // Invoice number shown on the invoice: "invno 00000011" -> "11"
    const invoiceDigits = String(data.order.invoice_number || orderId).match(/(\d+)\s*$/);
    const invoiceId = invoiceDigits ? String(Number(invoiceDigits[1])) : String(data.order.invoice_number || orderId);
    const filename = `Invoice-${invoiceId}.pdf`;

    try {
      // Wait for logo / QR images so they appear in the PDF
      await Promise.all(
        Array.from(element.querySelectorAll('img')).map((img) =>
          img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
        )
      );

      // html2pdf renders inside a box exactly as wide as the printable area
      // (210mm - 10mm - 10mm = 190mm). A detached copy is sized to that width.
      const source = element.cloneNode(true);
      source.style.width = '190mm';
      source.style.padding = '0';
      source.style.margin = '0';

      // Slightly tighter rows so more items fit on each page
      const rowStyle = document.createElement('style');
      rowStyle.textContent = '.invoice-print-container .items-table th, .invoice-print-container .items-table td { padding: 4px 3px !important; }';
      source.appendChild(rowStyle);

      paginateInvoice(source);

      const html2pdf = (await import('html2pdf.js')).default;
      const options = {
        margin: [10, 10, 14, 10],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4', compress: true },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['.items-table tbody tr', '.items-table tfoot', '.words-section', '.summary-section', '.invoice-footer'],
        },
      };

      const blob = await html2pdf()
        .set(options)
        .from(source)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          // Website + page number on every page
          const pages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= pages; i += 1) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(68, 68, 68);
            pdf.text('https://sivakasimart.in/', 10, 291);
            pdf.text(`Page ${i} of ${pages}`, 200, 291, { align: 'right' });
          }
        })
        .output('blob');

      return { blob, filename };
    } finally {
      setDownloadOrderData(null);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingOrderId(orderId);
      const { blob, filename } = await buildInvoicePdf(orderId);

      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      downloadLink.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  // Print = the same PDF as download, opened in the print dialog
  const handlePrintInvoice = async (orderId) => {
    try {
      setPrintingOrderId(orderId);
      const { blob } = await buildInvoicePdf(orderId);
      const url = URL.createObjectURL(blob);

      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      frame.src = url;
      frame.onload = () => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
        } catch (printError) {
          // Browser cannot print inside the frame: open the PDF in a new tab instead
          window.open(url, '_blank');
        }
        setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 60000);
      };
      document.body.appendChild(frame);
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error preparing invoice for printing. Please try again.');
    } finally {
      setPrintingOrderId(null);
    }
  };

  const fetchOrders = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/orders?search=${encodeURIComponent(query)}` : '/api/orders';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search (500ms)
    const timeout = setTimeout(() => {
      fetchOrders(query);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleStartEdit = (order) => {
    setEditingOrderId(order.id);
    setEditedStatus(order.status);
    setEditedPaymentStatus(order.payment_status || 'Unpaid');
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditedStatus('');
    setEditedPaymentStatus('');
  };

  const handleSaveStatusChange = async (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    const statusChanged = !!order && editedStatus !== order.status;

    // Must open synchronously (inside the click) so the browser doesn't block it.
    const waPopup = statusChanged ? openWhatsAppPopup() : null;

    try {
      setSavingOrderId(orderId);
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: editedStatus,
          paymentStatus: editedPaymentStatus
        })
      });

      if (response.ok) {
        const newStatus = editedStatus;
        setEditingOrderId(null);
        setEditedStatus('');
        setEditedPaymentStatus('');
        fetchOrders(searchQuery);

        if (statusChanged) {
          sendOrderWhatsApp(waPopup, {
            phone: order.phone,
            name: order.customer_name,
            orderId,
            status: newStatus,
            companyName,
          });
        }
      } else {
        closeWhatsAppPopup(waPopup);
        const data = await response.json();
        alert(`Failed to save changes: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      closeWhatsAppPopup(waPopup);
      console.error('Error saving status changes:', error);
      alert('Error saving status changes');
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <>
      <div>
        <div className="orders-page-header">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Orders</h2>

          <div className="orders-toolbar">
            <div className="orders-search-field mb-6">
              <input
                type="text"
                placeholder="Search by Customer Name or Phone..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <button onClick={handleCreateOrder} className="create-order-button">
              Create New Order
            </button>
            <button onClick={handleCreateGstInvoice} className="create-order-button">
              Create GST Invoice
            </button>
          </div>
        </div>

        <div className="orders-table-container bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              <p className="text-lg">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p className="text-lg">No orders yet.</p>
              <p className="text-sm mt-2">Orders will appear here when customers checkout.</p>
            </div>
          ) : (
            <table className="orders-table w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Order Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={`border-b border-gray-200 ${editingOrderId === order.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">#{order.id}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{order.customer_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{order.phone}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{order.item_count}</td>
                    <td className="px-6 py-3 text-sm">
                      {editingOrderId === order.id ? (
                        <select
                          value={editedStatus}
                          onChange={(e) => setEditedStatus(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-800 text-xs font-semibold"
                        >
                          <option value="not packing">Not Packing</option>
                          <option value="packed">Packed</option>
                          <option value="on the way">On The Way</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'not packing' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'packed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'on the way' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {editingOrderId === order.id ? (
                        <select
                          value={editedPaymentStatus}
                          onChange={(e) => setEditedPaymentStatus(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-800 text-xs font-semibold"
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.payment_status || 'Unpaid'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm action-buttons">
                      {editingOrderId === order.id ? (
                        <>
                          <button
                            onClick={() => handleSaveStatusChange(order.id)}
                            className="action-button save-btn"
                            title="Save changes"
                            disabled={savingOrderId === order.id}
                          >
                            {savingOrderId === order.id ? '⌛' : '✓'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="action-button cancel-btn"
                            title="Cancel edit"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(order)}
                            className="action-button"
                            title="Edit order status"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleViewDetails(order.id)}
                            className="action-button"
                            title="View order details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditDetails(order.id)}
                            className="action-button"
                            title="Edit full order"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order.id)}
                            className={`action-button ${printingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Print Invoice"
                            disabled={printingOrderId === order.id}
                          >
                            {printingOrderId === order.id ? '⌛' : '🖨️'}
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(order.id)}
                            className={`action-button ${downloadingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Download Invoice"
                            disabled={downloadingOrderId === order.id}
                          >
                            {downloadingOrderId === order.id ? '⌛' : '📥'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editMode={editMode}
      />

      {/* Hidden Invoice for downloading */}
      <div style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none', width: '210mm', zIndex: -1 }}>
        {downloadOrderData && (
          <InvoicePrint
            containerRef={invoiceRef}
            orderData={{
              order: downloadOrderData.order,
              items: downloadOrderData.items
            }}
            company={downloadOrderData.company}
            paymentMethods={downloadOrderData.paymentMethods}
          />
        )}
      </div>

      <style jsx>{`
        .orders-page-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .orders-toolbar {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
        }

        .orders-search-field {
          min-width: 320px;
        }

        .orders-table-container {
          overflow-x: auto;
        }

        .orders-table {
          min-width: 1000px;
        }

        .create-order-button {
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 16px;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .create-order-button:hover {
          background: #1d4ed8;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-button {
          background: none;
          border: 1px solid #d1d5db;
          cursor: pointer;
          font-size: 16px;
          padding: 6px 10px;
          border-radius: 4px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .action-button:active {
          background-color: #e5e7eb;
        }

        .action-button.save-btn {
          background-color: #d1fae5;
          border-color: #6ee7b7;
          color: #065f46;
        }

        .action-button.save-btn:hover:not(:disabled) {
          background-color: #a7f3d0;
          border-color: #34d399;
        }

        .action-button.save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-button.cancel-btn {
          background-color: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }

        .action-button.cancel-btn:hover {
          background-color: #fecaca;
          border-color: #f87171;
        }

        @media (max-width: 768px) {
          .orders-page-header,
          .orders-toolbar {
            flex-direction: column;
          }

          .orders-page-header h2 {
            margin-bottom: 8px;
          }

          .orders-search-field {
            width: 100%;
            min-width: 0;
          }

          .create-order-button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}