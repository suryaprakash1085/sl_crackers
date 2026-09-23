function amountToWords(amount) {
  const number = Math.floor(Number(amount));
  if (number === 0) return 'Zero rupees only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const underThousand = (value) => {
    let words = '';
    if (value >= 100) {
      words += `${ones[Math.floor(value / 100)]} Hundred `;
      value %= 100;
    }
    if (value >= 20) {
      words += `${tens[Math.floor(value / 10)]} `;
      value %= 10;
    } else if (value >= 10) {
      words += `${teens[value - 10]} `;
      value = 0;
    }
    if (value > 0) words += `${ones[value]} `;
    return words.trim();
  };

  const groups = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
    [1, ''],
  ];
  let remaining = number;
  const words = [];

  for (const [divisor, label] of groups) {
    const group = Math.floor(remaining / divisor);
    if (group > 0) {
      words.push(underThousand(group));
      if (label) words.push(label);
      remaining %= divisor;
    }
  }

  return `${words.join(' ')} rupees only`;
}

export const generateInvoicePDF = async (orderData, invoiceNumber, orderId, { download = true } = {}) => {
  // Dynamically import html2pdf only on the client side
  const html2pdf = (await import('html2pdf.js')).default;
  const currentDate = new Date().toLocaleDateString('en-IN');
  const payments = orderData.payments || {
    bankAccount: { name: 'Paradise TRADERS', accountNo: '123456789123', bankName: 'BBBB', ifscCode: '' },
    gpay: { name: 'xxxx', number: '9354200000' },
    upi: { name: 'xxxx', id: 'cnjncdjdk' },
  };
  const companyInfo = orderData.companyInfo || {
    company_name: 'Sivakasi Mart Traders',
    address: '',
    email: '',
    phone_number: '',
    gst_number: '',
    logo: '',
  };
  const companyLogo = companyInfo.logo || '';

  // Calculate order number (5-digit format starting from 11111)
  const displayOrderNumber = orderId ? String(orderId + 11110).padStart(5, '0') : '00001';

  const cartTotal = orderData.items.reduce((sum, item) => {
    const price = typeof item.price === 'number'
      ? item.price
      : typeof item.discount === 'number'
        ? item.discount
        : parseFloat(item.price?.replace('₹', '') || item.discount?.replace('₹', '') || 0);
    return sum + (price * item.quantity);
  }, 0);

  const totalAmount = cartTotal;

  const itemsHTML = orderData.items.map((item, index) => {
    // Get the sale price from item.price or item.discount
    const salePrice = typeof item.price === 'number'
      ? item.price
      : typeof item.discount === 'number'
        ? item.discount
        : parseFloat(item.price?.replace('₹', '') || item.discount?.replace('₹', '') || 0);

    // Get original price for calculating discount
    const originalPrice = typeof item.originalPrice === 'number'
      ? item.originalPrice
      : parseFloat(item.originalPrice?.replace('₹', '') || 0);

    // Calculate discount percentage and amount
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
    const discountAmount = originalPrice - salePrice;
    const amount = (salePrice * item.quantity).toFixed(2);

    return `
      <tr>
        <td style="text-align: center; color: #7b8794;">${index + 1}</td>
        <td style="font-weight: 600;">${item.name}</td>
        <td style="text-align: center; color: #7b8794;">₹ ${originalPrice.toFixed(0)}</td>
        <td style="text-align: center; color: #c0392b;">${discountPercent}%</td>
        <td style="text-align: center; color: #7b8794;">₹ ${discountAmount.toFixed(0)}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right; font-weight: 600;">₹ ${amount}</td>
      </tr>
    `;
  }).join('');

  const brandColor = '#1e3a5f';
  const brandColorLight = '#eef3f8';

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          padding: 0;
          background: #f2f4f7;
        }
        .invoice-container {
          border: 1px solid #e2e6ea;
          border-radius: 10px;
          overflow: hidden;
          width: 210mm;
          max-width: 100%;
          height: auto;
          margin: 0 auto;
          background: white;
          color: #1f2933;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          background: ${brandColor};
          color: #ffffff;
          padding: 18px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border-radius: 8px;
        }
        .logo-img {
          display: block;
          max-width: 40px;
          max-height: 40px;
          object-fit: contain;
        }
        .header-brand h1 {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .header-brand span {
          display: block;
          font-size: 9px;
          opacity: 0.85;
          margin-top: 2px;
        }
        .header-title {
          text-align: right;
        }
        .header-title h2 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .header-title span {
          display: block;
          font-size: 9px;
          opacity: 0.85;
          margin-top: 2px;
        }
        .company-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          border-bottom: 1px solid #e2e6ea;
          min-height: 60px;
        }
        .company-details {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-right: 1px solid #e2e6ea;
        }
        .company-text {
          min-width: 0;
        }
        .company-details p {
          font-size: 9px;
          color: #52606d;
          line-height: 1.3;
          margin: 1px 0;
        }
        .bill-info {
          padding: 12px 24px;
          font-size: 10px;
        }
        .bill-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          gap: 5px;
        }
        .bill-info-label {
          font-weight: 600;
          color: #7b8794;
        }
        .status-pill {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 10px;
          background: #fdecea;
          color: #c0392b;
          font-weight: 700;
          font-size: 9px;
        }
        .customer-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #e2e6ea;
          min-height: 64px;
        }
        .customer-details {
          padding: 12px 24px;
          border-right: 1px solid #e2e6ea;
          font-size: 10px;
        }
        .customer-details h3 {
          font-weight: 700;
          margin: 0 0 5px 0;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${brandColor};
        }
        .customer-details p {
          font-size: 9px;
          color: #52606d;
          line-height: 1.3;
          margin: 2px 0;
        }
        .customer-details strong {
          font-size: 12px;
          display: block;
          margin-bottom: 2px;
          color: #1f2933;
        }
        .transporter-section {
          padding: 12px 24px;
          display: flex;
          flex-direction: column;
          font-size: 10px;
        }
        .transporter-section h3 {
          font-weight: 700;
          margin: 5px 0;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${brandColor};
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          table-layout: auto;
        }
        .items-table th, .items-table td {
          padding: 9px 12px;
          vertical-align: middle;
          white-space: nowrap;
          font-size: 10px;
          border-bottom: 1px solid #eef1f4;
        }
        .items-table th {
          background: ${brandColor};
          color: #ffffff;
          font-weight: 600;
          text-align: center;
          border-bottom: none;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .items-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .items-table tbody tr {
          page-break-inside: avoid;
        }
        .items-table thead {
          display: table-header-group;
        }
        .total-row {
          font-weight: 700;
          background: ${brandColorLight};
        }
        .total-row td {
          padding: 10px 12px;
          border-bottom: none;
          color: ${brandColor};
        }
        .amount-in-words {
          padding: 10px 24px;
          border-bottom: 1px solid #e2e6ea;
          font-size: 10px;
          font-style: italic;
          color: #52606d;
          min-height: 28px;
          display: flex;
          align-items: center;
        }
        .summary-section {
          padding: 10px 24px;
          border-bottom: 1px solid #e2e6ea;
          font-size: 10px;
          display: flex;
          justify-content: flex-end;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          min-width: 220px;
        }
        .summary-label {
          font-weight: 700;
        }
        .summary-value {
          text-align: right;
          font-weight: 700;
          color: ${brandColor};
          font-size: 13px;
        }
        .payment-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          border-bottom: 1px solid #e2e6ea;
          min-height: 60px;
          padding: 12px 24px;
          page-break-inside: avoid;
        }
        .payment-box {
          min-width: 0;
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #e2e6ea;
          border-radius: 8px;
          font-size: 10px;
          overflow-wrap: anywhere;
        }
        .payment-box h4 {
          font-weight: 700;
          margin: 0 0 4px 0;
          font-size: 9px;
          color: ${brandColor};
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .payment-box p {
          margin: 3px 0;
          line-height: 1.3;
          font-size: 9px;
          color: #52606d;
          overflow-wrap: anywhere;
        }
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
          border: 1px solid #e2e6ea;
          border-radius: 4px;
          padding: 2px;
          background: #fff;
        }
        .declaration-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 80px;
          padding: 4px 24px 20px;
          page-break-inside: avoid;
        }
        .declaration {
          padding: 12px 12px 12px 0;
        }
        .declaration h3 {
          font-weight: 700;
          margin: 0 0 8px 0;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${brandColor};
        }
        .signature-section {
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }
        .signature-section p {
          font-size: 10px;
          font-weight: 700;
          margin: 0;
          color: #1f2933;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }

        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .invoice-container {
            padding: 0;
            margin: 0;
            width: 100%;
            height: auto;
            background: white;
            border-radius: 0;
            border: none;
          }
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="header-brand">
            ${companyLogo ? `<div class="logo-box"><img src="${companyLogo}" alt="${companyInfo.company_name} logo" class="logo-img"></div>` : ''}
            <div>
              <h1>${companyInfo.company_name}</h1>
              <span>${companyInfo.address || ''}</span>
            </div>
          </div>
          <div class="header-title">
            <h2>INVOICE</h2>
            <span>#${invoiceNumber}</span>
          </div>
        </div>

        <!-- Company and Bill Info Section -->
        <div class="company-section">
          <div class="company-details">
            <div class="company-text">
              <p>Gmail: ${companyInfo.email}</p>
              <p>Mob: ${companyInfo.phone_number}</p>
              ${companyInfo.gst_number ? `<p>GSTIN: ${companyInfo.gst_number}</p>` : ''}
            </div>
          </div>
          <div class="bill-info">
            <div class="bill-info-row">
              <span class="bill-info-label">Order No</span>
              <span>${displayOrderNumber}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Date</span>
              <span>${currentDate}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Payment</span>
              <span class="status-pill">Unpaid</span>
            </div>
          </div>
        </div>

        <!-- Customer Section -->
        <div class="customer-section">
          <div class="customer-details">
            <h3>Billed To:</h3>
            <p><strong>${orderData.customerName || '[Not provided]'}</strong></p>
            <p>${orderData.address || '[Not provided]'}</p>
            <p>Mob: ${orderData.phone || '[Not provided]'}</p>
            <p>Email: ${orderData.email || '[Not provided]'}</p>
          </div>
          <div class="transporter-section">
            <h3>Transporter Name:</h3>
            <p></p>
            <h3 style="margin-top: 15px;">LR No.</h3>
            <p></p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Name</th>
              <th>Product Rate</th>
              <th>Discount</th>
              <th>Discount Rate</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="5" style="text-align: right;">Total</td>
              <td style="text-align: center;">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td style="text-align: right;">₹ ${cartTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Amount in Words -->
        <div class="amount-in-words">
          INR ${amountToWords(totalAmount)}
        </div>

        <!-- Summary -->
        <div class="summary-section">
          <div class="summary-row">
            <span class="summary-label">Total Amount</span>
            <span class="summary-value">₹ ${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="payment-section">
          <div class="payment-box">
            <h4>A/C Name: ${payments.bankAccount.name}</h4>
            <p>Bank Name: ${payments.bankAccount.bankName}</p>
            <p>Current A/C No: ${payments.bankAccount.accountNo}</p>
            ${payments.bankAccount.ifscCode ? `<p>IFSC Code: ${payments.bankAccount.ifscCode}</p>` : ''}
          </div>
          <div class="payment-box">
            <h4>Name: ${payments.gpay.name}</h4>
            <p>G-Pay No: ${payments.gpay.number}</p>
          </div>
          <div class="payment-box">
            <h4>UPI Name: ${payments.upi.name}</h4>
            <p>UPI ID: ${payments.upi.id}</p>
            ${payments.upi.qrCode ? `
            <div class="upi-qr-container">
              <img src="${payments.upi.qrCode}" alt="UPI QR Code" class="upi-qr-image">
            </div>` : ''}
          </div>
        </div>

        <!-- Declaration -->
        <div class="declaration-section">
          <div class="declaration">
            <h3>Declaration</h3>
          </div>
          <div class="signature-section">
            <p>for ${companyInfo.company_name}</p>
            <p>Authorised Signatory</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const opt = {
    margin: 0,
    filename: `Invoice-${invoiceNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  const pdfBlob = await html2pdf().set(opt).from(invoiceHTML).outputPdf('blob');

  if (download) {
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = opt.filename;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  }

  return pdfBlob;
};