import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  let connection;
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    if (rows.length > 0) {
      const admin = rows[0];
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (isPasswordValid) {
        return NextResponse.json({ success: true, username: admin.username });
      }
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
