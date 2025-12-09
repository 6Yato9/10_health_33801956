// Workout routes - CRUD operations for workouts
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { isAuthenticated } = require("../middleware/auth");

// Helper to get base path for redirects
const getBasePath = () => process.env.BASE_PATH || "";

// List all workouts for current user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [workouts] = await pool.query(
      `SELECT w.*, COUNT(we.id) as exercise_count 
             FROM workouts w 
             LEFT JOIN workout_exercises we ON w.id = we.workout_id 
             WHERE w.user_id = ? 
             GROUP BY w.id 
             ORDER BY w.workout_date DESC
             LIMIT ? OFFSET ?`,
      [req.session.user.id, limit, offset]
    );

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM workouts WHERE user_id = ?",
      [req.session.user.id]
    );

    const totalWorkouts = countResult[0].total;
    const totalPages = Math.ceil(totalWorkouts / limit);

    res.render("workouts/list", {
      title: "My Workouts - Fitness Tracker",
      workouts,
      currentPage: page,
      totalPages,
      totalWorkouts,
    });
  } catch (error) {
    console.error("Workouts list error:", error);
    res.render("workouts/list", {
      title: "My Workouts - Fitness Tracker",
      workouts: [],
      currentPage: 1,
      totalPages: 1,
      totalWorkouts: 0,
    });
  }
});

// New workout form
router.get("/new", isAuthenticated, async (req, res) => {
  try {
    const [exercises] = await pool.query(
      `SELECT e.*, c.name as category_name 
             FROM exercises e 
             LEFT JOIN exercise_categories c ON e.category_id = c.id 
             ORDER BY c.name, e.name`
    );

    const [categories] = await pool.query(
      "SELECT * FROM exercise_categories ORDER BY name"
    );

    res.render("workouts/form", {
      title: "Log New Workout - Fitness Tracker",
      workout: null,
      exercises,
      categories,
      workoutExercises: [],
      errors: [],
    });
  } catch (error) {
    console.error("New workout form error:", error);
    res.render("workouts/form", {
      title: "Log New Workout - Fitness Tracker",
      workout: null,
      exercises: [],
      categories: [],
      workoutExercises: [],
      errors: ["Could not load exercise data"],
    });
  }
});

// Create workout
router.post("/new", isAuthenticated, async (req, res) => {
  const {
    name,
    workoutDate,
    durationMinutes,
    totalCalories,
    notes,
    rating,
    exercises,
  } = req.body;
  const errors = [];

  if (!name || name.trim() === "") {
    errors.push("Workout name is required");
  }

  if (!workoutDate) {
    errors.push("Workout date is required");
  }

  if (errors.length > 0) {
    const [exerciseList] = await pool.query(
      `SELECT e.*, c.name as category_name 
             FROM exercises e 
             LEFT JOIN exercise_categories c ON e.category_id = c.id 
             ORDER BY c.name, e.name`
    );
    const [categories] = await pool.query(
      "SELECT * FROM exercise_categories ORDER BY name"
    );

    return res.render("workouts/form", {
      title: "Log New Workout - Fitness Tracker",
      workout: {
        name,
        workout_date: workoutDate,
        duration_minutes: durationMinutes,
        total_calories: totalCalories,
        notes,
        rating,
      },
      exercises: exerciseList,
      categories,
      workoutExercises: [],
      errors,
    });
  }

  try {
    // Insert workout
    const [result] = await pool.query(
      `INSERT INTO workouts (user_id, name, workout_date, duration_minutes, total_calories, notes, rating)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        name,
        workoutDate,
        durationMinutes || null,
        totalCalories || null,
        notes || null,
        rating || null,
      ]
    );

    const workoutId = result.insertId;

    // Insert workout exercises if provided
    if (exercises && Array.isArray(exercises)) {
      for (const ex of exercises) {
        if (ex.exerciseId) {
          await pool.query(
            `INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight_kg, duration_minutes, calories_burned, notes)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              workoutId,
              ex.exerciseId,
              ex.sets || null,
              ex.reps || null,
              ex.weight || null,
              ex.duration || null,
              ex.calories || null,
              ex.notes || null,
            ]
          );
        }
      }
    }

    req.session.success = "Workout logged successfully!";
    res.redirect("./" + workoutId);
  } catch (error) {
    console.error("Create workout error:", error);
    errors.push("Could not save workout. Please try again.");

    const [exerciseList] = await pool.query(
      `SELECT e.*, c.name as category_name 
             FROM exercises e 
             LEFT JOIN exercise_categories c ON e.category_id = c.id 
             ORDER BY c.name, e.name`
    );
    const [categories] = await pool.query(
      "SELECT * FROM exercise_categories ORDER BY name"
    );

    res.render("workouts/form", {
      title: "Log New Workout - Fitness Tracker",
      workout: {
        name,
        workout_date: workoutDate,
        duration_minutes: durationMinutes,
        total_calories: totalCalories,
        notes,
        rating,
      },
      exercises: exerciseList,
      categories,
      workoutExercises: [],
      errors,
    });
  }
});

// View single workout
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const [workouts] = await pool.query(
      `SELECT w.* FROM workouts w WHERE w.id = ? AND w.user_id = ?`,
      [req.params.id, req.session.user.id]
    );

    if (workouts.length === 0) {
      return res.status(404).render("404", { title: "Workout Not Found" });
    }

    const [workoutExercises] = await pool.query(
      `SELECT we.*, e.name as exercise_name, e.muscle_group, c.name as category_name
             FROM workout_exercises we
             JOIN exercises e ON we.exercise_id = e.id
             LEFT JOIN exercise_categories c ON e.category_id = c.id
             WHERE we.workout_id = ?`,
      [req.params.id]
    );

    res.render("workouts/detail", {
      title: `${workouts[0].name} - Fitness Tracker`,
      workout: workouts[0],
      workoutExercises,
    });
  } catch (error) {
    console.error("View workout error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not load workout" });
  }
});

// Edit workout form
router.get("/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const [workouts] = await pool.query(
      `SELECT w.* FROM workouts w WHERE w.id = ? AND w.user_id = ?`,
      [req.params.id, req.session.user.id]
    );

    if (workouts.length === 0) {
      return res.status(404).render("404", { title: "Workout Not Found" });
    }

    const [exercises] = await pool.query(
      `SELECT e.*, c.name as category_name 
             FROM exercises e 
             LEFT JOIN exercise_categories c ON e.category_id = c.id 
             ORDER BY c.name, e.name`
    );

    const [categories] = await pool.query(
      "SELECT * FROM exercise_categories ORDER BY name"
    );

    const [workoutExercises] = await pool.query(
      `SELECT we.*, e.name as exercise_name
             FROM workout_exercises we
             JOIN exercises e ON we.exercise_id = e.id
             WHERE we.workout_id = ?`,
      [req.params.id]
    );

    res.render("workouts/form", {
      title: "Edit Workout - Fitness Tracker",
      workout: workouts[0],
      exercises,
      categories,
      workoutExercises,
      errors: [],
    });
  } catch (error) {
    console.error("Edit workout form error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not load workout" });
  }
});

// Update workout
router.post("/:id/edit", isAuthenticated, async (req, res) => {
  const { name, workoutDate, durationMinutes, totalCalories, notes, rating } =
    req.body;
  const errors = [];

  if (!name || name.trim() === "") {
    errors.push("Workout name is required");
  }

  try {
    // Verify ownership
    const [existing] = await pool.query(
      "SELECT * FROM workouts WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).render("404", { title: "Workout Not Found" });
    }

    if (errors.length > 0) {
      const [exercises] = await pool.query(
        `SELECT e.*, c.name as category_name 
                 FROM exercises e 
                 LEFT JOIN exercise_categories c ON e.category_id = c.id 
                 ORDER BY c.name, e.name`
      );
      const [categories] = await pool.query(
        "SELECT * FROM exercise_categories ORDER BY name"
      );
      const [workoutExercises] = await pool.query(
        `SELECT we.*, e.name as exercise_name
                 FROM workout_exercises we
                 JOIN exercises e ON we.exercise_id = e.id
                 WHERE we.workout_id = ?`,
        [req.params.id]
      );

      return res.render("workouts/form", {
        title: "Edit Workout - Fitness Tracker",
        workout: {
          ...existing[0],
          name,
          workout_date: workoutDate,
          duration_minutes: durationMinutes,
          total_calories: totalCalories,
          notes,
          rating,
        },
        exercises,
        categories,
        workoutExercises,
        errors,
      });
    }

    await pool.query(
      `UPDATE workouts SET name = ?, workout_date = ?, duration_minutes = ?, total_calories = ?, notes = ?, rating = ?
             WHERE id = ? AND user_id = ?`,
      [
        name,
        workoutDate,
        durationMinutes || null,
        totalCalories || null,
        notes || null,
        rating || null,
        req.params.id,
        req.session.user.id,
      ]
    );

    req.session.success = "Workout updated successfully!";
    res.redirect("./" + req.params.id);
  } catch (error) {
    console.error("Update workout error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not update workout" });
  }
});

// Delete workout
router.post("/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM workouts WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).render("404", { title: "Workout Not Found" });
    }

    req.session.success = "Workout deleted successfully!";
    res.redirect("./");
  } catch (error) {
    console.error("Delete workout error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not delete workout" });
  }
});

// Add exercise to workout
router.post("/:id/exercises", isAuthenticated, async (req, res) => {
  const { exerciseId, sets, reps, weight, duration, calories, notes } =
    req.body;

  try {
    // Verify ownership
    const [existing] = await pool.query(
      "SELECT * FROM workouts WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Workout not found" });
    }

    await pool.query(
      `INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight_kg, duration_minutes, calories_burned, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        exerciseId,
        sets || null,
        reps || null,
        weight || null,
        duration || null,
        calories || null,
        notes || null,
      ]
    );

    req.session.success = "Exercise added to workout!";
    res.redirect("./" + req.params.id);
  } catch (error) {
    console.error("Add exercise error:", error);
    req.session.error = "Could not add exercise";
    res.redirect("./" + req.params.id);
  }
});

// Remove exercise from workout
router.post(
  "/:id/exercises/:exerciseId/delete",
  isAuthenticated,
  async (req, res) => {
    try {
      // Verify ownership through workout
      const [existing] = await pool.query(
        `SELECT we.* FROM workout_exercises we
             JOIN workouts w ON we.workout_id = w.id
             WHERE we.id = ? AND w.user_id = ?`,
        [req.params.exerciseId, req.session.user.id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      await pool.query("DELETE FROM workout_exercises WHERE id = ?", [
        req.params.exerciseId,
      ]);

      req.session.success = "Exercise removed from workout!";
      res.redirect("./" + req.params.id);
    } catch (error) {
      console.error("Remove exercise error:", error);
      req.session.error = "Could not remove exercise";
      res.redirect("./" + req.params.id);
    }
  }
);

module.exports = router;
