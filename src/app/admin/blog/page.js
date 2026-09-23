'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Alert, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

export default function BlogAdminPage() {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '📝',
    content: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    socialMedia: '',
    socialLink: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();
      setBlogPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      showAlert(`Error fetching blog posts: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleOpenDialog = (post = null) => {
    if (post) {
      setFormData({
        title: post.title || '',
        image: post.image || '📝',
        content: post.content || '',
        author: post.author || '',
        date: post.date || new Date().toISOString().split('T')[0],
        socialMedia: post.socialMedia || '',
        socialLink: post.socialLink || '',
      });
      setEditingId(post.id);
    } else {
      setFormData({
        title: '',
        image: '📝',
        content: '',
        author: '',
        date: new Date().toISOString().split('T')[0],
        socialMedia: '',
        socialLink: '',
      });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      title: '',
      image: '📝',
      content: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      socialMedia: '',
      socialLink: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showAlert('Please enter a blog post title', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        ...(editingId && { id: editingId }),
      };

      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchBlogPosts();
        showAlert(
          editingId
            ? '✓ Post updated successfully!'
            : '✓ Post created successfully!',
          'success'
        );
        handleCloseDialog();
      } else {
        showAlert('Failed to save blog post', 'error');
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      showAlert(`Error saving blog post: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch('/api/blog', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: postId }),
      });

      if (response.ok) {
        fetchBlogPosts();
        showAlert('✓ Blog post deleted successfully!', 'success');
      } else {
        showAlert('Failed to delete blog post', 'error');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      showAlert(`Error deleting blog post: ${error.message}`, 'error');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-800">📝 Blog Management</h1>
          <button
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            + New Blog Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Loading blog posts...</p>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No blog posts yet.</p>
          <button
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold inline-block"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{post.image}</span>
                  <div className="flex gap-2">
                    <IconButton
                      onClick={() => handleOpenDialog(post)}
                      size="small"
                      color="primary"
                      title="Edit post"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(post.id)}
                      size="small"
                      color="error"
                      title="Delete post"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                  {post.title}
                </h3>

                {post.content && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.content}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  {post.author && (
                    <p>
                      <span className="font-semibold">Author:</span> {post.author}
                    </p>
                  )}
                  {post.date && (
                    <p>
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(post.date).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="text-2xl font-bold text-gray-800">
          {editingId ? 'Edit Blog Post' : 'Create New Blog Post'}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            fullWidth
            label="Post Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., How to Choose the Best Crackers?"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Icon/Emoji"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            placeholder="e.g., 🎆"
            inputProps={{ maxLength: '5' }}
            variant="outlined"
            helperText="Enter an emoji or special character"
          />

          <TextField
            fullWidth
            label="Content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Enter the blog post content..."
            variant="outlined"
            multiline
            rows={4}
          />

          <TextField
            fullWidth
            label="Author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="e.g., John Doe"
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            type="date"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            fullWidth
            select
            label="Social Media Platform"
            name="socialMedia"
            value={formData.socialMedia}
            onChange={handleInputChange}
            variant="outlined"
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="youtube">YouTube</MenuItem>
            <MenuItem value="instagram">Instagram</MenuItem>
            <MenuItem value="facebook">Facebook</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Social Media Link"
            name="socialLink"
            value={formData.socialLink}
            onChange={handleInputChange}
            placeholder="e.g., https://www.youtube.com/watch?v=..."
            variant="outlined"
            helperText="Enter the full URL to the social media post/video"
          />
        </DialogContent>
        <DialogActions className="p-4 gap-2">
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
