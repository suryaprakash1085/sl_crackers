'use client';

import { useState, useEffect } from 'react';

export default function AboutUs() {
  const [colors, setColors] = useState({
    darkBackground: '#0f1e3d',
    navyBackground: '#1a2847',
    goldAccent: '#d4a574',
  });
  const [companyName, setCompanyName] = useState('crackers');
  const [qualityImage, setQualityImage] = useState(null);
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
        setQualityImage(colorsData.aboutUsImage || null);

        const companyData = await companyResponse.json();
        setCompanyName(companyData.company_name || 'crackers');
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
      <section className="relative text-white py-12 px-6" style={{ backgroundColor: colors.navyBackground }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">About {companyName}</h1>
          <p className="mt-2" style={{ color: colors.goldAccent }}>Quality since 1974</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-6" style={{ backgroundColor: colors.navyBackground }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="rounded-lg min-h-64 overflow-hidden border border-gray-600" style={{ backgroundColor: colors.darkBackground }}>
              {qualityImage ? (
                <img
                  src={qualityImage}
                  alt="Quality since 1974"
                  className="h-full min-h-64 w-full object-cover"
                />
              ) : (
                <div className="flex min-h-64 items-center justify-center p-8 text-center text-white">
                  <p className="font-bold" style={{ color: colors.goldAccent }}>Quality Since 1974</p>
                </div>
              )}
            </div>

            {/* Right */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We are the leading supplier of crackers & fancy crackers items with over 50 years of experience in the industry.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                {companyName} has its own base and physical store at Sivakasi, TamilNadu and has been there since 7 years of experience in wholesale and retail of superior seasonal/festival fireworks crackers, supplies & gift boxes.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We have fireworks available not only during Diwali but throughout the year. So if you are looking for a fireworks/crackers shop in sivakasi anytime in the year, we are here to serve you with the best quality products at competitive prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-6" style={{ backgroundColor: colors.darkBackground }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: colors.goldAccent }}>Why Choose Us</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { title: '7+ Years Experience', description: 'Serving customers with quality products' },
              { title: 'Wholesale & Retail', description: 'Available for both bulk and individual orders' },
              { title: 'Year-Round Service', description: 'Not just for festivals, available all year' },
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6 border-l-4" style={{ borderLeftColor: colors.goldAccent }}>
                <h3 className="font-bold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
