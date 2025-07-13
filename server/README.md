# AudioLoot Backend API

A comprehensive Node.js backend for the AudioLoot e-commerce platform, built with Express, MongoDB, and Cloudinary.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 🛍️ **Product Management** - Full CRUD operations with categories, search, and filtering
- 🛒 **Shopping Cart** - Persistent cart functionality with user sessions
- 📦 **Order Management** - Complete order lifecycle from creation to delivery
- 👤 **User Profiles** - User management with addresses and preferences
- ⭐ **Reviews & Ratings** - Product review system with aggregated ratings
- 🔍 **Search & Filter** - Advanced product search and filtering capabilities
- 📊 **Admin Dashboard** - Comprehensive admin features and statistics
- ☁️ **Image Management** - Cloudinary integration for image uploads
- 🔒 **Security** - Rate limiting, CORS, helmet, and input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## Project Structure

```
server/
├── config/
│   ├── database.js          # MongoDB connection
│   └── cloudinary.js        # Cloudinary configuration
├── controllers/              # Route controllers (future enhancement)
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation schemas
├── models/
│   ├── User.js              # User model
│   ├── Product.js           # Product model
│   └── Order.js             # Order model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── products.js          # Product CRUD routes
│   └── orders.js            # Order management routes
├── scripts/
│   └── seedDatabase.js      # Database seeding script
├── utils/
│   └── jwt.js               # JWT utilities
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
└── server.js                # Main application entry point
```

## Installation & Setup

### 1. Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image management)

### 2. Clone and Install

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/audioloot
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/audioloot

# JWT Secret (use a strong, random string in production)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://127.0.0.1:5500
```

### 4. Database Setup

Seed the database with sample data:

```bash
npm run seed
```

This will create:
- 12 sample products across different categories
- 3 users (including an admin account)
- 2 sample orders

**Admin Credentials:**
- Email: `admin@audioloot.com`
- Password: `admin123`

### 5. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout user
- `POST /auth/verify-token` - Verify JWT token

#### Products
- `GET /products` - Get all products (with filtering, search, pagination)
- `GET /products/featured` - Get featured products
- `GET /products/categories` - Get product categories with counts
- `GET /products/:id` - Get single product
- `POST /products` - Create product (Admin only)
- `PUT /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)
- `POST /products/:id/reviews` - Add product review
- `GET /products/:id/reviews` - Get product reviews

#### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/addresses` - Get user addresses
- `POST /users/addresses` - Add new address
- `PUT /users/addresses/:id` - Update address
- `DELETE /users/addresses/:id` - Delete address
- `GET /users/cart` - Get user cart
- `POST /users/cart` - Add item to cart
- `PUT /users/cart/:productId` - Update cart item quantity
- `DELETE /users/cart/:productId` - Remove item from cart
- `DELETE /users/cart` - Clear entire cart
- `GET /users/wishlist` - Get user wishlist
- `POST /users/wishlist/:productId` - Add to wishlist
- `DELETE /users/wishlist/:productId` - Remove from wishlist

#### Orders
- `GET /orders` - Get user orders (or all orders for admin)
- `GET /orders/:id` - Get single order
- `POST /orders` - Create new order
- `PUT /orders/:id/status` - Update order status (Admin only)
- `PUT /orders/:id/shipping` - Update shipping info (Admin only)
- `POST /orders/:id/notes` - Add note to order
- `PUT /orders/:id/cancel` - Cancel order
- `GET /orders/stats/summary` - Get order statistics (Admin only)

### Query Parameters

#### Products
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Filter by category
- `minPrice`, `maxPrice` - Price range filter
- `brand` - Filter by brand
- `rating` - Minimum rating filter
- `search` - Search in name, description, brand
- `sort` - Sort by: price, rating, name, createdAt
- `order` - Sort order: asc, desc
- `featured` - Show only featured products

#### Example Requests

```bash
# Get all headphones under $300
GET /api/products?category=headphones&maxPrice=300

# Search for Sony products
GET /api/products?search=sony

# Get featured products
GET /api/products?featured=true

# Register new user
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}

# Add item to cart
POST /api/users/cart
{
  "productId": "65f1234567890abcdef12345",
  "quantity": 2
}
```

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### API Testing

You can test the API using tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- curl

### Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

### Success Responses

Successful responses follow this format:

```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

## Security Features

- **JWT Authentication** - Stateless authentication with configurable expiration
- **Password Hashing** - bcryptjs with salt rounds
- **Rate Limiting** - Prevent brute force attacks
- **CORS Protection** - Configurable cross-origin resource sharing
- **Input Validation** - Joi schema validation for all inputs
- **Security Headers** - Helmet.js for security headers
- **Account Locking** - Temporary account lock after failed login attempts

## Production Deployment

### Environment Variables for Production

Ensure these are properly configured:

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
MONGODB_URI=<production-mongodb-uri>
CLOUDINARY_CLOUD_NAME=<production-cloudinary-name>
CLOUDINARY_API_KEY=<production-cloudinary-key>
CLOUDINARY_API_SECRET=<production-cloudinary-secret>
```

### Deployment Considerations

1. Use a process manager like PM2
2. Set up proper logging
3. Configure reverse proxy (nginx)
4. Enable HTTPS
5. Set up database backups
6. Monitor application performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.