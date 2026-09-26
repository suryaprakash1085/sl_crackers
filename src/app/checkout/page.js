'use client';

import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { generateInvoicePDF } from '../../lib/generateInvoice';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function ImageField({ image, name }) {
  const [showAsImage, setShowAsImage] = useState(true);

  const handleImageError = () => {
    setShowAsImage(false);
  };

  const isLikelyImagePath = (str) => {
    // Check if string looks like a path or URL
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(str) || str.startsWith('http') || str.startsWith('/') || str.startsWith('data:');
  };

  return (
    <div className="w-24 h-24 flex-shrink-0 bg-gray-700 rounded-lg flex items-center justify-center text-4xl overflow-hidden">
      {showAsImage && isLikelyImagePath(image) ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <span>{image}</span>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart, isHydrated: cartIsHydrated } = useCart();
  const router = useRouter();
  const customerDetailsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [colors, setColors] = useState({
    darkBackground: '#0f1e3d',
    navyBackground: '#1a2847',
    goldAccent: '#d4a574',
  });
  const [colorsLoading, setColorsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    state: '',
  });

  const [companyInfo, setCompanyInfo] = useState({
    company_name: 'Sivakasi Mart Traders',
    address: '',
    email: '',
    phone_number: '',
    gst_number: '',
  });

  const [payments, setPayments] = useState({
    bankAccount: {
      name: 'Paradise TRADERS',
      accountNo: '45169853237',
      bankName: 'SBI',
      ifscCode: 'SBIN0000975'
    },
    gpay: {
      name: 'Saravanakumar',
      number: '6374254854'
    },
    upi: {
      name: 'Saravanakumar',
      id: 'cnjncdjdk',
      qrCode: null
    }
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const fetchColors = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        const data = await response.json();
        setColors({
          darkBackground: data.darkBackground || '#0f1e3d',
          navyBackground: data.navyBackground || '#1a2847',
          goldAccent: data.goldAccent || '#d4a574',
        });
      } catch (error) {
        console.error('Error fetching colors:', error);
      } finally {
        setColorsLoading(false);
      }
    };

    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company-info', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch company information');
        const data = await response.json();
        setCompanyInfo(prev => ({ ...prev, ...data }));
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/payments-info', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch payment information');
        const data = await response.json();
        setPayments(prev => ({
          ...prev,
          ...data,
          bankAccount: { ...prev.bankAccount, ...data.bankAccount },
          gpay: { ...prev.gpay, ...data.gpay },
          upi: { ...prev.upi, ...data.upi },
        }));
      } catch (error) {
        console.error('Error fetching payment info:', error);
      }
    };

    // Load customer details from localStorage
    const savedFormData = localStorage.getItem('checkoutFormData');
    console.log('Checkout page mounted. Loading form data from localStorage:', savedFormData);
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        console.log('Restored form data:', parsed);
        setFormData(parsed);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }

    fetchColors();
    fetchCompanyInfo();
    fetchPayments();
    setIsHydrated(true);
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return; // Don't save until we've loaded
    console.log('Form data changed. Saving to localStorage:', formData);
    localStorage.setItem('checkoutFormData', JSON.stringify(formData));
  }, [formData, isHydrated]);

  // Refresh Order Review data when entering checkout page or when cart changes
  useEffect(() => {
    if (!isHydrated) return;

    console.log('Order Review data refreshed. Current cart:', cart);
    console.log('Updated cart total:', getCartTotal());
  }, [cart, isHydrated]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showAlert = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const scrollToCustomerDetails = () => {
    customerDetailsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // Allow only letters and spaces
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: lettersOnly
      }));
    } else if (name === 'phone') {
      // Allow only numbers and limit to 10 digits
      const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleConfirmOrder = async () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.address || !formData.state) {
      scrollToCustomerDetails();
      showAlert('Please fill in all customer details', 'warning');
      return;
    }

    if (formData.name.trim().length === 0) {
      scrollToCustomerDetails();
      showAlert('Please enter a valid name (letters only)', 'warning');
      return;
    }

    if (formData.phone.length !== 10) {
      scrollToCustomerDetails();
      showAlert('Phone number must be exactly 10 digits', 'warning');
      return;
    }

    // Validate minimum order amount
    const minimumOrder = formData.state === 'Tamil Nadu' ? 3000 : 5000;
    if (cartTotal < minimumOrder) {
      scrollToCustomerDetails();
      showAlert(`Minimum order amount is ₹${minimumOrder} for ${formData.state}. Current total: ₹${cartTotal.toFixed(2)}`, 'warning');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        items: cart,
        itemCount: cart.length,
        totalAmount: getCartTotal(),
        payments,
        companyInfo,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('✓ Order confirmed! Thank you for your order.', 'success');

        try {
          const invoiceNumber = data.invoiceNumber || `invno ${String(data.orderId || '00000001').padStart(8, '0')}`;
          const pdfBlob = await generateInvoicePDF(orderData, invoiceNumber, data.orderId, { download: true });
          const emailResponse = await fetch('/api/orders/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              email: formData.email,
              filename: `Invoice-${invoiceNumber}.pdf`,
              pdfBase64: await blobToBase64(pdfBlob),
            }),
          });

          if (!emailResponse.ok) {
            const emailData = await emailResponse.json();
            throw new Error(emailData.error || 'Invoice email could not be sent');
          }
        } catch (confirmationError) {
          console.error('Error generating or sending confirmation:', confirmationError);
          showAlert('Order confirmed, but the invoice email could not be sent. Please contact us.', 'warning');
        }

        clearCart();
        localStorage.removeItem('checkoutFormData'); // Clear saved form data after successful order
        // Redirect or show success message
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        showAlert(`Failed to confirm order: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      showAlert(`Error confirming order: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!cartIsHydrated || colorsLoading) {
    return (
      <div style={{ backgroundColor: '#0f1e3d' }} className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading checkout...</div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ backgroundColor: colors.darkBackground }} className="min-h-screen flex items-center justify-center">
        <div style={{ backgroundColor: colors.navyBackground }} className="p-8 rounded-lg shadow-lg text-center border border-gray-600">
          <h1 className="text-2xl font-bold mb-4 text-white">Your cart is empty</h1>
          <button
            onClick={() => router.push('/price-list')}
            className="py-2 px-6 rounded"
            style={{ backgroundColor: colors.goldAccent, color: colors.darkBackground }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const cartTotal = getCartTotal();
  const shippingFee = 100; // Fixed shipping fee
  const packingFee = cartTotal > 5000 ? 0 : 50;
  const totalAmount = cartTotal + shippingFee + packingFee;

  return (
    <div style={{ backgroundColor: colors.darkBackground }} className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-gray-300">Review your order and complete checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Review Section */}
            <div style={{ backgroundColor: colors.navyBackground }} className="rounded-lg shadow-lg overflow-hidden border border-gray-600">
              <div className="bg-green-700 text-white px-6 py-4">
                <h2 className="text-xl font-bold">Order Review</h2>
              </div>

              <div className="p-6">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4 pb-6 border-b border-gray-600 last:border-b-0 last:pb-0">
                    {/* Product Image */}
                    {item.image && (
                      <ImageField image={item.image} name={item.name} />
                    )}

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{item.name}</h3>
                      {item.productNumber && (
                        <p className="text-sm text-gray-400 mb-2">Product ID: {item.productNumber}</p>
                      )}
                      <p className="text-gray-300 mb-2">
                        Quantity: <span className="font-semibold">{item.quantity}</span>
                      </p>
                      <p className="text-gray-300">
                        Price:{' '}
                        <span className="font-semibold">
                          ₹{
                            typeof item.price === 'number'
                              ? (item.price ).toFixed(2)
                              : item.price
                              ? (parseFloat(item.price.replace('₹', '')) ).toFixed(2)
                              : '0.00'
                          }
                        </span>
                      </p>
                       <p className="text-gray-300">
                        Discount Price:{' '}
                        <span className="font-semibold">
                          ₹{
                            (() => {
                              const discountPrice = typeof item.discountPrice === 'number'
                                ? item.discountPrice
                                : parseFloat(String(item.discountPrice || '').replace('₹', ''));
                              const regularPrice = typeof item.price === 'number'
                                ? item.price
                                : parseFloat(String(item.price || '').replace('₹', ''));
                              const price = Number.isFinite(discountPrice)
                                ? discountPrice
                                : Number.isFinite(regularPrice) ? regularPrice : 0;
                              return (price ).toFixed(2);
                            })()
                          }
                        </span>
                      </p>
                     
                    </div>
                    <div>
                       <p className="text-gray-300">
                        Total:{' '}
                        <span className="font-semibold">
                          ₹{
                            (() => {
                              const discountPrice = typeof item.discountPrice === 'number'
                                ? item.discountPrice
                                : parseFloat(String(item.discountPrice || '').replace('₹', ''));
                              const regularPrice = typeof item.price === 'number'
                                ? item.price
                                : parseFloat(String(item.price || '').replace('₹', ''));
                              const price = Number.isFinite(discountPrice)
                                ? discountPrice
                                : Number.isFinite(regularPrice) ? regularPrice : 0;
                              return (price * item.quantity).toFixed(2);
                            })()
                          }
                        </span>
                      </p>
                      </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Order Total:</span>
                    <span style={{ color: colors.goldAccent }}>₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details Section */}
            <div
              ref={customerDetailsRef}
              style={{ backgroundColor: colors.navyBackground }}
              className="rounded-lg shadow-lg overflow-hidden border border-gray-600"
            >
              <div className="bg-green-700 text-white px-6 py-4">
                <h2 className="text-xl font-bold">Customer Details</h2>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Letters only</p>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.phone.length}/10 digits</p>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">State/Region</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">Select your state</option>
                    <option value="Tamil Nadu">Tamil Nadu (Min: ₹3000)</option>
                    <option value="Other">Other States (Min: ₹5000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-semibold mb-2">Delivery Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter delivery address"
                    rows="3"
                    className="w-full border border-gray-600 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Order Summary & Payment Info */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div style={{ backgroundColor: colors.navyBackground }} className="rounded-lg shadow-lg overflow-hidden border border-gray-600">
              <div className="bg-blue-900 text-white px-6 py-4">
                <h2 className="text-lg font-bold">Payment Methods</h2>
              </div>

              <div className="p-6 space-y-3">
                <div className="pb-4 border-b border-gray-600">
                  <h3 className="font-bold text-white mb-2">Bank Account</h3>
                  <p className="text-sm text-gray-300">A/C Name: {payments.bankAccount.name}</p>
                  <p className="text-sm text-gray-300">A/C No: {payments.bankAccount.accountNo}</p>
                  <p className="text-sm text-gray-300">Bank: {payments.bankAccount.bankName}</p>
                  {payments.bankAccount.ifscCode && (
                    <p className="text-sm text-gray-300">IFSC: {payments.bankAccount.ifscCode}</p>
                  )}
                </div>

                <div className="pb-4 border-b border-gray-600">
                  <h3 className="font-bold text-white mb-2">GPay</h3>
                  <p className="text-sm text-gray-300">Name: {payments.gpay.name}</p>
                  <p className="text-sm text-gray-300">GPay No: {payments.gpay.number}</p>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-2">UPI</h3>
                  <p className="text-sm text-gray-300">Name: {payments.upi.name}</p>
                  <p className="text-sm text-gray-300">UPI ID: {payments.upi.id}</p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-900 border-l-4 p-4 rounded" style={{ borderLeftColor: colors.goldAccent }}>
              <h3 className="font-bold mb-2" style={{ color: colors.goldAccent }}>Important Notes</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Minimum Order: ₹3000 (TamilNadu), ₹5000 (Other States)</li>
                {/* <li>• 50% Discount on bulk orders</li> */}
                <li>• Payment required before delivery</li>
              </ul>
            </div>

            {/* Confirm Order Button */}
            <button
              onClick={handleConfirmOrder}
              disabled={loading}
              className="w-full py-3 rounded font-bold transition disabled:bg-gray-600"
              style={{ backgroundColor: colors.goldAccent, color: colors.darkBackground }}
            >
              {loading ? 'Confirming...' : 'Confirm Order'}
            </button>

            {/* Continue Shopping Button */}
            <button
              onClick={() => router.push('/price-list')}
              className="w-full border-2 py-3 rounded font-bold text-white hover:bg-gray-800 transition"
              style={{ borderColor: colors.goldAccent }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
