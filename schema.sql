/* USER MANAGEMENT */

CREATE TABLE my_companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    accessible_modules JSON,    
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    date_of_joining DATE NOT NULL,
    salary INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
CREATE TABLE accessible_modules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE user_companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES my_companies(id)
);

/* PRODUCT MANAGEMENT */
CREATE TABLE companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE finishes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    finish_name VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE woods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wood_name VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE thicknesses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thickness_value VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE units (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    unit_symbol VARCHAR(100) NOT NULL,
    is_base_unit TINYINT(1) DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE colors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    my_color VARCHAR(100) NOT NULL,
    company_color VARCHAR(100) NOT NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
CREATE TABLE warehouses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_address VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    capacity_left INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE product_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL UNIQUE,
    company_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    product_type_id BIGINT UNSIGNED NOT NULL,
    grading CHAR(1) NOT NULL,
    product_image VARCHAR(255) NOT NULL,
    product_description TEXT NOT NULL,
    product_unit BIGINT UNSIGNED NOT NULL,
    mycompany_id BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (product_type_id) REFERENCES product_types(id),
    FOREIGN KEY (product_unit) REFERENCES units(id),
    FOREIGN KEY (mycompany_id) REFERENCES my_companies(id)
);
CREATE TABLE product_dimensions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    thickness BIGINT UNSIGNED NOT NULL,
    width DECIMAL(10,2) DEFAULT NULL,
    length DECIMAL(10,2) DEFAULT NULL,
    height DECIMAL(10,2) DEFAULT NULL,
    unit BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (unit) REFERENCES units(id)
);
CREATE TABLE product_stocks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);
CREATE TABLE product_prices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    expected_selling_price DECIMAL(10,2) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE TABLE product_sides (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    side_name ENUM('front','beck') NOT NULL,
    color_id BIGINT UNSIGNED NOT NULL,
    wood_id BIGINT UNSIGNED NOT NULL,
    finish_id BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (color_id) REFERENCES colors(id),
    FOREIGN KEY (wood_id) REFERENCES woods(id),
    FOREIGN KEY (finish_id) REFERENCES finishes(id)
);

/* PURCHASE & SALE MANAGEMENT */
CREATE TABLE vehicles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_name VARCHAR(100) NOT NULL,
    vehicle_type ENUM('cart','truck','pickup-truck', 'bike') NOT NULL,
    vehicle_number VARCHAR(100) NOT NULL,
    vehicle_image VARCHAR(255) NOT NULL,
    vehicle_owner VARCHAR(100) NOT NULL,
    vehicle_owner_phone VARCHAR(100) NOT NULL,
    vehicle_owner_address VARCHAR(100) NOT NULL,
    vehicle_owner_cnic VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE drivers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(100) NOT NULL,
    driver_address VARCHAR(100) NOT NULL,
    driver_cnic VARCHAR(100) NOT NULL,
    driver_license_number VARCHAR(100) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE payment_terms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_term_name VARCHAR(100) NOT NULL,
    payment_term_days INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE banks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL UNIQUE,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE bank_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bank_id BIGINT UNSIGNED NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    iban_number VARCHAR(100) NOT NULL,
    account_title VARCHAR(100) NOT NULL,
    account_balance DECIMAL(10,2) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id)
);
CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_phone VARCHAR(100) NOT NULL,
    supplier_phone_2 VARCHAR(100) DEFAULT NULL,
    supplier_phone_3 VARCHAR(100) DEFAULT NULL,
    supplier_phone_4 VARCHAR(100) DEFAULT NULL,
    supplier_address VARCHAR(100) NOT NULL,
    supplier_cnic VARCHAR(100) NOT NULL,
    supplier_email VARCHAR(100) NOT NULL,
    supplier_image VARCHAR(255) NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL,
    payment_terms BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_terms) REFERENCES payment_terms(id)
);
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(100) NOT NULL,
    customer_phone_2 VARCHAR(100) DEFAULT NULL,
    customer_phone_3 VARCHAR(100) DEFAULT NULL,
    customer_phone_4 VARCHAR(100) DEFAULT NULL,
    customer_address VARCHAR(100) NOT NULL,
    customer_cnic VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_image VARCHAR(255) NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL,
    payment_terms BIGINT UNSIGNED NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_terms) REFERENCES payment_terms(id)
);
CREATE TABLE expense_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE expenses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expense_name VARCHAR(100) NOT NULL,
    expense_type BIGINT UNSIGNED NOT NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    expense_amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    expense_description TEXT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_type) REFERENCES expense_types(id),
    FOREIGN KEY (company_id) REFERENCES my_companies(id)
);
CREATE TABLE purchase_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_order_number VARCHAR(100) NOT NULL,
    purchase_order_date DATE NOT NULL,
    supplier_id BIGINT UNSIGNED  NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NULL,
    priority ENUM('low','medium','high') NOT NULL DEFAULT 'low',
    rate_given DECIMAL(10,2) NULL,
    purchase_price DECIMAL(10,2) NULL,
    purchase_order_status ENUM('pending','approved', 'partial-approved', 'rejected','partial-received','received') NOT NULL DEFAULT 'pending',
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE received_purchases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    received_purchase_number VARCHAR(100) NOT NULL,
    purchase_order_id BIGINT UNSIGNED NULL,
    received_date DATE NOT NULL,
    vehicle_id BIGINT UNSIGNED NULL,
    driver_id BIGINT UNSIGNED NULL,
    remarks TEXT NULL,
    vehicle_image VARCHAR(255) NULL,
    delivery_slip_image VARCHAR(255) NULL,
    delivery_charges VARCHAR(255) NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE received_products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id BIGINT UNSIGNED NULL,
    received_purchase_id BIGINT UNSIGNED NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NULL,
    warehouse_id BIGINT UNSIGNED NULL,
    invoice_image VARCHAR(255) NULL,
    rate_received DECIMAL(10,2) NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (received_purchase_id) REFERENCES received_purchases(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE returned_products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    received_purchase_id BIGINT UNSIGNED NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NULL,
    warehouse_id BIGINT UNSIGNED NULL,
    remarks TEXT NULL,
    returned_image VARCHAR(255) NULL,
    returned_date DATE NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (received_purchase_id) REFERENCES received_purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE sales_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_order_number VARCHAR(100) NOT NULL,
    sales_order_date DATE NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    manager_id BIGINT UNSIGNED NOT NULL,
    quantity INT NULL,
    rate_given DECIMAL(10,2) NULL,
    delivery_date DATE NULL,
    delivery_charges DECIMAL(10,2) DEFAULT 0.00,
    sales_order_status ENUM('pending','partial-sold','sold', 'paid', 'partial-paid', 'returned','partial-returned') NOT NULL DEFAULT 'pending',
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
CREATE TABLE sales_invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_order_number VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    company_id BIGINT UNSIGNED NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    due_amount DECIMAL(10,2) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE sales_warehouse_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_order_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    manager_id BIGINT UNSIGNED NOT NULL,
    order_product_id BIGINT UNSIGNED NOT NULL,
    buying_product_id BIGINT UNSIGNED NOT NULL,
    order_quantity INT NULL,
    buying_quantity INT NULL,
    remarks TEXT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (order_product_id) REFERENCES products(id),
    FOREIGN KEY (buying_product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE daily_counter (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES my_companies(id)
);
CREATE TABLE daily_counter_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    daily_counter_id BIGINT UNSIGNED NOT NULL,
    counter_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_type ENUM('income','expense','transfer') NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_counter_id) REFERENCES daily_counter(id)
);
CREATE TABLE payment_in (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    sales_invoice_id BIGINT UNSIGNED  NULL,
    customer_id BIGINT UNSIGNED  NULL,
    bank_account_id BIGINT UNSIGNED NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bank','cheque', 'cross-check') NOT NULL,
    payment_status ENUM('pending','paid','partial-paid') NOT NULL DEFAULT 'pending',
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE payment_out (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    purchase_order_id BIGINT UNSIGNED NULL,
    supplier_id BIGINT UNSIGNED NULL,
    bank_account_id BIGINT UNSIGNED NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bank','cheque', 'cross-check') NOT NULL,
    payment_status ENUM('pending','paid','partial-paid') NOT NULL DEFAULT 'pending',
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE cheques (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    account_title VARCHAR(100) NOT NULL,
    cheque_number VARCHAR(100) NOT NULL,
    bank_id BIGINT UNSIGNED NOT NULL,
    bank_account_id BIGINT UNSIGNED NOT NULL,
    given_by_customer BIGINT UNSIGNED NULL,
    given_to_customer BIGINT UNSIGNED NULL,
    given_by_supplier BIGINT UNSIGNED NULL,
    given_to_supplier BIGINT UNSIGNED NULL,
    cheque_date DATE NOT NULL,
    cheque_amount DECIMAL(10,2) NOT NULL,
    cheque_status ENUM('pending', 'cross-check', 'cleared','rejected', 'bounced') NOT NULL DEFAULT 'pending',
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (given_by_customer) REFERENCES customers(id),
    FOREIGN KEY (given_to_customer) REFERENCES customers(id),
    FOREIGN KEY (given_by_supplier) REFERENCES suppliers(id),
    FOREIGN KEY (given_to_supplier) REFERENCES suppliers(id),
    FOREIGN KEY (company_id) REFERENCES my_companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE cut_pieces (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_order_id BIGINT UNSIGNED NOT NULL,
    original_product_id BIGINT UNSIGNED NOT NULL,
    cut_warehouse_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
    original_length DECIMAL(10,2) NOT NULL,
    original_width DECIMAL(10,2) NOT NULL,
    cut_length DECIMAL(10,2) NOT NULL,
    cut_width DECIMAL(10,2) NOT NULL,
    remaining_length DECIMAL(10,2) NOT NULL,
    remaining_width DECIMAL(10,2) NOT NULL,
    cut_quantity INT NOT NULL,
    remaining_quantity INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
    FOREIGN KEY (original_product_id) REFERENCES products(id),
    FOREIGN KEY (cut_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);