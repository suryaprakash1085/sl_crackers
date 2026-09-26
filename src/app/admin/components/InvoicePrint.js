'use client';

import React from 'react';

// Utility to convert number to words
function amountToWords(amount) {
  const num = Math.floor(amount);
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

  function convert(n) {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    return n.toString();
  }

  if (num === 0) return "Zero";
  const result = convert(num);
  return result.charAt(0).toUpperCase() + result.slice(1) + " only";
}

export default function InvoicePrint({ orderData, company, containerRef, paymentMethods = null }) {
  if (!orderData) return null;

  const { order, items } = orderData;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const subTotal = parseFloat(order.total_amount);

  // Calculate display order number (5-digit format starting from 11111)
  const displayOrderNumber = order.id ? String(order.id + 11110).padStart(5, '0') : '00001';

  // Get payment methods from props or localStorage
  const getPaymentMethods = () => {
    if (paymentMethods) return paymentMethods;

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminPayments');
      if (saved) return JSON.parse(saved);
    }

    // Default fallback
    return {
      bankAccount: { name: '', accountNo: '', bankName: '', ifscCode: '' },
      gpay: { name: '', number: '' },
      upi: { name: '', id: '' }
    };
  };

  const payments = getPaymentMethods();

  return (
    <div ref={containerRef} className="invoice-print-container">
      <div className="invoice-outer-border">
        <div className="invoice-topline">
          <span>Invoice No: {order.invoice_number || `CC/${order.id}`}</span>
          <strong>TAX INVOICE</strong>
          <span>Original Copy</span>
        </div>

        <div className="company-heading">
          {company?.logo && <img src={company.logo} alt="Company logo" className="logo-img" />}
          <h1>{company?.company_name || 'Your Company Name'}</h1>
          {company?.address && <p>{company.address}</p>}
          <p>{[company?.email, company?.website, company?.phone_number].filter(Boolean).join(' | ')}</p>
          {company?.gst_number && <p>GSTIN: {company.gst_number}</p>}
        </div>

        <div className="bill-details">
          <div className="billed-to">
            <h2>Billing Details</h2>
            <p><strong>Customer Name:</strong> {order.customer_name}</p>
            <p>{order.address}</p>
            <p><strong>Mobile:</strong> {order.phone}</p>
            <p><strong>Email:</strong> {order.email}</p>
          </div>
          <div className="bill-info">
            <div className="row"><span className="label">Invoice Number</span><span>{order.invoice_number || `CC/${order.id}`}</span></div>
            <div className="row"><span className="label">Invoice Date</span><span>{new Date(order.created_at).toLocaleDateString('en-GB')}</span></div>
            <div className="row"><span className="label">Order Number</span><span>{displayOrderNumber}</span></div>
            <div className="row"><span className="label">Payment</span><span className="font-bold">{order.payment_status || 'UnPaid'}</span></div>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th className="col-item text-left">Item Name</th>
              <th className="col-rate">Product Rate</th>
              <th className="col-discount">Discount</th>
              <th className="col-discount-rate">Discount Rate</th>
              <th className="col-qty">Quantity</th>
              <th className="col-amount text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rate = parseFloat(item.price);
              const discPercent = 75;
              const discRate = rate * (discPercent / 100);   // 75% discount
              const disAmount = rate - discRate;             // balance 25%
              const amount = disAmount * item.quantity;

              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-left font-bold">{item.product_name}</td>
                  <td className="text-center">₹ {rate.toFixed(0)}</td>
                  <td className="text-center">{discPercent}%</td>
                  <td className="text-center">₹ {Number(disAmount.toFixed(0))}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹ {Math.round(amount)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="5" className="text-right font-bold">Total</td>
              <td className="text-center font-bold">{totalQty}</td>
              <td className="text-right font-bold">₹ {subTotal.toFixed(1)}</td>
            </tr>
            <tr>
              <td colSpan="6" className="text-right">Packing and Forwarding Charges</td>
              <td className="text-right">₹ 0</td>
            </tr>
            <tr className="grand-total">
              <td colSpan="6" className="text-right font-bold">Total Amount</td>
              <td className="text-right font-bold">₹ {subTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div className="words-section">
          <strong>Amount in words:</strong>&nbsp; INR {amountToWords(subTotal)}
        </div>

        <div className="summary-section">
          <div className="summary-row">
            <strong>Total Amount</strong>
            <strong>₹ {subTotal.toFixed(2)}</strong>
          </div>
        </div>

        <div className="invoice-footer">
          <div className="declaration">
            <h3>Declaration</h3>
          </div>
          <div className="payment-summary">
            <h3>Payment Details</h3>
            {payments.bankAccount?.name && <p><strong>A/C Name:</strong> {payments.bankAccount.name}</p>}
            {payments.bankAccount?.bankName && <p><strong>Bank:</strong> {payments.bankAccount.bankName}</p>}
            {payments.bankAccount?.accountNo && <p><strong>Account No:</strong> {payments.bankAccount.accountNo}</p>}
            {payments.bankAccount?.ifscCode && <p><strong>IFSC:</strong> {payments.bankAccount.ifscCode}</p>}
            {payments.gpay?.name && <p><strong>GPay:</strong> {payments.gpay.name} {payments.gpay.number}</p>}
            {payments.upi?.name && <p><strong>UPI:</strong> {payments.upi.name} {payments.upi.id}</p>}
            {payments.upi?.qrCode && (
              <img src={payments.upi.qrCode} alt="UPI QR Code" className="upi-qr-image" />
            )}
          </div>
          <div className="signature">
            <div className="for-company">for {company?.company_name || 'Your Company'}</div>
            <div className="sign-label">Authorised Signatory</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .invoice-print-container {
          background: white;
          width: 210mm;
          height: auto;
          margin: 0 auto;
          color: black;
          font-family: Arial, sans-serif;
          font-size: 10px;
          padding: 5mm;
          box-sizing: border-box;
          line-height: 1.3;
        }

        .invoice-outer-border {
          border: 1px solid #666;
          box-sizing: border-box;
          width: 100%;
        }

        .invoice-topline {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          min-height: 22px;
          padding: 3px 6px;
          background: #f2f2f2;
          border-bottom: 1px solid #888;
          font-size: 9px;
        }

        .invoice-topline strong {
          text-align: center;
          font-size: 13px;
        }

        .invoice-topline span:last-child {
          text-align: right;
        }

        .company-heading {
          padding: 5px 10px 7px;
          text-align: center;
          border-bottom: 1px solid #888;
        }

        .company-heading .logo-img {
          display: block;
          max-width: 42px;
          max-height: 32px;
          margin: 0 auto 2px;
          object-fit: contain;
        }

        .company-heading h1 {
          margin: 0 0 2px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 15px;
        }

        .company-heading p {
          margin: 1px 0;
          font-size: 9px;
        }

        .bill-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #888;
          min-height: 54px;
        }

        .billed-to,
        .bill-info {
          padding: 6px;
          font-size: 9px;
        }

        .billed-to {
          border-right: 1px solid #888;
        }

        .billed-to h2 {
          margin: 0 0 3px;
          font-size: 10px;
        }

        .billed-to p {
          margin: 1px 0;
          overflow-wrap: anywhere;
        }

        .billed-to strong {
          font-size: 10px;
        }

        .bill-info .row {
          display: flex;
          margin-bottom: 2px;
          gap: 4px;
        }

        .bill-info .label {
          min-width: 75px;
          font-weight: bold;
        }

        /* ---- TABLE: fixed for correct print pagination ---- */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          table-layout: fixed;
          border: 1px solid #777;
        }

        .items-table th, .items-table td {
          border: 1px solid #777;
          padding: 5px 3px;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: anywhere;
          box-sizing: border-box;
          font-size: 9px;
        }

        .items-table th:not(:nth-child(2)),
        .items-table td:not(:nth-child(2)) {
          white-space: nowrap;
          overflow-wrap: normal;
        }

        .items-table th {
          background: #f1f1f1;
          font-weight: bold;
          text-align: center;
          border: 1px solid #777;
        }

        /* Repeat header row on every printed page */
        .items-table thead {
          display: table-header-group;
        }

        .items-table tfoot {
          display: table-footer-group;
        }

        /* Never split a row across a page break */
        .items-table tbody tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .items-table tfoot tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .items-table tbody td {
          vertical-align: top;
        }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        .col-sno { width: 8%; }
        .col-item { width: 27%; }
        .col-rate { width: 13%; }
        .col-discount { width: 11%; }
        .col-discount-rate { width: 15%; }
        .col-qty { width: 9%; }
        .col-amount { width: 17%; }

        .total-row {
          background: #f7f7f7;
          font-weight: bold;
        }

        .grand-total {
          background: #f7f7f7;
          font-weight: bold;
        }

        .words-section {
          padding: 6px;
          border-bottom: 1px solid #888;
          font-size: 9px;
          min-height: 24px;
          display: flex;
          align-items: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .summary-section {
          padding: 7px 6px;
          border-bottom: 1px solid #888;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 5px;
          border-top: 1px solid #888;
          font-size: 11px;
        }

        .invoice-footer {
          display: grid;
          grid-template-columns: 1fr 1.35fr 1fr;
          border-bottom: 1px solid #888;
          min-height: 30mm;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .declaration,
        .payment-summary,
        .signature {
          min-width: 0;
          padding: 4px;
          font-size: 9px;
          overflow-wrap: anywhere;
        }

        .declaration,
        .payment-summary {
          border-right: 1px solid #888;
        }

        .declaration h3,
        .payment-summary h3 {
          margin: 0 0 5px;
          font-size: 9px;
        }

        .payment-summary p {
          margin: 2px 0;
          overflow-wrap: anywhere;
        }

        .signature {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          text-align: right;
        }

        .for-company {
          font-weight: bold;
          font-size: 9px;
        }

        .sign-label {
          font-weight: bold;
          font-size: 9px;
        }

        .upi-qr-image {
          width: 38px;
          height: 38px;
          margin-top: 4px;
          object-fit: contain;
          border: 1px solid #888;
          padding: 2px;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
            orphans: 3;
            widows: 3;
          }

          .invoice-print-container {
            padding: 0;
            margin: 0;
            width: 100%;
            height: auto;
            background: white;
          }

          .invoice-outer-border {
            box-shadow: none;
            border: 1px solid #666;
          }

          .items-table tbody tr,
          .items-table tfoot tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}