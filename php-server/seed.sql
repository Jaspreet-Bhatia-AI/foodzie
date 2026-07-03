-- Foodzie MySQL Seed Data
-- Import this SQL file into your phpMyAdmin database to populate base test records.
-- All user passwords are set to "password123"

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `OrderItem`;
DELETE FROM `Order`;
DELETE FROM `FoodItem`;
DELETE FROM `Category`;
DELETE FROM `User`;
DELETE FROM `University`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Seed Universities
INSERT INTO `University` (`id`, `name`, `city`, `country`, `lat`, `lng`) VALUES
('uni-1', 'Sant Baba Bhag Singh University (SBBSU)', 'Jalandhar', 'India', 31.4213, 75.8452),
('uni-2', 'Lovely Professional University (LPU)', 'Phagwara', 'India', 31.2536, 75.7037),
('uni-3', 'Delhi University', 'New Delhi', 'India', 28.6892, 77.2106);

-- 2. Seed Users
-- Password BCRYPT Hash of "password123" is: $2y$12$R.b2wex/X4041d8e13295982v2.C2gU.86nF5S8i9jXgP9eK.vGde
INSERT INTO `User` (`id`, `name`, `email`, `password`, `phone`, `profilePicUrl`, `role`, `universityId`, `vendorDescription`, `vendorUpi`, `createdAt`) VALUES
('student-1', 'Test Student 1', 'student1@foodzie.com', '$2y$12$R.b2wex/X4041d8e13295982v2.C2gU.86nF5S8i9jXgP9eK.vGde', '+919999999991', NULL, 'Student', 'uni-1', NULL, NULL, NOW(3)),
('student-2', 'Test Student 2', 'student2@foodzie.com', '$2y$12$R.b2wex/X4041d8e13295982v2.C2gU.86nF5S8i9jXgP9eK.vGde', '+919999999992', NULL, 'Student', 'uni-2', NULL, NULL, NOW(3)),
('vendor-1', 'Haldirams Canteen', 'haldirams@foodzie.com', '$2y$12$R.b2wex/X4041d8e13295982v2.C2gU.86nF5S8i9jXgP9eK.vGde', '+919999999993', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', 'Vendor', 'uni-1', 'Traditional Indian sweets, street chaats, and full lunch thalis.', 'haldirams@oksbi', NOW(3)),
('vendor-2', 'Dominos Express', 'dominos@foodzie.com', '$2y$12$R.b2wex/X4041d8e13295982v2.C2gU.86nF5S8i9jXgP9eK.vGde', '+919999999994', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', 'Vendor', 'uni-1', 'Hot and fresh pizzas made to order.', 'dominos@oksbi', NOW(3));

-- 3. Seed Categories
INSERT INTO `Category` (`id`, `name`, `vendorId`) VALUES
('cat-1', 'Street Food & Chaat', 'vendor-1'),
('cat-2', 'North Indian Thalis', 'vendor-1'),
('cat-3', 'Classic Pizzas', 'vendor-2');

-- 4. Seed Food Items
INSERT INTO `FoodItem` (`id`, `name`, `description`, `price`, `imageUrl`, `prepTimeMins`, `isCooked`, `stock`, `isVegetarian`, `discountPercent`, `discountStart`, `discountEnd`, `categoryId`) VALUES
('item-1', 'Raj Kachori', 'King of street food chaats, crispy shell stuffed with sweet and sour items', 120.00, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce70?auto=format&fit=crop&q=80&w=800', 15, 1, NULL, 1, NULL, NULL, NULL, 'cat-1'),
('item-2', 'Pani Puri (8pcs)', 'Crispy semolina puris with spicy green and sweet tamarind water', 60.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800', 10, 1, NULL, 1, NULL, NULL, NULL, 'cat-1'),
('item-3', 'Special Deluxe Thali', 'Dal Makhani, Shahi Paneer, Mix Veg, Rice, Butter Naan, Salad, and Gulab Jamun', 280.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800', 25, 1, NULL, 1, 10.00, NOW(3), DATE_ADD(NOW(3), INTERVAL 30 DAY), 'cat-2'),
('item-4', 'Margherita Pizza Regular', 'Classic regular size pizza with mozzarella cheese and tomato sauce base', 109.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', 15, 1, NULL, 1, NULL, NULL, NULL, 'cat-3'),
('item-5', 'Chicken Sausage Pizza Regular', 'Classic regular size pizza topped with spicy chicken sausage pieces', 189.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', 15, 1, NULL, 0, NULL, NULL, NULL, 'cat-3');
