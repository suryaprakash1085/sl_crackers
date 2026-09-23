/**
 * Generate order confirmation email HTML
 * @param {Object} data - Template data with placeholders
 * @returns {string} HTML email content
 */
export function generateOrderConfirmationEmail(data) {
  const {
    customerName,
    orderId,
    orderDate,
    totalAmount,
    orderItems,
    companyName,
    companyEmail,
    companyPhone,
  } = data;

  // Format order items list
  const itemsHTML = orderItems
    .map(
      (item) =>
        `<li>• <strong>${item.product_name || item.name}</strong> - Qty: ${item.quantity} × ₹${parseFloat(item.price || 0).toFixed(2)}</li>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }
    .success-message {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      color: #155724;
    }
    .section {
      margin: 25px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #666;
      font-weight: 500;
    }
    .detail-value {
      color: #333;
      font-weight: 600;
    }
    .items-list {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }
    .items-list li {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .items-list li:last-child {
      border-bottom: none;
    }
    .divider {
      border: 0;
      border-top: 2px solid #eee;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
    .company-name {
      font-weight: 600;
      color: #333;
    }
    .cta-button {
      display: inline-block;
      background-color: #667eea;
      color: #ffffff;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 4px;
      margin: 15px 0;
      font-weight: 600;
    }
    .icon {
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! 🎉</h1>
    </div>

    <div class="content">
      <p class="greeting">Hi ${customerName},</p>

      <p>Thanks for your purchase.</p>
      <p>Happy Diwali, engal vedi ungaludan, ungal santhosam engaludan.</p>
      <p>We're excited to inform you that your order has been successfully confirmed.</p>

      <div class="success-message">
        ✓ Your order is now in our system and will be processed shortly. We'll notify you once it's packed and ready to ship!
      </div>

      <hr class="divider">

      <div class="section">
        <div class="section-title">
          <span class="icon">🧾</span>
          <span>Order Details</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order Date:</span>
          <span class="detail-value">${orderDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value">₹${parseFloat(totalAmount).toFixed(2)}</span>
        </div>
      </div>

      <hr class="divider">

      <div class="section">
        <div class="section-title">
          <span class="icon">📦</span>
          <span>Items Ordered</span>
        </div>
        <ul class="items-list">
          ${itemsHTML}
        </ul>
      </div>

      <hr class="divider">

      <div class="section">
        <div class="section-title">
          <span class="icon">🏢</span>
          <span>Company Details</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Company Name:</span>
          <span class="detail-value">${companyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${companyEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${companyPhone}</span>
        </div>
      </div>

      <hr class="divider">

      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>🚚 Your order will be processed soon. We will notify you once it is packed.</p>
        <p>If you have any questions, feel free to contact us at <strong>${companyEmail}</strong> or <strong>${companyPhone}</strong>.</p>
      </div>

      <div style="text-align: center; margin-top: 25px;">
        <p style="font-size: 14px; color: #666;">Thank you for shopping with us! 🙏</p>
      </div>
    </div>

    <div class="footer">
      <p>Best Regards,</p>
      <p class="company-name">${companyName} Team</p>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate plain text version of order confirmation email
 * @param {Object} data - Template data
 * @returns {string} Plain text email content
 */
export function generateOrderConfirmationPlainText(data) {
  const {
    customerName,
    orderId,
    orderDate,
    totalAmount,
    orderItems,
    companyName,
    companyEmail,
    companyPhone,
  } = data;

  const itemsList = orderItems
    .map((item) => `- ${item.product_name || item.name} (Qty: ${item.quantity}) ₹${parseFloat(item.price || 0).toFixed(2)}`)
    .join('\n');

  const text = `Hi ${customerName},

Thanks for your purchase.
Happy Diwali, engal vedi ungaludan, ungal santhosam engaludan.

We're happy to inform you that your order has been successfully confirmed.

---

🧾 ORDER DETAILS

Order ID: ${orderId}
Order Date: ${orderDate}
Total Amount: ₹${parseFloat(totalAmount).toFixed(2)}

---

📦 ITEMS ORDERED

${itemsList}

---

🏢 COMPANY DETAILS

Company Name: ${companyName}
Email: ${companyEmail}
Phone: ${companyPhone}

---

🚚 Your order will be processed soon. We will notify you once it is packed.

If you have any questions, feel free to contact us.

---

Thank you for shopping with us! 🙏

Best Regards,
${companyName} Team`;

  return text;
}
