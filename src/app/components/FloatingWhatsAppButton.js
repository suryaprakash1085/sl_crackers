'use client';

import { useState, useEffect } from 'react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { getPublicJson } from '@/lib/publicJson';

export default function FloatingWhatsAppButton() {
  const [phoneNumber, setPhoneNumber] = useState(null);

  useEffect(() => {
    if (window.location.hash.startsWith('#/admin')) return;
    fetchPhoneNumber();
  }, []);

  const fetchPhoneNumber = async () => {
    try {
      const data = await getPublicJson('/api/company-info?fields=phone_number');
      if (data.phone_number) {
          // Remove any non-digit characters and ensure it starts with country code
          const cleanPhone = data.phone_number.replace(/\D/g, '');
          setPhoneNumber(cleanPhone);
      }
    } catch (error) {
      console.error('Error fetching phone number:', error);
    }
  };

  const handleWhatsAppClick = () => {
    if (phoneNumber) {
      // WhatsApp link format: https://wa.me/[country-code][phone-number]
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className="whatsapp-button"
      title="Chat with us on WhatsApp"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon className="whatsapp-icon" />
    </button>
  );
}
