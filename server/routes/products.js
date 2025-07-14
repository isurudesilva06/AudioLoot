const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validate, productSchema, productUpdateSchema, reviewSchema } = require('../middleware/validation');

// GET /api/products - Get all products with filtering, sorting, and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      brand,
      rating,
      search,
      sort = 'createdAt',
      order = 'desc',
      featured
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    // Rating filter
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }

    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = {};
    
    if (sort === 'price') {
      sortObj.price = sortOrder;
    } else if (sort === 'rating') {
      sortObj['rating.average'] = sortOrder;
    } else if (sort === 'name') {
      sortObj.name = sortOrder;
    } else {
      sortObj.createdAt = sortOrder;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-reviews'),
      Product.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// GET /api/products/categories - Get product categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { 
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const products = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(parseInt(limit))
    .select('-reviews');

    res.status(200).json({
      status: 'success',
      data: { products }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured products'
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('reviews.user', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', protect, authorize('admin'), validate(productSchema), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      status: 'success',
      data: { product },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create product'
    });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', protect, authorize('admin'), validate(productUpdateSchema), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update product'
    });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
});

// POST /api/products/:id/reviews - Add product review
router.post('/:id/reviews', protect, validate(reviewSchema), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this product'
      });
    }

    // Add the review
    await product.addReview(req.user._id, rating, comment);

    res.status(201).json({
      status: 'success',
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Add review error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to add review'
    });
  }
});

// GET /api/products/:id/reviews - Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'reviews.user',
        select: 'firstName lastName'
      });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Paginate reviews
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = product.reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + parseInt(limit));

    const totalReviews = product.reviews.length;
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews'
    });
  }
});

module.exports = router;