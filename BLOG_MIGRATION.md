# Blog Table Migration Guide

Your blog system has been updated to use a dedicated `blog` table in the database instead of storing data in the `settings` table.

## What Changed?

✅ **New Dedicated Blog Table**
- Table name: `blog`
- Columns: `id`, `title`, `content`, `image`, `author`, `date`, `created_at`, `updated_at`

✅ **New Blog API**
- Endpoint: `/api/blog`
- Supports GET (fetch all), POST (create/update), DELETE (remove)

✅ **Updated Admin Page**
- Uses the new `/api/blog` endpoint

✅ **Updated Homepage**
- Fetches blog posts from the new `/api/blog` endpoint

## How to Run the Migration

Run this command in your terminal:

```bash
npm run init:db
```

Then run the migration script:

```bash
node src/scripts/create-blog-table.js
```

This will:
1. ✅ Create the new `blog` table
2. ✅ Migrate existing blog posts from `settings` table to `blog` table
3. ✅ Keep your existing blog posts safe

## Database Structure

```sql
CREATE TABLE blog (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  image VARCHAR(255),
  author VARCHAR(255),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

## After Migration

- Go to `http://localhost:3000/#/admin/blog`
- Create, edit, and delete blog posts
- All data is now stored in the dedicated `blog` table
- No need to refresh the homepage anymore (automatic updates coming soon!)

## Rollback

If you need to go back, the old blog data is still in the `settings` table under `blog_posts_data` key.
