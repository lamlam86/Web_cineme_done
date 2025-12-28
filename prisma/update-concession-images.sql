-- =============================================
-- CẬP NHẬT HÌNH ẢNH BẮP NƯỚC
-- =============================================

-- Xóa dữ liệu cũ và thêm mới với hình ảnh
DELETE FROM `concessions`;

INSERT INTO `concessions` (`name`, `description`, `price`, `type`, `image_url`) VALUES
-- COMBO
('Combo Couple', 'Bắp lớn + 2 nước lớn', 109000, 'combo', 'https://www.cgv.vn/media/concession/web/63734d65a9e53-combo-cgv-2-nguoi-new.png'),
('Combo Single', 'Bắp vừa + 1 nước lớn', 79000, 'combo', 'https://www.cgv.vn/media/concession/web/63734d2a0a5da-combo-cgv-1-nguoi-new.png'),
('Combo Family', 'Bắp đại + 4 nước lớn', 189000, 'combo', 'https://www.cgv.vn/media/concession/web/6409e6c80c7b9-combo-4nguoi-my.png'),

-- BẮP RANG
('Bắp rang bơ L', 'Bắp rang bơ size lớn', 49000, 'popcorn', 'https://www.cgv.vn/media/concession/web/637341e0e1786-bap-rang-bo-69oz.png'),
('Bắp rang bơ M', 'Bắp rang bơ size vừa', 39000, 'popcorn', 'https://www.cgv.vn/media/concession/web/637341f3a54bf-bap-rang-bo-46oz.png'),
('Bắp phô mai', 'Bắp rang vị phô mai size L', 55000, 'popcorn', 'https://www.cgv.vn/media/concession/web/637341e0e1786-bap-rang-bo-69oz.png'),

-- NƯỚC UỐNG
('Coca Cola L', 'Coca Cola size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/6373423e7689e-cocacola-32oz.png'),
('Pepsi L', 'Pepsi size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/637342a7aedb5-pepsi-32oz.png'),
('Sprite L', 'Sprite size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/6373427a51b10-sprite-32oz.png'),
('Fanta L', 'Fanta cam size lớn 32oz', 32000, 'drink', 'https://www.cgv.vn/media/concession/web/6373425fe4c67-fanta-32oz.png'),
('Nước suối', 'Nước suối Aquafina 500ml', 15000, 'drink', 'https://www.cgv.vn/media/concession/web/60805c73c3df6-aquafina.png'),

-- SNACK
('Nachos Phô Mai', 'Nachos kèm sốt phô mai', 59000, 'snack', 'https://www.cgv.vn/media/concession/web/60c2b34babb63-nachos.png');

-- Kiểm tra
SELECT 'Cập nhật hình ảnh bắp nước thành công!' as Status;
SELECT id, name, type, price, image_url FROM concessions ORDER BY type, price;
