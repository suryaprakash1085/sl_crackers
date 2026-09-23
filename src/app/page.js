'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import 'scroll-carousel/dist/scroll.carousel.min.css';
import { useCart } from './context/CartContext';
import { getPublicJson } from '@/lib/publicJson';
import soundOne from '../music/1.mp3';
import soundTwo from '../music/2.mp3';

const celebrationCategories = [
  'ROCKETS',
  'SPARKLERS',
  'GARLANDS',
  'SPINNING',
  'FOUNTAINS',
  'STRING CRACKERS',
  'BOMBS',
];

const categoryEmoji = ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'];
const fallbackImage = '/window.svg';

function isProductImage(value) {
  return typeof value === 'string'
    && value.length > 0
    && value !== '/window.svg'
    && !/\.gif(?:$|[?#])/i.test(value);
}

function handleImageError(event) {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = fallbackImage;
}

function getProductSalePrice(product) {
  const originalPrice = Number.parseFloat(product.price) || 0;
  const salePrice = Number.parseFloat(product.price_80);
  return Number.isFinite(salePrice) ? salePrice : originalPrice * 0.8;
}

function formatPrice(value) {
  const price = Number.parseFloat(String(value).replace(/[₹,\s]/g, ''));
  return Number.isFinite(price) ? `₹${price.toFixed(2)}` : 'View price';
}

export default function Home() {
  const router = useRouter();
  const { addToCart, setShowCart } = useCart();
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});
  const [brands, setBrands] = useState([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({});
  const [aboutImage, setAboutImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [homeDataLoading, setHomeDataLoading] = useState(true);
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(12);

  const arrivalsTrackRef = useRef(null);
  const soundIndexRef = useRef(0);
  const activeAudioRef = useRef(null);

  useEffect(() => {
    if (window.location.hash.startsWith('#/admin')) return;

    const loadHomeData = async () => {
      try {
        const [productsData, sectionsData, carouselData, companyData, settingsData] = await Promise.all([
          getPublicJson('/api/products?imageSize=thumb'),
          getPublicJson('/api/sections?imageSize=card'),
          getPublicJson('/api/carousel'),
          getPublicJson('/api/company-info?fields=company_name'),
          getPublicJson('/api/settings?scope=home', { cache: 'no-store' }).catch((error) => {
            console.error('Unable to load homepage settings:', error);
            return {};
          }),
        ]);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
        setCarouselImages(Array.isArray(carouselData) ? carouselData : []);
        setCategoryImages(settingsData?.categoryImages || {});
        setBrands(Array.isArray(settingsData?.brands) ? settingsData.brands : []);
        setAboutImage(settingsData?.aboutUsImage || settingsData?.homePageDecoration || null);
        setBrandsLoaded(true);
        setCompanyInfo(companyData || {});
      } catch (error) {
        console.error('Unable to load homepage data:', error);
        setBrandsLoaded(true);
      } finally {
        setHomeDataLoading(false);
      }
    };
    loadHomeData();
  }, []);

  useEffect(() => {
    if (carouselImages.length < 2) return undefined;
    const timer = window.setInterval(() => setCurrentImage((index) => (index + 1) % carouselImages.length), 4500);
    return () => window.clearInterval(timer);
  }, [carouselImages.length]);

  const arrivals = useMemo(() => {
    const sectionProducts = sections.flatMap((section) => section.products || []);
    const sourceProducts = sectionProducts.length ? sectionProducts : products;
    const seenProducts = new Set();

    return sourceProducts.filter((product) => {
      const image = product.image_thumbnail || product.image;
      const productKey = product.id ?? product.name;
      if (!productKey || !product.name || !isProductImage(image) || seenProducts.has(productKey)) return false;
      seenProducts.add(productKey);
      return true;
    });
  }, [products, sections]);

  const enabledCategoryNames = useMemo(() => {
    const configured = new Map(
      Object.entries(categoryImages).map(([category, value]) => [category.trim().toUpperCase(), value]),
    );
    const availableCategories = new Set(
      [...arrivals, ...products]
        .map((product) => product.category?.trim().toUpperCase())
        .filter(Boolean),
    );
    const names = new Set();

    configured.forEach((value, category) => {
      const enabled = typeof value === 'string' ? Boolean(value) : value?.enabled !== false;
      if (enabled) names.add(category);
    });

    availableCategories.forEach((category) => {
      if (!configured.has(category) && celebrationCategories.includes(category)) names.add(category);
    });

    return names;
  }, [arrivals, categoryImages, products]);

  const visibleArrivals = useMemo(() => {
    if (Object.keys(categoryImages).length === 0) return arrivals;

    const seenProducts = new Set();
    return [...arrivals, ...products].filter((product) => {
      const category = product.category?.trim().toUpperCase();
      const productKey = product.id ?? product.name;
      const image = product.image_thumbnail || product.image;
      if (!enabledCategoryNames.has(category) || !isProductImage(image) || seenProducts.has(productKey)) return false;
      seenProducts.add(productKey);
      return true;
    });
  }, [arrivals, categoryImages, enabledCategoryNames, products]);

  const playProductSound = () => {
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

  const addProductToCart = (product) => {
    playProductSound();
    addToCart({ ...product, price: getProductSalePrice(product), quantity: 1 });
    setShowCart(true);
  };

  useEffect(() => {
    if (visibleArrivals.length < 2) return undefined;
    let carousel;
    let active = true;
    let frameId = 0;
    let slider;
    let viewport;
    let position = 0;
    let loopWidth = 0;
    let lastTime = 0;
    let paused = false;

    const readPosition = () => {
      const transform = window.getComputedStyle(slider).transform;
      const match = transform.match(/matrix3d\(([^)]+)\)/);
      if (match) return Math.max(0, -(Number.parseFloat(match[1].split(',')[12]) || 0));
      const matrix = transform.match(/matrix\(([^)]+)\)/);
      return matrix ? Math.max(0, -(Number.parseFloat(matrix[1].split(',')[4]) || 0)) : position;
    };

    const animate = (time) => {
      if (!active) return;
      if (!lastTime) lastTime = time;
      const elapsed = Math.min(time - lastTime, 48);
      lastTime = time;
      if (!paused && slider && loopWidth > 0) {
        position += elapsed * 0.035;
        if (position >= loopWidth) position -= loopWidth;
        slider.style.transform = `translate3d(${-position}px, 0, 0)`;
      }
      frameId = window.requestAnimationFrame(animate);
    };

    const pause = () => {
      paused = true;
    };

    const resume = () => {
      if (!slider) return;
      position = readPosition();
      paused = false;
      lastTime = performance.now();
    };

    import('scroll-carousel').then(({ default: ScrollCarousel }) => {
      if (!active) return;
      carousel = new ScrollCarousel('.my-carousel', {
        speed: 7,
        smartSpeed: false,
        autoplay: false,
        direction: 'rtl',
        on: {
          ready: () => {
            viewport = arrivalsTrackRef.current?.querySelector('.scroll-carousel-viewport');
            slider = viewport?.querySelector('.scroll-carousel-slider');
            if (!slider || !viewport) return;
            slider.style.willChange = 'transform';
            loopWidth = slider.scrollWidth / 2;
            viewport.addEventListener('pointerdown', pause, { passive: true });
            viewport.addEventListener('pointerup', resume, { passive: true });
            viewport.addEventListener('pointercancel', resume, { passive: true });
            frameId = window.requestAnimationFrame(animate);
          },
        },
      });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      viewport?.removeEventListener('pointerdown', pause);
      viewport?.removeEventListener('pointerup', resume);
      viewport?.removeEventListener('pointercancel', resume);
      if (slider) slider.style.willChange = '';
      if (carousel?.viewport?.isConnected) carousel.destroy();
    };
  }, [visibleArrivals]);

  const moveArrivals = (direction) => {
    const track = arrivalsTrackRef.current;
    const viewport = track?.querySelector('.scroll-carousel-viewport');
    if (!viewport) return;
    viewport.scrollBy({ left: direction * viewport.clientWidth / 3, behavior: 'smooth' });
  };

  const categoryImageByName = useMemo(() => {
    const images = new Map(celebrationCategories.map((category) => [category, null]));
    Object.entries(categoryImages).forEach(([category, value]) => {
      const normalizedCategory = category.trim().toUpperCase();
      const image = typeof value === 'string' ? value : value?.image;
      const enabled = typeof value === 'string' ? Boolean(image) : value?.enabled !== false;
      if (enabled) images.set(normalizedCategory, image || null);
      else images.delete(normalizedCategory);
    });
    return images;
  }, [categoryImages]);

  const categoryProductByName = useMemo(() => {
    const seenProducts = new Set();
    return new Map(
      [...products, ...visibleArrivals]
        .filter((product) => {
          const category = product.category?.trim().toUpperCase();
          const productKey = product.id ?? product.name;
          if (!category || !productKey || seenProducts.has(productKey)) return false;
          seenProducts.add(productKey);
          return true;
        })
        .map((product) => [product.category.trim().toUpperCase(), product]),
    );
  }, [products, visibleArrivals]);
  const categories = useMemo(
    () => Array.from(categoryImageByName.keys()).filter((category) => categoryProductByName.has(category)),
    [categoryImageByName, categoryProductByName],
  );

  const getCategoryImage = (name) => categoryImageByName.get(name.trim().toUpperCase());

  const heroImage = carouselImages[currentImage]?.image_url || carouselImages[currentImage]?.image || fallbackImage;
  const companyName = companyInfo.company_name || 'Sivakasi Mart Traders';

  return (
    <main className="paradise-home">
      <section className="paradise-hero">
        <img
          src={heroImage}
          alt={`${companyName} fireworks`}
          className="paradise-hero__image"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(event) => {
            handleImageError(event);
          }}
        />
      </section>

      {homeDataLoading ? (
        <section className="paradise-arrivals paradise-arrivals--loading" aria-label="Loading new arrivals">
          <div className="paradise-section-heading paradise-section-heading--light">
            <span>NEW ARRIVALS</span><h2>Fresh From Our Collection</h2>
          </div>
          <div className="paradise-arrivals__loading-track" aria-hidden="true">
            {[1, 2, 3, 4].map((item) => <div className="arrival-card arrival-card--skeleton" key={item}><div /><span /><span /></div>)}
          </div>
        </section>
      ) : arrivals.length > 0 && (
        <section className="paradise-arrivals">
          <div className="paradise-section-heading paradise-section-heading--light">
            <span>NEW ARRIVALS</span><h2>Fresh From Our Collection</h2>
          </div>
          <div className="paradise-arrivals__carousel">
            <button className="paradise-arrivals__control paradise-arrivals__control--previous" type="button" aria-label="Previous new arrivals" onClick={() => moveArrivals(-1)}>‹</button>
            <div className="paradise-arrivals__track my-carousel" ref={arrivalsTrackRef}>
            {visibleArrivals.map((product, index) => (
              <article className="arrival-card" key={`${product.id || product.name}-${index}`} onClick={() => router.push('/price-list')}>
                <div className="arrival-card__image">
                  {isProductImage(product.image_thumbnail || product.image) ? <img src={product.image_thumbnail || product.image} alt={product.name} loading="lazy" decoding="async" onError={handleImageError} /> : <span className="arrival-card__fallback">{categoryEmoji[0]}</span>}
                  <span className="arrival-card__discount">75% OFF</span>
                </div>
                <div className="arrival-card__body">
                  <h3>{product.name}</h3><strong>{formatPrice(getProductSalePrice(product))}</strong>
                  <button type="button" onClick={(event) => { event.stopPropagation(); addProductToCart(product); }}>ADD TO CART →</button>
                </div>
              </article>
            ))}
            </div>
            <button className="paradise-arrivals__control paradise-arrivals__control--next" type="button" aria-label="Next new arrivals" onClick={() => moveArrivals(1)}>›</button>
          </div>

          <button className="paradise-outline-button" type="button" onClick={() => router.push('/price-list')}>Explore All Products <span>→</span></button>
        </section>
      )}

      {brandsLoaded && brands.length > 0 && <section className="paradise-brands">
        <div className="paradise-section-heading"><span>QUALITY YOU CAN TRUST</span><h2>OUR TRUSTED <strong>BRANDS</strong></h2></div>
        <div className="brand-grid">
          {brands.slice(0, 8).map((brand, index) => {
            const name = typeof brand === 'string' ? brand : brand.name;
            const logo = typeof brand === 'string' ? null : brand.logo;
            return <div className="brand-tile" key={`${name}-${index}`}>
              {logo && <img src={logo} alt={name} loading="lazy" decoding="async" onError={handleImageError} />}
              <span>{name}</span>
            </div>;
          })}
        </div>
      </section>}

      <section className="paradise-products">
        <div className="paradise-section-heading paradise-products__heading"><span>EXPLOSIVE RANGE</span><h2>OUR <strong>PRODUCT CATEGORIES</strong></h2><i aria-hidden="true" /><p>Explore our wide variety of premium quality fireworks &amp; crackers</p></div>
        <div className="category-grid">
          {categories.slice(0, visibleCategoryCount).map((category, index) => {
            const image = getCategoryImage(category);
            const categoryProduct = categoryProductByName.get(category.trim().toUpperCase());
            return <article className="category-card" key={category} onClick={() => router.push(`/price-list?category=${encodeURIComponent(category.toUpperCase())}`)}>
              <div className="category-card__image">
                {image ? <img src={image} alt={category} loading="lazy" decoding="async" onError={handleImageError} /> : <span aria-hidden="true">{categoryEmoji[index % categoryEmoji.length]}</span>}
                <small>{index % 3 === 0 ? 'Popular Choice' : 'Best Seller'}</small>
              </div>
              <div className="category-card__body"><h3>{category}</h3><button type="button" disabled={!categoryProduct} onClick={(event) => { event.stopPropagation(); if (categoryProduct) addProductToCart(categoryProduct); }}>ADD TO CART <span>→</span></button></div>
            </article>;
          })}
        </div>
        {visibleCategoryCount < categories.length && (
          <button className="paradise-load-more" type="button" onClick={() => setVisibleCategoryCount((count) => count + 12)}>
            Load More Products <span>↓</span>
          </button>
        )}
      </section>

      <section className="paradise-about">
        <div className="paradise-section-heading paradise-about__heading"><span>SIVAKASI&apos;S PREMIER FIREWORKS STORE</span><h2>ABOUT <strong>Sivakasi Mart Traders</strong></h2><i aria-hidden="true" /><p>Spreading light, joy &amp; festive sparkles across India for over two decades</p></div>
        <div className="paradise-about__layout">
          <div className="paradise-about__banner" style={{ backgroundImage: `url(${aboutImage || heroImage})` }}><strong>{companyName}</strong><span>Bringing celebrations to life</span></div>
          <div className="paradise-about__copy"><h3>We Are The Leading Supplier Of Superior Fireworks &amp; Fancy Crackers</h3><p>With a carefully selected range, dependable service and quality products, {companyName} helps families light up every special occasion.</p><div className="about-points"><span>✓ Direct Factory Rates</span><span>✓ Green &amp; Safe Crackers</span><span>✓ Pan-India Dispatch</span></div></div>
        </div>
        <div className="about-stats"><div><strong>20+</strong><span>Years In Business</span></div><div><strong>200+</strong><span>Cracker Varieties</span></div><div><strong>1000+</strong><span>Happy Customers</span></div></div>
        <button className="paradise-cta" type="button" onClick={() => router.push('/price-list')}>Ready To Light Up Your Celebration? <span>Explore Products →</span></button>
      </section>
    </main>
  );
}
