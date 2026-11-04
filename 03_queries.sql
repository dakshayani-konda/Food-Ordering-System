USE food_ordering;

-- 1. Menu with category names (JOIN)
SELECT c.name AS category, m.name, m.price
FROM menu_items m JOIN categories c ON c.id = m.category_id
WHERE m.available = TRUE
ORDER BY c.id, m.price;

-- 2. Vegetarian items under 200
SELECT name, price FROM menu_items WHERE is_veg = TRUE AND price < 200;

-- 3. Place an order (transaction)
START TRANSACTION;
  INSERT INTO orders (user_id, total_amount) VALUES (2, 0);
  SET @oid = LAST_INSERT_ID();
  INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
    SELECT @oid, id, 2, price FROM menu_items WHERE id = 9;       -- 2 x Butter Naan
  UPDATE orders SET total_amount =
    (SELECT SUM(quantity * price_at_order) FROM order_items WHERE order_id = @oid)
  WHERE id = @oid;
COMMIT;

-- 4. One customer's order history with line items
SELECT o.id, o.created_at, o.status, m.name, oi.quantity, oi.price_at_order
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN menu_items m   ON m.id = oi.menu_item_id
WHERE o.user_id = 2
ORDER BY o.created_at DESC;

-- 5. Admin: move an order along
UPDATE orders SET status = 'Out for delivery' WHERE id = 2;

-- 6. Best sellers (GROUP BY)
SELECT m.name, SUM(oi.quantity) AS sold, SUM(oi.quantity * oi.price_at_order) AS revenue
FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
GROUP BY m.id ORDER BY sold DESC LIMIT 5;

-- 7. Revenue per day, delivered orders only
SELECT DATE(created_at) AS day, COUNT(*) AS orders, SUM(total_amount) AS revenue
FROM orders WHERE status = 'Delivered' GROUP BY DATE(created_at);

-- 8. Customers who never ordered (LEFT JOIN)
SELECT u.name FROM users u LEFT JOIN orders o ON o.user_id = u.id
WHERE u.role = 'customer' AND o.id IS NULL;

-- 9. Items never ordered
SELECT m.name FROM menu_items m
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.menu_item_id = m.id);
