'use client';

import { useEffect, useState } from 'react';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import styles from './Footer.module.css';
import { getPublicJson } from '@/lib/publicJson';

const defaultCompanyInfo = {
  company_name: 'Sivakasi Mart Traders',
  logo: null,
  phone_number: '',
  email: '',
  address: '',
  website: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  whatsapp_url: '',
};

const socialPlatforms = [
  { name: 'Facebook', field: 'facebook_url', Icon: FacebookIcon },
  { name: 'Instagram', field: 'instagram_url', Icon: InstagramIcon },
  { name: 'YouTube', field: 'youtube_url', Icon: YouTubeIcon },
  { name: 'WhatsApp', field: 'whatsapp_url', Icon: WhatsAppIcon },
];

function getSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export default function Footer() {
  const [companyInfo, setCompanyInfo] = useState(defaultCompanyInfo);

  useEffect(() => {
    const fetchFooterData = async () => {
      if (window.location.hash.startsWith('#/admin')) return;
      try {
        const [settings, companyData] = await Promise.all([
          getPublicJson('/api/settings?scope=navbar'),
          getPublicJson('/api/company-info'),
        ]);

        document.documentElement.style.setProperty('--site-footer-color', settings.navbarColor || '#1d4f4f');
        setCompanyInfo({ ...defaultCompanyInfo, ...companyData, company_name: 'Sivakasi Mart Traders' });
      } catch (error) {
        console.error('Error fetching footer details:', error);
      }
    };

    fetchFooterData();
  }, []);

  const footerLinks = [
    { href: '/', label: 'Home' },
    { href: '/price-list', label: 'Price List' },
    { href: '/about-us', label: 'About Us' },
    { href: '/contact-us', label: 'Contact Us' },
  ];

  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <div className={styles.footerCompany}>
          <div className={styles.footerLogo}>
            {companyInfo.logo ? (
              <img
                src={companyInfo.logo}
                alt={companyInfo.company_name}
                className={styles.footerLogoImage}
              />
            ) : (
              <div className={styles.footerLogoFallback}>
                {companyInfo.company_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p>As per 2018 supreme court order, online sale of firecrackers are not permitted! We give more value to our customers and at the same time, we should respect jurisdiction. Please submit your queries and enjoy your Diwali with Sivakasi Mart Traders. Our company follows 100% legal and statutory compliances.</p>
          <p className={styles.footerCopyright}>© 2026 Sivakasi Mart Traders. All Rights Reserved.</p>
        </div>

        <div className={styles.footerContacts}>
          <p className={styles.footerHeading}>Contacts</p>
          <p><strong>Name:</strong><br />{companyInfo.company_name}</p>
          <p><strong>Address:</strong><br />{companyInfo.address || 'Contact us for address details.'}</p>
          <p><strong>email:</strong><br />{companyInfo.email || 'Email not configured'}</p>
          <p><strong>phones:</strong><br />{companyInfo.phone_number || 'Phone not configured'}</p>
          <p><strong>Working Hours:</strong><br />Mon - Sun / 6:00 AM - 12:00 AM</p>
        </div>

        <nav className={styles.footerLinks} aria-label="Footer links">
          <p className={styles.footerHeading}>Links</p>
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className={styles.footerSocials}>
          <a href={companyInfo.phone_number ? `tel:${companyInfo.phone_number}` : undefined} aria-label="Phone" title="Phone"><PhoneIcon fontSize="small" /></a>
          {socialPlatforms.map(({ name, field, Icon }) => {
            const socialUrl = getSafeExternalUrl(companyInfo[field]);
            return socialUrl ? <a key={field} href={socialUrl} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}><Icon fontSize="small" /></a> : <span key={field} aria-label={name} title={name}><Icon fontSize="small" /></span>;
          })}
        </div>
      </div>
    </footer>
  );
}
