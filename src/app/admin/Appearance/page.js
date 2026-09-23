'use client';

import { useState, useEffect, useRef } from 'react';
import { Snackbar, Alert, IconButton, TextField, Autocomplete, Button, Switch, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RemoveIcon from '@mui/icons-material/Remove';
import ParadiseAnimation from '../../components/ParadiseAnimation';

const styleOptions = [
  { label: 'Cards', value: 'cards' },
  { label: 'Table', value: 'table' },
];

export default function AppearancePage() {
  const [carouselImages, setCarouselImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [priceListStyle, setPriceListStyle] = useState(null);
  const [styleLoading, setStyleLoading] = useState(true);
  const [homePageDecoration, setHomePageDecoration] = useState(null);
  const [aboutUsImage, setAboutUsImage] = useState(null);
  const [homePageDecorationLeft, setHomePageDecorationLeft] = useState(null);
  const [homePageDecorationRight, setHomePageDecorationRight] = useState(null);
  const [decorationLoading, setDecorationLoading] = useState(false);
  const [decorationLeftLoading, setDecorationLeftLoading] = useState(false);
  const [decorationRightLoading, setDecorationRightLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [editBannerData, setEditBannerData] = useState({});
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);
  const [newBannerData, setNewBannerData] = useState({ title: '', subtitle: '', solidColor: '#8B5CF6', products: [] });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchValue, setProductSearchValue] = useState('');
  const [paradiseText, setParadiseText] = useState('PARADISE');
  const [paradiseTextEditing, setParadiseTextEditing] = useState(false);
  const [paradiseTextSaving, setParadiseTextSaving] = useState(false);
  const [paradiseBackgroundColor, setParadiseBackgroundColor] = useState('#000000');
  const [paradiseBackgroundSaving, setParadiseBackgroundSaving] = useState(false);
  const [showParadiseAnimation, setShowParadiseAnimation] = useState(true);
  const [showCarouselImages, setShowCarouselImages] = useState(true);
  const [visibilityToggleSaving, setVisibilityToggleSaving] = useState(false);
  const [decorationPositionTop, setDecorationPositionTop] = useState('1rem');
  const [decorationPositionLeft, setDecorationPositionLeft] = useState('1rem');
  const [decorationPositionSaving, setDecorationPositionSaving] = useState(false);
  const fileInputRef = useRef(null);
  const decorationInputRef = useRef(null);
  const aboutUsImageInputRef = useRef(null);
  const decorationLeftInputRef = useRef(null);
  const decorationRightInputRef = useRef(null);
  const brandLogoInputRef = useRef(null);
  const editingBrandIndexRef = useRef(null);

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
    fetchCarouselImages();
    fetchSettings();
    fetchBanners();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      showAlert('Failed to load products', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setStyleLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      const selectedOption = styleOptions.find(opt => opt.value === data.style);
      setPriceListStyle(selectedOption || styleOptions[1]); // Default to 'table'
      setHomePageDecoration(data.homePageDecoration || null);
      setAboutUsImage(data.aboutUsImage || null);
      setHomePageDecorationLeft(data.homePageDecorationLeft || null);
      setHomePageDecorationRight(data.homePageDecorationRight || null);
      setBrands(data.brands || ['Renu Crackers', 'Mightloads', 'Sri Aravind', 'Ramesh']);
      setParadiseText(data.paradiseText || 'PARADISE');
      setParadiseBackgroundColor(data.paradiseBackgroundColor || '#000000');
      setShowParadiseAnimation(data.showParadiseAnimation !== false);
      setShowCarouselImages(data.showCarouselImages !== false);
      setDecorationPositionTop(data.decorationPositionTop || '1rem');
      setDecorationPositionLeft(data.decorationPositionLeft || '1rem');
    } catch (error) {
      console.error('Error fetching settings:', error);
      setPriceListStyle(styleOptions[1]); // Default to 'table'
      setHomePageDecoration(null);
      setAboutUsImage(null);
      setHomePageDecorationLeft(null);
      setHomePageDecorationRight(null);
      setBrands(['Renu Crackers', 'Mightloads', 'Sri Aravind', 'Ramesh']);
      setParadiseText('PARADISE');
      setParadiseBackgroundColor('#000000');
      setShowParadiseAnimation(true);
      setShowCarouselImages(true);
      setDecorationPositionTop('1rem');
      setDecorationPositionLeft('1rem');
    } finally {
      setStyleLoading(false);
      setBrandsLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
      showAlert('Failed to load banners', 'error');
    } finally {
      setBannersLoading(false);
    }
  };

  const handleEditBanner = (banner) => {
    setEditingBannerId(banner.id);
    setEditBannerData({ ...banner, products: banner.products || [] });
    setSelectedProduct(null);
    setProductSearchValue('');
  };

  const handleCancelEdit = () => {
    setEditingBannerId(null);
    setEditBannerData({});
    setSelectedProduct(null);
    setProductSearchValue('');
  };

  const handleAddProductToBanner = () => {
    if (!selectedProduct) {
      showAlert('Please select a product', 'error');
      return;
    }

    const bannerProducts = editBannerData.products || [];
    const alreadyAdded = bannerProducts.some(p => p.id === selectedProduct.id);

    if (alreadyAdded) {
      showAlert('This product is already added to the banner', 'error');
      return;
    }

    const updatedProducts = [...bannerProducts, { ...selectedProduct, qty: 1 }];
    setEditBannerData({ ...editBannerData, products: updatedProducts });
    setSelectedProduct(null);
    setProductSearchValue('');
  };

  const handleUpdateProductQty = (productId, newQty) => {
    const parsedQty = parseInt(newQty);
    // Allow empty value or numbers >= 1
    if (newQty === '' || newQty === undefined) {
      const updatedProducts = editBannerData.products.map(p =>
        p.id === productId ? { ...p, qty: '' } : p
      );
      setEditBannerData({ ...editBannerData, products: updatedProducts });
    } else if (!isNaN(parsedQty) && parsedQty >= 0) {
      // Set to 1 if 0, otherwise keep the value
      const qty = parsedQty === 0 ? 1 : parsedQty;
      const updatedProducts = editBannerData.products.map(p =>
        p.id === productId ? { ...p, qty } : p
      );
      setEditBannerData({ ...editBannerData, products: updatedProducts });
    }
  };

  const handleIncreaseQty = (productId) => {
    const product = editBannerData.products.find(p => p.id === productId);
    if (product) {
      handleUpdateProductQty(productId, (product.qty || 1) + 1);
    }
  };

  const handleDecreaseQty = (productId) => {
    const product = editBannerData.products.find(p => p.id === productId);
    if (product && (product.qty || 1) > 1) {
      handleUpdateProductQty(productId, (product.qty || 1) - 1);
    }
  };

  const handleRemoveProductFromBanner = (productId) => {
    const updatedProducts = (editBannerData.products || []).filter(p => p.id !== productId);
    setEditBannerData({ ...editBannerData, products: updatedProducts });
  };

  const handleSaveBanner = async () => {
    if (!editBannerData.title || !editBannerData.subtitle) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    const updatedBanners = banners.map(b =>
      b.id === editingBannerId ? editBannerData : b
    );

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updatedBanners }),
      });

      if (response.ok) {
        setBanners(updatedBanners);
        setEditingBannerId(null);
        setEditBannerData({});
        showAlert('✓ Banner updated successfully!', 'success');
      } else {
        showAlert('Failed to update banner', 'error');
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      showAlert('Error updating banner', 'error');
    }
  };

  const handleCreateNewBanner = async () => {
    if (!newBannerData.title || !newBannerData.subtitle) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    const bannerId = `banner-${Date.now()}`;
    const newBanner = {
      id: bannerId,
      title: newBannerData.title,
      subtitle: newBannerData.subtitle,
      solidColor: newBannerData.solidColor,
      products: newBannerData.products || [],
    };

    const updatedBanners = [...banners, newBanner];

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updatedBanners }),
      });

      if (response.ok) {
        setBanners(updatedBanners);
        setIsCreatingBanner(false);
        setNewBannerData({ title: '', subtitle: '', gradientFrom: 'from-purple-400', gradientTo: 'to-pink-600', products: [] });
        setSelectedProduct(null);
        setProductSearchValue('');
        showAlert('✓ Banner created successfully!', 'success');
      } else {
        showAlert('Failed to create banner', 'error');
      }
    } catch (error) {
      console.error('Error creating banner:', error);
      showAlert('Error creating banner', 'error');
    }
  };

  const handleCancelCreateBanner = () => {
    setIsCreatingBanner(false);
    setNewBannerData({ title: '', subtitle: '', solidColor: '#8B5CF6', products: [] });
    setSelectedProduct(null);
    setProductSearchValue('');
  };

  const handleAddProductToNewBanner = () => {
    if (!selectedProduct) {
      showAlert('Please select a product', 'error');
      return;
    }

    const bannerProducts = newBannerData.products || [];
    const alreadyAdded = bannerProducts.some(p => p.id === selectedProduct.id);

    if (alreadyAdded) {
      showAlert('This product is already added to the banner', 'error');
      return;
    }

    const updatedProducts = [...bannerProducts, { ...selectedProduct, qty: 1 }];
    setNewBannerData({ ...newBannerData, products: updatedProducts });
    setSelectedProduct(null);
    setProductSearchValue('');
  };

  const handleUpdateNewBannerProductQty = (productId, newQty) => {
    const parsedQty = parseInt(newQty);
    if (newQty === '' || newQty === undefined) {
      const updatedProducts = newBannerData.products.map(p =>
        p.id === productId ? { ...p, qty: '' } : p
      );
      setNewBannerData({ ...newBannerData, products: updatedProducts });
    } else if (!isNaN(parsedQty) && parsedQty >= 0) {
      const qty = parsedQty === 0 ? 1 : parsedQty;
      const updatedProducts = newBannerData.products.map(p =>
        p.id === productId ? { ...p, qty } : p
      );
      setNewBannerData({ ...newBannerData, products: updatedProducts });
    }
  };

  const handleIncreaseNewBannerProductQty = (productId) => {
    const product = newBannerData.products.find(p => p.id === productId);
    if (product) {
      handleUpdateNewBannerProductQty(productId, (product.qty || 1) + 1);
    }
  };

  const handleDecreaseNewBannerProductQty = (productId) => {
    const product = newBannerData.products.find(p => p.id === productId);
    if (product && (product.qty || 1) > 1) {
      handleUpdateNewBannerProductQty(productId, (product.qty || 1) - 1);
    }
  };

  const handleRemoveProductFromNewBanner = (productId) => {
    const updatedProducts = (newBannerData.products || []).filter(p => p.id !== productId);
    setNewBannerData({ ...newBannerData, products: updatedProducts });
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    const updatedBanners = banners.filter(b => b.id !== bannerId);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updatedBanners }),
      });

      if (response.ok) {
        setBanners(updatedBanners);
        showAlert('✓ Banner deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete banner', 'error');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      showAlert('Error deleting banner', 'error');
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      showAlert('Please enter a brand name', 'error');
      return;
    }

    const updatedBrands = [...brands, newBrandName.trim()];

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brands: updatedBrands }),
      });

      if (response.ok) {
        setBrands(updatedBrands);
        setNewBrandName('');
        showAlert('✓ Brand added successfully!', 'success');
      } else {
        showAlert('Failed to add brand', 'error');
      }
    } catch (error) {
      console.error('Error adding brand:', error);
      showAlert('Error adding brand', 'error');
    }
  };

  const handleEditBrandLogo = (index) => {
    editingBrandIndexRef.current = index;
    brandLogoInputRef.current?.click();
  };

  const handleDeleteBrand = async (index) => {
    const brand = brands[index];
    const brandName = typeof brand === 'string' ? brand : brand.name;
    if (!confirm(`Are you sure you want to delete ${brandName}?`)) return;

    const updatedBrands = brands.filter((_, brandIndex) => brandIndex !== index);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brands: updatedBrands }),
      });

      if (response.ok) {
        setBrands(updatedBrands);
        showAlert('Brand deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete brand', 'error');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      showAlert('Error deleting brand', 'error');
    }
  };

  const handleBrandLogoFileSelect = (event) => {
    const file = event.target.files?.[0];
    const brandIndex = editingBrandIndexRef.current;

    event.target.value = '';
    if (!file || brandIndex === null) return;
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const image = new Image();
      image.onload = async () => {
        const maxSize = 400;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const logo = canvas.toDataURL('image/webp', 0.85);
        const updatedBrands = brands.map((brand, index) => {
          if (index !== brandIndex) return brand;
          return {
            name: typeof brand === 'string' ? brand : brand.name,
            logo,
          };
        });

        try {
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brands: updatedBrands }),
          });

          if (response.ok) {
            setBrands(updatedBrands);
            showAlert('Brand logo updated successfully!', 'success');
          } else {
            showAlert('Failed to update brand logo', 'error');
          }
        } catch (error) {
          console.error('Error updating brand logo:', error);
          showAlert('Error updating brand logo', 'error');
        }
      };
      image.onerror = () => showAlert('Failed to process image', 'error');
      image.src = loadEvent.target?.result;
    };
    reader.onerror = () => showAlert('Failed to read file', 'error');
    reader.readAsDataURL(file);
  };

  const handlePriceListStyleChange = async (event, newValue) => {
    if (!newValue) return;

    setPriceListStyle(newValue);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: newValue.value }),
      });

      if (response.ok) {
        showAlert('✓ Price-list style updated successfully!', 'success');
      } else {
        showAlert('Failed to update price-list style', 'error');
        fetchSettings(); // Revert to previous value on error
      }
    } catch (error) {
      console.error('Error updating price list style:', error);
      showAlert('Error updating price-list style', 'error');
      fetchSettings(); // Revert to previous value on error
    }
  };

  const handleDecorationFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result;

        setDecorationLoading(true);
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homePageDecoration: base64Data }),
        });

        if (response.ok) {
          await fetchSettings();
          showAlert('✓ Home page decoration updated successfully!', 'success');
          // Reset file input
          if (decorationInputRef.current) {
            decorationInputRef.current.value = '';
          }
        } else {
          showAlert('Failed to update home page decoration', 'error');
        }
        setDecorationLoading(false);
      };

      reader.onerror = () => {
        showAlert('Failed to read file', 'error');
        setDecorationLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading decoration:', error);
      showAlert('Error uploading decoration', 'error');
      setDecorationLoading(false);
    }
  };

  const handleAboutUsImageFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aboutUsImage: event.target?.result }),
        });

        if (response.ok) {
          setAboutUsImage(event.target?.result);
          await fetchSettings();
          showAlert('About Us image updated successfully!', 'success');
          if (aboutUsImageInputRef.current) aboutUsImageInputRef.current.value = '';
        } else {
          showAlert('Failed to update About Us image', 'error');
        }
      } catch (error) {
        console.error('Error uploading About Us image:', error);
        showAlert('Error uploading About Us image', 'error');
      }
    };
    reader.onerror = () => showAlert('Failed to read file', 'error');
    reader.readAsDataURL(file);
  };

  const handleDecorationLeftFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result;

        setDecorationLeftLoading(true);
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homePageDecorationLeft: base64Data }),
        });

        if (response.ok) {
          await fetchSettings();
          showAlert('✓ Left decoration image updated successfully!', 'success');
          // Reset file input
          if (decorationLeftInputRef.current) {
            decorationLeftInputRef.current.value = '';
          }
        } else {
          showAlert('Failed to update left decoration image', 'error');
        }
        setDecorationLeftLoading(false);
      };

      reader.onerror = () => {
        showAlert('Failed to read file', 'error');
        setDecorationLeftLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading left decoration:', error);
      showAlert('Error uploading left decoration', 'error');
      setDecorationLeftLoading(false);
    }
  };

  const handleDecorationRightFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result;

        setDecorationRightLoading(true);
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homePageDecorationRight: base64Data }),
        });

        if (response.ok) {
          await fetchSettings();
          showAlert('✓ Right decoration image updated successfully!', 'success');
          // Reset file input
          if (decorationRightInputRef.current) {
            decorationRightInputRef.current.value = '';
          }
        } else {
          showAlert('Failed to update right decoration image', 'error');
        }
        setDecorationRightLoading(false);
      };

      reader.onerror = () => {
        showAlert('Failed to read file', 'error');
        setDecorationRightLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading right decoration:', error);
      showAlert('Error uploading right decoration', 'error');
      setDecorationRightLoading(false);
    }
  };

  const handleSaveParadiseText = async () => {
    if (!paradiseText.trim()) {
      showAlert('Please enter text for Paradise Animation', 'error');
      return;
    }

    try {
      setParadiseTextSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paradiseText: paradiseText.trim() }),
      });

      if (response.ok) {
        setParadiseTextEditing(false);
        showAlert('✓ Paradise Animation text updated successfully!', 'success');
      } else {
        showAlert('Failed to update Paradise Animation text', 'error');
      }
    } catch (error) {
      console.error('Error updating Paradise Animation text:', error);
      showAlert('Error updating Paradise Animation text', 'error');
    } finally {
      setParadiseTextSaving(false);
    }
  };

  const handleCancelParadiseEdit = () => {
    setParadiseTextEditing(false);
    setParadiseText(paradiseText); // Reset to previous value
  };

  const handleSaveParadiseBackgroundColor = async (color) => {
    try {
      setParadiseBackgroundSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paradiseBackgroundColor: color }),
      });

      if (response.ok) {
        setParadiseBackgroundColor(color);
        showAlert('✓ Paradise Animation background color updated successfully!', 'success');
      } else {
        showAlert('Failed to update background color', 'error');
      }
    } catch (error) {
      console.error('Error updating background color:', error);
      showAlert('Error updating background color', 'error');
    } finally {
      setParadiseBackgroundSaving(false);
    }
  };

  const handleDeleteDecoration = async () => {
    if (!confirm('Are you sure you want to delete the decoration image?')) {
      return;
    }

    try {
      setDecorationLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homePageDecoration: null }),
      });

      if (response.ok) {
        await fetchSettings();
        showAlert('✓ Decoration image deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete decoration image', 'error');
      }
    } catch (error) {
      console.error('Error deleting decoration:', error);
      showAlert('Error deleting decoration image', 'error');
    } finally {
      setDecorationLoading(false);
    }
  };

  const handleDeleteAboutUsImage = async () => {
    if (!confirm('Are you sure you want to delete the About Us image?')) return;

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aboutUsImage: null }),
      });

      if (response.ok) {
        await fetchSettings();
        showAlert('About Us image deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete About Us image', 'error');
      }
    } catch (error) {
      console.error('Error deleting About Us image:', error);
      showAlert('Error deleting About Us image', 'error');
    }
  };

  const handleDeleteDecorationLeft = async () => {
    if (!confirm('Are you sure you want to delete the left decoration image?')) {
      return;
    }

    try {
      setDecorationLeftLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homePageDecorationLeft: null }),
      });

      if (response.ok) {
        await fetchSettings();
        showAlert('✓ Left decoration image deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete left decoration image', 'error');
      }
    } catch (error) {
      console.error('Error deleting left decoration:', error);
      showAlert('Error deleting left decoration image', 'error');
    } finally {
      setDecorationLeftLoading(false);
    }
  };

  const handleDeleteDecorationRight = async () => {
    if (!confirm('Are you sure you want to delete the right decoration image?')) {
      return;
    }

    try {
      setDecorationRightLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homePageDecorationRight: null }),
      });

      if (response.ok) {
        await fetchSettings();
        showAlert('✓ Right decoration image deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete right decoration image', 'error');
      }
    } catch (error) {
      console.error('Error deleting right decoration:', error);
      showAlert('Error deleting right decoration image', 'error');
    } finally {
      setDecorationRightLoading(false);
    }
  };

  const handleSaveDecorationPosition = async () => {
    try {
      setDecorationPositionSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decorationPositionTop,
          decorationPositionLeft
        }),
      });

      if (response.ok) {
        showAlert('✓ Decoration position updated successfully!', 'success');
      } else {
        showAlert('Failed to update decoration position', 'error');
      }
    } catch (error) {
      console.error('Error saving decoration position:', error);
      showAlert('Error saving decoration position', 'error');
    } finally {
      setDecorationPositionSaving(false);
    }
  };

  const handleToggleParadiseAnimation = async (checked) => {
    setShowParadiseAnimation(checked);
    try {
      setVisibilityToggleSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showParadiseAnimation: checked }),
      });

      if (response.ok) {
        showAlert(checked ? '✓ Paradise Animation enabled!' : '✓ Paradise Animation disabled!', 'success');
      } else {
        showAlert('Failed to update setting', 'error');
        setShowParadiseAnimation(!checked); // Revert on error
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      showAlert('Error updating setting', 'error');
      setShowParadiseAnimation(!checked); // Revert on error
    } finally {
      setVisibilityToggleSaving(false);
    }
  };

  const handleToggleCarouselImages = async (checked) => {
    setShowCarouselImages(checked);
    try {
      setVisibilityToggleSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showCarouselImages: checked }),
      });

      if (response.ok) {
        showAlert(checked ? '✓ Carousel Images enabled!' : '✓ Carousel Images disabled!', 'success');
      } else {
        showAlert('Failed to update setting', 'error');
        setShowCarouselImages(!checked); // Revert on error
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      showAlert('Error updating setting', 'error');
      setShowCarouselImages(!checked); // Revert on error
    } finally {
      setVisibilityToggleSaving(false);
    }
  };

  const fetchCarouselImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/carousel');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setCarouselImages(data);
      } else {
        console.error('Invalid carousel data format:', data);
        setCarouselImages([]);
      }
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      setCarouselImages([]);
      showAlert('Failed to load carousel images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result;

        setSubmitting(true);
        const response = await fetch('/api/carousel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: base64Data,
            displayOrder: carouselImages.length,
          }),
        });

        if (response.ok) {
          await fetchCarouselImages();
          showAlert('✓ Image uploaded successfully!', 'success');
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          const error = await response.json();
          showAlert(`Failed to upload image: ${error.error}`, 'error');
        }
        setSubmitting(false);
      };

      reader.onerror = () => {
        showAlert('Failed to read file', 'error');
        setSubmitting(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('Error uploading image', 'error');
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this carousel image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/carousel/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCarouselImages();
        showAlert('✓ Image deleted successfully!', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to delete image';
        showAlert(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert(`Error deleting image: ${error.message}`, 'error');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Appearance Settings</h2>

      {/* Paradise Animation Preview */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Paradise Animation Preview</h3>
          <div className="flex items-center gap-4">
            <FormControlLabel
              control={
                <Switch
                  checked={showParadiseAnimation}
                  onChange={(e) => handleToggleParadiseAnimation(e.target.checked)}
                  disabled={visibilityToggleSaving}
                  color="primary"
                />
              }
              label={showParadiseAnimation ? 'Enabled' : 'Disabled'}
            />
            {!paradiseTextEditing && (
              <button
                onClick={() => setParadiseTextEditing(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
              >
                Edit Text
              </button>
            )}
          </div>
        </div>

        {paradiseTextEditing ? (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Animation Text</label>
              <input
                type="text"
                value={paradiseText}
                onChange={(e) => setParadiseText(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter text for animation"
              />
              <p className="text-sm text-gray-500 mt-2">Text will be converted to uppercase. Max 20 characters recommended.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveParadiseText}
                disabled={paradiseTextSaving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {paradiseTextSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelParadiseEdit}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">This is the animated text displayed at the top of the home page:</p>
            <div style={{ backgroundColor: paradiseBackgroundColor }} className="border border-gray-300 rounded-lg overflow-hidden p-8">
              <ParadiseAnimation text={paradiseText} />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Background Color</label>
                <input
                  type="color"
                  value={paradiseBackgroundColor}
                  onChange={(e) => handleSaveParadiseBackgroundColor(e.target.value)}
                  disabled={paradiseBackgroundSaving}
                  className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  title="Click to change the animation background color"
                />
              </div>
              {paradiseBackgroundSaving && (
                <p className="text-sm text-gray-500">Saving...</p>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4">Each letter appears one-by-one with a spark/fireworks animation effect.</p>
          </>
        )}
      </div>

      {/* Carousel Images Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Carousel Images</h3>
            <p className="text-gray-600">Upload images for the DIWALI 2026 banner carousel. Images will auto-scroll every 3 seconds.</p>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={showCarouselImages}
                onChange={(e) => handleToggleCarouselImages(e.target.checked)}
                disabled={visibilityToggleSaving}
                color="primary"
              />
            }
            label={showCarouselImages ? 'Enabled' : 'Disabled'}
          />
        </div>

        {/* Add Image Form */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          {/* File Upload Option */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Upload Image from Device</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={submitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">Supported formats: JPG, PNG, WebP, GIF (Max 5MB)</p>
          </div>
        </div>

        {/* Carousel Images Preview */}
        {loading ? (
          <p className="text-gray-600">Loading carousel images...</p>
        ) : carouselImages.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No carousel images yet. Add some to get started!</p>
          </div>
        ) : (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Current Carousel Images ({carouselImages.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carouselImages.map((image, index) => (
                <div key={image.id} className="bg-gray-50 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                  {/* Image Preview */}
                  <div className="bg-white h-40 overflow-hidden flex items-center justify-center">
                    <img
                      src={image.image_url}
                      alt={`Carousel ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23999%22%3EImage Failed to Load%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Image Info */}
                  <div className="p-4">
                    {/* <p className="text-sm text-gray-600 mb-3 break-all">{image.image_url}</p> */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded">Position {index + 1}</span>
                      <IconButton
                        onClick={() => handleDeleteImage(image.id)}
                        color="error"
                        size="small"
                        title="Delete image"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6" style={{ marginTop: '2rem' }}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Price-List Page Design</h3>
        <div style={{display:"flex", gap: "1rem", alignItems: "flex-start"}}>
          <div style={{ flex: 1, maxWidth: "300px" }}>

              <Autocomplete
                options={styleOptions}
                value={priceListStyle}
                onChange={handlePriceListStyleChange}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => <TextField {...params} label="Style Settings" />}
              />
          </div>
        </div>
      </div>

        <div className="bg-white rounded-lg shadow p-6" style={{ marginTop: '2rem' }}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Home Page Design</h3>
        <p className="text-gray-600 mb-6">Manage the introduction image and the separate decoration images for the home page.</p>

        {/* Introduction Image */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Introduction Image</h4>
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <label className="block text-gray-700 font-medium mb-2">Upload Introduction Image</label>
            <input
              ref={decorationInputRef}
              type="file"
              accept="image/*"
              onChange={handleDecorationFileSelect}
              disabled={decorationLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">This image replaces the decorative stars in the home page introduction section (Max 5MB).</p>
          </div>

          {homePageDecoration && (
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <img
                    src={homePageDecoration}
                    alt="Introduction preview"
                    className="max-w-xs max-h-64 object-contain rounded"
                  />
                  <p className="text-xs text-gray-600 mt-3">Preview of the image shown in the home page introduction section</p>
                </div>
                <IconButton
                  onClick={handleDeleteDecoration}
                  color="error"
                  disabled={decorationLoading}
                  title="Delete introduction image"
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          )}
        </div>

        {/* About Us Image */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">About Us Image</h4>
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <label className="block text-gray-700 font-medium mb-2">Upload About Us Image</label>
            <input
              ref={aboutUsImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleAboutUsImageFileSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">This separate image appears in the Quality Since 1974 box on the About Us page (Max 5MB).</p>
          </div>

          {aboutUsImage && (
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <img src={aboutUsImage} alt="About Us preview" className="max-w-xs max-h-64 object-contain rounded" />
                  <p className="text-xs text-gray-600 mt-3">Preview of the image shown on the About Us page</p>
                </div>
                <IconButton onClick={handleDeleteAboutUsImage} color="error" title="Delete About Us image">
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          )}
        </div>

        {/* Left Decoration */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Left Decoration Image</h4>
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <label className="block text-gray-700 font-medium mb-2">Upload Left Decoration Image</label>
            <input
              ref={decorationLeftInputRef}
              type="file"
              accept="image/*"
              onChange={handleDecorationLeftFileSelect}
              disabled={decorationLeftLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
          </div>

          {homePageDecorationLeft && (
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <img
                    src={homePageDecorationLeft}
                    alt="Left decoration"
                    className="max-w-xs max-h-64 object-contain rounded"
                  />
                  <p className="text-xs text-gray-600 mt-3">This image will appear on the top left corner</p>
                </div>
                <IconButton
                  onClick={handleDeleteDecorationLeft}
                  color="error"
                  disabled={decorationLeftLoading}
                  title="Delete left decoration image"
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          )}
        </div>

        {/* Right Decoration */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Right Decoration Image</h4>
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <label className="block text-gray-700 font-medium mb-2">Upload Right Decoration Image</label>
            <input
              ref={decorationRightInputRef}
              type="file"
              accept="image/*"
              onChange={handleDecorationRightFileSelect}
              disabled={decorationRightLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-2">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
          </div>

          {homePageDecorationRight && (
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <img
                    src={homePageDecorationRight}
                    alt="Right decoration"
                    className="max-w-xs max-h-64 object-contain rounded"
                  />
                  <p className="text-xs text-gray-600 mt-3">This image will appear on the top right corner</p>
                </div>
                <IconButton
                  onClick={handleDeleteDecorationRight}
                  color="error"
                  disabled={decorationRightLoading}
                  title="Delete right decoration image"
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          )}
        </div>

        {(homePageDecorationLeft || homePageDecorationRight) && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Position Settings</h4>
            <p className="text-sm text-gray-600 mb-4">Adjust where the decoration images appear on the home page</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Distance from Top</label>
                <input
                  type="text"
                  value={decorationPositionTop}
                  onChange={(e) => setDecorationPositionTop(e.target.value)}
                  placeholder="e.g., 1rem, 20px, 5%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">Use values like: 1rem, 20px, 5%, etc.</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Distance from Left/Right</label>
                <input
                  type="text"
                  value={decorationPositionLeft}
                  onChange={(e) => setDecorationPositionLeft(e.target.value)}
                  placeholder="e.g., 1rem, 20px, 5%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">Applied to both left and right sides</p>
              </div>
            </div>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveDecorationPosition}
              disabled={decorationPositionSaving}
              fullWidth
            >
              {decorationPositionSaving ? 'Saving...' : 'Save Position Settings'}
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6" style={{ marginTop: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Festival Banners</h3>
            <p className="text-gray-600 text-sm mt-1">Customize the promotional banners displayed on the home page.</p>
          </div>
          {!isCreatingBanner && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsCreatingBanner(true)}
            >
              Add New Banner
            </Button>
          )}
        </div>

        {isCreatingBanner && (
          <div style={{ backgroundColor: newBannerData.solidColor, color: 'white' }} className="text-white p-6 rounded-lg mb-6">
            <h4 className="font-bold text-lg mb-4">Create New Festival Banner</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newBannerData.title || ''}
                  onChange={(e) => setNewBannerData({ ...newBannerData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter banner title"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Subtitle</label>
                <input
                  type="text"
                  value={newBannerData.subtitle || ''}
                  onChange={(e) => setNewBannerData({ ...newBannerData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter banner subtitle"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Banner Color</label>
                <input
                  type="color"
                  value={newBannerData.solidColor || '#8B5CF6'}
                  onChange={(e) => setNewBannerData({ ...newBannerData, solidColor: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        showAlert('Please select a valid image file', 'error');
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        showAlert('Image size must be less than 5MB', 'error');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setNewBannerData({ ...newBannerData, bannerImage: event.target?.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-100"
                />
                {newBannerData.bannerImage && (
                  <div className="mt-3 bg-white rounded p-2 flex items-center justify-between">
                    <img src={newBannerData.bannerImage} alt="Preview" className="max-h-32 max-w-xs object-contain rounded" />
                    <button
                      onClick={() => setNewBannerData({ ...newBannerData, bannerImage: null })}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Product Selection Section */}
              <div className="bg-white rounded p-3">
                <label className="block text-black font-medium mb-3">Select Products for This Banner</label>

                {/* Autocomplete Field */}
                <div className="flex gap-2 mb-4">
                  <Autocomplete
                    options={products}
                    sx={{ flex: 1 }}
                    getOptionLabel={(option) => option?.name || ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={selectedProduct}
                    onChange={(event, newValue) => setSelectedProduct(newValue)}
                    inputValue={productSearchValue}
                    onInputChange={(event, newInputValue) => {
                      setProductSearchValue(newInputValue);
                    }}
                    clearOnBlur={false}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search products..."
                        size="small"
                        style={{width:"250px"}}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'black',
                            '& fieldset': { borderColor: 'black' },
                            '&:hover fieldset': { borderColor: 'black' },
                            '&.Mui-focused fieldset': { borderColor: 'black' }
                          },
                          '& .MuiInputBase-input::placeholder': {
                            color: 'rgba(0, 0, 0, 0.5)',
                            opacity: 1
                          },
                          '& .MuiInputBase-input': {
                            color: 'black'
                          },
                          '& .MuiAutocomplete-listbox': {
                            color: 'black'
                          }
                        }}
                      />
                    )}
                    loading={productsLoading}
                    noOptionsText="No products found"
                  />
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleAddProductToNewBanner}
                    size="small"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Add Product
                  </Button>
                </div>

                {/* Selected Products Table */}
                {(newBannerData.products && newBannerData.products.length > 0) && (
                  <div className="mt-4">
                    <p className="text-black text-sm font-medium mb-3">Selected Products ({newBannerData.products.length})</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-black">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="text-left py-2 px-2">Product Name</th>
                            <th className="text-left py-2 px-2">Price</th>
                            <th className="text-left py-2 px-2">Qty</th>
                            <th className="text-left py-2 px-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newBannerData.products.map((product) => (
                            <tr key={product.id} className="border-b border-black">
                              <td className="py-2 px-2">{product.name}</td>
                              <td className="py-2 px-2">₹{parseFloat(product.price).toFixed(2)}</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDecreaseNewBannerProductQty(product.id)}
                                    className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm font-bold"
                                    title="Decrease quantity"
                                    disabled={(product.qty || 1) <= 1}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={product.qty || 1}
                                    onChange={(e) => handleUpdateNewBannerProductQty(product.id, e.target.value)}
                                    className="w-16 px-2 py-1 border border-black rounded text-black text-center"
                                  />
                                  <button
                                    onClick={() => handleIncreaseNewBannerProductQty(product.id)}
                                    className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm font-bold"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => handleRemoveProductFromNewBanner(product.id)}
                                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                  title="Remove product"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleCreateNewBanner}
                  size="small"
                >
                  Create Banner
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancelCreateBanner}
                  size="small"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {bannersLoading ? (
          <p className="text-gray-600">Loading banners...</p>
        ) : banners.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No banners found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((banner) => (
              <div key={banner.id} style={{ backgroundColor: banner.solidColor || '#8B5CF6' }} className="text-white p-6 rounded-lg">
                {editingBannerId === banner.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={editBannerData.title || ''}
                        onChange={(e) => setEditBannerData({ ...editBannerData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Subtitle</label>
                      <input
                        type="text"
                        value={editBannerData.subtitle || ''}
                        onChange={(e) => setEditBannerData({ ...editBannerData, subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Banner Color</label>
                      <input
                        type="color"
                        value={editBannerData.solidColor || '#8B5CF6'}
                        onChange={(e) => setEditBannerData({ ...editBannerData, solidColor: e.target.value })}
                        className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Banner Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.type.startsWith('image/')) {
                              showAlert('Please select a valid image file', 'error');
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              showAlert('Image size must be less than 5MB', 'error');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEditBannerData({ ...editBannerData, bannerImage: event.target?.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-100"
                      />
                      {editBannerData.bannerImage && (
                        <div className="mt-3 bg-white rounded p-2 flex items-center justify-between">
                          <img src={editBannerData.bannerImage} alt="Preview" className="max-h-32 max-w-xs object-contain rounded" />
                          <button
                            onClick={() => setEditBannerData({ ...editBannerData, bannerImage: null })}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Product Selection Section */}
                    <div className="bg-white rounded p-3">
                      <label className="block text-black font-medium mb-3">Select Products for This Banner</label>

                      {/* Autocomplete Field */}
                      <div className="flex gap-2 mb-4">
                        <Autocomplete
                          options={products}
                          sx={{ flex: 1 }}
                          getOptionLabel={(option) => option?.name || ''}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          value={selectedProduct}
                          onChange={(event, newValue) => setSelectedProduct(newValue)}
                          inputValue={productSearchValue}
                          onInputChange={(event, newInputValue) => {
                            setProductSearchValue(newInputValue);
                          }}
                          clearOnBlur={false}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search products..."
                              size="small"
                              style={{width:"250px"}}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: 'black',
                                  '& fieldset': { borderColor: 'black' },
                                  '&:hover fieldset': { borderColor: 'black' },
                                  '&.Mui-focused fieldset': { borderColor: 'black' }
                                },
                                '& .MuiInputBase-input::placeholder': {
                                  color: 'rgba(0, 0, 0, 0.5)',
                                  opacity: 1
                                },
                                '& .MuiInputBase-input': {
                                  color: 'black'
                                },
                                '& .MuiAutocomplete-listbox': {
                                  color: 'black'
                                }
                              }}
                            />
                          )}
                          loading={productsLoading}
                          noOptionsText="No products found"
                        />
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleAddProductToBanner}
                          size="small"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Add Product
                        </Button>
                      </div>

                      {/* Selected Products Table */}
                      {(editBannerData.products && editBannerData.products.length > 0) && (
                        <div className="mt-4">
                          <p className="text-black text-sm font-medium mb-3">Selected Products ({editBannerData.products.length})</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-black">
                              <thead>
                                <tr className="border-b border-black">
                                  <th className="text-left py-2 px-2">Product Name</th>
                                  <th className="text-left py-2 px-2">Price</th>
                                  <th className="text-left py-2 px-2">Qty</th>
                                  <th className="text-left py-2 px-2">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {editBannerData.products.map((product) => (
                                  <tr key={product.id} className="border-b border-black">
                                    <td className="py-2 px-2">{product.name}</td>
                                    <td className="py-2 px-2">₹{parseFloat(product.price).toFixed(2)}</td>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleDecreaseQty(product.id)}
                                          className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm font-bold"
                                          title="Decrease quantity"
                                          disabled={(product.qty || 1) <= 1}
                                        >
                                          −
                                        </button>
                                        <input
                                          type="number"
                                          value={product.qty || 1}
                                          onChange={(e) => handleUpdateProductQty(product.id, e.target.value)}
                                          className="w-16 px-2 py-1 border border-black rounded text-black text-center"
                                        />
                                        <button
                                          onClick={() => handleIncreaseQty(product.id)}
                                          className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm font-bold"
                                          title="Increase quantity"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <button
                                        onClick={() => handleRemoveProductFromBanner(product.id)}
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                        title="Remove product"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSaveBanner}
                        size="small"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancelEdit}
                        size="small"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      {banner.bannerImage && (
                        <div className="mb-4">
                          <img src={banner.bannerImage} alt={banner.title} className="w-full max-h-48 object-cover rounded" />
                        </div>
                      )}
                      <h4 className="font-bold text-lg mb-2">{banner.title}</h4>
                      <p className="text-sm">{banner.subtitle}</p>
                      {banner.products && banner.products.length > 0 && (
                        <p className="text-xs mt-3 opacity-80">📦 {banner.products.length} product(s) selected</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <IconButton
                        onClick={() => handleEditBanner(banner)}
                        color="inherit"
                        size="small"
                        title="Edit banner"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteBanner(banner.id)}
                        color="error"
                        size="small"
                        title="Delete banner"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6" style={{ marginTop: '2rem' }}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Brands</h3>
        <p className="text-gray-600 mb-6">Manage the brands displayed in the &quot;OUR BRANDS&quot; section on the home page.</p>

        <input
          ref={brandLogoInputRef}
          type="file"
          accept="image/*"
          onChange={handleBrandLogoFileSelect}
          className="hidden"
        />

        <div className="flex gap-4 mb-8">
          <TextField
            label="Brand Name"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            size="small"
            fullWidth
            onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddBrand}
            disabled={!newBrandName.trim()}
          >
            Add Brand
          </Button>
        </div>

        {brandsLoading ? (
          <p className="text-gray-600">Loading brands...</p>
        ) : brands.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No brands found. Add some to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand, index) => {
              const brandName = typeof brand === 'string' ? brand : brand.name;
              const brandLogo = typeof brand === 'string' ? null : brand.logo;

              return (
                <div key={`${brandName}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    {brandLogo && <img src={brandLogo} alt="" className="w-10 h-10 object-contain rounded" />}
                    <span className="font-bold text-teal-900 truncate">{brandName}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <IconButton
                      onClick={() => handleEditBrandLogo(index)}
                      color="primary"
                      size="small"
                      title={`Upload logo for ${brandName}`}
                      aria-label={`Upload logo for ${brandName}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteBrand(index)}
                      color="error"
                      size="small"
                      title={`Delete ${brandName}`}
                      aria-label={`Delete ${brandName}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
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
