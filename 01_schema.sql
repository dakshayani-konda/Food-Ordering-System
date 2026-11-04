-- Food Ordering System: schema (MySQL 8)
DROP DATABASE IF EXISTS food_ordering;
CREATE DATABASE food_ordering CHARACTER SET utf8mb4;
USE food_ordering;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  phone         VARCHAR(20),
  address       VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE menu_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  price       DECIMAL(8,2) NOT NULL CHECK (price > 0),
  is_veg      BOOLEAN NOT NULL DEFAULT TRUE,
  available   BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status       ENUM('Placed','Preparing','Out for delivery','Delivered','Cancelled')
               NOT NULL DEFAULT 'Placed',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  menu_item_id  INT NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  price_at_order DECIMAL(8,2) NOT NULL,   -- price frozen at order time
  FOREIGN KEY (order_id)     REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE INDEX idx_menu_category ON menu_items(category_id);
CREATE INDEX idx_orders_user   ON orders(user_id);
