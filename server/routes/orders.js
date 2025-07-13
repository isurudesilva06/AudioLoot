const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { validate, orderSchema } = require('../middleware/validation');

// GET /api/orders - Get user orders or all orders (admin)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Build query based on user role
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-admin users can only view their own orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images brand')
      .populate('statusHistory.updatedBy', 'firstName lastName')
      .populate('notes.createdBy', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order'
    });
  }
});

// POST /api/orders - Create new order
router.post('/', protect, validate(orderSchema), async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod = 'standard',
      couponCode,
      giftMessage,
      specialInstructions
    } = req.body;

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product || !product.isActive) {
        return res.status(400).json({
          status: 'error',
          message: `Product ${item.product} is not available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.mainImage
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate pricing
    const shippingCost = calculateShipping(shippingMethod, subtotal);
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const discount = 0; // TODO: Implement coupon logic
    const total = subtotal + shippingCost + tax - discount;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: processedItems,
      shippingAddress,
      billingAddress,
      pricing: {
        subtotal,
        shipping: shippingCost,
        tax,
        discount,
        total
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      shipping: {
        method: shippingMethod
      },
      couponCode,
      giftMessage,
      specialInstructions,
      customerEmail: req.user.email,
      customerPhone: req.user.phone
    });

    await order.save();

    // Clear user's cart
    const user = await User.findById(req.user._id);
    await user.clearCart();

    // Populate order for response
    await order.populate('items.product', 'name images brand');

    res.status(201).json({
      status: 'success',
      data: { order },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    
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
      message: 'Failed to create order'
    });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const validStatuses = [
      'pending', 'confirmed', 'processing', 'shipped', 
      'delivered', 'cancelled', 'refunded', 'returned'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, note, req.user._id);

    res.status(200).json({
      status: 'success',
      data: { order },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
});

// PUT /api/orders/:id/shipping - Update shipping info (Admin only)
router.put('/:id/shipping', protect, authorize('admin'), async (req, res) => {
  try {
    const { carrier, trackingNumber, estimatedDelivery } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        'shipping.carrier': carrier,
        'shipping.trackingNumber': trackingNumber,
        'shipping.estimatedDelivery': estimatedDelivery,
        'shipping.shippedAt': new Date(),
        status: 'shipped'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Add to status history
    order.statusHistory.push({
      status: 'shipped',
      note: `Shipped via ${carrier}. Tracking: ${trackingNumber}`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });
    
    await order.save();

    res.status(200).json({
      status: 'success',
      data: { order },
      message: 'Shipping information updated successfully'
    });
  } catch (error) {
    console.error('Update shipping error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update shipping information'
    });
  }
});

// POST /api/orders/:id/notes - Add note to order
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { content, type = 'internal' } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Note content is required'
      });
    }

    let query = { _id: req.params.id };
    
    // Non-admin users can only add notes to their own orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    await order.addNote(content, type, req.user._id);

    res.status(201).json({
      status: 'success',
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add note'
    });
  }
});

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    
    let query = { _id: req.params.id };
    
    // Non-admin users can only cancel their own orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query).populate('items.product');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Restore product stock
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product._id);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    // Update order status
    await order.updateStatus('cancelled', reason || 'Cancelled by customer', req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order'
    });
  }
});

// GET /api/orders/stats/summary - Get order statistics (Admin only)
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'shipped'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'shipped'] } } },
        { $group: { _id: null, average: { $avg: '$pricing.total' } } }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageOrderValue: averageOrderValue[0]?.average || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order statistics'
    });
  }
});

// Helper function to calculate shipping cost
function calculateShipping(method, subtotal) {
  // Free shipping for orders over $100
  if (subtotal >= 100) {
    return 0;
  }

  switch (method) {
    case 'standard':
      return 9.99;
    case 'express':
      return 19.99;
    case 'overnight':
      return 39.99;
    case 'pickup':
      return 0;
    default:
      return 9.99;
  }
}

module.exports = router;