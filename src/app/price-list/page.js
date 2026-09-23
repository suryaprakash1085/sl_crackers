'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { getPublicJson } from '@/lib/publicJson';
import FireworksBurst from '../components/FireworksBurst';
import soundOne from '../../music/1.mp3';
import soundTwo from '../../music/2.mp3';

const PAGE_SIZE = 40;
const fallbackImage = '/window.svg';

function handleImageError(event) {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = fallbackImage;
}

function formatPrice(price) {
  return `₹${Number(price || 0).toFixed(2)}`;
}

function normalizeCategory(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function categoryId(value) {
  return `category-${normalizeCategory(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function parsePrice(value) {
  const normalizedValue = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsedValue = Number.parseFloat(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getProductSalePrice(product) {
  const originalPrice = parsePrice(product.price);
  const explicitSalePrice = parsePrice(product.price_80);

  if (product.price_80 !== undefined && product.price_80 !== null && product.price_80 !== '') {
    return explicitSalePrice;
  }

  return originalPrice * 0.8;
}

function groupProducts(products) {
  const groupedProducts = products.reduce((groups, product) => {
    const categoryName = normalizeCategory(product.category) || 'UNCATEGORIZED';
    const originalPrice = parsePrice(product.price);
    const salePrice = getProductSalePrice(product);
    const listProduct = {
      id: product.id,
      name: product.name,
      tamilName: product.description || '',
      originalPrice,
      discount: salePrice,
      image: product.image,
      fullImage: product.image_full || product.image,
    };

    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }

    groups[categoryName].push(listProduct);
    return groups;
  }, {});

  return Object.entries(groupedProducts).map(([name, products]) => ({
    name,
    products: products.sort((firstProduct, secondProduct) => firstProduct.discount - secondProduct.discount),
  }));
}

export default function PriceList() {
  const { cart, getCartTotal, setProductQuantity, setShowCart } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const categories = useMemo(() => {
    const groupedCategories = groupProducts(allProducts);
    return [
      ...categoryOrder
        .map((categoryName) => groupedCategories.find((category) => normalizeCategory(category.name) === normalizeCategory(categoryName)))
        .filter(Boolean),
      ...groupedCategories.filter((category) => !categoryOrder.some((categoryName) => normalizeCategory(category.name) === normalizeCategory(categoryName))),
    ];
  }, [allProducts, categoryOrder]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [requestedCategory, setRequestedCategory] = useState(null);
  const [categoryFound, setCategoryFound] = useState(true);
  const [priceListPdf, setPriceListPdf] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [burst, setBurst] = useState(null);
  const soundIndexRef = useRef(0);
  const activeAudioRef = useRef(null);
  const loadMoreRef = useRef(null);

  const loadProducts = useCallback(async (offset) => {
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), imageSize: 'thumb', fresh: '1' });
      const categoryParam = new URLSearchParams(window.location.search).get('category');
      if (categoryParam) params.set('category', categoryParam);
      const data = await getPublicJson(`/api/products?${params.toString()}`);
      const products = Array.isArray(data.products) ? data.products : [];
      setTotalProducts(Number(data.total) || 0);
      setAllProducts((currentProducts) => (
        offset === 0 ? products : [...currentProducts, ...products]
      ));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(0);
  }, [loadProducts]);

  useEffect(() => {
    const loadMoreTarget = loadMoreRef.current;
    if (!loadMoreTarget || allProducts.length >= totalProducts || loadingMore) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loadingMore) return;
      setLoadingMore(true);
      loadProducts(allProducts.length);
    }, { rootMargin: '600px 0px' });

    observer.observe(loadMoreTarget);
    return () => observer.disconnect();
  }, [allProducts.length, loadingMore, loadProducts, totalProducts]);

  useEffect(() => {
    Promise.all([
      getPublicJson('/api/company-info?fields=price_list_pdf'),
      getPublicJson('/api/settings?fresh=1', { cache: 'no-store' }),
    ])
      .then(([companyData, settingsData]) => {
        setPriceListPdf(companyData?.price_list_pdf || null);
        setCategoryOrder(Array.isArray(settingsData?.categoryOrder) ? settingsData.categoryOrder : []);
      })
      .catch((error) => console.error('Error loading price list settings:', error))
      .finally(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    const categoryParam = new URLSearchParams(window.location.search).get('category');
    setRequestedCategory(categoryParam);

    if (!categoryParam || categories.length === 0) {
      setCategoryFound(true);
      return;
    }

    const targetCategory = categories.find((category) => (
      normalizeCategory(category.name) === normalizeCategory(categoryParam)
    ));

    if (!targetCategory) {
      setCategoryFound(false);
      return;
    }

    setCategoryFound(true);
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(categoryId(targetCategory.name))?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [categories]);

  const displayedCategories = requestedCategory && categoryFound
    ? categories.filter((category) => normalizeCategory(category.name) === normalizeCategory(requestedCategory))
    : categories;

  const cartQuantities = useMemo(() => new Map(
    cart
      .filter((item) => !item.bannerSelectionId && !item.bannerTitle)
      .map((item) => [item.id, item.quantity])
  ), [cart]);

  const getQuantity = (productId) => cartQuantities.get(productId) || 0;

  const setQuantity = (productId, quantity) => {
    const newQuantity = Math.max(0, quantity);
    const product = allProducts.find((item) => item.id === productId);

    if (!product || newQuantity === 0) {
      setProductQuantity({ id: productId }, 0);
      return;
    }

    const originalPrice = Number.parseFloat(product.price) || 0;
    const salePrice = getProductSalePrice(product);

    setProductQuantity({
      id: product.id,
      name: product.name,
      originalPrice,
      price: salePrice,
      image: product.image_full || product.image,
    }, newQuantity);
  };

  const playQuantitySound = () => {
    const previousAudio = activeAudioRef.current;
    previousAudio?.pause();
    if (previousAudio) previousAudio.currentTime = 0;

    const sound = soundIndexRef.current % 2 === 0 ? soundOne : soundTwo;
    soundIndexRef.current += 1;

    const audio = new Audio(sound);
    audio.volume = 0.65;
    activeAudioRef.current = audio;
    audio.play().catch(() => {
      if (activeAudioRef.current === audio) activeAudioRef.current = null;
    });
  };

  const triggerProductEffect = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setBurst({ id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    playQuantitySound();
  };

  const handleIncrease = (productId, event) => {
    triggerProductEffect(event);
    setQuantity(productId, getQuantity(productId) + 1);
  };

  const handleDecrease = (productId, quantity) => {
    playQuantitySound();
    setQuantity(productId, quantity - 1);
  };

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = getCartTotal();

  return (
    <>
      {burst && (
        <FireworksBurst
          key={burst.id}
          x={burst.x}
          y={burst.y}
          onAnimationEnd={() => setBurst(null)}
        />
      )}
      <div className="price-list-page dark-bg-section">
      <section className="price-list-summary" aria-label="Cart summary">
        <div className="price-list-summary__content">
          <div>
            <p className="price-list-summary__label">🛍️ PRODUCTS</p>
            <p className="price-list-summary__value">{itemCount}</p>
          </div>
          <div>
            <p className="price-list-summary__label">🪙 OVERALL TOTAL</p>
            <p className="price-list-summary__value">{formatPrice(cartTotal)}</p>
          </div>
        </div>
        <div className="price-list-summary__actions">
          <button type="button" onClick={() => setShowCart(true)}>🛒 Cart</button>
          <a
            className="price-list-summary__pdf-link"
            href={priceListPdf || '#'}
            download={priceListPdf ? 'price-list.pdf' : undefined}
            onClick={(event) => {
              if (!priceListPdf) {
                event.preventDefault();
                window.alert('Price List PDF is not available yet.');
              }
            }}
          >
            ▣ PDF List
          </a>
          <button type="button" onClick={() => document.querySelector('.price-list-catalogue')?.scrollIntoView({ behavior: 'smooth' })}>⚑ Filter</button>
        </div>
      </section>

      <section className="price-list-order-info" aria-label="Ordering information">
        <div className="price-list-minimum-order">🎉 <strong>MIN ORDER: RS. 3000 (TN) | RS 5000 (Other States)</strong><br /><b>⚡ FLAT 75% SPECIAL DISCOUNT ⚡</b></div>
        <div className="price-list-steps">
          <h2>✨ SIMPLE 3-STEP ORDERING PROCESS ✨</h2>
          <div className="price-list-steps__grid">
            <article><strong>STEP 1</strong><span>🛒</span><h3>Add Products</h3><p>Select crackers to cart</p><button type="button" onClick={() => document.querySelector('.price-list-catalogue')?.scrollIntoView({ behavior: 'smooth' })}>Click Cart 🛒</button></article>
            <article><strong>STEP 2</strong><span>📄</span><h3>Enter Details</h3><p>Name &amp; Address ⬇️</p><button type="button" onClick={() => setShowCart(true)}>Click to Fill ⬇️</button></article>
            <article><strong>STEP 3</strong><span>🚀</span><h3>Confirm Order</h3><p>Submit order</p></article>
          </div>
          <p className="price-list-important-note">⚠️ <strong>Important Note:</strong> Adding products to cart does <u>NOT</u> automatically place your order. You must scroll down to <strong>Step 2 (Customer Details)</strong> and click <strong>&quot;Confirm Order&quot;</strong>!</p>
        </div>
      </section>

      <section className="price-list-catalogue">
        {!categoryFound && requestedCategory && (
          <div className="price-list-notice" role="status">
            <strong>Category “{requestedCategory}” was not found.</strong>
            <span>Showing all available products instead.</span>
          </div>
        )}

        {loading || settingsLoading ? (
          <div className="price-list-state">Loading products...</div>
        ) : categories.length === 0 ? (
          <div className="price-list-state">No products are available right now.</div>
        ) : (
          displayedCategories.map((category, categoryIndex) => (
            <section className="price-list-category" id={categoryId(category.name)} key={category.name}>
                <h2 className="price-list-category__title">{categoryIndex + 1}. {category.name} <span>(75% discount)</span></h2>
              <div className="price-list-table-header" aria-hidden="true">
                <span>Image</span><span>Product</span><span>Unit</span><span>Price</span><span>Discount</span><span>Quantity</span><span>Total</span>
              </div>
              <div className="price-list-products">
                {category.products.map((product) => {
                  const quantity = getQuantity(product.id);
                  const total = product.discount * quantity;

                  return (
                    <article className="price-list-product" key={product.id}>
                      <button
                        className="price-list-product__image-frame"
                        onClick={(event) => {
                          triggerProductEffect(event);
                          setEnlargedImage(product.fullImage);
                        }}
                        aria-label={`View ${product.name} image`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="price-list-product__image"
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                        />
                        <span className="price-list-product__discount">75%</span>
                      </button>

                      <div className="price-list-product__details">
                        <h3 className="price-list-product__name">{product.name}</h3>
                        {product.tamilName && <p className="price-list-product__tamil-name">{product.tamilName}</p>}
                      </div>

                      <div className="price-list-product__unit">1 Box</div>
                      <div className="price-list-product__original-price">{formatPrice(product.originalPrice)}</div>
                      <div className="price-list-product__sale-price">{formatPrice(product.discount)}</div>
                      <div className="price-list-product__quantity" aria-label={`${product.name} quantity`}>
                        {quantity === 0 ? (
                          <button
                            type="button"
                            className="price-list-product__quantity-button price-list-product__quantity-button--add"
                            onClick={(event) => handleIncrease(product.id, event)}
                            aria-label={`Add ${product.name} to cart`}
                          >
                            ADD
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="price-list-product__quantity-button price-list-product__quantity-button--minus"
                              onClick={() => handleDecrease(product.id, quantity)}
                              aria-label={`Remove one ${product.name}`}
                            >
                              −
                            </button>
                            <span className="price-list-product__quantity-value">{quantity}</span>
                            <button
                              type="button"
                              className="price-list-product__quantity-button price-list-product__quantity-button--plus"
                              onClick={(event) => handleIncrease(product.id, event)}
                              aria-label={`Add one ${product.name}`}
                            >
                              +
                            </button>
                          </>
                        )}
                      </div>

                      <div className="price-list-product__total">
                        <span className="price-list-product__total-label">Total</span>
                        <strong>{formatPrice(total)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
        {requestedCategory && categoryFound && (
          <a className="price-list-all-products" href="/price-list">ALL PRODUCTS</a>
        )}
        {allProducts.length < totalProducts && (
          <div ref={loadMoreRef} className="price-list-load-sentinel" aria-live="polite">
            {loadingMore && 'Loading Products...'}
          </div>
        )}
      </section>

      {enlargedImage && (
        <div className="price-list-image-dialog" role="dialog" aria-modal="true" aria-label="Product image" onClick={() => setEnlargedImage(null)}>
          <div className="price-list-image-dialog__content" onClick={(event) => event.stopPropagation()}>
            <button className="price-list-image-dialog__close" onClick={() => setEnlargedImage(null)} aria-label="Close image preview">×</button>
            <img src={enlargedImage} alt="Product preview" className="price-list-image-dialog__image" decoding="async" onError={handleImageError} />
          </div>
        </div>
      )}

      <style jsx>{`
        .price-list-page {
          min-height: 100%;
          background: #f8fafb;
          color: #172a2d;
        }

        .price-list-summary {
          border-bottom: 2px solid #d8ad3f;
          background: #003d4a;
          padding: 0.8rem 0.65rem 1rem;
        }

        .price-list-summary__content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          align-items: center;
          width: min(100%, 62rem);
          margin: 0 auto;
          text-align: center;
        }

        .price-list-summary__label,
        .price-list-summary__value,
        .price-list-summary__note {
          margin: 0;
        }

        .price-list-summary__label {
          color: #f0cf63;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .price-list-summary__value {
          margin-top: 0.18rem;
          color: #fff;
          font-size: 1.6rem;
          font-weight: 900;
        }

        .price-list-summary__content > div + div {
          border-left: 1px solid rgba(216, 173, 63, .55);
          padding-left: 1rem;
        }

        .price-list-summary__actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: .6rem;
          width: min(100%, 75rem);
          margin: .7rem auto 0;
        }

        .price-list-summary__actions button,
        .price-list-summary__pdf-link {
          min-height: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d8ad3f;
          border-radius: .6rem;
          background: #f4e683;
          color: #003d4a;
          font-size: .85rem;
          font-weight: 900;
          text-decoration: none;
        }

        .price-list-summary__pdf-link {
          background: transparent;
          color: #f0cf63;
        }

        .price-list-summary__button {
          border: 1px solid #d4e1e2;
          border-radius: 0.45rem;
          background: #173f41;
          color: #fff;
          padding: 0.62rem 0.8rem;
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .price-list-summary__button:hover {
          background: #205356;
        }

        .price-list-summary__note {
          width: min(100%, 72rem);
          margin: 0.75rem auto 0;
          color: #7a8587;
          font-size: 0.72rem;
          line-height: 1.4;
        }

        .price-list-order-info {
          width: min(100% - 1.5rem, 72rem);
          margin: .7rem auto 0;
        }

        .price-list-minimum-order,
        .price-list-steps {
          border: 2px solid #d8ad3f;
          border-radius: .35rem;
          background: #064b59;
          color: #f0cf63;
          text-align: center;
        }

        .price-list-minimum-order {
          padding: 1rem;
          font-size: 1rem;
          line-height: 1.7;
        }

        .price-list-minimum-order b { color: #ff6565; }

        .price-list-steps {
          margin-top: .6rem;
          padding: 1.2rem 1rem 1rem;
        }

        .price-list-steps h2 {
          margin: 0 0 1rem;
          font-size: 1.05rem;
        }

        .price-list-steps__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .35rem;
        }

        .price-list-steps__grid article {
          min-height: 9rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(240, 207, 99, .7);
          border-radius: .7rem;
          background: rgba(255, 255, 255, .08);
          padding: .75rem;
        }

        .price-list-steps__grid article:nth-child(2) { border: 2px solid #11dce9; }
        .price-list-steps__grid strong { font-size: .8rem; }
        .price-list-steps__grid span { margin: .35rem 0; font-size: 1.5rem; }
        .price-list-steps__grid h3 { margin: 0; color: #fff; font-size: .95rem; }
        .price-list-steps__grid p { margin: .3rem 0; font-size: .75rem; }
        .price-list-steps__grid button { border: 0; border-radius: 999px; background: #f4e683; color: #17454c; padding: .25rem .65rem; font-size: .7rem; font-weight: 800; }
        .price-list-important-note { margin: .7rem 0 0; border: 1px dashed #d8ad3f; padding: .65rem; color: #f0cf63; font-size: .78rem; }

        .price-list-all-products {
          display: block;
          width: fit-content;
          margin: 1.5rem auto 0;
          padding: .75rem 1.5rem;
          border: 1px solid #d4a574;
          border-radius: 999px;
          background: #1d4f4f;
          color: #fff;
          font-size: .75rem;
          font-weight: 800;
          letter-spacing: .08em;
          text-decoration: none;
        }

        .price-list-catalogue {
          width: min(100%, 72rem);
          margin: 0 auto;
          padding: 1rem 0 2.5rem;
          overflow-x: auto;
        }

        .price-list-notice,
        .price-list-state {
          margin: 0 1rem 1rem;
          border: 1px solid #dce5e6;
          border-radius: 0.5rem;
          background: #fff;
          color: #536265;
          padding: 1rem;
          text-align: center;
        }

        .price-list-notice {
          display: grid;
          gap: 0.25rem;
        }

        .price-list-category + .price-list-category {
          margin-top: 1.5rem;
        }

        .price-list-category__title {
          margin: 0;
          border: 1px solid #d8ad3f;
          background: #064b59;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 800;
          padding: 0.8rem 1rem;
          text-align: center;
          text-transform: uppercase;
        }

        .price-list-category__title span { color: #f0cf63; text-transform: none; }

        .price-list-table-header {
          display: grid;
          grid-template-columns: 10% 20% 10% 15% 10% 15% 20%;
          min-width: 70rem;
          border: 1px solid #d8dce1;
          background: #c098e6;
          color: #172a2d;
          font-size: .75rem;
          font-weight: 900;
          text-align: center;
        }

        .price-list-table-header span { padding: .75rem .35rem; border-right: 1px solid rgba(255,255,255,.6); }

        .price-list-products {
          min-width: 70rem;
          border-bottom: 1px solid #e3e9ea;
          background: #fff;
        }

        .price-list-product {
          display: grid;
          grid-template-columns: 10% 20% 10% 15% 10% 15% 20%;
          gap: 0;
          min-height: 7rem;
          border-top: 1px solid #e3e9ea;
          border-left: 1px solid #d8dce1;
          border-right: 1px solid #d8dce1;
          padding: 0;
          align-items: center;
          text-align: center;
        }

        .price-list-product:first-child {
          border-top: 0;
        }

        .price-list-product__image-frame {
          position: relative;
          display: grid;
          width: 4rem;
          height: 4rem;
          place-items: center;
          align-self: center;
          overflow: visible;
          border: 1px solid #e1e6e7;
          border-radius: 0.45rem;
          background: #f2f4f5;
          padding: 0.4rem;
        }

        .price-list-product__image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .price-list-product__discount {
          position: absolute;
          top: -0.35rem;
          right: -0.35rem;
          border-radius: 0.25rem;
          background: #e84242;
          color: #fff;
          padding: 0.2rem 0.32rem;
          font-size: 0.65rem;
          font-weight: 800;
          line-height: 1;
        }

        .price-list-product__details {
          min-width: 0;
          padding: .5rem .65rem;
        }

        .price-list-product__name,
        .price-list-product__tamil-name {
          margin: 0;
        }

        .price-list-product__name {
          color: #172a2d;
          font-size: 0.95rem;
          font-weight: 800;
          line-height: 1.35;
        }

        .price-list-product__tamil-name {
          margin-top: 0.18rem;
          color: #829092;
          font-size: 0.74rem;
          line-height: 1.35;
        }

        .price-list-product__prices {
          display: flex;
          gap: 0.5rem;
          align-items: baseline;
          margin-top: 0.5rem;
        }

        .price-list-product__sale-price {
          color: #172a2d;
          font-size: 1rem;
          font-weight: 800;
        }

        .price-list-product__unit,
        .price-list-product__original-price,
        .price-list-product__sale-price,
        .price-list-product__quantity,
        .price-list-product__total { justify-self: center; }

        .price-list-product__unit { color: #172a2d; font-size: 1rem; font-weight: 700; }

        .price-list-product__original-price {
          color: #aab4b5;
          font-size: 0.75rem;
          text-decoration: line-through;
        }

        .price-list-product__quantity {
          display: inline-flex;
          margin-top: 0.62rem;
          border: 1px solid #d8e0e1;
          border-radius: 0.4rem;
          box-shadow: 0 0.1rem 0.25rem rgba(23, 63, 65, 0.08);
          overflow: hidden;
        }

        .price-list-product__quantity-button,
        .price-list-product__quantity-value {
          display: grid;
          width: 2rem;
          height: 1.85rem;
          place-items: center;
          border: 0;
          color: #284144;
          font-size: 1rem;
          font-weight: 800;
          line-height: 1;
        }

        .price-list-product__quantity-button {
          transition: background-color 0.2s ease;
        }

        .price-list-product__quantity-button--add {
          width: 6.5rem;
          min-width: 6.5rem;
          background: #e3f5e8;
          color: #278447;
          font-size: 0.72rem;
        }

        .price-list-product__quantity-button--add:hover {
          background: #d2efdc;
        }

        .price-list-product__quantity-button--minus {
          border-right: 1px solid #ead7d7;
          background: #fee9e8;
          color: #be4b4b;
        }

        .price-list-product__quantity-button--minus:not(:disabled):hover {
          background: #fbd7d5;
        }

        .price-list-product__quantity-button--minus:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .price-list-product__quantity-value {
          border-right: 1px solid #d8e0e1;
          background: #fff;
          font-size: 0.76rem;
        }

        .price-list-product__quantity-button--plus {
          background: #e3f5e8;
          color: #278447;
        }

        .price-list-product__quantity-button--plus:hover {
          background: #d2efdc;
        }

        .price-list-product__total {
          grid-column: auto;
          align-self: center;
          justify-self: center;
          display: grid;
          gap: 0.1rem;
          text-align: right;
        }

        .price-list-product__total-label {
          color: #879395;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .price-list-product__total strong {
          color: #172a2d;
          font-size: 1rem;
          font-weight: 800;
        }

        .price-list-image-dialog {
          position: fixed;
          z-index: 60;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(10, 25, 27, 0.75);
          padding: 1.5rem;
        }

        .price-list-image-dialog__content {
          position: relative;
          max-width: min(90vw, 42rem);
          max-height: 85vh;
          border-radius: 0.65rem;
          background: #fff;
          padding: 1rem;
        }

        .price-list-image-dialog__close {
          position: absolute;
          top: -0.65rem;
          right: -0.65rem;
          display: grid;
          width: 2rem;
          height: 2rem;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: #173f41;
          color: #fff;
          font-size: 1.35rem;
          line-height: 1;
        }

        .price-list-image-dialog__image {
          display: block;
          max-width: 100%;
          max-height: calc(85vh - 2rem);
          object-fit: contain;
        }

        @media (min-width: 640px) {
          .price-list-summary {
            padding: 1.25rem 1.5rem;
          }

          .price-list-summary__content {
            grid-template-columns: 1fr 1fr;
          }

          .price-list-catalogue {
            padding-top: 1.5rem;
          }

          .price-list-product {
            grid-template-columns: 10% 20% 10% 15% 10% 15% 20%;
            min-height: 7rem;
            padding: 0;
          }

          .price-list-product__image-frame {
            width: 4rem;
            height: 4rem;
          }

          .price-list-product__name {
            font-size: 1rem;
          }

          .price-list-product__total { grid-column: auto; align-self: center; }
        }

        @media (max-width: 639px) {
          .price-list-catalogue { width: 100%; padding-top: .75rem; overflow-x: hidden; }
          .price-list-category { width: 100%; overflow: hidden; }
          .price-list-category__title { font-size: .95rem; padding: .75rem .5rem; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .price-list-table-header { display: none; }
          .price-list-products { min-width: 0; width: 100%; }
          .price-list-product { position: relative; grid-template-columns: 6rem minmax(0, 1fr) 4rem; grid-template-rows: auto auto auto; min-height: 10.5rem; padding: .65rem .35rem; }
          .price-list-product__image-frame { grid-column: 1; grid-row: 1 / span 3; width: 5rem; height: 7.5rem; align-self: start; margin: 0; border: 0; border-radius: 0; background: #f5f6f7; }
          .price-list-product__discount { top: .35rem; right: -.2rem; border-radius: .3rem; background: #ff4545; padding: .45rem .5rem; font-size: .8rem; }
          .price-list-product__details { grid-column: 2; grid-row: 1; padding: .1rem .15rem 0; text-align: center; }
          .price-list-product__name { font-size: .95rem; line-height: 1.25; }
          .price-list-product__tamil-name { margin-top: .5rem; font-size: .78rem; font-style: italic; }
          .price-list-product__unit { display: none; }
          .price-list-product__original-price { position: absolute; top: 4.45rem; left: calc(6rem + 50%); transform: translateX(.5rem); font-size: .75rem; }
          .price-list-product__sale-price { grid-column: 2; grid-row: 2; align-self: center; margin-top: .25rem; font-size: 1.05rem; text-align: center; }
          .price-list-product__quantity { grid-column: 2; grid-row: 3; justify-self: start; margin: .55rem 0 0 .05rem; }
          .price-list-product__quantity-button, .price-list-product__quantity-value { width: 2rem; height: 2.4rem; font-size: 1.05rem; }
          .price-list-product__total { grid-column: 3; grid-row: 2 / span 2; align-self: end; justify-self: end; padding-bottom: .15rem; }
          .price-list-product__total-label { display: none; }
          .price-list-product__total strong { font-size: 1.15rem; }
          .price-list-steps__grid { grid-template-columns: 1fr; }
          .price-list-steps__grid article { min-height: 7rem; }
          .price-list-summary__actions { gap: .35rem; }
          .price-list-summary__actions button,
          .price-list-summary__pdf-link { font-size: .7rem; }
          .price-list-minimum-order { font-size: .78rem; }
        }
      `}</style>

      <style jsx>{`
        .price-list-page.dark-bg-section {
          position: relative;
          overflow: hidden;
          background-color: var(--dark-navy);
          background-image: radial-gradient(circle at 14% 12%, rgba(212, 165, 116, 0.12), transparent 20rem), radial-gradient(circle at 86% 74%, rgba(212, 165, 116, 0.08), transparent 18rem);
          color: white;
        }

        .price-list-hero {
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(212, 165, 116, 0.2);
          padding: 3.5rem 1rem 3rem;
          text-align: center;
        }

        .price-list-hero__content {
          position: relative;
          z-index: 1;
          width: min(100%, 48rem);
          margin: 0 auto;
        }

        .price-list-hero__eyebrow {
          display: inline-block;
          border: 1px solid rgba(212, 165, 116, 0.45);
          color: var(--gold);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          padding: 0.375rem 0.625rem;
        }

        .price-list-hero__title {
          margin: 1rem 0 0;
          color: var(--gold);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(2rem, 7vw, 3.5rem);
          font-weight: 700;
          line-height: 1.1;
        }

        .price-list-hero__description {
          max-width: 36rem;
          margin: 1rem auto 0;
          color: #d1d5db;
          font-size: 0.95rem;
          line-height: 1.7;
        }

        .price-list-hero__glow {
          position: absolute;
          width: 14rem;
          height: 14rem;
          border-radius: 50%;
          background: var(--gold);
          filter: blur(7rem);
          opacity: 0.08;
        }

        .price-list-hero__glow--start {
          top: -8rem;
          left: -5rem;
        }

        .price-list-hero__glow--end {
          right: -5rem;
          bottom: -9rem;
        }

        .price-list-page.dark-bg-section .price-list-summary {
          border-bottom-color: rgba(212, 165, 116, 0.18);
          background: rgba(15, 30, 61, 0.7);
        }

        .price-list-page.dark-bg-section .price-list-summary__label,
        .price-list-page.dark-bg-section .price-list-summary__note {
          color: #d1d5db;
        }

        .price-list-page.dark-bg-section .price-list-summary__value {
          color: var(--gold);
        }

        .price-list-page.dark-bg-section .price-list-catalogue {
          padding-top: 2rem;
        }

        .price-list-page.dark-bg-section .price-list-category__title {
          border-bottom-color: rgba(212, 165, 116, 0.3);
          color: var(--gold);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.05rem;
          letter-spacing: 0.05em;
          padding-top: 0;
        }

        .price-list-page.dark-bg-section .price-list-products {
          border: 1px solid rgba(212, 165, 116, 0.22);
          border-radius: 1.25rem;
          background: linear-gradient(180deg, rgba(19, 31, 58, 0.9), rgba(9, 18, 35, 0.96));
          box-shadow: 0 14px 32px rgba(4, 9, 24, 0.35);
          overflow: hidden;
        }

        .price-list-page.dark-bg-section .price-list-product {
          border-top-color: rgba(255, 255, 255, 0.12);
        }

        .price-list-page.dark-bg-section .price-list-product__image-frame {
          border-color: rgba(212, 165, 116, 0.3);
          background: #111b37;
        }

        .price-list-page.dark-bg-section .price-list-product__name {
          color: white;
        }

        .price-list-page.dark-bg-section .price-list-product__tamil-name,
        .price-list-page.dark-bg-section .price-list-product__total-label {
          color: #d1d5db;
        }

        .price-list-page.dark-bg-section .price-list-product__sale-price,
        .price-list-page.dark-bg-section .price-list-product__total strong {
          color: var(--gold);
        }

        .price-list-page.dark-bg-section .price-list-product__original-price {
          color: #9ca3af;
        }

        .price-list-page.dark-bg-section .price-list-product__quantity {
          border-color: rgba(255, 255, 255, 0.18);
        }

        .price-list-page.dark-bg-section .price-list-product__quantity-value {
          background: #fff;
          color: #284144;
        }

        .price-list-page.dark-bg-section .price-list-notice,
        .price-list-page.dark-bg-section .price-list-state {
          border-color: rgba(212, 165, 116, 0.3);
          background: rgba(19, 31, 58, 0.9);
          color: #d1d5db;
        }

        @media (min-width: 640px) {
          .price-list-hero {
            padding: 5rem 1.5rem 4rem;
          }

          .price-list-page.dark-bg-section .price-list-catalogue {
            padding-top: 3rem;
          }

          .price-list-page.dark-bg-section .price-list-category__title {
            font-size: 1.25rem;
          }
        }
      `}</style>
      </div>
    </>
  );
}
