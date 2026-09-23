'use client';

import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { getCartItemCount, setShowCart } = useCart();
  const cartItemsCount = getCartItemCount();

  if (pathname === '/') {
    return null;
  }

  return (
    <button
      onClick={() => setShowCart(true)}
      className="cart-button"
    >
      🛒
      {cartItemsCount > 0 && (
        <span className="cart-badge">
          {cartItemsCount}
        </span>
      )}
    </button>
  );
}
