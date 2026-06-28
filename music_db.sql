-- ============================================
-- ПОЛНАЯ СТРУКТУРА ДЛЯ MUSICBOARD (БЕЗ РЕГИСТРАЦИИ)
-- ============================================

-- Удаляем старые таблицы, если есть
DROP TABLE IF EXISTS playlist_tracks;
DROP TABLE IF EXISTS liked_tracks;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS artist_bios;

-- ===== USERS (БЕЗ email и password) =====
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===== ARTISTS =====
CREATE TABLE `artists` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(512) NULL,
    `bio` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===== ARTIST BIOS =====
CREATE TABLE `artist_bios` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `artist_id` BIGINT NOT NULL,
    `language_code` VARCHAR(5) NOT NULL DEFAULT 'ua',
    `bio` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_artist_lang` (`artist_id`, `language_code`)
);

-- ===== ALBUMS =====
CREATE TABLE `albums` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `artist_id` BIGINT NOT NULL,
    `cover_url` VARCHAR(512) NULL,
    `release_year` INT NULL,
    `is_single` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE CASCADE
);

-- ===== TRACKS =====
CREATE TABLE `tracks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `artist_id` BIGINT NOT NULL,
    `album_id` BIGINT NULL,
    `genre` VARCHAR(100) NULL,
    `duration` INT NULL,
    `release_year` INT NULL,
    `file_url` VARCHAR(512) NOT NULL,
    `cover_url` VARCHAR(512) NULL,
    `plays_count` INT NOT NULL DEFAULT 0,
    `likes` INT NOT NULL DEFAULT 0,
    `is_official` TINYINT(1) NOT NULL DEFAULT 0,
    `user_id` BIGINT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- ===== PLAYLISTS (НЕ ИСПОЛЬЗУЕТСЯ, НО ПУСТЬ БУДЕТ) =====
CREATE TABLE `playlists` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `is_private` BOOLEAN NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ===== PLAYLIST_TRACKS =====
CREATE TABLE `playlist_tracks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `playlist_id` BIGINT NOT NULL,
    `track_id` BIGINT NOT NULL,
    `added_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE
);

-- ===== LIKED_TRACKS =====
CREATE TABLE `liked_tracks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `track_id` BIGINT NOT NULL,
    `liked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_track` (`user_id`, `track_id`)
);

-- ===== СОЗДАЕМ АДМИНА =====
INSERT INTO `users` (username, is_admin) VALUES ('admin', 1);

-- ===== ПРОВЕРКА =====
SELECT id, username, is_admin FROM users;