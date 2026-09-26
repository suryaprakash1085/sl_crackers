'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Cart hydrated from localStorage:', parsedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isHydrated]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const quantityToAdd = product.quantity || 1;

      // For banner items, always create a new line item (don't merge with regular products)
      if (product.bannerSelectionId || product.bannerTitle) {
        const cartItemId = `${product.id}-${Date.now()}-${Math.random()}`;
        return [...prevCart, { ...product, quantity: quantityToAdd, cartItemId }];
      }

      // For regular products, check if product already exists in cart (by id)
      const existingItem = prevCart.find(item => item.id === product.id && !item.bannerSelectionId && !item.bannerTitle);

      if (existingItem) {
        // If product exists, update its quantity instead of adding a duplicate
        return prevCart.map(item =>
          item.id === product.id && !item.bannerSelectionId && !item.bannerTitle
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }

      // Create a unique cart item ID for new items
      const cartItemId = `${product.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, { ...product, quantity: quantityToAdd, cartItemId }];
    });
  };

  const setProductQuantity = (product, quantity) => {
    // Set exact quantity for a product in cart, either updating existing or adding new
    setCart(prevCart => {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return prevCart.filter(item => item.id !== product.id || item.bannerSelectionId || item.bannerTitle);
      }

      // For banner items, always create a new line item (don't merge with regular products)
      if (product.bannerSelectionId || product.bannerTitle) {
        const existingItem = prevCart.find(item => item.cartItemId === product.cartItemId);
        if (existingItem) {
          return prevCart.map(item =>
            item.cartItemId === product.cartItemId ? { ...item, quantity } : item
          );
        }
        const cartItemId = `${product.id}-${Date.now()}-${Math.random()}`;
        return [...prevCart, { ...product, quantity, cartItemId }];
      }

      // For regular products, only match with non-banner items
      const existingItem = prevCart.find(item => item.id === product.id && !item.bannerSelectionId && !item.bannerTitle);

      if (existingItem) {
        // Update existing item with exact quantity
        return prevCart.map(item =>
          item.id === product.id && !item.bannerSelectionId && !item.bannerTitle ? { ...item, quantity } : item
        );
      }

      // Item doesn't exist, add it with the specified quantity
      const cartItemId = `${product.id}-${Date.now()}-${Math.random()}`;
      return [...prevCart, { ...product, quantity, cartItemId }];
    });
  };

  const removeFromCart = (cartItemIdOrProductId) => {
    setCart(prevCart => prevCart.filter(item =>
      item.cartItemId !== cartItemIdOrProductId && item.id !== cartItemIdOrProductId
    ));
  };

  const updateQuantity = (cartItemIdOrProductId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemIdOrProductId);
    } else {
      setCart(prevCart =>
        prevCart.map(item => {
          // Support both cartItemId and productId for backwards compatibility
          const isMatch = item.cartItemId === cartItemIdOrProductId || item.id === cartItemIdOrProductId;
          return isMatch
            ? { ...item, quantity }
            : item;
        })
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const discountedPrice = typeof item.discountPrice === 'number'
        ? item.discountPrice
        : parseFloat(String(item.discountPrice || '').replace('₹', ''));
      const regularPrice = typeof item.price === 'number'
        ? item.price
        : parseFloat(String(item.price || '').replace('₹', ''));
      const price = Number.isFinite(discountedPrice)
        ? discountedPrice
        : Number.isFinite(regularPrice) ? regularPrice : 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.length;
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    setProductQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    showCart,
    setShowCart,
    isHydrated,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
