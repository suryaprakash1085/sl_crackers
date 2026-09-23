'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function PaymentsInfoPage() {
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

  const [editMode, setEditMode] = useState(false);
  const [tempPayments, setTempPayments] = useState(payments);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showAlert = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/payments-info', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch payment information');

        const data = await response.json();
        setPayments(data);
        setTempPayments(data);
      } catch (error) {
        console.error('Error fetching payment information:', error);
        showAlert('Failed to load payment information', 'error');
      }
    };

    fetchPayments();
  }, []);

  const handleInputChange = (category, field, value) => {
    setTempPayments(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPayments(prev => ({
          ...prev,
          upi: {
            ...prev.upi,
            qrCode: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/payments-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempPayments),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save payment information');
      }

      const savedPayments = await response.json();
      setPayments(savedPayments);
      setTempPayments(savedPayments);
      setEditMode(false);
      showAlert('Payment methods updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving payment information:', error);
      showAlert(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Payment Methods</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`${editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded font-semibold transition-colors`}
        >
          {editMode ? '✕ Cancel' : '✎ Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bank Account */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Bank Account</h3>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={tempPayments.bankAccount.name}
                  onChange={(e) => handleInputChange('bankAccount', 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={tempPayments.bankAccount.accountNo}
                  onChange={(e) => handleInputChange('bankAccount', 'accountNo', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={tempPayments.bankAccount.bankName}
                  onChange={(e) => handleInputChange('bankAccount', 'bankName', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={tempPayments.bankAccount.ifscCode || ''}
                  onChange={(e) => handleInputChange('bankAccount', 'ifscCode', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Name:</span> {payments.bankAccount.name}</p>
              <p><span className="font-semibold">Account No:</span> {payments.bankAccount.accountNo}</p>
              <p><span className="font-semibold">Bank:</span> {payments.bankAccount.bankName}</p>
              <p><span className="font-semibold">IFSC:</span> {payments.bankAccount.ifscCode || '—'}</p>
            </div>
          )}
        </div>

        {/* GPay */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📱 GPay</h3>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={tempPayments.gpay.name}
                  onChange={(e) => handleInputChange('gpay', 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">GPay Number</label>
                <input
                  type="text"
                  value={tempPayments.gpay.number}
                  onChange={(e) => handleInputChange('gpay', 'number', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Name:</span> {payments.gpay.name}</p>
              <p><span className="font-semibold">GPay No:</span> {payments.gpay.number}</p>
            </div>
          )}
        </div>

        {/* UPI */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💰 UPI</h3>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={tempPayments.upi.name}
                  onChange={(e) => handleInputChange('upi', 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={tempPayments.upi.id}
                  onChange={(e) => handleInputChange('upi', 'id', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">UPI QR Code Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
                {tempPayments.upi.qrCode && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Preview:</p>
                    <img src={tempPayments.upi.qrCode} alt="UPI QR Code" className="w-32 h-32 object-contain border border-gray-300 rounded" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Name:</span> {payments.upi.name}</p>
              <p><span className="font-semibold">UPI ID:</span> {payments.upi.id}</p>
              {payments.upi.qrCode && (
                <div className="mt-3">
                  <img src={payments.upi.qrCode} alt="UPI QR Code" className="w-32 h-32 object-contain border border-gray-300 rounded" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editMode && (
        <div className="mt-6">
          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

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
