const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// User registration validation schema
const registerSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional()
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Product creation validation schema
const productSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().max(2000).required(),
  price: Joi.number().min(0).required(),
  originalPrice: Joi.number().min(0).optional(),
  category: Joi.string().valid('headphones', 'speakers', 'earbuds', 'accessories').required(),
  brand: Joi.string().trim().required(),
  features: Joi.array().items(Joi.string().max(200)).optional(),
  specifications: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  stock: Joi.number().min(0).required(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
  isFeatured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});

// Product update validation schema
const productUpdateSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  category: Joi.string().valid('headphones', 'speakers', 'earbuds', 'accessories').optional(),
  brand: Joi.string().trim().optional(),
  features: Joi.array().items(Joi.string().max(200)).optional(),
  specifications: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  stock: Joi.number().min(0).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
  isFeatured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});

// Address validation schema
const addressSchema = Joi.object({
  type: Joi.string().valid('shipping', 'billing', 'both').optional(),
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  company: Joi.string().trim().optional(),
  address1: Joi.string().trim().required(),
  address2: Joi.string().trim().optional(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  zipCode: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  isDefault: Joi.boolean().optional()
});

// Cart item validation schema
const cartItemSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  quantity: Joi.number().min(1).max(10).required()
});

// Order creation validation schema
const orderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    product: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    quantity: Joi.number().min(1).required()
  })).min(1).required(),
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer').required(),
  shippingMethod: Joi.string().valid('standard', 'express', 'overnight', 'pickup').optional(),
  couponCode: Joi.string().optional(),
  giftMessage: Joi.string().max(500).optional(),
  specialInstructions: Joi.string().max(1000).optional()
});

// Review validation schema
const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(500).optional()
});

// Password change validation schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// User profile update validation schema
const profileUpdateSchema = Joi.object({
  firstName: Joi.string().trim().max(50).optional(),
  lastName: Joi.string().trim().max(50).optional(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional(),
  preferences: Joi.object({
    newsletter: Joi.boolean().optional(),
    smsUpdates: Joi.boolean().optional(),
    preferredCategories: Joi.array().items(
      Joi.string().valid('headphones', 'speakers', 'earbuds', 'accessories')
    ).optional(),
    currency: Joi.string().optional(),
    language: Joi.string().optional()
  }).optional()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  addressSchema,
  cartItemSchema,
  orderSchema,
  reviewSchema,
  passwordChangeSchema,
  profileUpdateSchema
};