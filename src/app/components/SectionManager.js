'use client';

import { useState, useEffect, useRef } from 'react';
import { Snackbar, Alert, IconButton, Autocomplete, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function SectionManager() {
  const [sections, setSections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [sectionProducts, setSectionProducts] = useState({});
  
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
    fetchSectionsAndProducts();
  }, []);

  const fetchSectionsAndProducts = async () => {
    try {
      setLoading(true);
      const [sectionsRes, productsRes] = await Promise.all([
        fetch('/api/sections'),
        fetch('/api/products'),
      ]);

      const sectionsData = await sectionsRes.json();
      const productsData = await productsRes.json();

      setSections(sectionsData);
      setAllProducts(productsData);

      // Build product selection map
      const prodMap = {};
      sectionsData.forEach(section => {
        prodMap[section.id] = section.products || [];
      });
      setSectionProducts(prodMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Failed to load sections and products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      showAlert('Please enter a section title', 'error');
      return;
    }

    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSectionTitle }),
      });

      if (response.ok) {
        const newSection = await response.json();
        setSections([...sections, newSection]);
        setSectionProducts(prev => ({ ...prev, [newSection.id]: [] }));
        setNewSectionTitle('');
        setShowForm(false);
        showAlert('Section created successfully!', 'success');
      } else {
        showAlert('Failed to create section', 'error');
      }
    } catch (error) {
      console.error('Error creating section:', error);
      showAlert('Error creating section', 'error');
    }
  };

  const handleUpdateSectionTitle = async (sectionId, newTitle) => {
    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        const updatedSection = await response.json();
        setSections(sections.map(s => s.id === sectionId ? updatedSection : s));
        setEditingId(null);
        setEditTitle('');
        showAlert('Section title updated!', 'success');
      } else {
        showAlert('Failed to update section', 'error');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      showAlert('Error updating section', 'error');
    }
  };

  const handleProductsChange = (sectionId, selectedProducts) => {
    setSectionProducts(prev => ({
      ...prev,
      [sectionId]: selectedProducts,
    }));
  };

  const handleSaveProducts = async (sectionId) => {
    try {
      const productIds = sectionProducts[sectionId].map(p => p.id);
      console.log('Saving products for section', sectionId, 'with product IDs:', productIds);

      const response = await fetch(`/api/sections/${sectionId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });

      const responseData = await response.json();
      console.log('Response:', response.status, responseData);

      if (response.ok) {
        await fetchSectionsAndProducts();
        showAlert('Products updated successfully!', 'success');
      } else {
        showAlert(`Failed to update products: ${responseData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating products:', error);
      showAlert(`Error updating products: ${error.message}`, 'error');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSections(sections.filter(s => s.id !== sectionId));
        const newMap = { ...sectionProducts };
        delete newMap[sectionId];
        setSectionProducts(newMap);
        showAlert('Section deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete section', 'error');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      showAlert('Error deleting section', 'error');
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading sections...</p>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Manage Product Sections</h2>

      {/* Create New Section Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add New Section'}
        </button>
      </div>

      {/* Create Section Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Create New Section</h3>
          <form onSubmit={handleCreateSection} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Section Title *</label>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="e.g., Sale Products, New Arrivals"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Create Section
            </button>
          </form>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-6">
        {sections.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No sections created yet. Click "Add New Section" to get started!</p>
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow p-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                {editingId === section.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateSectionTitle(section.id, editTitle)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{section.title}</h3>
                  </div>
                )}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingId(section.id);
                      setEditTitle(section.title);
                    }}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Edit Title
                  </button>
                  <IconButton
                    onClick={() => handleDeleteSection(section.id)}
                    color="error"
                    title="Delete section"
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </div>

              {/* Product Selector */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-3">
                  Products in this section ({(sectionProducts[section.id] || []).length})
                </label>
                <Autocomplete
                  multiple
                  value={sectionProducts[section.id] || []}
                  onChange={(event, newValue) => handleProductsChange(section.id, newValue)}
                  options={allProducts}
                  getOptionLabel={(option) => `${option.name} (₹${option.price})`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search and select products..."
                      variant="outlined"
                    />
                  )}
                />
              </div>

              {/* Selected Products Preview */}
              {sectionProducts[section.id] && sectionProducts[section.id].length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Selected Products:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sectionProducts[section.id].map((product) => (
                      <div key={product.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">₹{parseFloat(product.price).toFixed(2)}</p>
                        {product.category && (
                          <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Products Button */}
              {sectionProducts[section.id] && (
                <button
                  onClick={() => handleSaveProducts(section.id)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save Products
                </button>
              )}
            </div>
          ))
        )}
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
