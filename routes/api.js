// API routes - JSON endpoints for AJAX requests
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { isAuthenticated } = require("../middleware/auth");

// Get exercises (for autocomplete/select)
router.get("/exercises", async (req, res) => {
  try {
    const category = req.query.category || "";
    const search = req.query.search || "";

    let query = `
            SELECT e.id, e.name, e.calories_per_minute, e.muscle_group, e.difficulty, c.name as category_name
            FROM exercises e
            LEFT JOIN exercise_categories c ON e.category_id = c.id
            WHERE 1=1
        `;
    const params = [];

    if (category) {
      query += " AND c.name = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (e.name LIKE ? OR e.muscle_group LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY e.name LIMIT 50";

    const [exercises] = await pool.query(query, params);
    res.json(exercises);
  } catch (error) {
    console.error("API exercises error:", error);
    res.status(500).json({ error: "Could not fetch exercises" });
  }
});

// Get exercise categories
router.get("/categories", async (req, res) => {
  try {
    const [categories] = await pool.query(
      "SELECT * FROM exercise_categories ORDER BY name"
    );
    res.json(categories);
  } catch (error) {
    console.error("API categories error:", error);
    res.status(500).json({ error: "Could not fetch categories" });
  }
});

// Get user stats
router.get("/stats", isAuthenticated, async (req, res) => {
  try {
    const [stats] = await pool.query(
      "SELECT * FROM user_stats WHERE user_id = ?",
      [req.session.user.id]
    );

    // Get workout data for chart (last 30 days)
    const [workoutData] = await pool.query(
      `SELECT DATE(workout_date) as date, SUM(duration_minutes) as minutes, SUM(total_calories) as calories
             FROM workouts
             WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY DATE(workout_date)
             ORDER BY date`,
      [req.session.user.id]
    );

    // Get goal progress
    const [goals] = await pool.query(
      `SELECT title, current_value, target_value, 
                    ROUND((current_value / target_value) * 100, 1) as progress
             FROM goals
             WHERE user_id = ? AND status = 'active' AND target_value > 0
             ORDER BY progress DESC
             LIMIT 5`,
      [req.session.user.id]
    );

    res.json({
      stats: stats[0] || {},
      workoutData,
      goals,
    });
  } catch (error) {
    console.error("API stats error:", error);
    res.status(500).json({ error: "Could not fetch stats" });
  }
});

// Get recent workouts
router.get("/workouts/recent", isAuthenticated, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const [workouts] = await pool.query(
      `SELECT w.id, w.name, w.workout_date, w.duration_minutes, w.total_calories, w.rating,
                    COUNT(we.id) as exercise_count
             FROM workouts w
             LEFT JOIN workout_exercises we ON w.id = we.workout_id
             WHERE w.user_id = ?
             GROUP BY w.id
             ORDER BY w.workout_date DESC
             LIMIT ?`,
      [req.session.user.id, limit]
    );

    res.json(workouts);
  } catch (error) {
    console.error("API recent workouts error:", error);
    res.status(500).json({ error: "Could not fetch workouts" });
  }
});

// Calculate calories for an exercise
router.get("/exercises/:id/calories", async (req, res) => {
  try {
    const duration = parseInt(req.query.duration) || 0;

    const [exercises] = await pool.query(
      "SELECT calories_per_minute FROM exercises WHERE id = ?",
      [req.params.id]
    );

    if (exercises.length === 0) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    const caloriesPerMinute = exercises[0].calories_per_minute || 5;
    const totalCalories = Math.round(caloriesPerMinute * duration);

    res.json({ calories: totalCalories });
  } catch (error) {
    console.error("API calories error:", error);
    res.status(500).json({ error: "Could not calculate calories" });
  }
});

// Search endpoint for AJAX
router.get("/search", async (req, res) => {
  const query = req.query.q || "";
  const type = req.query.type || "exercises";

  if (!query.trim()) {
    return res.json([]);
  }

  try {
    const searchTerm = `%${query}%`;
    let results = [];

    if (type === "exercises") {
      const [exercises] = await pool.query(
        `SELECT e.id, e.name, e.muscle_group, c.name as category
                 FROM exercises e
                 LEFT JOIN exercise_categories c ON e.category_id = c.id
                 WHERE e.name LIKE ? OR e.muscle_group LIKE ?
                 LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results = exercises;
    }

    res.json(results);
  } catch (error) {
    console.error("API search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
