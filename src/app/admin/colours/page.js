'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

export default function ColoursPage() {
  const [colors, setColors] = useState({
    darkBackground: '#0f1e3d',
    navyBackground: '#1a2847',
    goldAccent: '#d4a574',
  });
  const [navbarColor, setNavbarColor] = useState('#1d4f4f');
  const [priceListColors, setPriceListColors] = useState({
    categoryColor: '#a855f7',
    tableHeaderColor: '#9333ea',
  });
  const [loading, setLoading] = useState(true);
  const [navbarColorLoading, setNavbarColorLoading] = useState(true);
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
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      setNavbarColorLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      setColors({
        darkBackground: data.darkBackground || '#0f1e3d',
        navyBackground: data.navyBackground || '#1a2847',
        goldAccent: data.goldAccent || '#d4a574',
      });
      setNavbarColor(data.navbarColor || '#1d4f4f');
      setPriceListColors({
        categoryColor: data.priceListCategoryColor || '#a855f7',
        tableHeaderColor: data.priceListTableHeaderColor || '#9333ea',
      });
    } catch (error) {
      console.error('Error fetching colors:', error);
      showAlert('Failed to load colors', 'error');
    } finally {
      setLoading(false);
      setNavbarColorLoading(false);
    }
  };

  const handleColorChange = (colorKey, value) => {
    setColors(prev => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handlePriceListColorChange = (colorKey, value) => {
    setPriceListColors(prev => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const saveNavbarColor = async (newColor) => {
    setNavbarColor(newColor);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navbarColor: newColor }),
      });

      if (response.ok) {
        showAlert('✓ Navbar color updated successfully!', 'success');
      } else {
        showAlert('Failed to update navbar color', 'error');
        fetchColors(); // Revert to previous value on error
      }
    } catch (error) {
      console.error('Error updating navbar color:', error);
      showAlert('Error updating navbar color', 'error');
      fetchColors(); // Revert to previous value on error
    }
  };

  const handleNavbarColorChange = (e) => {
    saveNavbarColor(e.target.value);
  };

  const handleNavbarHexChange = (e) => {
    setNavbarColor(e.target.value);
  };

  const handleNavbarHexBlur = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(navbarColor)) {
      saveNavbarColor(navbarColor);
    } else {
      fetchColors();
    }
  };

  const handleSaveColors = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          darkBackground: colors.darkBackground,
          navyBackground: colors.navyBackground,
          goldAccent: colors.goldAccent,
        }),
      });

      if (response.ok) {
        showAlert('✓ Colors updated successfully!', 'success');
      } else {
        showAlert('Failed to update colors', 'error');
      }
    } catch (error) {
      console.error('Error updating colors:', error);
      showAlert('Error updating colors', 'error');
    }
  };

  const handleSavePriceListColors = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceListCategoryColor: priceListColors.categoryColor,
          priceListTableHeaderColor: priceListColors.tableHeaderColor,
        }),
      });

      if (response.ok) {
        showAlert('✓ Price list colors updated successfully!', 'success');
      } else {
        showAlert('Failed to update price list colors', 'error');
      }
    } catch (error) {
      console.error('Error updating price list colors:', error);
      showAlert('Error updating price list colors', 'error');
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset colors to defaults?')) {
      return;
    }

    const defaultColors = {
      darkBackground: '#0f1e3d',
      navyBackground: '#1a2847',
      goldAccent: '#d4a574',
    };

    setColors(defaultColors);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultColors),
      });

      if (response.ok) {
        showAlert('✓ Colors reset to defaults!', 'success');
      } else {
        showAlert('Failed to reset colors', 'error');
      }
    } catch (error) {
      console.error('Error resetting colors:', error);
      showAlert('Error resetting colors', 'error');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading colors...</p>
      </div>
    );
  }

  const colorSettings = [
    {
      key: 'darkBackground',
      label: 'Dark Background Color',
      description: 'Main dark background color used across the page',
      usage: 'Dark sections background',
    },
    {
      key: 'navyBackground',
      label: 'Navy Background Color',
      description: 'Navy color used for cards and secondary sections',
      usage: 'Card backgrounds and navy sections',
    },
    {
      key: 'goldAccent',
      label: 'Gold Accent Color',
      description: 'Gold color used for text, buttons, and accents',
      usage: 'Text accents, buttons, borders',
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Appearance Settings</h2>

      {/* Navbar Appearance Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Navbar Appearance</h3>
        <div className="flex gap-4 items-flex-start">
          <div style={{ flex: 1, maxWidth: "300px" }}>
            <label className="block text-gray-700 font-medium mb-2">Navbar Color</label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <input
                type="color"
                value={navbarColor}
                onChange={handleNavbarColorChange}
                disabled={navbarColorLoading}
                style={{ width: "60px", height: "40px", cursor: "pointer", border: "1px solid #ddd", borderRadius: "4px" }}
              />
              <input
                type="text"
                value={navbarColor}
                onChange={handleNavbarHexChange}
                onBlur={handleNavbarHexBlur}
                disabled={navbarColorLoading}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
                aria-label="Navbar color hex value"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Colors Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Theme Colors</h3>
        <p className="text-gray-600 mb-8">
          Customize the theme colors used throughout your website. Changes will be applied instantly to the home page.
        </p>

        <div className="space-y-8">
          {colorSettings.map(setting => (
            <div key={setting.key} className="border-b border-gray-200 pb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{setting.label}</h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
                <p className="text-xs text-gray-500 mt-2">Used for: {setting.usage}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colors[setting.key]}
                    onChange={(e) => handleColorChange(setting.key, e.target.value)}
                    style={{
                      width: '80px',
                      height: '50px',
                      cursor: 'pointer',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                    }}
                  />
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={colors[setting.key]}
                      onChange={(e) => handleColorChange(setting.key, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#000000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Hex color code</p>
                  </div>
                </div>

                <div
                  style={{ backgroundColor: colors[setting.key] }}
                  className="w-24 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                  title="Color preview"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveColors}
            size="large"
          >
            Save Colors
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleResetToDefaults}
            size="large"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* price list colors section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Price List Page Colors</h3>
        <p className="text-gray-600 mb-8">
          Customize the colors used in the price list section of your website.
        </p>

        <div className="space-y-8">
          {/* Category Header Color */}
          <div className="border-b border-gray-200 pb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Category Header Color</h3>
              <p className="text-sm text-gray-600">Color used for category section headers (e.g., "SPARKLERS")</p>
              <p className="text-xs text-gray-500 mt-2">Used for: Category header backgrounds</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={priceListColors.categoryColor}
                  onChange={(e) => handlePriceListColorChange('categoryColor', e.target.value)}
                  style={{
                    width: '80px',
                    height: '50px',
                    cursor: 'pointer',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={priceListColors.categoryColor}
                    onChange={(e) => handlePriceListColorChange('categoryColor', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Hex color code</p>
                </div>
              </div>

              <div
                style={{ backgroundColor: priceListColors.categoryColor }}
                className="w-24 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                title="Color preview"
              />
            </div>
          </div>

          {/* Table Header Color */}
          <div className="border-b border-gray-200 pb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Table Header Color</h3>
              <p className="text-sm text-gray-600">Color used for the table header row in the price list</p>
              <p className="text-xs text-gray-500 mt-2">Used for: Table header backgrounds</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={priceListColors.tableHeaderColor}
                  onChange={(e) => handlePriceListColorChange('tableHeaderColor', e.target.value)}
                  style={{
                    width: '80px',
                    height: '50px',
                    cursor: 'pointer',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                  }}
                />
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={priceListColors.tableHeaderColor}
                    onChange={(e) => handlePriceListColorChange('tableHeaderColor', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Hex color code</p>
                </div>
              </div>

              <div
                style={{ backgroundColor: priceListColors.tableHeaderColor }}
                className="w-24 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                title="Color preview"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSavePriceListColors}
            size="large"
          >
            Save Price List Colors
          </Button>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
