-- Thêm 10 suất chiếu mẫu
-- Lấy movie_id từ phim đang chiếu, screen_id từ screens có sẵn

INSERT INTO `showtimes` (`movie_id`, `screen_id`, `start_time`, `end_time`, `language`, `subtitle`, `status`) VALUES
-- Hôm nay
((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1), 1, 
 DATE_ADD(CURDATE(), INTERVAL 9 HOUR), 
 DATE_ADD(CURDATE(), INTERVAL 11 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1), 1, 
 DATE_ADD(CURDATE(), INTERVAL 14 HOUR), 
 DATE_ADD(CURDATE(), INTERVAL 16 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1), 2, 
 DATE_ADD(CURDATE(), INTERVAL 19 HOUR), 
 DATE_ADD(CURDATE(), INTERVAL 21 HOUR), 
 'Tiếng Việt', NULL, 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1 OFFSET 1), 1, 
 DATE_ADD(CURDATE(), INTERVAL 10 HOUR), 
 DATE_ADD(CURDATE(), INTERVAL 12 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1 OFFSET 1), 3, 
 DATE_ADD(CURDATE(), INTERVAL 15 HOUR), 
 DATE_ADD(CURDATE(), INTERVAL 17 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

-- Ngày mai
((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1), 1, 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR), 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 11 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1), 2, 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 14 HOUR), 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 16 HOUR), 
 'Tiếng Việt', NULL, 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1 OFFSET 1), 1, 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 19 HOUR), 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 21 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

-- Ngày kia
((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1), 3, 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 2 DAY), INTERVAL 10 HOUR), 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 2 DAY), INTERVAL 12 HOUR), 
 'Tiếng Anh', 'Phụ đề Việt', 'selling'),

((SELECT id FROM movies WHERE status = 'now_showing' LIMIT 1 OFFSET 1), 2, 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 2 DAY), INTERVAL 20 HOUR), 
 DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 2 DAY), INTERVAL 22 HOUR), 
 'Tiếng Việt', NULL, 'selling');

-- Kiểm tra kết quả
SELECT COUNT(*) as 'Tổng suất chiếu' FROM showtimes;
