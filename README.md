# YT Pro Backend API

## Overview
This is a Node.js + Express backend API for managing users, products, warehouses, sales, purchases, and more. It uses MySQL as the database and JWT for authentication. File uploads (images) are supported for products, suppliers, customers, and vehicles.

---

## Features
- JWT-based authentication (login/logout)
- CRUD endpoints for 28 tables
- Special endpoints for product details and warehouse stock management
- File upload support for images
- Soft delete for most tables

---

## Setup
1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure MySQL:**
   - Update your MySQL credentials in `utils/db.js` if needed.
   - Import `schema.sql` into your MySQL database.
4. **Run the server:**
   ```bash
   node server.js
   ```
5. **Uploads:**
   - Images are saved in `uploads/products`, `uploads/suppliers`, `uploads/customers`, `uploads/vehicles`.
   - These are served at `/uploads/<type>/<filename>`.

---

## Authentication
- **Login:** `POST /auth/login` (body: `{ user_name, password }`)
- **Logout:** `POST /auth/logout`
- All other endpoints require a JWT in the `Authorization: Bearer <token>` header.

---

## Endpoints

### Auth
- `POST /auth/login` — Login, returns JWT
- `POST /auth/logout` — Logout (stateless)

### Example CRUD (for all tables)
- `POST   /users` — Create user
- `GET    /users` — List users
- `GET    /users/:id` — Get user by ID
- `PUT    /users/:id` — Update user
- `DELETE /users/:id` — Soft delete user

_Repeat for:_
- `/roles`, `/my_companies`, `/accessible_modules`, `/user_companies`, `/companies`, `/categories`, `/finishes`, `/woods`, `/thicknesses`, `/units`, `/colors`, `/warehouses`, `/product_types`, `/products`, `/product_dimensions`, `/product_stocks`, `/product_prices`, `/product_sides`, `/vehicles`, `/drivers`, `/payment_terms`, `/banks`, `/bank_accounts`, `/suppliers`, `/customers`, `/expense_types`, `/expenses`

### Special Endpoints
- `GET /products/full/:id` — Fetch product with all related details (company, category, type, dimensions, prices, stocks, sides, etc.)
- `GET /product_stocks/warehouse/:warehouse_id` — Get all product stocks in a warehouse
- `POST /product_stocks/add-to-warehouse` — Add product to warehouse (checks capacity)
- `POST /product_stocks/move-between-warehouses` — Move product between warehouses (checks stock and capacity)

### File Uploads
- **Products:** `POST /products` and `PUT /products/:id` — field: `product_image` (multipart/form-data)
- **Suppliers:** `POST /suppliers` and `PUT /suppliers/:id` — field: `supplier_image`
- **Customers:** `POST /customers` and `PUT /customers/:id` — field: `customer_image`
- **Vehicles:** `POST /vehicles` and `PUT /vehicles/:id` — field: `vehicle_image`

Example (using curl):
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer <token>" \
  -F "product_name=Table" \
  -F "company_id=1" \
  -F "category_id=1" \
  -F "product_type_id=1" \
  -F "grading=A" \
  -F "product_image=@/path/to/image.jpg"
```

---

## Notes
- All endpoints except `/auth/login` and `/auth/logout` require JWT authentication.
- Soft delete is implemented via the `is_deleted` column.
- Passwords are hashed with bcrypt.
- Images are served at `/uploads/<type>/<filename>`.

---

## License
MIT 