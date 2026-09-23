import { getConnection } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/emailService';
import { generateOrderConfirmationEmail, generateOrderConfirmationPlainText } from '@/lib/emailTemplate';

const SELLER_EMAIL = 'paradisecrackerssales@gmail.com';
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export async function POST(request) {
  let connection;
  try {
    const { orderId, email, pdfBase64, filename } = await request.json();

    if (!orderId || !email || !pdfBase64) {
      return Response.json({ error: 'Order ID, customer email, and invoice PDF are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'A valid customer email is required' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    if (pdfBuffer.length === 0 || pdfBuffer.length > MAX_ATTACHMENT_BYTES) {
      return Response.json({ error: 'Invoice PDF is invalid or too large' }, { status: 400 });
    }

    connection = await getConnection();
    const [[order]] = await connection.execute(
      'SELECT id, customer_name, email, total_amount, created_at FROM orders WHERE id = ?',
      [orderId],
    );

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.email.toLowerCase() !== email.toLowerCase()) {
      return Response.json({ error: 'Customer email does not match the order' }, { status: 403 });
    }

    const [orderItems] = await connection.execute(
      'SELECT product_name, quantity, price FROM order_items WHERE order_id = ?',
      [orderId],
    );
    const [companyInfoRows] = await connection.execute('SELECT * FROM company_info LIMIT 1');
    const companyInfo = companyInfoRows[0] || {
      company_name: 'Sivakasi Mart Traders',
      email: SELLER_EMAIL,
      phone_number: '+91-XXXXXXXXXX',
    };

    const emailData = {
      customerName: order.customer_name,
      orderId: order.id,
      orderDate: new Date(order.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalAmount: order.total_amount,
      orderItems,
      companyName: companyInfo.company_name,
      companyEmail: SELLER_EMAIL,
      companyPhone: companyInfo.phone_number,
    };

    const emailResult = await sendOrderConfirmationEmail({
      to: email,
      sellerEmail: SELLER_EMAIL,
      customerName: order.customer_name,
      htmlTemplate: generateOrderConfirmationEmail(emailData),
      plainTextTemplate: generateOrderConfirmationPlainText(emailData),
      attachment: {
        filename: filename || `Invoice-${order.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    });

    if (!emailResult.success) {
      return Response.json({ error: emailResult.error || emailResult.message || 'Email could not be sent' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return Response.json({ error: 'Failed to send order confirmation email' }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
