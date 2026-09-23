'use client';

import { useState, useEffect } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Load customers from database
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/customers?search=${encodeURIComponent(query)}` : '/api/customers';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setCustomers(data);
      } else {
        console.error('Failed to fetch customers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search (500ms)
    const timeout = setTimeout(() => {
      fetchCustomers(query);
    }, 500);

    setSearchTimeout(timeout);
  };

  return (
    <>
      <div>
        <div className="search-header">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Customers</h2>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by Customer Name or Phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              <p className="text-lg">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p className="text-lg">No customers yet.</p>
              <p className="text-sm mt-2">Customer information will appear here when they place orders.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Total Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Order Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{customer.customer_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{customer.phone}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{customer.email || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{customer.total_orders}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-green-600">₹{parseFloat(customer.total_spent).toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(customer.last_order_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .search-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .search-header {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
