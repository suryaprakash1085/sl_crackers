// Helpers for notifying a customer on WhatsApp when an order status changes.
//
// Flow (used by every admin screen that can change an order status):
//   1. On the Save click, call openWhatsAppPopup() *synchronously* (before any
//      await). Browsers only allow popups opened directly from a click, so
//      opening it after the save request finishes would get blocked.
//   2. When the save succeeds, call sendOrderWhatsApp(popup, {...}) to load the
//      prefilled wa.me link in that popup.
//   3. When the save fails, call closeWhatsAppPopup(popup).

// Edit the wording here. Placeholders: name, orderId, company.
export const WHATSAPP_STATUS_TEMPLATES = {
  'not packing': ({ name, orderId, company }) =>
    `Hi ${name}, thank you for your order #${orderId}${company ? ` with ${company}` : ''}! We have received it and will start packing it soon.`,
  packed: ({ name, orderId }) =>
    `Hi ${name}, your order #${orderId} has been packed and is ready to be shipped.`,
  'on the way': ({ name, orderId }) =>
    `Hi ${name}, your order #${orderId} has been shipped and is on the way to you. 🚚`,
  delivered: ({ name, orderId, company }) =>
    `Hi ${name}, your order #${orderId} has been delivered. Thank you for shopping${company ? ` with ${company}` : ''}! 🎆`,
};

// Accepts "9876543210", "+91 98765 43210", "09876543210" ... and returns the
// number in the international format wa.me expects (digits only, with 91).
export function normalizeWhatsAppPhone(phone, defaultCountryCode = '91') {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  digits = digits.replace(/^0+/, '');
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  if (digits.length === 12 && digits.startsWith(defaultCountryCode)) return digits;
  return digits.length >= 11 ? digits : null;
}

export function buildOrderWhatsAppUrl({ phone, name, orderId, status, companyName }) {
  const number = normalizeWhatsAppPhone(phone);
  if (!number) return null;

  const template = WHATSAPP_STATUS_TEMPLATES[status];
  const message = template
    ? template({ name: name || 'Customer', orderId, company: companyName || '' })
    : `Hi ${name || 'Customer'}, your order #${orderId} status is now: ${status}.`;

  // wa.me expects the "text" query parameter (not "message").
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Must be called synchronously inside the click handler.
export function openWhatsAppPopup() {
  if (typeof window === 'undefined') return null;
  const popup = window.open('', 'wa_order_notify', 'width=900,height=700,resizable=yes,scrollbars=yes');
  if (popup) {
    try {
      popup.opener = null;
      popup.document.title = 'Opening WhatsApp...';
      popup.document.body.innerHTML =
        '<p style="font-family:sans-serif;padding:24px;color:#374151">Opening WhatsApp...</p>';
    } catch {
      // Ignore - the popup will still be navigated below.
    }
  }
  return popup;
}

export function closeWhatsAppPopup(popup) {
  try {
    if (popup && !popup.closed) popup.close();
  } catch {
    // Ignore
  }
}

export function sendOrderWhatsApp(popup, details) {
  const url = buildOrderWhatsAppUrl(details);

  if (!url) {
    closeWhatsAppPopup(popup);
    alert('Status saved, but the customer phone number is not valid for WhatsApp.');
    return;
  }

  if (popup && !popup.closed) {
    popup.location.href = url;
    return;
  }

  // The pre-opened popup was blocked or closed; try once more.
  const fallback = window.open(url, '_blank');
  if (!fallback) {
    alert('Status saved. Your browser blocked the WhatsApp popup - please allow popups for this site.');
  }
}