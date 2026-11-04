USE food_ordering;

INSERT INTO users (name, email, password_hash, role, phone, address) VALUES
('Admin',  'admin@food.test', 'hash-placeholder', 'admin',    '9000000000', 'Kitchen HQ'),
('Ravi K', 'ravi@food.test',  'hash-placeholder', 'customer', '9111111111', 'Kukatpally, Hyderabad'),
('Anita S','anita@food.test', 'hash-placeholder', 'customer', '9222222222', 'Madhapur, Hyderabad');

INSERT INTO categories (name) VALUES ('Starters'), ('Mains'), ('Breads & Rice'), ('Drinks & Sweets');

INSERT INTO menu_items (category_id, name, description, price, is_veg) VALUES
(1, 'Paneer Tikka',      'Charred cottage cheese, mint chutney',         220, TRUE),
(1, 'Chicken 65',        'Crisp, curry leaf and green chilli',           260, FALSE),
(1, 'Mirchi Bajji',      'Stuffed chillies fried in gram flour',         120, TRUE),
(2, 'Butter Chicken',    'Tomato-cream gravy, kasuri methi',             320, FALSE),
(2, 'Dal Tadka',         'Yellow lentils, ghee and garlic tempering',    180, TRUE),
(2, 'Gongura Mutton',    'Andhra-style sorrel leaf curry',               380, FALSE),
(3, 'Hyderabadi Biryani','Dum-cooked basmati, raita on the side',        299, FALSE),
(3, 'Veg Pulao',         'Fragrant rice with seasonal vegetables',       190, TRUE),
(3, 'Butter Naan',       'Tandoor-baked, brushed with butter',            50, TRUE),
(4, 'Masala Chai',       'Ginger, cardamom, strong',                      40, TRUE),
(4, 'Mango Lassi',       'Thick yogurt and Alphonso pulp',                90, TRUE),
(4, 'Double Ka Meetha',  'Bread pudding, saffron milk, nuts',            110, TRUE);

-- Two sample orders
INSERT INTO orders (user_id, total_amount, status) VALUES (2, 619, 'Delivered'), (3, 270, 'Preparing');
INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES
(1, 7, 1, 299), (1, 1, 1, 220), (1, 11, 1, 90) ,(1, 10, 1, 10),
(2, 5, 1, 180), (2, 11, 1, 90);
