# AudioLoot E-Commerce Platform

A full-stack e-commerce platform for premium audio equipment, featuring a Node.js/Express backend and a modern static frontend (HTML/CSS/JS). The backend provides a robust REST API, while the frontend offers a responsive, user-friendly shopping experience.

---

## Project Overview

**AudioLoot** is a complete e-commerce solution for audiophiles and music enthusiasts. It includes:
- **Backend**: Node.js, Express, MongoDB, JWT authentication, Cloudinary for image storage, and robust security features.
- **Frontend**: Static HTML, CSS (modular, with page-specific styles), and vanilla JavaScript for dynamic UI and API integration.

---

## Project Structure

```
AudioLoot/
├── add_admin_user.js         # MongoDB admin user creation script
├── client/                   # Frontend static site
│   ├── index.html            # Home page
│   ├── login.html            # Login page
│   ├── register.html         # Registration page
│   ├── cart.html             # Shopping cart
│   ├── checkout.html         # Checkout flow
│   ├── products.html         # Product listing
│   ├── product.html          # Product details
│   ├── profile.html          # User profile
│   ├── assets/
│   │   ├── favicon.svg       # Custom favicon (branding)
│   │   └── images/           # Product and UI images
│   ├── css/                  # Global and page-specific styles
│   │   ├── styles.css        # Main global styles
│   │   ├── base.css, layout.css, ...
│   │   └── pages/            # home.css, cart.css, products.css, profile.css, auth.css
│   ├── js/                   # Modular JS for each page/feature
│   │   ├── app.js            # Main app logic (UI, auth, cart)
│   │   ├── api.js            # API service (handles all backend requests)
│   │   ├── products.js, cart.js, ...
│   └── components/           # (reserved for future modular HTML/JS components)
├── server/                   # Backend API
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── cloudinary.js     # Cloudinary configuration
│   ├── controllers/          # (empty, for future route controllers)
│   ├── middleware/
│   │   ├── auth.js           # Auth middleware (JWT, roles)
│   │   └── validation.js     # Joi validation schemas
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Product.js        # Product model
│   │   └── Order.js          # Order model
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── users.js          # User profile, cart, wishlist, addresses
│   │   ├── products.js       # Product CRUD, reviews, categories
│   │   └── orders.js         # Order management
│   ├── scripts/
│   │   └── seedDatabase.js   # Database seeding script
│   ├── utils/
│   │   └── jwt.js            # JWT utilities
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js             # Main backend entry point
└── .vscode/                  # Editor config (optional)
```

---

## Backend (server/)

### Features
- **Authentication & Authorization**: JWT-based, role-based access (user, admin, moderator)
- **Product Management**: CRUD, categories, search, filtering, reviews
- **Shopping Cart & Wishlist**: Persistent, per-user
- **Order Management**: Full lifecycle, admin controls, status tracking
- **User Profiles**: Addresses, preferences, password change
- **Security**: Rate limiting, CORS, helmet, input validation, account locking
- **Image Management**: Cloudinary integration

### Scripts
- `npm start` — Start production server
- `npm run dev` — Start dev server with nodemon
- `npm run seed` — Seed database with sample data
- `add_admin_user.js` (project root) — MongoDB shell script to create an admin user in the database (see script for usage)

### Environment Variables
See `server/.env.example` for all required variables:
- `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `CORS_ORIGINS`, etc.

### API Endpoints
See below for a summary. All endpoints are under `/api` and require JWT auth unless noted.

#### Auth
- `POST /auth/register` — Register
- `POST /auth/login` — Login
- `GET /auth/me` — Current user
- `PUT /auth/change-password` — Change password
- `POST /auth/logout` — Logout
- `POST /auth/verify-token` — Verify JWT

#### Products
- `GET /products` — List (filter, search, paginate)
- `GET /products/featured` — Featured
- `GET /products/categories` — Categories
- `GET /products/:id` — Details
- `POST /products` — Create (admin)
- `PUT /products/:id` — Update (admin)
- `DELETE /products/:id` — Delete (admin)
- `POST /products/:id/reviews` — Add review
- `GET /products/:id/reviews` — Get reviews

#### Users
- `GET /users/profile` — Profile
- `PUT /users/profile` — Update profile
- `GET /users/addresses` — List addresses
- `POST /users/addresses` — Add address
- `PUT /users/addresses/:id` — Update address
- `DELETE /users/addresses/:id` — Delete address
- `GET /users/cart` — Get cart
- `POST /users/cart` — Add to cart
- `PUT /users/cart/:productId` — Update cart item
- `DELETE /users/cart/:productId` — Remove from cart
- `DELETE /users/cart` — Clear cart
- `GET /users/wishlist` — Get wishlist
- `POST /users/wishlist/:productId` — Add to wishlist
- `DELETE /users/wishlist/:productId` — Remove from wishlist

#### Orders
- `GET /orders` — List orders (user or admin)
- `GET /orders/:id` — Order details
- `POST /orders` — Create order
- `PUT /orders/:id/status` — Update status (admin)
- `PUT /orders/:id/shipping` — Update shipping (admin)
- `POST /orders/:id/notes` — Add note
- `PUT /orders/:id/cancel` — Cancel order
- `GET /orders/stats/summary` — Order stats (admin)

### Models
- **User**: name, email, password, phone, addresses, preferences, wishlist, cart, role, status, etc.
- **Product**: name, description, price, originalPrice, category, brand, images, features, specifications, stock, rating, reviews, tags, SEO fields
- **Order**: user, items, shipping/billing address, pricing, payment, shipping, status, notes, history

### Middleware & Utilities
- **Auth**: JWT verification, role-based access, optional auth
- **Validation**: Joi schemas for all major entities
- **JWT Utils**: Token generation/verification
- **Database/Cloudinary Config**: Centralized connection/config logic

### Seeding & Admin Setup
- `npm run seed` — Seeds DB with products, users (including admin), and orders
- `add_admin_user.js` — Run in MongoDB shell to create a DB admin (see script for details)

### Error & Success Responses
- Consistent JSON structure for all API responses (see below for format)

---

## Frontend (client/)

### Features
- **Modern, responsive UI**: Built with semantic HTML, modular CSS, and vanilla JS
- **Pages**: Home, Products, Product Details, Cart, Checkout, Login, Register, Profile
- **Dynamic content**: All product, cart, order, and user data fetched from backend API
- **Authentication**: JWT-based, stored in localStorage, with auto-logout and UI updates
- **Cart & Wishlist**: Persistent (localStorage + server sync)
- **Profile management**: Update info, addresses, password
- **Checkout flow**: Multi-step, with validation
- **Branding**: Custom favicon (`assets/favicon.svg`), modern design

### Structure
- **HTML**: One file per page (index, products, product, cart, checkout, login, register, profile)
- **CSS**: Modular, with global and page-specific files (see `css/pages/`)
- **JS**: Modular, with one file per major feature/page (see `js/`)
- **Assets**: All images and icons in `assets/`

### Running the Frontend
- No build step required — open `client/index.html` in your browser (or use a static server for CORS/API calls)
- For local API calls, ensure the backend is running on `localhost:5000` (or update `js/api.js` as needed)
- All API requests are made to `/api` endpoints on the backend

### API Integration
- All frontend data (products, cart, orders, user) is fetched via the backend REST API
- See `js/api.js` for all API methods and usage

---

## Local Development

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Setup
1. **Clone the repo**
2. **Backend**:
   - `cd server`
   - `npm install`
   - Copy `.env.example` to `.env` and fill in your config
   - `npm run seed` to seed the DB (optional)
   - `npm run dev` to start the backend
3. **Frontend**:
   - Open `client/index.html` in your browser, or serve with a static server (e.g. `npx serve client`)
   - The frontend will connect to the backend API at `localhost:5000` by default

### Admin Credentials (seeded by default)
- Email: `admin@audioloot.com`
- Password: `admin123`

---

## API Response Format

**Error:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    { "field": "fieldName", "message": "Validation error message" }
  ]
}
```

**Success:**
```json
{
  "status": "success",
  "data": { /* ... */ },
  "message": "Success message"
}
```

---

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## License
MIT

---

## Support
For support or questions, please contact the development team or create an issue in the repository.