// Main routes - Home, About, Search
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

// Home page
router.get("/", async (req, res) => {
  // Default values
  let stats = {
    totalUsers: 0,
    totalWorkouts: 0,
    totalExercises: 0,
  };
  let recentWorkouts = [];
  let userStats = null;

  try {
    // Get some statistics for the home page
    const [userCount] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [workoutCount] = await pool.query(
      "SELECT COUNT(*) as count FROM workouts"
    );
    const [exerciseCount] = await pool.query(
      "SELECT COUNT(*) as count FROM exercises"
    );

    stats.totalUsers = userCount[0].count;
    stats.totalWorkouts = workoutCount[0].count;
    stats.totalExercises = exerciseCount[0].count;
  } catch (dbError) {
    console.log("Database stats error:", dbError.message);
  }

  // Get recent workouts if user is logged in
  if (req.session && req.session.user) {
    try {
      const [workouts] = await pool.query(
        `SELECT w.*, COUNT(we.id) as exercise_count 
         FROM workouts w 
         LEFT JOIN workout_exercises we ON w.id = we.workout_id 
         WHERE w.user_id = ? 
         GROUP BY w.id 
         ORDER BY w.workout_date DESC 
         LIMIT 5`,
        [req.session.user.id]
      );
      recentWorkouts = workouts || [];

      const [statsResult] = await pool.query(
        `SELECT * FROM user_stats WHERE user_id = ?`,
        [req.session.user.id]
      );
      userStats = statsResult[0] || null;
    } catch (dbError) {
      console.log("User data error:", dbError.message);
    }
  }

  res.render("home", {
    title: "Fitness Tracker - Home",
    stats: stats,
    recentWorkouts: recentWorkouts,
    userStats: userStats,
  });
});

// About page
router.get("/about", (req, res) => {
  res.render("about", { title: "About - Fitness Tracker" });
});

// Search page
router.get("/search", async (req, res) => {
  const query = req.query.q || "";
  const type = req.query.type || "all";
  let results = {
    exercises: [],
    workouts: [],
    users: [],
  };

  if (query.trim()) {
    try {
      const searchTerm = `%${query}%`;

      // Search exercises
      if (type === "all" || type === "exercises") {
        const [exercises] = await pool.query(
          `SELECT e.*, c.name as category_name 
                     FROM exercises e 
                     LEFT JOIN exercise_categories c ON e.category_id = c.id 
                     WHERE e.name LIKE ? OR e.description LIKE ? OR e.muscle_group LIKE ?
                     LIMIT 20`,
          [searchTerm, searchTerm, searchTerm]
        );
        results.exercises = exercises;
      }

      // Search workouts (only user's own if logged in, or public summary)
      if (type === "all" || type === "workouts") {
        if (req.session.user) {
          const [workouts] = await pool.query(
            `SELECT w.*, u.username 
                         FROM workouts w 
                         JOIN users u ON w.user_id = u.id 
                         WHERE w.user_id = ? AND (w.name LIKE ? OR w.notes LIKE ?)
                         ORDER BY w.workout_date DESC
                         LIMIT 20`,
            [req.session.user.id, searchTerm, searchTerm]
          );
          results.workouts = workouts;
        }
      }

      // Search users (public profiles)
      if (type === "all" || type === "users") {
        const [users] = await pool.query(
          `SELECT u.id, u.username, up.first_name, up.last_name 
                     FROM users u 
                     LEFT JOIN user_profiles up ON u.id = up.user_id 
                     WHERE u.username LIKE ? OR up.first_name LIKE ? OR up.last_name LIKE ?
                     LIMIT 20`,
          [searchTerm, searchTerm, searchTerm]
        );
        results.users = users;
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  res.render("search", {
    title: "Search - Fitness Tracker",
    query,
    type,
    results,
  });
});

// Exercise library page
router.get("/exercises", async (req, res) => {
  try {
    const category = req.query.category || "";
    const difficulty = req.query.difficulty || "";

    let query = `
            SELECT e.*, c.name as category_name 
            FROM exercises e 
            LEFT JOIN exercise_categories c ON e.category_id = c.id 
            WHERE 1=1
        `;
    const params = [];

    if (category) {
      query += " AND c.name = ?";
      params.push(category);
    }

    if (difficulty) {
      query += " AND e.difficulty = ?";
      params.push(difficulty);
    }

    query += " ORDER BY e.name";

    const [exercises] = await pool.query(query, params);
    const [categories] = await pool.query(
      "SELECT * FROM exercise_categories ORDER BY name"
    );

    res.render("exercises", {
      title: "Exercise Library - Fitness Tracker",
      exercises,
      categories,
      selectedCategory: category,
      selectedDifficulty: difficulty,
    });
  } catch (error) {
    console.error("Exercises page error:", error);
    res.render("exercises", {
      title: "Exercise Library - Fitness Tracker",
      exercises: [],
      categories: [],
      selectedCategory: "",
      selectedDifficulty: "",
    });
  }
});

// Single exercise detail
router.get("/exercises/:id", async (req, res) => {
  try {
    const [exercises] = await pool.query(
      `SELECT e.*, c.name as category_name, c.description as category_description
             FROM exercises e 
             LEFT JOIN exercise_categories c ON e.category_id = c.id 
             WHERE e.id = ?`,
      [req.params.id]
    );

    if (exercises.length === 0) {
      return res.status(404).render("404", { title: "Exercise Not Found" });
    }

    res.render("exercise-detail", {
      title: `${exercises[0].name} - Fitness Tracker`,
      exercise: exercises[0],
    });
  } catch (error) {
    console.error("Exercise detail error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not load exercise" });
  }
});

module.exports = router;
