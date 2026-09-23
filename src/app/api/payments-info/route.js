import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

const defaultPayments = {
  bankAccount: {
      name: 'Paradise TRADERS',
      accountNo: '45169853237',
      bankName: 'SBI',
      ifscCode: 'SBIN0000975'
    },
    gpay: {
      name: 'Saravanakumar',
      number: '6374254854'
    },
    upi: {
      name: 'Saravanakumar',
      id: 'cnjncdjdk',
      qrCode: null
    },
};

export async function GET() {
  let connection;

  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
      ['payment_info']
    );

    if (rows.length === 0) {
      return NextResponse.json(defaultPayments);
    }

    return NextResponse.json(JSON.parse(rows[0].setting_value));
  } catch (error) {
    console.error('Error fetching payment info:', error);
    return NextResponse.json({ error: 'Failed to fetch payment info' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PUT(request) {
  let connection;

  try {
    const payments = await request.json();

    if (!payments?.bankAccount || !payments?.gpay || !payments?.upi) {
      return NextResponse.json({ error: 'Invalid payment information' }, { status: 400 });
    }

    connection = await getConnection();
    await connection.execute(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      ['payment_info', JSON.stringify(payments)]
    );

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error saving payment info:', error);
    return NextResponse.json({ error: 'Failed to save payment info' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
