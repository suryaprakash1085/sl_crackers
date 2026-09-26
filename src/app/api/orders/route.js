import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';


export async function POST(request) {
  let connection;
  try {
    const orderData = await request.json();
    const {
      customerName,
      phone,
      email,
      address,
      paymentStatus = 'Unpaid',
      status = 'not packing',
      totalAmount,
      itemCount,
      items,
    } = orderData;

    connection = await getConnection();
    await connection.beginTransaction();

    // Insert into orders table
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (customer_name, phone, email, address, total_amount, item_count, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerName, phone, email, address, totalAmount, itemCount, paymentStatus, status]
    );

    const orderId = orderResult.insertId;
    if (!orderId || Number(orderId) < 1) {
      throw new Error('The database did not generate a valid order ID. Run the order ID migration.');
    }
    const invoiceNumber = `invno ${String(orderId).padStart(8, '0')}`;

    // Update invoice number
    await connection.execute(
      'UPDATE orders SET invoice_number = ? WHERE id = ?',
      [invoiceNumber, orderId]
    );

    // Insert into order_items table
    for (const item of items) {
      const price = Number.parseFloat(String(item.originalPrice ?? item.price ?? '').replace(/[₹,\s]/g, '')) || 0;
      const salePrice = Number.parseFloat(String(item.discountPrice ?? item.salePrice ?? item.price ?? '').replace(/[₹,\s]/g, '')) || 0;
      const suppliedDiscount = Number.parseFloat(item.discountPercent);
      const discountPercent = Number.isFinite(suppliedDiscount)
        ? suppliedDiscount
        : price > 0 ? Math.max(0, ((price - salePrice) / price) * 100) : 0;

      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price, discount_price, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.id || null, item.name, item.quantity, price, salePrice, discountPercent]
      );
    }

    await connection.commit();

    await connection.end();

    return NextResponse.json({ success: true, orderId, invoiceNumber });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('Error creating order:', error);
    return NextResponse.json({ error: `Failed to create order: ${error.message}` }, { status: 500 });
  }
}

export async function PATCH(request) {
  let connection;
  try {
    const { orderId, status, paymentStatus, customerDetails, items } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    connection = await getConnection();
    await connection.beginTransaction();

    // Update order status and payment status
    if (status || paymentStatus || customerDetails) {
      let updateQuery = 'UPDATE orders SET';
      const updateValues = [];
      const updateFields = [];

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (paymentStatus) {
        updateFields.push('payment_status = ?');
        updateValues.push(paymentStatus);
      }

      if (customerDetails) {
        if (customerDetails.customer_name) {
          updateFields.push('customer_name = ?');
          updateValues.push(customerDetails.customer_name);
        }
        if (customerDetails.phone) {
          updateFields.push('phone = ?');
          updateValues.push(customerDetails.phone);
        }
        if (customerDetails.email) {
          updateFields.push('email = ?');
          updateValues.push(customerDetails.email);
        }
        if (customerDetails.address) {
          updateFields.push('address = ?');
          updateValues.push(customerDetails.address);
        }
      }

      if (updateFields.length > 0) {
        updateQuery += ' ' + updateFields.join(', ') + ' WHERE id = ?';
        updateValues.push(orderId);
        await connection.execute(updateQuery, updateValues);
      }
    }

    // Update order items if provided
    if (items && items.length > 0) {
      // Delete existing items
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      // Insert updated items
      for (const item of items) {
        const price = Number.parseFloat(String(item.price ?? '').replace(/[₹,\s]/g, '')) || 0;
        const discount = Number.parseFloat(item.discount ?? item.discountPercent) || 0;
        const suppliedSalePrice = item.discountPrice ?? item.discount_price;
        const salePrice = suppliedSalePrice == null
          ? price * (1 - discount / 100)
          : Number.parseFloat(String(suppliedSalePrice).replace(/[₹,\s]/g, '')) || 0;

        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, product_name, quantity, price, discount_price, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [orderId, item.product_id || null, item.product_name, item.quantity, price, salePrice, discount]
        );
      }

      // Recalculate total amount if items changed (price with percentage discount × quantity)
      const itemTotal = items.reduce((sum, item) => {
        const price = parseFloat(item.price);
        const discountPercent = parseFloat(item.discount) || 0;
        const quantity = item.quantity;
        const discountedPrice = price * (1 - discountPercent / 100);
        return sum + (discountedPrice * quantity);
      }, 0);
      await connection.execute('UPDATE orders SET total_amount = ? WHERE id = ?', [itemTotal, orderId]);
    }

    await connection.commit();
    await connection.end();

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.end();
    }
    console.error('Error updating order:', error);
    return NextResponse.json({ error: `Failed to update order: ${error.message}` }, { status: 500 });
  }
}

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const searchQuery = searchParams.get('search');

    connection = await getConnection();

    if (orderId) {
      // Fetch specific order with items
      const [orderData] = await connection.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      if (orderData.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const [orderItems] = await connection.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId]
      );

      const [companyInfo] = await connection.execute('SELECT * FROM company_info LIMIT 1');

      return NextResponse.json({
        order: orderData[0],
        items: orderItems,
        company: companyInfo[0] || null
      });
    } else if (searchQuery) {
      // Search orders by customer name or phone
      const searchTerm = `%${searchQuery}%`;
      const [orders] = await connection.execute(
        "SELECT * FROM orders WHERE customer_name LIKE ? OR phone LIKE ? ORDER BY FIELD(status, 'delivered', 'on the way', 'packed', 'not packing') ASC, created_at DESC",
        [searchTerm, searchTerm]
      );

      return NextResponse.json(orders);
    } else {
      // Fetch all orders
      const [orders] = await connection.execute(
        "SELECT * FROM orders ORDER BY FIELD(status, 'delivered', 'on the way', 'packed', 'not packing') ASC, created_at DESC"
      );

      return NextResponse.json(orders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: `Failed to fetch orders: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}
