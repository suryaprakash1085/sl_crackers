import { getConnection } from '@/lib/db';

export async function GET(request) {
  let connection;
  try {
    connection = await getConnection();
    const [posts] = await connection.execute(
      'SELECT * FROM blog ORDER BY date DESC, created_at DESC'
    );
    await connection.end();
    
    return Response.json(posts || []);
  } catch (error) {
    if (connection) await connection.end().catch(() => {});
    console.error('Error fetching blog posts:', error);
    return Response.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let connection;
  try {
    connection = await getConnection();
    const data = await request.json();

    const { id, title, content, image, author, date, socialMedia, socialLink } = data;

    if (!title) {
      await connection.end();
      return Response.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (id) {
      // Update existing post
      await connection.execute(
        'UPDATE blog SET title = ?, content = ?, image = ?, author = ?, date = ?, socialMedia = ?, socialLink = ? WHERE id = ?',
        [title, content || '', image || '📝', author || '', date || new Date().toISOString().split('T')[0], socialMedia || null, socialLink || null, id]
      );
    } else {
      // Create new post
      await connection.execute(
        'INSERT INTO blog (title, content, image, author, date, socialMedia, socialLink) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, content || '', image || '📝', author || '', date || new Date().toISOString().split('T')[0], socialMedia || null, socialLink || null]
      );
    }

    await connection.end();

    return Response.json(
      { success: true, message: 'Blog post saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (connection) await connection.end().catch(() => {});
    console.error('Error saving blog post:', error);
    return Response.json(
      { error: 'Failed to save blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  let connection;
  try {
    connection = await getConnection();
    const data = await request.json();
    const { id } = data;

    if (!id) {
      await connection.end();
      return Response.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await connection.execute(
      'DELETE FROM blog WHERE id = ?',
      [id]
    );

    await connection.end();
    
    return Response.json(
      { success: true, message: 'Blog post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (connection) await connection.end().catch(() => {});
    console.error('Error deleting blog post:', error);
    return Response.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
