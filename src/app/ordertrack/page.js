'use client';

import { useState, useEffect } from 'react';
import styles from './ordertrack.module.css';

const STATUS_STAGES = [
  { status: 'not packing', label: 'Not Packing', icon: '📦', description: 'Order received, awaiting processing' },
  { status: 'packed', label: 'Packed', icon: '✓', description: 'Your order has been packed' },
  { status: 'on the way', label: 'On The Way', icon: '🚚', description: 'Your order is in transit' },
  { status: 'delivered', label: 'Delivered', icon: '✓✓', description: 'Your order has been delivered' }
];

export default function OrderTrackPage() {
  const [searchInput, setSearchInput] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [colors, setColors] = useState({
    darkBackground: '#0f1e3d',
    navyBackground: '#1a2847',
    goldAccent: '#d4a574',
  });
  const [colorsLoading, setColorsLoading] = useState(true);

  useEffect(() => {
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

    fetchColors();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchInput.trim()) {
      setError('Please enter an Order ID or Mobile Number');
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);
    setSearched(true);

    try {
      const response = await fetch(`/api/orders/track?query=${encodeURIComponent(searchInput)}`);
      const data = await response.json();

      if (response.ok && data.order) {
        setOrderData(data);
      } else {
        setError(data.error || 'Order not found. Please check your Order ID or Mobile Number.');
        setOrderData(null);
      }
    } catch (err) {
      setError('Failed to fetch order details. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (currentStatus) => {
    return STATUS_STAGES.findIndex(s => s.status === currentStatus);
  };

  const currentStatusIndex = orderData ? getStatusIndex(orderData.order.status) : -1;

  if (colorsLoading) {
    return (
      <div style={{ backgroundColor: '#0f1e3d' }} className="min-h-screen flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.trackingPageContainer} style={{ backgroundColor: colors.darkBackground }}>
      <div className={styles.trackingContent}>
        <div className={styles.headerSection}>
          <h1 className={styles.mainTitle}>Track Your Order</h1>
          <p className={styles.subtitle}>Enter your Order ID or Mobile Number to track your order</p>
        </div>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter Order ID (e.g., #123) or Mobile Number (e.g., 9876543210)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={styles.searchInput}
            />
            <button 
              type="submit" 
              className={styles.searchButton}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>
        </form>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {searched && !orderData && !error && !loading && (
          <div className={styles.noResults}>
            <p>No order found. Please verify your Order ID or Mobile Number and try again.</p>
          </div>
        )}

        {orderData && (
          <div className={styles.orderDetailsSection}>
            <div className={styles.orderInfo}>
              <div className={styles.infoBlock}>
                <h3>Order Information</h3>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Order ID:</span>
                  <span className={styles.value}>#{orderData.order.id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Invoice Number:</span>
                  <span className={styles.value}>{orderData.order.invoice_number}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Total Amount:</span>
                  <span className={styles.value}>₹{parseFloat(orderData.order.total_amount).toFixed(2)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Order Date:</span>
                  <span className={styles.value}>
                    {new Date(orderData.order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className={styles.infoBlock}>
                <h3>Delivery Address</h3>
                <div className={styles.addressInfo}>
                  <p className={styles.customerName}>{orderData.order.customer_name}</p>
                  <p className={styles.phone}>{orderData.order.phone}</p>
                  <p className={styles.address}>{orderData.order.address}</p>
                </div>
              </div>
            </div>

            <div className={styles.trackingTimeline}>
              <h3>Tracking Status</h3>
              <div className={styles.timelineContainer}>
                {STATUS_STAGES.map((stage, index) => (
                  <div key={stage.status} className={styles.timelineItem}>
                    <div className={styles.timelineMarker}>
                      <div className={`${styles.circle} ${index <= currentStatusIndex || index === 0 ? styles.completed : ''}`}>
                        <span className={styles.icon}>{stage.icon}</span>
                      </div>
                      {index < STATUS_STAGES.length - 1 && (
                        <div className={`${styles.connector} ${index < currentStatusIndex ? styles.completed : ''}`}></div>
                      )}
                    </div>
                    <div className={styles.stageInfo}>
                      <h4 className={`${styles.stageName} ${index === currentStatusIndex ? styles.active : ''}`}>
                        {stage.label}
                      </h4>
                      <p className={styles.stageDescription}>{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.itemsSection}>
              <h3>Order Items</h3>
              <div className={styles.itemsList}>
                {orderData.items && orderData.items.length > 0 ? (
                  orderData.items.map((item) => (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName}>{item.product_name}</h4>
                        <p className={styles.itemQuantity}>Quantity: {item.quantity}</p>
                      </div>
                      <div className={styles.itemPrice}>
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No items in this order</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
