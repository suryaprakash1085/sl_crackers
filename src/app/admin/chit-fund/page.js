'use client';

export default function ChitFundPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Chit Fund</h2>

      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Chit Fund Management</h3>
        <p className="text-gray-600 mb-4">
          Use this section to manage your chit fund information and details.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-gray-700 text-sm mt-2">Total Chits</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-6">
            <p className="text-2xl font-bold text-green-600">₹0</p>
            <p className="text-gray-700 text-sm mt-2">Total Amount</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-6">
            <p className="text-2xl font-bold text-yellow-600">0</p>
            <p className="text-gray-700 text-sm mt-2">Active Participants</p>
          </div>
        </div>
      </div>
    </div>
  );
}
