'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import styles from './company-info.module.css';

export default function CompanyInfoPage() {
  const [formData, setFormData] = useState({
    company_name: '',
    phone_number: '',
    gst_number: '',
    email: '',
    address: '',
    website: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    whatsapp_url: '',
    logo: null,
    price_list_pdf: '',
    latitude: '',
    longitude: '',
    business_hours: {
      monday: { open: '9 AM', close: '6 PM' },
      tuesday: { open: '9 AM', close: '6 PM' },
      wednesday: { open: '9 AM', close: '6 PM' },
      thursday: { open: '9 AM', close: '6 PM' },
      friday: { open: '9 AM', close: '6 PM' },
      saturday: { open: '9 AM', close: '6 PM' },
      sunday: { open: '10 AM', close: '4 PM' }
    },
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    document.title = 'Sivakasi Mart Traders';
  }, []);

  useEffect(() => {
    if (logoPreview) {
      const link = document.querySelector("link[rel='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = logoPreview;
      if (!document.querySelector("link[rel='icon']")) {
        document.head.appendChild(link);
      }
    }
  }, [logoPreview]);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company-info', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const defaultBusinessHours = {
          monday: { open: '9 AM', close: '6 PM' },
          tuesday: { open: '9 AM', close: '6 PM' },
          wednesday: { open: '9 AM', close: '6 PM' },
          thursday: { open: '9 AM', close: '6 PM' },
          friday: { open: '9 AM', close: '6 PM' },
          saturday: { open: '9 AM', close: '6 PM' },
          sunday: { open: '10 AM', close: '4 PM' }
        };
        setFormData({
          company_name: data.company_name || '',
          phone_number: data.phone_number || '',
          gst_number: data.gst_number || '',
          email: data.email || '',
          address: data.address || '',
          website: data.website || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          whatsapp_url: data.whatsapp_url || '',
          logo: null,
          price_list_pdf: data.price_list_pdf || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          business_hours: data.business_hours || defaultBusinessHours,
        });
        setLogoPreview(data.logo || '');
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      showAlert('Error fetching company info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBusinessHoursChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [type]: value,
        }
      }
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setFormData(prev => ({
          ...prev,
          logo: base64,
        }));
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo: null,
    }));
    setLogoPreview('');
  };

  const handlePriceListPdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showAlert('Please select a PDF file.', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, price_list_pdf: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePriceListPdf = () => {
    setFormData(prev => ({ ...prev, price_list_pdf: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload = {
        company_name: formData.company_name,
        phone_number: formData.phone_number,
        gst_number: formData.gst_number,
        email: formData.email,
        address: formData.address,
        website: formData.website,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        youtube_url: formData.youtube_url,
        whatsapp_url: formData.whatsapp_url,
        logo: logoPreview,
        price_list_pdf: formData.price_list_pdf,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        business_hours: formData.business_hours,
      };

      const response = await fetch('/api/company-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert('✓ Company info updated successfully!', 'success');
        fetchCompanyInfo();
      } else {
        const errorData = await response.json();
        showAlert(`Failed to update: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating company info:', error);
      showAlert(`Error: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading company info...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 pb-8 border-b-2 border-gray-200">
        <div className="flex items-center gap-6">
          {logoPreview && (
            <div className="flex-shrink-0">
              <img
                src={logoPreview}
                alt={formData.company_name}
                className="h-32 w-32 object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              {formData.company_name || 'Company Name'}
            </h1>
            <p className="text-gray-600 mt-2">Company Information & Settings</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Edit Information</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              placeholder="e.g., Sivakasi Mart Traders"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
            <p className="text-sm text-gray-600 mt-1">This name will appear in the navbar</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-2"><PhoneIcon fontSize="small" color="primary" /> Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="e.g., +91 98765 43210"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">GST Number</label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleInputChange}
              placeholder="e.g., 27AABFG1234H1Z0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g., info@pkcrackers.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="e.g., 4/1434-27, Sattur Main Road, Thayilpatti, Sivakasi - 626189"
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="e.g., www.pkcrackers.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 font-medium mb-4">Social Media</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2"><FacebookIcon fontSize="small" sx={{ color: '#1877f2' }} /> Facebook URL</label>
                <input
                  type="url"
                  name="facebook_url"
                  value={formData.facebook_url}
                  onChange={handleInputChange}
                  placeholder="https://www.facebook.com/your-page"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2"><InstagramIcon fontSize="small" sx={{ color: '#e4405f' }} /> Instagram URL</label>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleInputChange}
                  placeholder="https://www.instagram.com/your-account"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2"><YouTubeIcon fontSize="small" sx={{ color: '#ff0000' }} /> YouTube URL</label>
                <input
                  type="url"
                  name="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/@your-channel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2"><WhatsAppIcon fontSize="small" sx={{ color: '#25d366' }} /> WhatsApp URL or Phone Number</label>
                <input
                  type="text"
                  name="whatsapp_url"
                  value={formData.whatsapp_url}
                  onChange={handleInputChange}
                  placeholder="https://wa.me/919876543210 or +91 98765 43210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Latitude</label>
              <input
                type="number"
                step="0.00000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="e.g., 9.19000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <p className="text-sm text-gray-600 mt-1">For Google Maps location pin</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Longitude</label>
              <input
                type="number"
                step="0.00000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 77.30000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <p className="text-sm text-gray-600 mt-1">For Google Maps location pin</p>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <label className="block text-gray-700 font-medium mb-4">Business Hours</label>
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(formData.business_hours).map(([day, times], index) => (
                <div key={day} className={styles.businessHourItem} style={{ animationDelay: `${index * 0.1}s` }}>
                  <label className="block text-gray-700 font-medium mb-2 capitalize">{day}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={times.open}
                      onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                      placeholder="e.g., 9 AM"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                    <span className="text-gray-500 flex-shrink-0">-</span>
                    <input
                      type="text"
                      value={times.close}
                      onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                      placeholder="e.g., 6 PM"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Logo */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Company Logo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {logoPreview ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-48 max-w-48 object-contain"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer">
                      Change Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="text-6xl mb-2">🖼️</div>
                  <p className="text-gray-600 mb-2">Click to upload logo</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Price List PDF */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Price List PDF</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {formData.price_list_pdf ? (
                <div className="space-y-4">
                  <p className="text-gray-700">Price list PDF uploaded</p>
                  <div className="flex gap-2 justify-center">
                    <a
                      href={formData.price_list_pdf}
                      download="price-list.pdf"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Download PDF
                    </a>
                    <label className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition cursor-pointer">
                      Change PDF
                      <input type="file" accept="application/pdf,.pdf" onChange={handlePriceListPdfChange} className="hidden" />
                    </label>
                    <button type="button" onClick={handleRemovePriceListPdf} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                      Remove PDF
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <p className="text-gray-600 mb-2">Click to upload price list PDF</p>
                  <p className="text-sm text-gray-500">PDF files only</p>
                  <input type="file" accept="application/pdf,.pdf" onChange={handlePriceListPdfChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold"
            >
              {submitting ? 'Saving...' : 'Save Company Info'}
            </button>
          </div>
        </form>
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
