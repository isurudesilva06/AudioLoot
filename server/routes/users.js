const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validate, profileUpdateSchema, addressSchema, cartItemSchema } = require('../middleware/validation');

// GET /api/users/profile - Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cart.product', 'name price images stock')
      .populate('wishlist.product', 'name price images');

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', protect, validate(profileUpdateSchema), async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 
      'gender', 'preferences'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { user },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Failed to update profile'
    });
  }
});

// GET /api/users/addresses - Get user addresses
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    
    res.status(200).json({
      status: 'success',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch addresses'
    });
  }
});

// POST /api/users/addresses - Add new address
router.post('/addresses', protect, validate(addressSchema), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // If this is the first address or marked as default, make it default
    if (user.addresses.length === 0 || req.body.isDefault) {
      // Remove default from other addresses
      user.addresses.forEach(addr => addr.isDefault = false);
      req.body.isDefault = true;
    }
    
    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({
      status: 'success',
      data: { addresses: user.addresses },
      message: 'Address added successfully'
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add address'
    });
  }
});

// PUT /api/users/addresses/:addressId - Update address
router.put('/addresses/:addressId', protect, validate(addressSchema), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    // If setting as default, remove default from others
    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Update address fields
    Object.keys(req.body).forEach(key => {
      address[key] = req.body[key];
    });

    await user.save();

    res.status(200).json({
      status: 'success',
      data: { addresses: user.addresses },
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update address'
    });
  }
});

// DELETE /api/users/addresses/:addressId - Delete address
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    address.remove();

    // If removed address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      data: { addresses: user.addresses },
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete address'
    });
  }
});

// GET /api/users/cart - Get user cart
router.get('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cart.product', 'name price images stock isActive');

    // Filter out inactive products or products that no longer exist
    const activeCartItems = user.cart.filter(item => 
      item.product && item.product.isActive
    );

    // Update cart if items were filtered out
    if (activeCartItems.length !== user.cart.length) {
      user.cart = activeCartItems;
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: { 
        cart: user.cart,
        cartTotal: user.cartTotal,
        cartItemsCount: user.cartItemsCount
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cart'
    });
  }
});

// POST /api/users/cart - Add item to cart
router.post('/cart', protect, validate(cartItemSchema), async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const user = await User.findById(req.user._id);
    await user.addToCart(productId, quantity);
    
    // Populate cart for response
    await user.populate('cart.product', 'name price images stock');

    res.status(200).json({
      status: 'success',
      data: { 
        cart: user.cart,
        cartTotal: user.cartTotal,
        cartItemsCount: user.cartItemsCount
      },
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart'
    });
  }
});

// PUT /api/users/cart/:productId - Update cart item quantity
router.put('/cart/:productId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0 || quantity > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be between 1 and 10'
      });
    }

    const user = await User.findById(req.user._id);
    await user.updateCartQuantity(req.params.productId, quantity);
    
    // Populate cart for response
    await user.populate('cart.product', 'name price images stock');

    res.status(200).json({
      status: 'success',
      data: { 
        cart: user.cart,
        cartTotal: user.cartTotal,
        cartItemsCount: user.cartItemsCount
      },
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cart'
    });
  }
});

// DELETE /api/users/cart/:productId - Remove item from cart
router.delete('/cart/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.removeFromCart(req.params.productId);
    
    // Populate cart for response
    await user.populate('cart.product', 'name price images stock');

    res.status(200).json({
      status: 'success',
      data: { 
        cart: user.cart,
        cartTotal: user.cartTotal,
        cartItemsCount: user.cartItemsCount
      },
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove item from cart'
    });
  }
});

// DELETE /api/users/cart - Clear entire cart
router.delete('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.clearCart();

    res.status(200).json({
      status: 'success',
      data: { 
        cart: [],
        cartTotal: 0,
        cartItemsCount: 0
      },
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cart'
    });
  }
});

// GET /api/users/wishlist - Get user wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist.product', 'name price images isActive');

    // Filter out inactive products
    const activeWishlistItems = user.wishlist.filter(item => 
      item.product && item.product.isActive
    );

    res.status(200).json({
      status: 'success',
      data: { wishlist: activeWishlistItems }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wishlist'
    });
  }
});

// POST /api/users/wishlist/:productId - Add item to wishlist
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.addToWishlist(req.params.productId);
    
    // Populate wishlist for response
    await user.populate('wishlist.product', 'name price images');

    res.status(200).json({
      status: 'success',
      data: { wishlist: user.wishlist },
      message: 'Item added to wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to wishlist'
    });
  }
});

// DELETE /api/users/wishlist/:productId - Remove item from wishlist
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.removeFromWishlist(req.params.productId);
    
    // Populate wishlist for response
    await user.populate('wishlist.product', 'name price images');

    res.status(200).json({
      status: 'success',
      data: { wishlist: user.wishlist },
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove item from wishlist'
    });
  }
});

// Admin routes
// GET /api/users - Get all users (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// PUT /api/users/:id/role - Update user role (Admin only)
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user },
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user role'
    });
  }
});

// PUT /api/users/:id/status - Update user status (Admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user },
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status'
    });
  }
});

module.exports = router;