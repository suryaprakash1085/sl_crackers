'use client';

import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export default function CartModal() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartItemCount, showCart, setShowCart } = useCart();
  const router = useRouter();
  const cartItemsCount = getCartItemCount();
  const cartTotal = getCartTotal();

  const handleCheckout = () => {
    setShowCart(false);
    router.push('/checkout');
  };

  if (!showCart) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-40"
        onClick={() => setShowCart(false)}
      />

      {/* Modal Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-teal-900 p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">Shopping Cart</h2>
        <button
          onClick={() => setShowCart(false)}
          className="text-2xl font-bold text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItemsCount === 0 ? (
          <p className="text-gray-600 text-center py-12">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Group items by bannerSelectionId if available, otherwise by bannerTitle
              const groupedItems = cart.reduce((acc, item) => {
                const key = item.bannerSelectionId || item.bannerTitle || 'Other Items';
                if (!acc[key]) {
                  acc[key] = { items: [], name: item.bannerTitle || 'Other Items' };
                }
                acc[key].items.push(item);
                return acc;
              }, {});

              return Object.entries(groupedItems).map(([groupKey, groupData]) => (
                <div key={groupKey}>
                  {/* Group Header with Pack Name */}
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 px-1">
                    {groupData.name}
                  </h3>

                  {/* Items in Group */}
                  <div className="space-y-3">
                    {groupData.items.map(item => (
                      <div key={item.cartItemId} className="bg-gray-50 rounded-lg p-4">
                        {/* Item Card */}
                        <div className="flex gap-3 mb-3">
                          {/* Image */}
                          <div className="w-16 h-16 bg-yellow-100 rounded flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                  event.currentTarget.parentElement.textContent = '🎆';
                                }}
                              />
                            ) : '🎆'}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-black text-sm line-clamp-2">{item.name}</h3>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.cartItemId)}
                                className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0 transition-colors"
                                title={`Remove ${item.name} from cart`}
                                aria-label={`Remove ${item.name} from cart`}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {item.price && typeof item.price === 'number'
                                ? `₹${item.price.toFixed(2)}`
                                : item.price
                              }
                            </p>
                            <span className="text-sm font-bold text-red-600">
                              ₹{(() => {
                                let price = 0;
                                if (typeof item.price === 'number') {
                                  price = item.price;
                                } else if (item.price) {
                                  price = parseFloat(item.price.replace('₹', ''));
                                }
                                return (price * item.quantity).toFixed(2);
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-center gap-2 bg-white rounded border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-900"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-black font-semibold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-900"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItemsCount > 0 && (
        <div className="border-t p-4 bg-white space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold">Total:</span>
            <span className="text-xl font-bold text-red-600">₹{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
      </div>
    </>
  );
}
