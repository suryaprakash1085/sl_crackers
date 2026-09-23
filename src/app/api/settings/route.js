import { NextResponse } from 'next/server';
import { getConnection, getPool } from '@/lib/db';

const categoryImageSettingPrefix = 'celebration_category_image_';
const categoryOrderSettingKey = 'price_list_category_order';

export async function GET(request) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get('fresh') === '1';
    const allSettingKeys = ['price_list_style', 'home_page_decoration', 'home_page_decoration_left', 'home_page_decoration_right', 'about_us_image', 'home_page_banners', 'home_page_brands', 'navbar_color', 'dark_background_color', 'navy_background_color', 'gold_accent_color', 'paradise_text', 'paradise_background_color', 'testimonial_data', 'blog_posts_data', 'show_paradise_animation', 'show_carousel_images', 'price_list_category_color', 'price_list_table_header_color', 'decoration_position_top', 'decoration_position_left', 'testimonial_background_color', 'celebration_category_images', categoryOrderSettingKey];
    const homeSettingKeys = ['home_page_decoration', 'about_us_image', 'home_page_brands', 'celebration_category_images'];
    const requestedKeys = searchParams.get('scope') === 'home'
      ? homeSettingKeys
      : searchParams.get('scope') === 'navbar'
        ? ['navbar_color']
        : allSettingKeys;
    const includeCategoryImageSettings = requestedKeys.includes('celebration_category_images');
    const categoryImageCondition = includeCategoryImageSettings ? ' OR setting_key LIKE ?' : '';
    const queryParams = includeCategoryImageSettings
      ? [...requestedKeys, `${categoryImageSettingPrefix}%`]
      : requestedKeys;
    const [settings] = await pool.execute(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${requestedKeys.map(() => '?').join(', ')})${categoryImageCondition}`,
      queryParams
    );
    const categoryImageUpdates = {};
    const result = {
      style: 'table',
      homePageDecoration: null,
      homePageDecorationLeft: null,
      homePageDecorationRight: null,
      aboutUsImage: null,
      decorationPositionTop: '1rem',
      decorationPositionLeft: '1rem',
      navbarColor: '#1d4f4f',
      testimonialBackgroundColor: '#1d4f4f',
      darkBackground: '#0f1e3d',
      navyBackground: '#1a2847',
      goldAccent: '#d4a574',
      paradiseText: 'PARADISE',
      paradiseBackgroundColor: '#f3f4f6',
      showParadiseAnimation: true,
      showCarouselImages: true,
      priceListCategoryColor: '#a855f7',
      priceListTableHeaderColor: '#9333ea',
      categoryImages: {},
      categoryOrder: [],
      testimonial: {
        title: 'CRACKERS INDIA',
        heading: 'Client Says About Us',
        quote: 'We have been sourcing crackers from Paradise Crackers for the past 5 years. The quality is consistently excellent, and their customer service is outstanding. They have helped us grow our business significantly.',
        attribution: 'Satisfied Customer'
      },
      brands: ['Renu Crackers', 'Mightloads', 'Sri Aravind', 'Ramesh'],
      banners: [
        {
          id: 1,
          title: 'Perfect Collection',
          subtitle: 'Customize & Diwali',
          gradientFrom: 'from-green-700',
          gradientTo: 'to-green-900',
        },
        {
          id: 2,
          title: 'Festival',
          subtitle: 'Sale on All Items',
          gradientFrom: 'from-yellow-500',
          gradientTo: 'to-yellow-700',
        },
        {
          id: 3,
          title: 'Special Offer',
          subtitle: 'Limited Time Only',
          gradientFrom: 'from-orange-500',
          gradientTo: 'to-orange-700',
        },
      ],
    };

    settings.forEach(setting => {
      if (setting.setting_key === 'price_list_style') {
        result.style = setting.setting_value;
      } else if (setting.setting_key === 'home_page_decoration') {
        result.homePageDecoration = setting.setting_value;
      } else if (setting.setting_key === 'home_page_decoration_left') {
        result.homePageDecorationLeft = setting.setting_value;
      } else if (setting.setting_key === 'home_page_decoration_right') {
        result.homePageDecorationRight = setting.setting_value;
      } else if (setting.setting_key === 'about_us_image') {
        result.aboutUsImage = setting.setting_value;
      } else if (setting.setting_key === 'home_page_banners') {
        try {
          result.banners = JSON.parse(setting.setting_value);
        } catch (e) {
          console.error('Error parsing banners JSON:', e);
        }
      } else if (setting.setting_key === 'home_page_brands') {
        try {
          result.brands = JSON.parse(setting.setting_value);
        } catch (e) {
          console.error('Error parsing brands JSON:', e);
        }
      } else if (setting.setting_key === 'celebration_category_images') {
        try {
          result.categoryImages = JSON.parse(setting.setting_value);
        } catch (e) {
          console.error('Error parsing category images JSON:', e);
        }
      } else if (setting.setting_key === categoryOrderSettingKey) {
        try {
          const parsedOrder = JSON.parse(setting.setting_value);
          result.categoryOrder = Array.isArray(parsedOrder) ? parsedOrder : [];
        } catch (e) {
          console.error('Error parsing category order JSON:', e);
        }
      } else if (setting.setting_key.startsWith(categoryImageSettingPrefix)) {
        try {
          const category = setting.setting_key.slice(categoryImageSettingPrefix.length);
          if (category) categoryImageUpdates[category] = JSON.parse(setting.setting_value);
        } catch (e) {
          console.error('Error parsing category image JSON:', e);
        }
      } else if (setting.setting_key === 'navbar_color') {
        result.navbarColor = setting.setting_value;
      } else if (setting.setting_key === 'testimonial_background_color') {
        result.testimonialBackgroundColor = setting.setting_value;
      } else if (setting.setting_key === 'dark_background_color') {
        result.darkBackground = setting.setting_value;
      } else if (setting.setting_key === 'navy_background_color') {
        result.navyBackground = setting.setting_value;
      } else if (setting.setting_key === 'gold_accent_color') {
        result.goldAccent = setting.setting_value;
      } else if (setting.setting_key === 'paradise_text') {
        result.paradiseText = setting.setting_value;
      } else if (setting.setting_key === 'paradise_background_color') {
        result.paradiseBackgroundColor = setting.setting_value;
      } else if (setting.setting_key === 'testimonial_data') {
        try {
          result.testimonial = JSON.parse(setting.setting_value);
          result.testimonial.quote = result.testimonial.quote.replace(/pk crackers/gi, 'Paradise Crackers');
        } catch (e) {
          console.error('Error parsing testimonial JSON:', e);
        }
      } else if (setting.setting_key === 'blog_posts_data') {
        try {
          result.blogPosts = JSON.parse(setting.setting_value);
        } catch (e) {
          console.error('Error parsing blog posts JSON:', e);
        }
      } else if (setting.setting_key === 'show_paradise_animation') {
        result.showParadiseAnimation = setting.setting_value === '1' || setting.setting_value === true;
      } else if (setting.setting_key === 'show_carousel_images') {
        result.showCarouselImages = setting.setting_value === '1' || setting.setting_value === true;
      } else if (setting.setting_key === 'price_list_category_color') {
        result.priceListCategoryColor = setting.setting_value;
      } else if (setting.setting_key === 'price_list_table_header_color') {
        result.priceListTableHeaderColor = setting.setting_value;
      } else if (setting.setting_key === 'decoration_position_top') {
        result.decorationPositionTop = setting.setting_value;
      } else if (setting.setting_key === 'decoration_position_left') {
        result.decorationPositionLeft = setting.setting_value;
      }
    });

    Object.assign(result.categoryImages, categoryImageUpdates);

    return NextResponse.json(result, {
      headers: fresh
        ? { 'Cache-Control': 'no-store' }
        : { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      style: 'table',
      homePageDecoration: null,
      aboutUsImage: null,
      decorationPositionTop: '1rem',
      decorationPositionLeft: '1rem',
      navbarColor: '#1d4f4f',
      testimonialBackgroundColor: '#1d4f4f',
      darkBackground: '#0f1e3d',
      navyBackground: '#1a2847',
      goldAccent: '#d4a574',
      paradiseText: 'PARADISE',
      paradiseBackgroundColor: '#f3f4f6',
      showParadiseAnimation: true,
      showCarouselImages: true,
      priceListCategoryColor: '#a855f7',
      priceListTableHeaderColor: '#9333ea',
      categoryImages: {},
      categoryOrder: [],
      banners: [
        {
          id: 1,
          title: 'Perfect Collection',
          subtitle: 'Customize & Diwali',
          gradientFrom: 'from-green-700',
          gradientTo: 'to-green-900',
        },
        {
          id: 2,
          title: 'Festival',
          subtitle: 'Sale on All Items',
          gradientFrom: 'from-yellow-500',
          gradientTo: 'to-yellow-700',
        },
        {
          id: 3,
          title: 'Special Offer',
          subtitle: 'Limited Time Only',
          gradientFrom: 'from-orange-500',
          gradientTo: 'to-orange-700',
        },
      ],
    });
  }
}

export async function POST(request) {
  let connection;
  try {
    const data = await request.json();
    const { style, homePageDecoration, homePageDecorationLeft, homePageDecorationRight, aboutUsImage, banners, brands, categoryImages, categoryImageUpdate, categoryOrder, navbarColor, testimonialBackgroundColor, darkBackground, navyBackground, goldAccent, paradiseText, paradiseBackgroundColor, testimonial, blogPosts, showParadiseAnimation, showCarouselImages, priceListCategoryColor, priceListTableHeaderColor, decorationPositionTop, decorationPositionLeft } = data;

    if (categoryImageUpdate !== undefined) {
      const category = typeof categoryImageUpdate.category === 'string'
        ? categoryImageUpdate.category.trim().toUpperCase()
        : '';
      if (!category || categoryImageUpdate.value === undefined) {
        return NextResponse.json({ error: 'Invalid category image update' }, { status: 400 });
      }
    }

    connection = await getConnection();

    // Update style if provided
    if (style) {
      if (!['cards', 'table'].includes(style)) {
        return NextResponse.json({ error: 'Invalid style value. Must be "cards" or "table"' }, { status: 400 });
      }

      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['price_list_style']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [style, 'price_list_style']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['price_list_style', style]
        );
      }
    }

    // Update home page decoration if provided
    if (homePageDecoration !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['home_page_decoration']
      );

      if (homePageDecoration === null) {
        // Delete the setting
        if (existing.length > 0) {
          await connection.execute(
            'DELETE FROM settings WHERE setting_key = ?',
            ['home_page_decoration']
          );
        }
      } else {
        // Update or insert
        if (existing.length > 0) {
          await connection.execute(
            'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
            [homePageDecoration, 'home_page_decoration']
          );
        } else {
          await connection.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
            ['home_page_decoration', homePageDecoration]
          );
        }
      }
    }

    // Update home page decoration left if provided
    if (homePageDecorationLeft !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['home_page_decoration_left']
      );

      if (homePageDecorationLeft === null) {
        // Delete the setting
        if (existing.length > 0) {
          await connection.execute(
            'DELETE FROM settings WHERE setting_key = ?',
            ['home_page_decoration_left']
          );
        }
      } else {
        // Update or insert
        if (existing.length > 0) {
          await connection.execute(
            'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
            [homePageDecorationLeft, 'home_page_decoration_left']
          );
        } else {
          await connection.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
            ['home_page_decoration_left', homePageDecorationLeft]
          );
        }
      }
    }

    // Update home page decoration right if provided
    if (homePageDecorationRight !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['home_page_decoration_right']
      );

      if (homePageDecorationRight === null) {
        // Delete the setting
        if (existing.length > 0) {
          await connection.execute(
            'DELETE FROM settings WHERE setting_key = ?',
            ['home_page_decoration_right']
          );
        }
      } else {
        // Update or insert
        if (existing.length > 0) {
          await connection.execute(
            'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
            [homePageDecorationRight, 'home_page_decoration_right']
          );
        } else {
          await connection.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
            ['home_page_decoration_right', homePageDecorationRight]
          );
        }
      }
    }

    // Update About Us image if provided
    if (aboutUsImage !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['about_us_image']
      );

      if (aboutUsImage === null) {
        if (existing.length > 0) {
          await connection.execute(
            'DELETE FROM settings WHERE setting_key = ?',
            ['about_us_image']
          );
        }
      } else if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [aboutUsImage, 'about_us_image']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['about_us_image', aboutUsImage]
        );
      }
    }

    // Update banners if provided
    if (banners !== undefined) {
      const bannersJSON = JSON.stringify(banners);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['home_page_banners']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [bannersJSON, 'home_page_banners']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['home_page_banners', bannersJSON]
        );
      }
    }

    // Update brands if provided
    if (brands !== undefined) {
      const brandsJSON = JSON.stringify(brands);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['home_page_brands']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [brandsJSON, 'home_page_brands']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['home_page_brands', brandsJSON]
        );
      }
    }

    // Update category images if provided
    if (categoryImageUpdate !== undefined) {
      const category = categoryImageUpdate.category.trim().toUpperCase();
      const settingKey = `${categoryImageSettingPrefix}${category}`;
      const categoryImageJSON = JSON.stringify(categoryImageUpdate.value);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        [settingKey]
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [categoryImageJSON, settingKey]
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          [settingKey, categoryImageJSON]
        );
      }
    } else if (categoryImages !== undefined) {
      const categoryImagesJSON = JSON.stringify(categoryImages);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['celebration_category_images']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [categoryImagesJSON, 'celebration_category_images']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['celebration_category_images', categoryImagesJSON]
        );
      }
    }

    if (categoryOrder !== undefined) {
      const normalizedOrder = Array.isArray(categoryOrder)
        ? [...new Set(categoryOrder.map((category) => String(category).trim().replace(/\s+/g, ' ').toUpperCase()).filter(Boolean))]
        : [];
      const categoryOrderJSON = JSON.stringify(normalizedOrder);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        [categoryOrderSettingKey]
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [categoryOrderJSON, categoryOrderSettingKey]
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          [categoryOrderSettingKey, categoryOrderJSON]
        );
      }
    }

    // Update navbar color if provided
    if (navbarColor !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['navbar_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [navbarColor, 'navbar_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['navbar_color', navbarColor]
        );
      }
    }

    // Update testimonial background color if provided
    if (testimonialBackgroundColor !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['testimonial_background_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [testimonialBackgroundColor, 'testimonial_background_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['testimonial_background_color', testimonialBackgroundColor]
        );
      }
    }

    // Update dark background color if provided
    if (darkBackground !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['dark_background_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [darkBackground, 'dark_background_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['dark_background_color', darkBackground]
        );
      }
    }

    // Update navy background color if provided
    if (navyBackground !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['navy_background_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [navyBackground, 'navy_background_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['navy_background_color', navyBackground]
        );
      }
    }

    // Update gold accent color if provided
    if (goldAccent !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['gold_accent_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [goldAccent, 'gold_accent_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['gold_accent_color', goldAccent]
        );
      }
    }

    // Update paradise text if provided
    if (paradiseText !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['paradise_text']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [paradiseText, 'paradise_text']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['paradise_text', paradiseText]
        );
      }
    }

    // Update paradise background color if provided
    if (paradiseBackgroundColor !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['paradise_background_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [paradiseBackgroundColor, 'paradise_background_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['paradise_background_color', paradiseBackgroundColor]
        );
      }
    }

    // Update testimonial if provided
    if (testimonial !== undefined) {
      const testimonialJSON = JSON.stringify(testimonial);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['testimonial_data']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [testimonialJSON, 'testimonial_data']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['testimonial_data', testimonialJSON]
        );
      }
    }

    // Update blog posts if provided
    if (blogPosts !== undefined) {
      const blogPostsJSON = JSON.stringify(blogPosts);
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['blog_posts_data']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [blogPostsJSON, 'blog_posts_data']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['blog_posts_data', blogPostsJSON]
        );
      }
    }

    // Update paradise animation visibility if provided
    if (showParadiseAnimation !== undefined) {
      const value = showParadiseAnimation ? '1' : '0';
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['show_paradise_animation']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [value, 'show_paradise_animation']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['show_paradise_animation', value]
        );
      }
    }

    // Update carousel images visibility if provided
    if (showCarouselImages !== undefined) {
      const value = showCarouselImages ? '1' : '0';
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['show_carousel_images']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [value, 'show_carousel_images']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['show_carousel_images', value]
        );
      }
    }

    // Update price list category color if provided
    if (priceListCategoryColor !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['price_list_category_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [priceListCategoryColor, 'price_list_category_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['price_list_category_color', priceListCategoryColor]
        );
      }
    }

    // Update price list table header color if provided
    if (priceListTableHeaderColor !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['price_list_table_header_color']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [priceListTableHeaderColor, 'price_list_table_header_color']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['price_list_table_header_color', priceListTableHeaderColor]
        );
      }
    }

    // Update decoration position top if provided
    if (decorationPositionTop !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['decoration_position_top']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [decorationPositionTop, 'decoration_position_top']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['decoration_position_top', decorationPositionTop]
        );
      }
    }

    // Update decoration position left if provided
    if (decorationPositionLeft !== undefined) {
      const [existing] = await connection.execute(
        'SELECT id FROM settings WHERE setting_key = ? LIMIT 1',
        ['decoration_position_left']
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          [decorationPositionLeft, 'decoration_position_left']
        );
      } else {
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          ['decoration_position_left', decorationPositionLeft]
        );
      }
    }

    return NextResponse.json({ style, homePageDecoration, homePageDecorationLeft, homePageDecorationRight, aboutUsImage, banners, brands, categoryImages, categoryOrder, navbarColor, testimonialBackgroundColor, darkBackground, navyBackground, goldAccent, paradiseText, paradiseBackgroundColor, testimonial, blogPosts, showParadiseAnimation, showCarouselImages, priceListCategoryColor, priceListTableHeaderColor, decorationPositionTop, decorationPositionLeft }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
