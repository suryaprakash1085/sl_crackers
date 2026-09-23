'use client';

import { useState, useEffect } from 'react';
import { getPublicJson } from '@/lib/publicJson';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [companyName, setCompanyName] = useState('Admin');

  useEffect(() => {
    fetchCompanyName();
  }, []);

  const fetchCompanyName = async () => {
    try {
      const data = await getPublicJson('/api/company-info?fields=company_name');
      setCompanyName(data.company_name || 'Admin');
    } catch (error) {
      console.error('Error fetching company name:', error);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Products', href: '/admin/products', icon: '📦' },
    { label: 'Orders', href: '/admin/orders', icon: '📋' },
    { label: 'Customers', href: '/admin/customers', icon: '👥' },
    { label: 'Payments Info', href: '/admin/payments-info', icon: '💳' },
    // { label: 'Chit Fund', href: '/admin/chit-fund', icon: '💰' },
    { label: 'Company Info', href: '/admin/company-info', icon: '🏢' },
    { label: 'Appearance', href: '/admin/appearance', icon: '🎨' },
    { label: 'Theme Colors', href: '/admin/colours', icon: '🎨' },
    { label: 'Blog', href: '/admin/blog', icon: '📝' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    window.location.href = '/#/admin/login';
  };

  return (
    <div className="flex h-screen bg-gray-100 print:flex-col print:h-auto">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-16 md:w-64' : 'w-16 md:w-20'} shrink-0 bg-gray-900 text-white transition-all duration-300 flex flex-col print:hidden`}>
        {/* Logo */}
        <div className="p-3 md:p-4 border-b border-gray-700 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 shrink-0 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-gray-900">
              {companyName.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && <span className="hidden md:inline font-bold truncate">{companyName}</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item, index) => (
            <a
              key={`${item.href}-${index}`}
              href={`#${item.href}`}
              className="px-4 py-3 hover:bg-gray-800 transition-colors flex items-center gap-3 text-sm border-l-4 border-transparent hover:border-yellow-500"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="hidden md:inline">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>🚪</span>
            {sidebarOpen && <span className="hidden md:inline">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-w-0 min-h-0 flex-1 overflow-auto print:overflow-visible print:h-auto">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 md:p-6 flex items-center justify-between print:hidden">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Panel</h1>
          {/* <div className="flex items-center gap-4">
            <span className="hidden md:inline text-gray-600">Powered by Slashlabs</span>
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          </div> */}
        </div>

        {/* Page Content */}
        <div className="p-3 md:p-6 print:p-0 print:m-0 print:overflow-visible print:h-auto">
          {children}
        </div>
      </div>


      
    </div>
  );
}
