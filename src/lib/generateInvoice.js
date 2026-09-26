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

function parsePrice(value) {
  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getInvoiceItemPrices(item) {
  const salePrice = parsePrice(item.discountPrice ?? item.salePrice ?? item.price ?? item.discount);
  const listedPrice = parsePrice(item.originalPrice ?? item.price);
  const originalPrice = listedPrice > 0 ? listedPrice : salePrice / 0.25;

  return { originalPrice, salePrice };
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
    company_name: 'Paradise Crackers',
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
    const { salePrice } = getInvoiceItemPrices(item);
    return sum + (salePrice * item.quantity);
  }, 0);

  const totalAmount = cartTotal;

  const itemsHTML = orderData.items.map((item, index) => {
    const { originalPrice, salePrice } = getInvoiceItemPrices(item);
    const discountPercent = Number.isFinite(Number(item.discountPercent))
      ? Number(item.discountPercent)
      : originalPrice > 0 ? Math.max(0, ((originalPrice - salePrice) / originalPrice) * 100) : 0;
    const amount = (salePrice * item.quantity).toFixed(2);

    return `<tr style="border: 1px solid #000;">
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 8px;">${item.name}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">₹ ${originalPrice.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">75%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">₹ ${salePrice.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">₹ ${amount}</td>
      </tr>
    `;
  }).join('');

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
          font-family: Arial, sans-serif;
          padding: 0;
          background: white;
        }
        .invoice-container {
          border: 2px solid #000;
          width: 100%;
          max-width: 190mm;
          height: auto;
          margin: 0 auto;
          background: white;
          color: black;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          border-bottom: 1px solid #000;
          padding: 8px;
          text-align: center;
        }
        .header h1 {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
        }
        .company-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          border-bottom: 1px solid #000;
          min-height: 70px;
        }
        .company-details {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-right: 1px solid #000;
        }
        .logo-box {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          display: block;
          max-width: 58px;
          max-height: 58px;
          object-fit: contain;
        }
        .company-text {
          min-width: 0;
        }
        .company-details h3 {
          font-weight: bold;
          margin: 0 0 3px 0;
          font-size: 12px;
        }
        .company-details p {
          font-size: 9px;
          line-height: 1.2;
          margin: 1px 0;
        }
        .bill-info {
          padding: 8px;
          font-size: 10px;
        }
        .bill-info-row {
          display: flex;
          margin-bottom: 6px;
          gap: 5px;
        }
        .bill-info-label {
          font-weight: bold;
          width: 60px;
        }
        .customer-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #000;
          min-height: 70px;
        }
        .customer-details {
          padding: 8px;
          border-right: 1px solid #000;
          font-size: 10px;
        }
        .customer-details h3 {
          font-weight: bold;
          margin: 0 0 5px 0;
          font-size: 10px;
        }
        .customer-details p {
          font-size: 9px;
          line-height: 1.3;
          margin: 2px 0;
        }
        .customer-details strong {
          font-size: 12px;
          display: block;
          margin-bottom: 2px;
        }
        .transporter-section {
          padding: 8px;
          display: flex;
          flex-direction: column;
          font-size: 10px;
        }
        .transporter-section h3 {
          font-weight: bold;
          margin: 5px 0;
          font-size: 10px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          table-layout: fixed;
          border: 1px solid #000;
        }
        .items-table th, .items-table td {
          border: 1px solid #000;
          padding: 5px 3px;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: anywhere;
          box-sizing: border-box;
          font-size: 9px;
        }
        .items-table th:not(:nth-child(2)), .items-table td:not(:nth-child(2)) {
          white-space: nowrap;
          overflow-wrap: normal;
        }
        .items-table th {
          background: #f5f5f5;
          font-weight: bold;
          text-align: center;
          border: 2px solid #000;
        }
        .items-table tbody tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .items-table tbody td {
          vertical-align: top;
        }
        .items-table thead {
          display: table-header-group;
        }
        .items-table tfoot {
          display: table-footer-group;
        }
        .col-sno { width: 8%; }
        .col-item { width: 27%; }
        .col-rate { width: 13%; }
        .col-discount { width: 11%; }
        .col-discount-rate { width: 15%; }
        .col-qty { width: 9%; }
        .col-amount { width: 17%; }
        .total-row {
          font-weight: bold;
          background: #fff;
        }
        .total-row td {
          padding: 8px 4px;
        }
        .summary-section {
          padding: 8px;
          border-bottom: 1px solid #000;
          font-size: 10px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .summary-row:last-child {
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 10px;
        }
        .summary-label {
          font-weight: bold;
        }
        .summary-value {
          text-align: right;
        }
        .payment-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid #000;
          min-height: 60px;
          page-break-inside: avoid;
        }
        .payment-box {
          min-width: 0;
          padding: 8px;
          border-right: 1px solid #000;
          font-size: 10px;
          overflow-wrap: anywhere;
        }
        .payment-box:last-child {
          border-right: none;
        }
        .payment-box h4 {
          font-weight: bold;
          margin: 0 0 3px 0;
          font-size: 10px;
        }
        .payment-box p {
          margin: 3px 0;
          line-height: 1.3;
          font-size: 9px;
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
          border: 1px solid #000;
          padding: 2px;
        }
        .declaration-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 80px;
          page-break-inside: avoid;
        }
        .declaration {
          padding: 8px;
          border-right: 1px solid #000;
        }
        .declaration h3 {
          font-weight: bold;
          margin: 0 0 8px 0;
          font-size: 10px;
        }
        .signature-section {
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }
        .signature-section p {
          font-size: 10px;
          font-weight: bold;
          margin: 0;
        }
        .amount-in-words {
          padding: 8px;
          border-bottom: 1px solid #000;
          font-size: 10px;
          min-height: 30px;
          display: flex;
          align-items: center;
          background-color: #f9f9f9;
          page-break-inside: avoid;
          break-inside: avoid;
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
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <h1>BILL</h1>
        </div>

        <!-- Company and Bill Info Section -->
        <div class="company-section">
          <div class="company-details">
            ${companyLogo ? `<div class="logo-box"><img src="${companyLogo}" alt="${companyInfo.company_name} logo" class="logo-img"></div>` : ''}
            <div class="company-text">
              <h3>${companyInfo.company_name}</h3>
              <p>${companyInfo.address}</p>
              <p>Gmail: ${companyInfo.email}</p>
              <p>Mob: ${companyInfo.phone_number}</p>
              ${companyInfo.gst_number ? `<p>GSTIN: ${companyInfo.gst_number}</p>` : ''}
            </div>
          </div>
          <div class="bill-info">
            <div class="bill-info-row">
              <span class="bill-info-label">Bill No:</span>
              <span>${invoiceNumber}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Order No:</span>
              <span>${displayOrderNumber}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Date:</span>
              <span>${currentDate}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Payment:</span>
              <span>Unpaid</span>
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
          <colgroup>
            <col class="col-sno">
            <col class="col-item">
            <col class="col-rate">
            <col class="col-discount">
            <col class="col-discount-rate">
            <col class="col-qty">
            <col class="col-amount">
          </colgroup>
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
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="5" style="text-align: right;">Total</td>
              <td style="text-align: center;">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td style="text-align: right;">₹ ${cartTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount in Words -->
        <div class="amount-in-words">
          INR ${amountToWords(totalAmount)}
        </div>

        <!-- Summary -->
        <div class="summary-section">
          <div class="summary-row" style="border-top: 1px solid #000; padding-top: 10px;">
            <span class="summary-label"><strong>Total Amount</strong></span>
            <span class="summary-value"><strong>₹ ${totalAmount.toFixed(2)}</strong></span>
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
            <div style="margin-top: 20px; text-align: center;">
              <div style="width: 60px; height: 60px; border: 1px solid #000; display: inline-block;"></div>
            </div>
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
    margin: [10, 10, 10, 10],
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
    pagebreak: {
      mode: ['css', 'legacy'],
      avoid: [
        '.items-table tbody tr',
        '.payment-section',
        '.declaration-section',
        '.amount-in-words',
        '.summary-section'
      ]
    }
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
