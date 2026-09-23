'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getPublicJson } from '@/lib/publicJson';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

// Helper function to adjust brightness of a hex color
function adjustBrightness(hexColor, percent) {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

export default function Header() {
  const { getCartItemCount, setShowCart } = useCart();
  const cartItemsCount = getCartItemCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    company_name: 'Sivakasi Mart Traders',
    logo: null,
    price_list_pdf: null,
    phone_number: '',
    whatsapp_url: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
  });
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  const [navbarColor, setNavbarColor] = useState('#1d4f4f');

  useEffect(() => {
    if (window.location.hash.startsWith('#/admin')) return;
    fetchCompanyInfo();
    fetchNavbarColor();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const data = await getPublicJson('/api/company-info');
      setCompanyInfo({
          company_name: data.company_name || 'Sivakasi Mart Traders',
          logo: data.logo,
          price_list_pdf: data.price_list_pdf || null,
          phone_number: data.phone_number || '',
          whatsapp_url: data.whatsapp_url || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
      });
      // Set favicon dynamically
      if (data.logo) {
        const link = document.querySelector("link[rel='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = data.logo;
        if (!document.querySelector("link[rel='icon']")) {
          document.head.appendChild(link);
        }
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      // Use default values on error
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  const fetchNavbarColor = async () => {
    try {
      const data = await getPublicJson('/api/settings?scope=navbar');
      setNavbarColor(data.navbarColor || '#1d4f4f');
    } catch (error) {
      console.error('Error fetching navbar color:', error);
      // Use default color on error
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/price-list', label: 'Product List' },
    { href: '#', label: 'Price List PDF', isPdf: true },
    { href: '/about-us', label: 'About Us' },
    { href: '/contact-us', label: 'Contact Us' },
    { href: '/payments-info', label: 'Payments Info' },
  ];
  const priceListPdfLink = navLinks.find((link) => link.isPdf);
  const pageLinks = navLinks.filter((link) => !link.isPdf);

  return (
    <header className="paradise-navbar text-white sticky top-0 z-50 shadow-md" style={{ backgroundColor: navbarColor }}>
      <div className="paradise-navbar__inner">
        {/* Logo */}
        <a href="/" className="paradise-navbar__brand" aria-label="Go to Sivakasi Mart Traders home">
          {!loadingCompanyInfo && companyInfo.logo ? (
            <img
              src={companyInfo.logo}
              alt={companyInfo.company_name}
              className="paradise-navbar__logo"
            />
          ) : (
            <div className="paradise-navbar__fallback-logo">
              {companyInfo.company_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="paradise-navbar__name">{companyInfo.company_name}</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="paradise-navbar__links hidden md:flex">
          {pageLinks.map((link, index) => (
            <a
              key={`${link.href}-${index}`}
              href={link.href}
              className="paradise-navbar__link"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => setShowCart(true)}
            className="paradise-navbar__link paradise-navbar__cart"
          >
            🛒 Cart
            {cartItemsCount > 0 && (
              <span className="bg-red-500 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartItemsCount}
              </span>
            )}
          </button>
          {priceListPdfLink && (
            <a
              href={companyInfo.price_list_pdf || '#'}
              download={companyInfo.price_list_pdf ? 'price-list.pdf' : undefined}
              className="paradise-navbar__download"
              onClick={(event) => {
                if (!companyInfo.price_list_pdf) {
                  event.preventDefault();
                  window.alert('Price List PDF is not available yet.');
                }
              }}
            >
              📄 Download Price List
            </a>
          )}
          
          {/* <a
            href="/#/admin/login"
            className="bg-yellow-500 text-teal-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors"
          >
            Admin Login
          </a> */}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="paradise-navbar__menu md:hidden"
        >
          ☰
        </button>
      </div>

      <div className="paradise-navbar__social-strip" aria-label="Contact and social media links">
        <a href={companyInfo.phone_number ? `tel:${companyInfo.phone_number}` : undefined} aria-label="Phone"><PhoneIcon /></a>
        <a href={companyInfo.whatsapp_url || undefined} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon /></a>
        <a href={companyInfo.facebook_url || undefined} target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookIcon /></a>
        <a href={companyInfo.youtube_url || undefined} target="_blank" rel="noreferrer" aria-label="YouTube"><YouTubeIcon /></a>
        <a href={companyInfo.instagram_url || undefined} target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon /></a>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t" style={{ backgroundColor: adjustBrightness(navbarColor, -20) }}>
          <nav className="flex flex-col py-2">
            {navLinks.map((link, index) => (
              <a
                key={`${link.href}-${index}`}
                href={link.isPdf ? companyInfo.price_list_pdf || '#' : link.href}
                download={link.isPdf && companyInfo.price_list_pdf ? 'price-list.pdf' : undefined}
                className="px-6 py-3 transition-colors text-sm hover-link"
                style={{
                  borderBottom: `1px solid ${adjustBrightness(navbarColor, -20)}`,
                }}
                onClick={(event) => {
                  if (link.isPdf && !companyInfo.price_list_pdf) {
                    event.preventDefault();
                    window.alert('Price List PDF is not available yet.');
                  }
                  setMobileMenuOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setShowCart(true);
                setMobileMenuOpen(false);
              }}
              className="px-6 py-3 transition-colors text-sm text-left flex items-center gap-2 hover-link"
            >
              🛒 Cart
              {cartItemsCount > 0 && (
                <span className="bg-red-500 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs ml-auto">
                  {cartItemsCount}
                </span>
              )}
            </button>
            {/* <a
              href="/#/admin/login"
              className="px-6 py-3 transition-colors text-sm block hover-link"
              style={{
                borderBottom: `1px solid ${adjustBrightness(navbarColor, -20)}`,
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Login
            </a> */}
          </nav>
        </div>
      )}

      <style jsx>{`
        .hover-link {
          cursor: pointer;
        }
      `}</style>
    </header>
  );
}
