---
trigger: always_on
---

# Product Requirements Document (PRD)
## Organic/Grocery E-Commerce Platform

**Version:** 1.1
**Author:** Sheikh Sudais
**Status:** Draft — updated per client reference
**Stack:** React, Node.js, Express, PostgreSQL (via Prisma ORM only), Zustand + React Query for state, JWT Auth

---

## 0. Reference Design
Client-provided demo: **[Organic Store](https://websitedemos.net/organic-shop-02/)** (websitedemos.net template).

This is a single-vendor organic/grocery storefront (WooCommerce-style demo). It sets the direction for **look, layout, and feature emphasis** — our build keeps the custom MERN/PERN architecture already defined (React + Express + Prisma/Postgres + Zustand/React Query); we are not adopting WordPress/WooCommerce, only matching the UX it demonstrates.

Key takeaways from the reference to build toward:
- Clean, product-photography-led storefront with an organic/natural visual theme (earthy greens, leaf motifs, soft product cards).
- Simple category structure (e.g. Groceries, Juice) rather than deep nested categories.
- Home page is marketing-heavy: hero banner, trust badges, curated product rows, promo banners, and social proof — not just a plain product grid.
- Shop page: category filter, sort dropdown (popularity / rating / latest / price asc / price desc), paginated grid, sale-price badges.
- A slide-out **mini-cart drawer** (not just a `/cart` page) that shows live cart contents and total.
- A visible, self-serve **coupons list** shown to the customer (not just an entry field).
- Lightweight customer reviews shown as testimonials on the home page, plus per-product reviews.
- Footer used for trust/navigation: quick links, policy links, newsletter tagline, brand strip.

This PRD updates feature scope and page structure to match that direction while keeping all backend rules (Prisma-only DB access, business logic server-side, JWT auth) from the original spec unchanged.

---

## 1. Overview

### 1.1 Purpose
A full-stack organic/grocery e-commerce storefront with an admin dashboard, styled and structured after the client's chosen reference site, built on a custom React + Express + PostgreSQL/Prisma stack rather than WordPress/WooCommerce.

### 1.2 Goals
- Match the reference site's storefront experience: marketing-rich home page, simple category browsing, mini-cart drawer, visible coupons, testimonials.
- Keep all business logic (pricing, stock, coupon validation, review eligibility) server-side and Prisma-only for data access.
- Ship fast-loading pages — this is a grocery/FMCG store; customers expect near-instant browsing and checkout.
- Provide an admin dashboard for managing the catalog, orders, coupons, and reviews.

### 1.3 Non-Goals (v1)
- Multi-vendor/marketplace support.
- Product variants beyond simple options (this is a grocery catalog, not apparel — no complex size/color matrices unless the client asks later).
- Native mobile apps.
- Multi-currency / multi-language (reference site uses GBP display only; confirm target currency with client — likely PKR).

---

## 2. Target Users

| Persona | Description | Key Needs |
|---|---|---|
| **Customer** | Browses and buys groceries/organic products | Fast browsing, clear pricing/sale badges, easy cart & checkout, order visibility |
| **Admin** | Manages catalog and store operations | CRUD on products/categories/coupons, order management, sales visibility |
| **Guest** | Unauthenticated visitor | Browse, view products/prices, must log in to complete checkout |

---

## 3. Scope: Feature Set

### 3.1 Home Page (marketing layout, per reference)
- Hero banner (headline, subtext, CTA button, hero image)
- Trust badges strip: Free Shipping, Certified Organic, Huge Savings, Easy Returns (configurable by admin)
- **Best Selling Products** row (curated/algorithmic)
- Category highlight banners (e.g. "Farm Fresh Fruits", "Fresh Vegetables") linking into filtered shop views
- Promo banner ("Get 25% Off Your First Purchase" style) linking to shop or a coupon
- **Trending Products** row
- Customer reviews / testimonials section (curated, admin-managed)
- Secondary promo banner ("Deal of the Day") — time- or admin-bound
- Featured brands / partner logos strip
- Footer: quick links, policy links (Privacy, Shipping, Terms), newsletter signup, social links

### 3.2 Shop / Category Browsing
- Category navigation in header (e.g. Everything / All, Groceries, Juice, ... — driven by DB categories, not hardcoded)
- Product grid with: image, category label, name, price, **sale price badge + struck-through original price** when discounted
- Sort dropdown: Popularity, Average rating, Latest, Price low→high, Price high→low
- Pagination ("Showing 1–9 of 12 results" style)
- Search bar (header + shop page)
- Filters: category, price range

### 3.3 Product Details
- Image gallery
- Name, price, sale price (if any), category
- Description
- Stock status
- Quantity selector, Add to Cart, Buy Now
- Reviews (purchase-gated — see business rules)
- Related products

### 3.4 Cart
- **Mini-cart drawer** (slide-out panel from header cart icon) showing: item count, line items, remove, running total, "empty cart" state, CTA to shop when empty
- Full `/cart` page: same data, more room for quantity edits, coupon code entry, subtotal/shipping/total
- **Available Coupons** list surfaced to the logged-in/guest customer at cart/checkout (self-serve, not just a blind input field)

### 3.5 Checkout
- Shipping address
- Contact information
- Payment method (COD for v1, gateway later — unchanged from original spec)
- Order summary
- Coupon application

### 3.6 Customer Account
- Login / Signup / Forgot / Reset Password
- Profile
- My Orders / Order Details
- Addresses
- Wishlist
- Change Password

### 3.7 Admin Dashboard
- Dashboard stats: total sales, orders, customers, products, recent orders, top products, low-stock alerts, sales chart
- Products: CRUD, sale price field, stock/inventory
- Categories: CRUD (drives header nav — adding a category should not require a code change)
- Orders: view, update status
- Customers: view/manage
- Coupons: CRUD, plus which coupons are "public" (shown in the self-serve coupon list) vs. hidden/manual
- Reviews: moderate (approve/hide)
- Home-page content: manage which products appear in "Best Selling" / "Trending" rows, manage promo banner text/links, manage testimonials shown on home page, manage brand-logo strip — so the client can update marketing content without a redeploy

### 3.8 Technical Requirements (unchanged from v1.0, restated)
- React Router, Zustand (client/UI state), React Query (server state/cache)
- Express REST API, **PostgreSQL via Prisma ORM only** — no raw/direct queries
- JWT auth with role-based authorization middleware
- Server-side validation on every mutating route
- Centralized error handling + loading/error UI states
- Responsive UI across breakpoints
- Fast page loads (grocery-store UX expectation): paginated/lean queries, debounced search, image optimization, no heavy animations

---

## 4. Information Architecture

### 4.1 Frontend Routes
```
/
├── /shop                          (all products, filter/sort/paginate)
├── /category/:slug                (matches header category nav, e.g. /category/groceries)
├── /product/:id
├── /cart
├── /checkout
├── /login
├── /signup
├── /about                         (per reference nav)
├── /contact                       (per reference nav)
├── /account
│   ├── /profile
│   ├── /orders
│   ├── /orders/:id
│   ├── /addresses
│   └── /wishlist
└── /admin                         (auth + admin role required)
    ├── /dashboard
    ├── /products
    ├── /products/new
    ├── /products/:id/edit
    ├── /categories
    ├── /orders
    ├── /customers
    ├── /coupons
    ├── /reviews
    └── /content                   (home page rows, banners, testimonials, brand strip)
```
Route guards: `/account/*` requires authentication; `/admin/*` requires authentication **and** admin role.

### 4.2 Frontend Directory Structure
```
src/
├── components/
│   ├── Navbar                (category nav driven by DB, search, cart icon)
│   ├── MiniCartDrawer        (slide-out cart)
│   ├── Footer
│   ├── ProductCard           (handles sale-price badge state)
│   ├── ProductGrid
│   ├── ProductFilters
│   ├── SortDropdown
│   ├── SearchBar
│   ├── CartItem
│   ├── CheckoutForm
│   ├── Rating
│   ├── TestimonialCard
│   ├── PromoBanner
│   ├── CouponList
│   └── ProtectedRoute
│
├── pages/
│   ├── Home                  (hero, trust badges, best-selling, category banners,
│   │                           promo banner, trending, testimonials, deal-of-day, brands)
│   ├── Shop
│   ├── Category
│   ├── ProductDetails
│   ├── Cart
│   ├── Checkout
│   ├── Login
│   ├── Signup
│   ├── About
│   ├── Contact
│   ├── Orders
│   ├── Profile
│   └── admin/
│       ├── Dashboard
│       ├── Products
│       ├── Orders
│       ├── Users
│       ├── Coupons
│       └── Content
│
├── store/                    (Zustand — client/UI state only)
│   ├── authStore
│   ├── cartDrawerStore        (open/closed, transient UI)
│   └── wishlistUiStore
│
├── services/                 (React Query hooks / API calls — server state)
│   ├── authApi
│   ├── productApi
│   ├── categoryApi
│   ├── cartApi
│   ├── orderApi
│   ├── couponApi
│   ├── reviewApi
│   └── contentApi            (home page marketing content)
│
└── App.jsx
```

---

## 5. Data Model

### 5.1 Entities
`User, Product, Category, ProductImage, Cart, CartItem, Wishlist, Order, OrderItem, Address, Review, Coupon, Payment`

Additions for the marketing/home-page layer:
`HomeSection` (type: best_selling | trending | category_banner | promo_banner | deal_of_day, references Products/Categories), `Testimonial`, `BrandLogo`

### 5.2 Relationships
```
User        → Orders, Cart, Wishlist, Addresses, Reviews
Category    → Products
Product     → Category, Images, Reviews, OrderItems
Order       → User, OrderItems, Address, Payment
HomeSection → Products (curated list) or Category (for banners)
```

### 5.3 Product Pricing Fields
```
price            (base price)
salePrice        (nullable — when set, product shows as "Sale!" with struck-through original price, per reference site)
```

### 5.4 Order Status Enum
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                   → CANCELLED
```

### 5.5 Payment Status (COD default for v1)
```
paymentMethod: COD
paymentStatus: PENDING
```

---

## 6. API Specification

*(Unchanged endpoints from v1.0 retained — see appendix in prior draft. New/updated endpoints below.)*

### 6.1 Categories (now drives header nav — must be dynamic, not hardcoded)
```
GET    /api/categories                 → { id, name, slug, productCount }
GET    /api/categories/:slug/products
POST/PUT/DELETE /api/categories[/:id]  (admin)
```

### 6.2 Products — sale price & sorting
```
GET /api/products?sort=popularity
GET /api/products?sort=rating
GET /api/products?sort=latest
GET /api/products?sort=price_asc
GET /api/products?sort=price_desc
```
Response includes `price`, `salePrice` (nullable), `onSale` (derived boolean) so the frontend never computes discount logic itself.

### 6.3 Coupons — public list
```
GET  /api/coupons/public       → coupons flagged "visible", for the self-serve Available Coupons list
POST /api/coupons/validate     → { code, cartTotal } (server re-validates min order + expiry)
```

### 6.4 Home Page Content
```
GET /api/home/sections          → best-selling, trending, category banners, promo/deal-of-day, in admin-configured order
GET /api/home/testimonials
GET /api/home/brands

Admin:
PUT /api/admin/home/sections
PUT /api/admin/home/testimonials
PUT /api/admin/home/brands
```
This keeps the marketing layout editable without redeploying — matches the reference site's WordPress-editable nature, achieved here through an admin content API instead.

### 6.5 Cart (unchanged, still Prisma-only, still server-validated on every mutation)
```
GET/POST/PUT/DELETE /api/cart[...]
```

---

## 7. Key Busine