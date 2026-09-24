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
        <h2 className="main-title">BILL</h2>
       
        {/* Header Section */}
        <div className="header-section">
          <div className="company-info">
            {company?.logo && (
              <div className="logo-box">
                <img src={company.logo} alt="logo" className="logo-img" />
              </div>
            )}
            <div className="details-box">
              <h1 className="company-name">{company?.company_name || 'Your Company Name'}</h1>
              {company?.address && <p>{company.address}</p>}
              {company?.email && <p>Gmail: {company.email}</p>}
              {company?.website && <p>Website: {company.website}</p>}
              {company?.phone_number && <p>Mob: {company.phone_number}</p>}
            </div>
          </div>
          <div className="bill-info">
            <div className="row"><span className="label">Bill No:</span> <span className="value">{order.invoice_number || `CC/${order.id}`}</span></div>
            <div className="row"><span className="label">Order No:</span> <span className="value">{displayOrderNumber}</span></div>
            <div className="row"><span className="label">Date:</span> <span className="value">{new Date(order.created_at).toLocaleDateString('en-GB')}</span></div>
            <div className="row"><span className="label">Payment:</span> <span className="value font-bold">{order.payment_status || 'UnPaid'}</span></div>
          </div>
        </div>
 
        {/* Billed To / Transporter Section */}
        <div className="client-grid">
          <div className="billed-to">
            <div className="label-top">Billed To:</div>
            <div className="client-name">{order.customer_name}</div>
            <div>{order.address}</div>
            <div>Mob: {order.phone}</div>
            <div>Email: {order.email}</div>
          </div>
          <div className="transporter">
            <div className="t-row"><span className="t-label">Transporter Name:</span></div>
            <div className="t-row mt-auto"><span className="t-label">LR No.</span></div>
          </div>
        </div>
 
        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="w-10">S.No</th>
              <th className="w-40 text-left">Item Name</th>
              <th className="w-15">Product Rate</th>
              <th className="w-10">Discount</th>
              <th className="w-10">Discount Rate</th>
              <th className="w-5">Quantity</th>
              <th className="w-10 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rate = parseFloat(item.price);
              const discPercent = 75;
              const discRate = rate * (discPercent / 100);
              const discountedPrice = rate - discRate;
              const amount = discountedPrice * item.quantity;
             
              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-left font-bold">{item.product_name}</td>
                  <td className="text-center">₹ {rate.toFixed(0)}</td>
                  <td className="text-center">{discPercent}%</td>
                  <td className="text-center">₹ {rate.toFixed(0)}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹ {Math.round(amount)}</td>
                </tr>
              );
            })}
            {/* Pad empty rows to maintain height if needed */}
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
          INR {amountToWords(subTotal)}
        </div>
 
        {/* Footer Grid */}
        <div className="footer-info-grid">
          <div className="bank-box">
            {payments.bankAccount?.name && <p className="font-bold">A/C Name: {payments.bankAccount.name}</p>}
            {payments.bankAccount?.bankName && <p>Bank Name: {payments.bankAccount.bankName}</p>}
            {payments.bankAccount?.accountNo && <p>Current A/C No: {payments.bankAccount.accountNo}</p>}
            {payments.bankAccount?.ifscCode && <p>IFSC Code: {payments.bankAccount.ifscCode}</p>}
          </div>
          <div className="gpay-box">
            {payments.gpay?.name && <p className="font-bold">Name: {payments.gpay.name}</p>}
            {payments.gpay?.number && <p>G-Pay No: {payments.gpay.number}</p>}
          </div>
          <div className="upi-box">
            {payments.upi?.name && <p className="font-bold">UPI Name: {payments.upi.name}</p>}
            {payments.upi?.id && <p>UPI ID: {payments.upi.id}</p>}
            {payments.upi?.qrCode && (
              <div className="upi-qr-container">
                <img src={payments.upi.qrCode} alt="UPI QR Code" className="upi-qr-image" />
              </div>
            )}
          </div>
        </div>
 
        {/* Declaration and Signature */}
        <div className="bottom-grid">
          <div className="declaration">
            <div className="label-top">Declaration</div>
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
          font-size: 11px;
          padding: 5mm;
          box-sizing: border-box;
          line-height: 1.4;
        }
 
        .invoice-outer-border {
          border: 2px solid #000;
          box-sizing: border-box;
        }
 
        .main-title {
          text-align: center;
          border-bottom: 1px solid #000;
          margin: 0;
          padding: 8px;
          font-size: 16px;
          font-weight: bold;
        }
 
        .header-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          border-bottom: 1px solid #000;
          min-height: 70px;
        }
 
        .company-info {
          display: flex;
          border-right: 1px solid #000;
          padding: 8px;
          gap: 10px;
          align-items: flex-start;
        }
 
        .logo-box {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
 
        .logo-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
 
        .details-box h1 {
          font-size: 14px;
          margin: 0 0 3px 0;
          font-weight: bold;
        }
 
        .details-box p {
          margin: 1px 0;
          line-height: 1.2;
          font-size: 9px;
        }
 
        .bill-info {
          padding: 8px;
          font-size: 10px;
        }
 
        .bill-info .row {
          display: flex;
          margin-bottom: 6px;
          gap: 5px;
        }
 
        .bill-info .label {
          width: 60px;
          font-weight: bold;
        }
 
        .client-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #000;
          min-height: 70px;
        }
 
        .billed-to {
          padding: 8px;
          border-right: 1px solid #000;
          font-size: 10px;
        }
 
        .transporter {
          padding: 8px;
          display: flex;
          flex-direction: column;
          font-size: 10px;
        }
 
        .label-top {
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 5px;
        }
 
        .client-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 2px;
        }
 
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          table-layout: fixed;
        }
 
        .items-table th, .items-table td {
          border: 1px solid #000;
          padding: 8px 4px;
          vertical-align: middle;
          word-wrap: break-word;
        }
 
        .items-table th {
          background: #f5f5f5;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
          border: 2px solid #000;
        }
 
        .items-table tbody tr {
          page-break-inside: avoid;
        }
 
        .items-table tbody td {
          border: 1px solid #000;
        }
 
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
 
        .w-10 { width: 10%; }
        .w-40 { width: 40%; }
        .w-15 { width: 15%; }
        .w-5 { width: 5%; }
 
        .total-row {
          background: #fff;
          font-weight: bold;
        }
 
        .grand-total {
          background: #fff;
          font-weight: bold;
        }
 
        .words-section {
          padding: 8px;
          border-bottom: 1px solid #000;
          text-transform: lowercase;
          font-size: 10px;
          min-height: 30px;
          display: flex;
          align-items: center;
        }
 
        .footer-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid #000;
          min-height: 60px;
        }
 
        .bank-box, .gpay-box, .upi-box {
          padding: 8px;
          border-right: 1px solid #000;
          font-size: 10px;
        }
 
        .upi-box {
          border-right: none;
        }
 
        .footer-info-grid p {
          margin: 3px 0;
          font-size: 9px;
          line-height: 1.3;
        }
 
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 80px;
        }
 
        .declaration {
          padding: 8px;
          border-right: 1px solid #000;
        }
 
        .signature {
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }
 
        .for-company {
          font-weight: bold;
          font-size: 10px;
          margin-top: auto;
        }
 
        .sign-label {
          font-weight: bold;
          font-size: 9px;
        }
 
        .t-row {
          margin-bottom: 5px;
          font-size: 10px;
        }
 
        .t-label {
          font-weight: bold;
        }
 
        .mt-auto { margin-top: auto; }
 
        .upi-qr-container {
          margin-top: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
 
        .upi-qr-image {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border: 1px solid #000;
          padding: 2px;
        }
 
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
 
          .invoice-print-container {
            padding: 0;
            margin: 0;
            width: 100%;
            height: auto;
            background: white;
            page-break-after: always;
          }
 
          .invoice-outer-border {
            box-shadow: none;
            border: 2px solid #000;
          }
 
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}