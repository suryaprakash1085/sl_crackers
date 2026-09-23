'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from './Header';
import Footer from './Footer';

const LoginPage = dynamic(() => import('../login/page'));
const AdminLayout = dynamic(() => import('../admin/layout'));
const AdminDashboard = dynamic(() => import('../admin/page'));
const ProductsPage = dynamic(() => import('../admin/products/page'));
const OrdersPage = dynamic(() => import('../admin/orders/page'));
const CustomersPage = dynamic(() => import('../admin/customers/page'));
const PaymentsInfoPage = dynamic(() => import('../admin/payments-info/page'));
const ChitFundPage = dynamic(() => import('../admin/chit-fund/page'));
const CompanyInfoPage = dynamic(() => import('../admin/company-info/page'));
const AppearancePage = dynamic(() => import('../admin/appearance/page'));
const ColoursPage = dynamic(() => import('../admin/colours/page'));
const EditOrderPage = dynamic(() => import('../admin/orders/edit/page'));
const GstInvoicePage = dynamic(() => import('../admin/gst-invoice/page'));
const BlogPage = dynamic(() => import('../admin/blog/page'));

export default function HashRouter({ children }) {
  const [hash, setHash] = useState('');

  useEffect(() => {
    // Set initial hash
    setHash(window.location.hash);

    // Listen for hash changes
    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse hash to get route
  const route = hash.replace('#', '') || '/';

  useEffect(() => {
    document.title = 'Sivakasi Mart Traders';
  }, [route]);

  // Admin routes - check if user is authorized
  const adminRoutes = ['/admin', '/admin/dashboard', '/admin/products', '/admin/orders', '/admin/customers', '/admin/payments-info', '/admin/chit-fund', '/admin/company-info', '/admin/appearance', '/admin/colours', '/admin/gst-invoice', '/admin/blog'];

  // Check for dynamic routes
  const orderEditMatch = route.match(/^\/admin\/orders\/(\d+)$/);
  const orderCreateRoute = route === '/admin/orders/new';

  const isAdminRoute = adminRoutes.includes(route) || orderEditMatch || orderCreateRoute;
  const adminUser = typeof window !== 'undefined' ? localStorage.getItem('adminUser') : null;

  // If admin route but not logged in, show login
  if (isAdminRoute && !adminUser) {
    return <LoginPage />;
  }

  // Render admin pages
  if (route === '/admin/login') {
    return <LoginPage />;
  }

  if (isAdminRoute && adminUser) {
    let pageContent = <AdminDashboard />;

    if (route === '/admin/products') {
      pageContent = <ProductsPage />;
    } else if (route === '/admin/orders') {
      pageContent = <OrdersPage />;
    } else if (orderCreateRoute) {
      pageContent = <EditOrderPage mode="create" />;
    } else if (orderEditMatch) {
      pageContent = <EditOrderPage orderId={orderEditMatch[1]} />;
    } else if (route === '/admin/customers') {
      pageContent = <CustomersPage />;
    } else if (route === '/admin/payments-info') {
      pageContent = <PaymentsInfoPage />;
    } else if (route === '/admin/chit-fund') {
      pageContent = <ChitFundPage />;
    } else if (route === '/admin/company-info') {
      pageContent = <CompanyInfoPage />;
    } else if (route === '/admin/appearance') {
      pageContent = <AppearancePage />;
    } else if (route === '/admin/colours') {
      pageContent = <ColoursPage />;
    } else if (route === '/admin/gst-invoice') {
      pageContent = <GstInvoicePage />;
    } else if (route === '/admin/blog') {
      pageContent = <BlogPage />;
    }

    return <AdminLayout>{pageContent}</AdminLayout>;
  }

  // Otherwise render regular frontend with header and footer
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
