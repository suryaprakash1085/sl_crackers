'use client';

import { useState, useEffect } from 'react';
import LocationMap from '@/app/components/LocationMap';

export default function ContactUs() {
  const [colors, setColors] = useState({
    darkBackground: '#0f1e3d',
    navyBackground: '#1a2847',
    goldAccent: '#d4a574',
  });
  const [companyInfo, setCompanyInfo] = useState({
    company_name: 'Our Company',
    phone_number: '+91 XXXX XXX XXX',
    email: 'info@company.com',
    address: 'Address not available',
    business_hours: {
      monday: { open: '9 AM', close: '6 PM' },
      tuesday: { open: '9 AM', close: '6 PM' },
      wednesday: { open: '9 AM', close: '6 PM' },
      thursday: { open: '9 AM', close: '6 PM' },
      friday: { open: '9 AM', close: '6 PM' },
      saturday: { open: '9 AM', close: '6 PM' },
      sunday: { open: '10 AM', close: '4 PM' }
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colorsResponse, companyResponse] = await Promise.all([
          fetch('/api/settings', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          }),
          fetch('/api/company-info', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          }),
        ]);

        const colorsData = await colorsResponse.json();
        setColors({
          darkBackground: colorsData.darkBackground || '#0f1e3d',
          navyBackground: colorsData.navyBackground || '#1a2847',
          goldAccent: colorsData.goldAccent || '#d4a574',
        });

        const companyData = await companyResponse.json();
        const defaultBusinessHours = {
          monday: { open: '9 AM', close: '6 PM' },
          tuesday: { open: '9 AM', close: '6 PM' },
          wednesday: { open: '9 AM', close: '6 PM' },
          thursday: { open: '9 AM', close: '6 PM' },
          friday: { open: '9 AM', close: '6 PM' },
          saturday: { open: '9 AM', close: '6 PM' },
          sunday: { open: '10 AM', close: '4 PM' }
        };
        setCompanyInfo({
          company_name: companyData.company_name || 'Our Company',
          phone_number: companyData.phone_number || '+91 XXXX XXX XXX',
          email: companyData.email || 'info@company.com',
          address: companyData.address || 'Address not available',
          business_hours: companyData.business_hours || defaultBusinessHours,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
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
      <section className="relative text-white py-8 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: colors.navyBackground }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Contact Us</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: colors.goldAccent }}>Get in touch with our team</p>
              <p className="mt-2 text-sm sm:text-base" style={{ color: colors.goldAccent }}>9894663705, 8122523705</p>
        </div>
      </section>

       {/* Map Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: colors.darkBackground }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Find Us On Map</h2>
          <LocationMap />
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: colors.darkBackground }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Send us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2 text-sm sm:text-base">Name</label>
                  <input type="text" className="w-full px-3 sm:px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:border-yellow-500 text-sm sm:text-base" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2 text-sm sm:text-base">Email</label>
                  <input type="email" className="w-full px-3 sm:px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:border-yellow-500 text-sm sm:text-base" placeholder="Your email" />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-2 text-sm sm:text-base">Message</label>
                  <textarea rows="5" className="w-full px-3 sm:px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:border-yellow-500 text-sm sm:text-base" placeholder="Your message"></textarea>
                </div>
                <button type="submit" className="font-bold px-4 sm:px-6 py-2 rounded text-sm sm:text-base hover:bg-opacity-90 transition-colors" style={{ backgroundColor: colors.goldAccent, color: colors.darkBackground }}>
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Address</h3>
                  <p className="text-gray-300 text-sm sm:text-base">{companyInfo.address}</p>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Phone</h3>
                  <p className="text-gray-300 text-sm sm:text-base">{companyInfo.phone_number}</p>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Email</h3>
                  <p className="text-gray-300 text-sm sm:text-base">{companyInfo.email}</p>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Business Hours</h3>
                  <div className="text-gray-300 text-sm sm:text-base space-y-1">
                    {companyInfo.business_hours && Object.entries(companyInfo.business_hours).map(([day, times]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize font-medium">{day}:</span>
                        <span>{times.open} - {times.close}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
