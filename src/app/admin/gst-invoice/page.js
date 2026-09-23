'use client';

import { useEffect, useMemo, useState, useRef } from 'react';

const createInvoiceItem = () => ({
  itemName: '',
  hsnSac: '',
  quantity: 1,
  unit: 'Bdl',
  unitPrice: 0,
});

function formatCurrency(amount) {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function amountToWords(amount) {
  const number = Math.round(Number(amount) || 0);

  if (number === 0) {
    return 'Zero Rupees only';
  }

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertBelowThousand = (value) => {
    let result = '';
    const hundred = Math.floor(value / 100);
    const remainder = value % 100;

    if (hundred) {
      result += `${ones[hundred]} Hundred`;
      if (remainder) {
        result += ' ';
      }
    }

    if (remainder >= 20) {
      result += tens[Math.floor(remainder / 10)];
      if (remainder % 10) {
        result += ` ${ones[remainder % 10]}`;
      }
    } else if (remainder >= 10) {
      result += teens[remainder - 10];
    } else if (remainder > 0) {
      result += ones[remainder];
    }

    return result.trim();
  };

  const crore = Math.floor(number / 10000000);
  const lakh = Math.floor((number % 10000000) / 100000);
  const thousand = Math.floor((number % 100000) / 1000);
  const remainder = number % 1000;

  const parts = [];

  if (crore) parts.push(`${convertBelowThousand(crore)} Crore`);
  if (lakh) parts.push(`${convertBelowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${convertBelowThousand(thousand)} Thousand`);
  if (remainder) parts.push(convertBelowThousand(remainder));

  return `${parts.join(' ')} Rupees only`;
}

export default function GstInvoicePage() {
  const invoiceSheetRef = useRef(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [products, setProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState({});
  const [invoiceData, setInvoiceData] = useState(() => ({
    billToName: '',
    contactNo: '',
    invoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    companyState: '',
    placeOfSupply: '',
    taxRate: 18,
    receivedAmount: 0,
    description: '',
    aadharNumber: '',
    terms: 'Thank you for doing business with us.',
    items: [createInvoiceItem()],
  }));

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company-info', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const totals = useMemo(() => {
    const taxableAmount = invoiceData.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const igstAmount = taxableAmount * ((Number(invoiceData.taxRate) || 0) / 100);
    const grandTotal = taxableAmount + igstAmount;
    const receivedAmount = Number(invoiceData.receivedAmount) || 0;

    return {
      taxableAmount,
      igstAmount,
      grandTotal,
      receivedAmount,
      balanceAmount: grandTotal - receivedAmount,
      totalQuantity: invoiceData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    };
  }, [invoiceData]);

  const handleBack = () => {
    window.location.hash = '#/admin/orders';
  };

  // const handleDownloadPDF = async () => {
  //   if (!invoiceSheetRef.current) return;

  //   try {
  //     const element = invoiceSheetRef.current;
  //     const invoiceNumber = invoiceData.invoiceNo || 'invoice';

  //     // Clone the element to avoid modifying the original
  //     const clonedElement = element.cloneNode(true);

  //     const options = {
  //       margin: [3, 3, 3, 3],
  //       filename: `${invoiceNumber}-${invoiceData.invoiceDate}.pdf`,
  //       image: { type: 'png', quality: 0.98 },
  //       html2canvas: {
  //         scale: 3,
  //         useCORS: true,
  //         logging: false,
  //         backgroundColor: '#ffffff',
  //         allowTaint: true,
  //         windowWidth: 900,
  //         windowHeight: 1200
  //       },
  //       jsPDF: {
  //         unit: 'mm',
  //         format: 'a4',
  //         orientation: 'portrait',
  //         compress: false
  //       }
  //     };

  //     const { default: html2pdf } = await import('html2pdf.js');

  //     await html2pdf()
  //       .set(options)
  //       .from(clonedElement)
  //       .save();
  //   } catch (error) {
  //     console.error('PDF download error:', error);
  //     alert('Failed to download PDF. Please try again.');
  //   }
  // };

  const handlePrint = () => {
    window.print();
  };

  const handleInvoiceFieldChange = (field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )),
    }));
  };

  const handleAddItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, createInvoiceItem()],
    }));
  };

  const handleRemoveItem = (index) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.length === 1
        ? [createInvoiceItem()]
        : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const getFilteredProducts = (searchQuery) => {
    if (!searchQuery.trim()) return [];
    return products
      .filter((product) => product?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  };

  const handleSelectProduct = (index, product) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              itemName: product.name,
              unitPrice: product.price || 0,
            }
          : item
      )),
    }));
    setShowSuggestions((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const companyName = companyInfo?.company_name || 'Your Company Name';
  const companyAddress = companyInfo?.address || 'Add your company address in Company Info';
  const companyPhone = companyInfo?.phone_number || 'Add phone number';
  const companyEmail = companyInfo?.email || 'Add email address';
  const companyGst = companyInfo?.gst_number || 'Add GST number';

  return (
    <div className="gst-invoice-page">
      <div className="gst-invoice-toolbar no-print">
        <div className="gst-invoice-toolbar-left">
          <button onClick={handleBack} className="toolbar-button secondary-toolbar-button">
            ← Back to Orders
          </button>
          <button onClick={handleAddItem} className="toolbar-button primary-toolbar-button">
            + Add Item Row
          </button>
        </div>
        <div className="gst-invoice-toolbar-actions">
          {/* <button onClick={handleDownloadPDF} className="toolbar-button primary-toolbar-button">
            ⬇ Download PDF
          </button> */}
          <button onClick={handlePrint} className="toolbar-button primary-toolbar-button">
            Print Invoice
          </button>
        </div>
      </div>

      <div className="gst-invoice-sheet-shell">
        <div className="gst-invoice-sheet" ref={invoiceSheetRef}>
          <div className="gst-invoice-title-row">
            <h1 className="gst-invoice-title">Tax Invoice</h1>
          </div>

          <div className="gst-company-block">
            <div className="gst-company-branding">
              {companyInfo?.logo ? (
                <img src={companyInfo.logo} alt={companyName} className="gst-company-logo" />
              ) : (
                <div className="gst-company-logo gst-company-logo-fallback">GST</div>
              )}
            </div>

            <div className="gst-company-details">
              <h2 className="gst-company-name">{companyName}</h2>
              <p className="gst-company-line">{companyAddress}</p>
              <p className="gst-company-line">Phone no.: {companyPhone} Email: {companyEmail}</p>
              <p className="gst-company-line">
                GSTIN: {companyGst}, State:{' '}
                <input
                  type="text"
                  value={invoiceData.companyState}
                  onChange={(event) => handleInvoiceFieldChange('companyState', event.target.value)}
                  className="invoice-inline-input invoice-inline-state"
                  placeholder="33-Tamil Nadu"
                />
              </p>
            </div>
          </div>

          <div className="invoice-summary-grid">
            <div className="invoice-panel">
              <div className="invoice-panel-heading">Bill To</div>
              <div className="invoice-panel-body bill-to-panel-body">
                <input
                  type="text"
                  value={invoiceData.billToName}
                  onChange={(event) => handleInvoiceFieldChange('billToName', event.target.value)}
                  className="invoice-block-input invoice-customer-name"
                  placeholder="Customer name"
                />
                <label className="invoice-inline-row">
                  <span className="invoice-inline-label">Contact No.:</span>
                  <input
                    type="text"
                    value={invoiceData.contactNo}
                    onChange={(event) => handleInvoiceFieldChange('contactNo', event.target.value)}
                    className="invoice-inline-input"
                    placeholder="Phone number"
                  />
                </label>
              </div>
            </div>

            <div className="invoice-panel">
              <div className="invoice-panel-heading invoice-panel-heading-right">Invoice Details</div>
              <div className="invoice-panel-body invoice-details-panel-body">
                <label className="invoice-detail-row">
                  <span className="invoice-detail-label">Invoice No.:</span>
                  <input
                    type="text"
                    value={invoiceData.invoiceNo}
                    onChange={(event) => handleInvoiceFieldChange('invoiceNo', event.target.value)}
                    className="invoice-inline-input invoice-detail-input"
                    placeholder="Enter invoice no."
                  />
                </label>
                <label className="invoice-detail-row">
                  <span className="invoice-detail-label">Date:</span>
                  <input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(event) => handleInvoiceFieldChange('invoiceDate', event.target.value)}
                    className="invoice-inline-input invoice-detail-input"
                  />
                </label>
                <label className="invoice-detail-row">
                  <span className="invoice-detail-label">Place of Supply:</span>
                  <input
                    type="text"
                    value={invoiceData.placeOfSupply}
                    onChange={(event) => handleInvoiceFieldChange('placeOfSupply', event.target.value)}
                    className="invoice-inline-input invoice-detail-input"
                    placeholder="State code and state name"
                  />
                </label>
                <label className="invoice-detail-row">
                  <span className="invoice-detail-label">GST Rate (%):</span>
                  <input
                    type="number"
                    value={invoiceData.taxRate}
                    onChange={(event) => handleInvoiceFieldChange('taxRate', parseFloat(event.target.value) || 0)}
                    className="invoice-inline-input invoice-detail-input"
                    placeholder="18"
                    min="0"
                    step="0.01"
                  />
                </label>
              </div>
            </div>
          </div>

          <table className="invoice-items-table">
            <thead>
              <tr>
                <th className="table-cell-serial">#</th>
                <th className="table-cell-item">Item name</th>
                <th className="table-cell-hsn">HSN/ SAC</th>
                <th className="table-cell-quantity">Quantity</th>
                <th className="table-cell-unit">Unit</th>
                <th className="table-cell-price">Price/ unit</th>
                <th className="table-cell-taxable">Taxable amount</th>
                <th className="table-cell-igst">IGST Amount</th>
                <th className="table-cell-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => {
                const taxableAmount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const igstAmount = taxableAmount * ((Number(invoiceData.taxRate) || 0) / 100);
                const totalAmount = taxableAmount + igstAmount;

                return (
                  <tr key={`invoice-row-${index}`}>
                    <td>{index + 1}</td>
                    <td className="invoice-item-cell-wrapper">
                      <div className="invoice-item-autocomplete-wrapper">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(event) => {
                            handleItemChange(index, 'itemName', event.target.value);
                            setShowSuggestions((prev) => ({
                              ...prev,
                              [index]: event.target.value.length > 0,
                            }));
                          }}
                          onFocus={() => {
                            if (item.itemName.length > 0) {
                              setShowSuggestions((prev) => ({
                                ...prev,
                                [index]: true,
                              }));
                            }
                          }}
                          autoComplete="off"
                          className="invoice-table-input invoice-item-name-input"
                          placeholder="Item name"
                        />
                        {showSuggestions[index] && getFilteredProducts(item.itemName).length > 0 && (
                          <div className="invoice-autocomplete-suggestions">
                            {getFilteredProducts(item.itemName).map((product) => (
                              <div
                                key={`suggestion-${index}-${product.id}`}
                                className="invoice-suggestion-item"
                                onClick={() => handleSelectProduct(index, product)}
                              >
                                <div className="invoice-suggestion-name">{product.name}</div>
                                <div className="invoice-suggestion-price">₹ {Number(product.price || 0).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.hsnSac}
                        onChange={(event) => handleItemChange(index, 'hsnSac', event.target.value)}
                        className="invoice-table-input"
                        placeholder="HSN/SAC"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        min="0"
                        onChange={(event) => handleItemChange(index, 'quantity', event.target.value)}
                        className="invoice-table-input invoice-table-number-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(event) => handleItemChange(index, 'unit', event.target.value)}
                        className="invoice-table-input invoice-table-unit-input"
                        placeholder="Unit"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitPrice}
                        min="0"
                        step="0.01"
                        onChange={(event) => handleItemChange(index, 'unitPrice', event.target.value)}
                        className="invoice-table-input invoice-table-number-input"
                      />
                    </td>
                    <td>{formatCurrency(taxableAmount)}</td>
                    <td>
                      <div className="invoice-tax-value">{formatCurrency(igstAmount)}</div>
                      <div className="invoice-tax-rate">({Number(invoiceData.taxRate) || 0}%)</div>
                    </td>
                    <td>
                      <div className="invoice-amount-cell">
                        <span>{formatCurrency(totalAmount)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="invoice-row-remove-button no-print"
                          aria-label={`Remove item row ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="invoice-total-row">
                <td colSpan="3" className="invoice-total-label-cell">Total</td>
                <td>{invoiceData.items.length > 0 ? totals.totalQuantity : 0}</td>
                <td></td>
                <td></td>
                <td>{formatCurrency(totals.taxableAmount)}</td>
                <td>{formatCurrency(totals.igstAmount)}</td>
                <td>{formatCurrency(totals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="invoice-bottom-grid">
            <div className="invoice-tax-breakup-panel">
              <div className="invoice-panel-heading">Tax type</div>
              <table className="invoice-tax-table">
                <thead>
                  <tr>
                    <th>Tax type</th>
                    <th>Taxable amount</th>
                    <th>Rate</th>
                    <th>Tax amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>IGST</td>
                    <td>{formatCurrency(totals.taxableAmount)}</td>
                    <td>{Number(invoiceData.taxRate) || 0}%</td>
                    <td>{formatCurrency(totals.igstAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="invoice-amounts-panel">
              <div className="invoice-panel-heading invoice-panel-heading-right">Amounts</div>
              <div className="invoice-amount-row">
                <span>Sub Total</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
              <div className="invoice-amount-row invoice-grand-total-row">
                <span>Total</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
              <label className="invoice-amount-row invoice-received-row">
                <span>Received</span>
                <input
                  type="number"
                  value={invoiceData.receivedAmount}
                  min="0"
                  step="0.01"
                  onChange={(event) => handleInvoiceFieldChange('receivedAmount', event.target.value)}
                  className="invoice-inline-input invoice-received-input"
                />
              </label>
              <div className="invoice-amount-row">
                <span>Balance</span>
                <span>{formatCurrency(totals.balanceAmount)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-bottom-grid">
            <div className="invoice-panel">
              <div className="invoice-panel-heading">Invoice Amount In Words</div>
              <div className="invoice-panel-body invoice-words-block">
                {amountToWords(totals.grandTotal)}
              </div>
            </div>

            <div className="invoice-panel">
              <div className="invoice-panel-heading">Description</div>
              <div className="invoice-panel-body invoice-description-block">
                <textarea
                  value={invoiceData.description}
                  onChange={(event) => handleInvoiceFieldChange('description', event.target.value)}
                  className="invoice-textarea-input"
                  placeholder="Enter invoice description"
                  rows="3"
                />
                <label className="invoice-inline-row invoice-aadhar-row">
                  <span className="invoice-inline-label">Aadhar number :</span>
                  <input
                    type="text"
                    value={invoiceData.aadharNumber}
                    onChange={(event) => handleInvoiceFieldChange('aadharNumber', event.target.value)}
                    className="invoice-inline-input"
                    placeholder="0000 0000 0000"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="invoice-bottom-grid invoice-final-grid">
            <div className="invoice-panel">
              <div className="invoice-panel-heading">Terms and conditions</div>
              <div className="invoice-panel-body invoice-terms-block">
                <textarea
                  value={invoiceData.terms}
                  onChange={(event) => handleInvoiceFieldChange('terms', event.target.value)}
                  className="invoice-textarea-input invoice-terms-input"
                  rows="3"
                />
              </div>
            </div>

            <div className="invoice-signature-panel">
              <div className="invoice-signature-company">For: {companyName}</div>
              <div className="invoice-signature-space"></div>
              <div className="invoice-signature-label">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>

      {!loadingCompany ? null : <p className="company-loading-note no-print">Loading company details...</p>}

      <style jsx>{`
        .gst-invoice-page {
          color: #111827;
        }

        .gst-invoice-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .gst-invoice-toolbar-left,
        .gst-invoice-toolbar-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .toolbar-button {
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 16px;
          transition: background-color 0.2s;
        }

        .primary-toolbar-button {
          background: #2563eb;
          color: #ffffff;
        }

        .primary-toolbar-button:hover {
          background: #1d4ed8;
        }

        .secondary-toolbar-button {
          background: #e5e7eb;
          color: #111827;
        }

        .secondary-toolbar-button:hover {
          background: #d1d5db;
        }

        .gst-invoice-sheet-shell {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .gst-invoice-sheet {
          width: 100%;
          max-width: 900px;
          background: #ffffff;
          border: 1px solid #7b7b7b;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
          position: relative;
          display: block;
        }

        .gst-invoice-title-row {
          border-bottom: 1px solid #7b7b7b;
          padding: 8px 12px;
          text-align: center;
          width: 100%;
          box-sizing: border-box;
          display: block;
        }

        .gst-invoice-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          display: block;
        }

        .gst-company-block {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid #7b7b7b;
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
        }

        .gst-company-branding {
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .gst-company-logo {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border: 1px solid #c7c7c7;
          background: #ffffff;
        }

        .gst-company-logo-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: #374151;
        }

        .gst-company-details {
          text-align: right;
        }

        .gst-company-name {
          margin: 0 0 4px;
          font-size: 32px;
          font-weight: 800;
          line-height: 1.1;
          text-transform: uppercase;
        }

        .gst-company-line {
          margin: 0;
          font-size: 13px;
          line-height: 1.4;
        }

        .invoice-summary-grid,
        .invoice-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .invoice-panel,
        .invoice-signature-panel {
          min-height: 120px;
          border-right: 1px solid #7b7b7b;
          border-bottom: 1px solid #7b7b7b;
        }

        .invoice-panel:nth-child(2),
        .invoice-signature-panel {
          border-right: none;
        }

        .invoice-panel-heading {
          background: #8f89eb;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 10px;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .invoice-panel-heading-right {
          text-align: right;
        }

        .invoice-panel-body {
          padding: 10px;
          font-size: 13px;
        }

        .bill-to-panel-body {
          display: grid;
          gap: 10px;
          min-height: 82px;
        }

        .invoice-details-panel-body {
          display: grid;
          gap: 8px;
          min-height: 82px;
        }

        .invoice-customer-name {
          font-size: 15px;
          font-weight: 700;
        }

        .invoice-block-input,
        .invoice-inline-input,
        .invoice-table-input,
        .invoice-textarea-input {
          width: 100%;
          border: none;
          background: transparent;
          color: #111827;
          font: inherit;
          padding: 0;
        }

        .invoice-block-input:focus,
        .invoice-inline-input:focus,
        .invoice-table-input:focus,
        .invoice-textarea-input:focus {
          outline: none;
        }

        .invoice-inline-row,
        .invoice-detail-row,
        .invoice-amount-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .invoice-inline-label,
        .invoice-detail-label {
          font-weight: 500;
          white-space: nowrap;
        }

        .invoice-detail-row {
          justify-content: flex-end;
        }

        .invoice-detail-label {
          min-width: 110px;
          text-align: right;
        }

        .invoice-detail-input {
          max-width: 220px;
          text-align: right;
        }

        .invoice-inline-state {
          display: inline-block;
          width: 170px;
          text-align: left;
        }

        .invoice-items-table,
        .invoice-tax-table {
          width: 100%;
          border-collapse: collapse;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .invoice-items-table th,
        .invoice-items-table td,
        .invoice-tax-table th,
        .invoice-tax-table td {
          border-right: 1px solid #7b7b7b;
          border-bottom: 1px solid #7b7b7b;
          padding: 8px 6px;
          font-size: 13px;
          text-align: center;
          vertical-align: middle;
        }

        .invoice-items-table th:last-child,
        .invoice-items-table td:last-child,
        .invoice-tax-table th:last-child,
        .invoice-tax-table td:last-child {
          border-right: none;
        }

        .invoice-items-table thead th,
        .invoice-tax-table thead th {
          background: #8f89eb;
          color: #ffffff;
          font-weight: 700;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .table-cell-serial {
          width: 5%;
        }

        .table-cell-item {
          width: 24%;
        }

        .table-cell-hsn {
          width: 12%;
        }

        .table-cell-quantity {
          width: 10%;
        }

        .table-cell-unit {
          width: 8%;
        }

        .table-cell-price,
        .table-cell-taxable,
        .table-cell-igst,
        .table-cell-amount {
          width: 13%;
        }

        .invoice-item-name-input {
          font-weight: 600;
        }

        .invoice-item-cell-wrapper {
          position: relative;
        }

        .invoice-item-autocomplete-wrapper {
          position: relative;
        }

        .invoice-autocomplete-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 6px 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 100;
          max-height: 200px;
          overflow-y: auto;
        }

        .invoice-suggestion-item {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .invoice-suggestion-item:last-child {
          border-bottom: none;
        }

        .invoice-suggestion-item:hover {
          background-color: #f3f4f6;
        }

        .invoice-suggestion-name {
          flex: 1;
          font-weight: 500;
          color: #111827;
        }

        .invoice-suggestion-price {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
        }

        .invoice-table-number-input,
        .invoice-table-unit-input {
          text-align: center;
        }

        .invoice-tax-value {
          font-weight: 600;
        }

        .invoice-tax-rate {
          font-size: 12px;
          color: #4b5563;
        }

        .invoice-amount-cell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .invoice-row-remove-button {
          border: none;
          background: #fee2e2;
          color: #b91c1c;
          border-radius: 999px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .invoice-total-row td {
          font-weight: 700;
        }

        .invoice-total-label-cell {
          text-align: right !important;
        }

        .invoice-tax-breakup-panel,
        .invoice-amounts-panel {
          border-bottom: 1px solid #7b7b7b;
        }

        .invoice-amounts-panel {
          padding-bottom: 6px;
        }

        .invoice-amount-row {
          justify-content: space-between;
          padding: 9px 10px 0;
          font-size: 13px;
        }

        .invoice-grand-total-row {
          font-weight: 700;
        }

        .invoice-received-row {
          align-items: baseline;
        }

        .invoice-received-input {
          max-width: 160px;
          text-align: right;
        }

        .invoice-words-block,
        .invoice-description-block,
        .invoice-terms-block {
          min-height: 82px;
        }

        .invoice-description-block,
        .invoice-terms-block {
          display: grid;
          gap: 10px;
        }

        .invoice-textarea-input {
          resize: none;
          min-height: 52px;
        }

        .invoice-aadhar-row {
          align-items: flex-end;
        }

        .invoice-final-grid {
          align-items: stretch;
        }

        .invoice-signature-panel {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding: 18px 10px 10px;
          text-align: center;
        }

        .invoice-signature-company {
          width: 100%;
          text-align: right;
          font-size: 16px;
          font-weight: 700;
          padding-right: 12px;
        }

        .invoice-signature-space {
          min-height: 58px;
          width: 100%;
        }

        .invoice-signature-label {
          font-size: 16px;
          font-weight: 700;
        }

        .company-loading-note {
          margin-top: 12px;
          color: #6b7280;
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .gst-invoice-toolbar,
          .gst-invoice-toolbar-left,
          .invoice-summary-grid,
          .invoice-bottom-grid {
            flex-direction: column;
            grid-template-columns: 1fr;
          }

          .gst-invoice-toolbar {
            align-items: stretch;
          }

          .gst-company-block {
            grid-template-columns: 1fr;
          }

          .gst-company-branding {
            justify-content: flex-start;
          }

          .gst-company-details {
            text-align: left;
          }

          .gst-company-name {
            font-size: 24px;
          }

          .invoice-panel,
          .invoice-signature-panel,
          .invoice-tax-breakup-panel,
          .invoice-amounts-panel {
            border-right: none;
          }

          .invoice-detail-row {
            justify-content: flex-start;
          }

          .invoice-detail-label {
            min-width: 0;
            text-align: left;
          }

          .invoice-detail-input,
          .invoice-received-input,
          .invoice-inline-state {
            max-width: none;
            width: 100%;
            text-align: left;
          }

          .invoice-items-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
        }

        @page {
          margin: 0;
          padding: 0;
        }

        @media print {
          * {
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          html {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .gst-invoice-page {
            padding: 0;
            margin: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .gst-invoice-sheet-shell {
            display: block;
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .gst-invoice-sheet {
            max-width: none;
            width: 100%;
            margin: 0;
            padding: 0;
            border: 1px solid #7b7b7b;
            box-shadow: none;
            page-break-after: avoid;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .invoice-panel,
          .invoice-signature-panel {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .invoice-panel-heading,
          .invoice-items-table,
          .invoice-items-table thead th,
          .invoice-items-table td,
          .invoice-tax-table,
          .invoice-tax-table thead th,
          .invoice-tax-table td {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
