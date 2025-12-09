-- Insert test data for Fitness Tracker Application
-- Run this after create_db.sql

USE health;

-- Insert default user (gold/smiths)
-- Password hash is for 'smiths' using bcrypt (cost factor 10)
INSERT INTO users (username, email, password_hash) VALUES
('gold', 'gold@example.com', '$2b$10$BdT0IVM27Jc29I4lnTdOguK4j2jxL0qpzRjBZWs7IK0jeJ4MjPqni'),
('testuser', 'test@example.com', '$2b$10$BdT0IVM27Jc29I4lnTdOguK4j2jxL0qpzRjBZWs7IK0jeJ4MjPqni'),
('fitness_fan', 'fitness@example.com', '$2b$10$BdT0IVM27Jc29I4lnTdOguK4j2jxL0qpzRjBZWs7IK0jeJ4MjPqni');

-- Insert user profiles
INSERT INTO user_profiles (user_id, first_name, last_name, date_of_birth, gender, height_cm, weight_kg, activity_level) VALUES
(1, 'Gold', 'Smith', '1990-05-15', 'male', 175.00, 75.00, 'active'),
(2, 'Test', 'User', '1995-08-20', 'female', 165.00, 60.00, 'moderate'),
(3, 'Fitness', 'Fan', '1988-03-10', 'male', 180.00, 82.00, 'very_active');

-- Insert exercise categories
INSERT INTO exercise_categories (name, description, icon) VALUES
('Cardio', 'Cardiovascular exercises to improve heart health and burn calories', 'heart'),
('Strength', 'Weight training and resistance exercises for muscle building', 'dumbbell'),
('Flexibility', 'Stretching and mobility exercises', 'stretch'),
('HIIT', 'High-Intensity Interval Training workouts', 'fire'),
('Sports', 'Various sports activities', 'trophy'),
('Yoga', 'Yoga poses and flows for mind-body wellness', 'lotus');

-- Insert exercises
INSERT INTO exercises (name, description, category_id, calories_per_minute, muscle_group, difficulty) VALUES
-- Cardio exercises
('Running', 'Outdoor or treadmill running', 1, 10.00, 'Full Body', 'beginner'),
('Cycling', 'Stationary or outdoor cycling', 1, 8.00, 'Legs', 'beginner'),
('Swimming', 'Lap swimming in pool', 1, 9.00, 'Full Body', 'intermediate'),
('Jump Rope', 'Skipping rope exercise', 1, 12.00, 'Full Body', 'beginner'),
('Rowing', 'Rowing machine workout', 1, 8.50, 'Back, Arms', 'intermediate'),

-- Strength exercises
('Bench Press', 'Barbell or dumbbell chest press', 2, 5.00, 'Chest', 'intermediate'),
('Squats', 'Barbell or bodyweight squats', 2, 6.00, 'Legs, Glutes', 'beginner'),
('Deadlift', 'Conventional or sumo deadlift', 2, 6.50, 'Back, Legs', 'advanced'),
('Pull-ups', 'Bodyweight pull-ups', 2, 5.50, 'Back, Biceps', 'intermediate'),
('Shoulder Press', 'Overhead press with dumbbells or barbell', 2, 4.50, 'Shoulders', 'intermediate'),
('Bicep Curls', 'Dumbbell or barbell curls', 2, 3.50, 'Biceps', 'beginner'),
('Tricep Dips', 'Bodyweight or assisted dips', 2, 4.00, 'Triceps', 'beginner'),
('Lunges', 'Walking or stationary lunges', 2, 5.00, 'Legs, Glutes', 'beginner'),
('Plank', 'Core stabilization exercise', 2, 3.00, 'Core', 'beginner'),

-- Flexibility exercises
('Static Stretching', 'Hold stretches for flexibility', 3, 2.00, 'Full Body', 'beginner'),
('Dynamic Stretching', 'Movement-based stretching', 3, 3.00, 'Full Body', 'beginner'),
('Foam Rolling', 'Self-myofascial release', 3, 2.50, 'Full Body', 'beginner'),

-- HIIT exercises
('Burpees', 'Full body explosive exercise', 4, 12.00, 'Full Body', 'intermediate'),
('Mountain Climbers', 'Core and cardio exercise', 4, 10.00, 'Core, Legs', 'beginner'),
('Box Jumps', 'Plyometric jumping exercise', 4, 11.00, 'Legs', 'intermediate'),
('Kettlebell Swings', 'Hip hinge explosive movement', 4, 10.00, 'Glutes, Back', 'intermediate'),

-- Sports
('Basketball', 'Playing basketball', 5, 8.00, 'Full Body', 'intermediate'),
('Tennis', 'Playing tennis', 5, 7.50, 'Full Body', 'intermediate'),
('Soccer', 'Playing soccer/football', 5, 9.00, 'Legs, Full Body', 'intermediate'),

-- Yoga
('Sun Salutation', 'Classic yoga flow sequence', 6, 3.50, 'Full Body', 'beginner'),
('Warrior Poses', 'Standing yoga poses', 6, 3.00, 'Legs, Core', 'beginner'),
('Balance Poses', 'Single-leg balance poses', 6, 2.50, 'Core, Legs', 'intermediate');

-- Insert sample workouts for gold user
INSERT INTO workouts (user_id, name, workout_date, duration_minutes, total_calories, notes, rating) VALUES
(1, 'Morning Cardio', '2024-01-15', 45, 450, 'Great morning run in the park', 5),
(1, 'Upper Body Strength', '2024-01-16', 60, 350, 'Focused on chest and back', 4),
(1, 'HIIT Session', '2024-01-17', 30, 400, 'Intense but effective', 5),
(1, 'Leg Day', '2024-01-18', 50, 380, 'Squats and lunges', 4),
(1, 'Yoga Flow', '2024-01-19', 40, 150, 'Relaxing recovery session', 5),
(1, 'Full Body Workout', '2024-01-20', 55, 420, 'Mixed exercises', 4),
(2, 'Evening Run', '2024-01-15', 30, 300, 'Quick run after work', 4),
(2, 'Core Workout', '2024-01-17', 25, 180, 'Abs and planks', 3),
(3, 'Marathon Training', '2024-01-15', 90, 900, 'Long distance run', 5),
(3, 'Cross Training', '2024-01-16', 60, 500, 'Mixed cardio and strength', 4);

-- Insert workout exercises
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight_kg, duration_minutes, calories_burned, notes) VALUES
-- Morning Cardio workout
(1, 1, NULL, NULL, NULL, 30, 300, 'Steady pace'),
(1, 4, 3, 100, NULL, 15, 150, 'Jump rope intervals'),

-- Upper Body Strength workout
(2, 6, 4, 10, 60.00, 15, 75, 'Increased weight'),
(2, 9, 3, 8, NULL, 10, 55, 'Strict form'),
(2, 10, 4, 12, 20.00, 10, 45, NULL),
(2, 11, 3, 15, NULL, 10, 40, NULL),
(2, 12, 3, 12, 15.00, 10, 35, NULL),

-- HIIT Session
(3, 18, 4, 15, NULL, 8, 120, 'Tough but great'),
(3, 19, 4, 30, NULL, 8, 100, NULL),
(3, 21, 3, 20, 16.00, 10, 100, NULL),

-- Leg Day
(4, 7, 5, 10, 80.00, 20, 150, 'Heavy squats'),
(4, 13, 4, 12, 20.00, 15, 100, 'Walking lunges'),
(4, 8, 3, 8, 100.00, 15, 130, 'New PR!'),

-- Yoga Flow
(5, 26, 3, NULL, NULL, 20, 70, 'Morning flow'),
(5, 27, 2, NULL, NULL, 15, 50, NULL),
(5, 28, 2, NULL, NULL, 5, 30, 'Working on balance');

-- Insert goals for users
INSERT INTO goals (user_id, title, description, goal_type, target_value, current_value, unit, start_date, target_date, status) VALUES
(1, 'Lose 5kg', 'Reduce body weight by 5kg through cardio and diet', 'weight_loss', 5.00, 2.50, 'kg', '2024-01-01', '2024-03-31', 'active'),
(1, 'Run a 10K', 'Complete a 10K run under 50 minutes', 'endurance', 10.00, 7.50, 'km', '2024-01-01', '2024-04-30', 'active'),
(1, 'Bench Press 100kg', 'Increase bench press to 100kg', 'muscle_gain', 100.00, 75.00, 'kg', '2024-01-01', '2024-06-30', 'active'),
(2, 'Exercise 3x per week', 'Maintain consistent workout schedule', 'general_fitness', 12.00, 8.00, 'workouts/month', '2024-01-01', '2024-12-31', 'active'),
(2, 'Improve Flexibility', 'Touch toes without bending knees', 'flexibility', 100.00, 60.00, '%', '2024-01-01', '2024-06-30', 'active'),
(3, 'Complete Marathon', 'Finish a full marathon', 'endurance', 42.20, 30.00, 'km', '2024-01-01', '2024-09-30', 'active'),
(1, 'Daily Steps Goal', 'Walk 10000 steps daily for a month', 'general_fitness', 300000.00, 300000.00, 'steps', '2023-11-01', '2023-11-30', 'completed');
