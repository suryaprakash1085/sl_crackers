'use client';

import { useState, useEffect } from 'react';

export default function PaymentsInfo() {
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
  const [colors, setColors] = useState({
    darkBackground: '#0f1e3d',
    navyBackground: '#1a2847',
    goldAccent: '#d4a574',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsResponse, paymentsResponse] = await Promise.all([
          fetch('/api/settings', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          }),
          fetch('/api/payments-info', { cache: 'no-store' }),
        ]);

        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          setColors({
            darkBackground: data.darkBackground || '#0f1e3d',
            navyBackground: data.navyBackground || '#1a2847',
            goldAccent: data.goldAccent || '#d4a574',
          });
        }

        if (paymentsResponse.ok) {
          const data = await paymentsResponse.json();
          setPayments(prev => ({
            ...prev,
            ...data,
            bankAccount: { ...prev.bankAccount, ...data.bankAccount },
            gpay: { ...prev.gpay, ...data.gpay },
            upi: { ...prev.upi, ...data.upi },
          }));
        }
      } catch (error) {
        console.error('Error fetching payment page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0f1e3d' }} className="min-h-screen flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.darkBackground }}>
      {/* Hero Section */}
      <section className="relative text-white py-12 px-6" style={{ backgroundColor: colors.navyBackground }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">Payments Information</h1>
          <p className="mt-2" style={{ color: colors.goldAccent }}>Payment details for your orders</p>
        </div>
      </section>

      {/* Payment Details Section */}
      <section className="py-12 px-6" style={{ backgroundColor: colors.darkBackground }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Bank Account */}
            <div className="rounded-lg shadow border border-gray-600 p-6" style={{ backgroundColor: colors.navyBackground }}>
              <h3 className="text-lg font-bold text-white mb-4">💳 Bank Account</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>Name:</span> {payments.bankAccount.name}</p>
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>Account No:</span> {payments.bankAccount.accountNo}</p>
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>Bank:</span> {payments.bankAccount.bankName}</p>
                {payments.bankAccount.ifscCode && (
                  <p><span className="font-semibold" style={{ color: colors.goldAccent }}>IFSC:</span> {payments.bankAccount.ifscCode}</p>
                )}
              </div>
            </div>

            {/* GPay */}
            <div className="rounded-lg shadow border border-gray-600 p-6" style={{ backgroundColor: colors.navyBackground }}>
              <h3 className="text-lg font-bold text-white mb-4">📱 GPay</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>Name:</span> {payments.gpay.name}</p>
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>GPay No:</span> {payments.gpay.number}</p>
              </div>
            </div>

            {/* UPI Text Only */}
            <div className="rounded-lg shadow border border-gray-600 p-6" style={{ backgroundColor: colors.navyBackground }}>
              <h3 className="text-lg font-bold text-white mb-4">💰 UPI</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>Name:</span> {payments.upi.name}</p>
                <p><span className="font-semibold" style={{ color: colors.goldAccent }}>UPI ID:</span> {payments.upi.id}</p>
              </div>
            </div>
          </div>

          {/* UPI QR Code Section */}
          <div className="rounded-lg shadow border border-gray-600 p-10 flex flex-col items-center" style={{ backgroundColor: colors.navyBackground }}>
            <h2 className="text-2xl font-bold text-white mb-6">Scan UPI QR Code</h2>
            {payments.upi.qrCode ? (
              <>
                <img src={payments.upi.qrCode} alt="UPI QR Code" className="w-64 h-64 object-contain border-2 rounded p-4" style={{ borderColor: colors.goldAccent }} />
                <p className="text-center text-gray-300 mt-4 font-semibold">{payments.upi.id}</p>
              </>
            ) : (
              <div className="w-64 h-64 bg-gray-700 border-2 rounded flex items-center justify-center" style={{ borderColor: colors.goldAccent }}>
                <p className="text-gray-400 text-center">QR Code will be displayed here</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
