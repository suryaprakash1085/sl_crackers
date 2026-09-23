import nodemailer from 'nodemailer';

import { emailConfig } from './db';

let transporter = null;

/**
 * Initialize email transporter with SMTP configuration
 * @returns {Object} Nodemailer transporter instance
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  const smtpConfig = {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.user && emailConfig.password ? {
      user: emailConfig.user,
      pass: emailConfig.password,
    } : undefined,
  };

  // Remove undefined auth if credentials aren't provided
  if (!smtpConfig.auth) {
    delete smtpConfig.auth;
  }

  transporter = nodemailer.createTransport(smtpConfig);

  return transporter;
}

/**
 * Send order confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.customerName - Customer name for greeting
 * @param {number} options.orderId - Order ID
 * @param {string} options.orderDate - Order date
 * @param {number} options.totalAmount - Total order amount
 * @param {Array} options.orderItems - Array of order items
 * @param {string} options.companyName - Company name
 * @param {string} options.companyEmail - Company email
 * @param {string} options.companyPhone - Company phone
 * @param {string} options.htmlTemplate - HTML email template
 * @param {string} options.plainTextTemplate - Plain text email template
 * @returns {Promise<Object>} Result from nodemailer
 */
export async function sendOrderConfirmationEmail(options) {
  try {
    const mailer = initializeTransporter();

    if (!emailConfig.user || !emailConfig.password) {
      console.warn('SMTP credentials not set. Email sending disabled.');
      return { success: false, message: 'SMTP credentials not configured' };
    }

    const {
      to,
      sellerEmail,
      customerName,
      htmlTemplate,
      plainTextTemplate,
      attachment,
    } = options;

    const result = await mailer.sendMail({
      from: emailConfig.from,
      to,
      bcc: sellerEmail,
      subject: `Order Confirmation - ${customerName}`,
      html: htmlTemplate,
      text: plainTextTemplate,
      attachments: attachment ? [attachment] : undefined,
      replyTo: emailConfig.from,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function verifyEmailConfig() {
  try {
    if (!emailConfig.user || !emailConfig.password) {
      return false;
    }

    const mailer = initializeTransporter();
    await mailer.verify();
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}
