'use client';

import { useState, useEffect } from 'react';

export default function LocationMap() {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company-info', {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data);
      } else {
        setError('Failed to load location information');
      }
    } catch (err) {
      console.error('Error fetching company info:', err);
      setError('Failed to load location information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (error || !companyInfo) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">{error || 'Map not available'}</p>
      </div>
    );
  }

  // If coordinates are not available, show a message
  if (!companyInfo.latitude || !companyInfo.longitude) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Location coordinates not configured</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg">
      <iframe
        title="Company Location Map"
        width="100%"
        height="400"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=${companyInfo.latitude},${companyInfo.longitude}&z=15&output=embed`}
      />
    </div>
  );
}
