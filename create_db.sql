-- Create database script for Fitness Tracker Application
-- Run this script to set up the database from scratch

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS health;
USE health;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS exercise_categories;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User profiles for additional user information
CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active') DEFAULT 'moderate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Exercise categories
CREATE TABLE exercise_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50)
);

-- Exercises library
CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT,
    calories_per_minute DECIMAL(5,2),
    muscle_group VARCHAR(100),
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL
);

-- Workouts (user's workout sessions)
CREATE TABLE workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    workout_date DATE NOT NULL,
    duration_minutes INT,
    total_calories INT,
    notes TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workout exercises (exercises performed in a workout)
CREATE TABLE workout_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT,
    reps INT,
    weight_kg DECIMAL(5,2),
    duration_minutes INT,
    calories_burned INT,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Fitness goals
CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    goal_type ENUM('weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness', 'other') NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20),
    start_date DATE NOT NULL,
    target_date DATE,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(workout_date);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_exercises_category ON exercises(category_id);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);

-- Create a view for workout summaries
CREATE OR REPLACE VIEW workout_summary AS
SELECT 
    w.id,
    w.user_id,
    u.username,
    w.name,
    w.workout_date,
    w.duration_minutes,
    w.total_calories,
    w.rating,
    COUNT(we.id) as exercise_count
FROM workouts w
JOIN users u ON w.user_id = u.id
LEFT JOIN workout_exercises we ON w.id = we.workout_id
GROUP BY w.id, w.user_id, u.username, w.name, w.workout_date, w.duration_minutes, w.total_calories, w.rating;

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT w.id) as total_workouts,
    COALESCE(SUM(w.duration_minutes), 0) as total_minutes,
    COALESCE(SUM(w.total_calories), 0) as total_calories,
    COALESCE(AVG(w.rating), 0) as avg_rating,
    COUNT(DISTINCT g.id) as total_goals,
    SUM(CASE WHEN g.status = 'completed' THEN 1 ELSE 0 END) as completed_goals
FROM users u
LEFT JOIN workouts w ON u.id = w.user_id
LEFT JOIN goals g ON u.id = g.user_id
GROUP BY u.id, u.username;
