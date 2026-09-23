import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getConnection, getPool } from '@/lib/db';
import { resizeAndConvertToBase64 } from '@/lib/imageProcessor';

async function storePriceListPdf(priceListPdf) {
  if (!priceListPdf) return null;
  if (!priceListPdf.startsWith('data:application/pdf;base64,')) return priceListPdf;

  const base64Data = priceListPdf.slice('data:application/pdf;base64,'.length);
  const uploadsDirectory = path.join(process.cwd(), 'public', 'uploads');
  const filename = `price-list-${Date.now()}.pdf`;
  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(path.join(uploadsDirectory, filename), Buffer.from(base64Data, 'base64'));

  return `/uploads/${filename}`;
}

export async function GET(request) {
  try {
    const pool = getPool();
    const fields = new URL(request.url).searchParams.get('fields')?.split(',').filter((field) => (
      ['company_name', 'phone_number', 'price_list_pdf'].includes(field)
    ));
    const selectedFields = fields?.length
      ? fields.join(', ')
      : 'id, company_name, phone_number, gst_number, email, address, website, logo, price_list_pdf, latitude, longitude, business_hours, facebook_url, instagram_url, youtube_url, whatsapp_url';
    const [rows] = await pool.execute(
      `SELECT ${selectedFields} FROM company_info LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Company info not found' }, { status: 404 });
    }

    const companyInfo = rows[0];
    // Parse business_hours if it's a JSON string
    if (companyInfo.business_hours && typeof companyInfo.business_hours === 'string') {
      try {
        companyInfo.business_hours = JSON.parse(companyInfo.business_hours);
      } catch (e) {
        console.warn('Failed to parse business_hours JSON:', e);
      }
    }

    return NextResponse.json(companyInfo, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Error fetching company info:', error);
    return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 });
  }
}

export async function PUT(request) {
  let connection;
  try {
    const data = await request.json();
    let { company_name, phone_number, gst_number, email, address, website, logo, price_list_pdf, latitude, longitude, business_hours, facebook_url, instagram_url, youtube_url, whatsapp_url } = data;
    const normalizeSocialUrl = (value, allowPhoneNumber = false) => {
      const trimmedValue = typeof value === 'string' ? value.trim() : '';

      if (!trimmedValue) return '';

      if (allowPhoneNumber && /^[+\d\s()-]+$/.test(trimmedValue)) {
        const phoneNumber = trimmedValue.replace(/\D/g, '');
        return phoneNumber ? `https://wa.me/${phoneNumber}` : '';
      }

      try {
        const url = new URL(trimmedValue);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
      } catch {
        return '';
      }
    };

    facebook_url = normalizeSocialUrl(facebook_url);
    instagram_url = normalizeSocialUrl(instagram_url);
    youtube_url = normalizeSocialUrl(youtube_url);
    whatsapp_url = normalizeSocialUrl(whatsapp_url, true);

    // Resize logo to standardized size (300x300)
    if (logo && typeof logo === 'string') {
      logo = await resizeAndConvertToBase64(logo, 'image/jpeg', 300, 300);
    }

    price_list_pdf = await storePriceListPdf(price_list_pdf);

    connection = await getConnection();

    // Check if company info exists
    const [rows] = await connection.execute('SELECT id FROM company_info LIMIT 1');

    // Convert business_hours to JSON string if it's an object
    const businessHoursJson = business_hours ? JSON.stringify(business_hours) : null;

    if (rows.length === 0) {
      // Insert if doesn't exist
      const query = `
        INSERT INTO company_info (company_name, phone_number, gst_number, email, address, website, logo, price_list_pdf, latitude, longitude, business_hours, facebook_url, instagram_url, youtube_url, whatsapp_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await connection.execute(query, [company_name, phone_number, gst_number, email, address, website, logo, price_list_pdf || null, latitude || null, longitude || null, businessHoursJson, facebook_url, instagram_url, youtube_url, whatsapp_url]);
      return NextResponse.json({
        id: result.insertId,
        company_name,
        phone_number,
        gst_number,
        email,
        address,
        website,
        logo,
        price_list_pdf,
        latitude,
        longitude,
        business_hours: business_hours || null,
        facebook_url,
        instagram_url,
        youtube_url,
        whatsapp_url,
      }, { status: 201 });
    } else {
      // Update existing
      const query = `
        UPDATE company_info
        SET company_name = ?, phone_number = ?, gst_number = ?, email = ?, address = ?, website = ?, logo = ?, price_list_pdf = ?, latitude = ?, longitude = ?, business_hours = ?, facebook_url = ?, instagram_url = ?, youtube_url = ?, whatsapp_url = ?
        WHERE id = ?
      `;
      await connection.execute(query, [company_name, phone_number, gst_number, email, address, website, logo, price_list_pdf || null, latitude || null, longitude || null, businessHoursJson, facebook_url, instagram_url, youtube_url, whatsapp_url, rows[0].id]);
      return NextResponse.json({
        id: rows[0].id,
        company_name,
        phone_number,
        gst_number,
        email,
        address,
        website,
        logo,
        price_list_pdf,
        latitude,
        longitude,
        business_hours: business_hours || null,
        facebook_url,
        instagram_url,
        youtube_url,
        whatsapp_url,
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error updating company info:', error);
    return NextResponse.json({ error: `Failed to update company info: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
