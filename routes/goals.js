// Goals routes - CRUD operations for fitness goals
const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { isAuthenticated } = require("../middleware/auth");

// List all goals for current user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const status = req.query.status || "";

    let query = `SELECT * FROM goals WHERE user_id = ?`;
    const params = [req.session.user.id];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query +=
      ' ORDER BY FIELD(status, "active", "completed", "abandoned"), target_date ASC';

    const [goals] = await pool.query(query, params);

    // Calculate progress percentage for each goal
    goals.forEach((goal) => {
      if (goal.target_value && goal.target_value > 0) {
        goal.progress = Math.min(
          100,
          Math.round((goal.current_value / goal.target_value) * 100)
        );
      } else {
        goal.progress = 0;
      }
    });

    res.render("goals/list", {
      title: "My Goals - Fitness Tracker",
      goals,
      selectedStatus: status,
    });
  } catch (error) {
    console.error("Goals list error:", error);
    res.render("goals/list", {
      title: "My Goals - Fitness Tracker",
      goals: [],
      selectedStatus: "",
    });
  }
});

// New goal form
router.get("/new", isAuthenticated, (req, res) => {
  res.render("goals/form", {
    title: "Create New Goal - Fitness Tracker",
    goal: null,
    errors: [],
  });
});

// Create goal
router.post("/new", isAuthenticated, async (req, res) => {
  const {
    title,
    description,
    goalType,
    targetValue,
    currentValue,
    unit,
    startDate,
    targetDate,
  } = req.body;
  const errors = [];

  if (!title || title.trim() === "") {
    errors.push("Goal title is required");
  }

  if (!goalType) {
    errors.push("Goal type is required");
  }

  if (!startDate) {
    errors.push("Start date is required");
  }

  if (errors.length > 0) {
    return res.render("goals/form", {
      title: "Create New Goal - Fitness Tracker",
      goal: {
        title,
        description,
        goal_type: goalType,
        target_value: targetValue,
        current_value: currentValue,
        unit,
        start_date: startDate,
        target_date: targetDate,
      },
      errors,
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO goals (user_id, title, description, goal_type, target_value, current_value, unit, start_date, target_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        title,
        description || null,
        goalType,
        targetValue || null,
        currentValue || 0,
        unit || null,
        startDate,
        targetDate || null,
      ]
    );

    req.session.success = "Goal created successfully!";
    res.redirect("/goals/" + result.insertId);
  } catch (error) {
    console.error("Create goal error:", error);
    errors.push("Could not save goal. Please try again.");
    res.render("goals/form", {
      title: "Create New Goal - Fitness Tracker",
      goal: {
        title,
        description,
        goal_type: goalType,
        target_value: targetValue,
        current_value: currentValue,
        unit,
        start_date: startDate,
        target_date: targetDate,
      },
      errors,
    });
  }
});

// View single goal
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const [goals] = await pool.query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (goals.length === 0) {
      return res.status(404).render("404", { title: "Goal Not Found" });
    }

    const goal = goals[0];

    // Calculate progress
    if (goal.target_value && goal.target_value > 0) {
      goal.progress = Math.min(
        100,
        Math.round((goal.current_value / goal.target_value) * 100)
      );
    } else {
      goal.progress = 0;
    }

    // Calculate days remaining
    if (goal.target_date) {
      const today = new Date();
      const target = new Date(goal.target_date);
      const diffTime = target - today;
      goal.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    res.render("goals/detail", {
      title: `${goal.title} - Fitness Tracker`,
      goal,
    });
  } catch (error) {
    console.error("View goal error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not load goal" });
  }
});

// Edit goal form
router.get("/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const [goals] = await pool.query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (goals.length === 0) {
      return res.status(404).render("404", { title: "Goal Not Found" });
    }

    res.render("goals/form", {
      title: "Edit Goal - Fitness Tracker",
      goal: goals[0],
      errors: [],
    });
  } catch (error) {
    console.error("Edit goal form error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not load goal" });
  }
});

// Update goal
router.post("/:id/edit", isAuthenticated, async (req, res) => {
  const {
    title,
    description,
    goalType,
    targetValue,
    currentValue,
    unit,
    startDate,
    targetDate,
    status,
  } = req.body;
  const errors = [];

  if (!title || title.trim() === "") {
    errors.push("Goal title is required");
  }

  try {
    // Verify ownership
    const [existing] = await pool.query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).render("404", { title: "Goal Not Found" });
    }

    if (errors.length > 0) {
      return res.render("goals/form", {
        title: "Edit Goal - Fitness Tracker",
        goal: {
          ...existing[0],
          title,
          description,
          goal_type: goalType,
          target_value: targetValue,
          current_value: currentValue,
          unit,
          start_date: startDate,
          target_date: targetDate,
          status,
        },
        errors,
      });
    }

    await pool.query(
      `UPDATE goals SET title = ?, description = ?, goal_type = ?, target_value = ?, current_value = ?, unit = ?, start_date = ?, target_date = ?, status = ?
             WHERE id = ? AND user_id = ?`,
      [
        title,
        description || null,
        goalType,
        targetValue || null,
        currentValue || 0,
        unit || null,
        startDate,
        targetDate || null,
        status || "active",
        req.params.id,
        req.session.user.id,
      ]
    );

    req.session.success = "Goal updated successfully!";
    res.redirect("/goals/" + req.params.id);
  } catch (error) {
    console.error("Update goal error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not update goal" });
  }
});

// Update progress (quick update)
router.post("/:id/progress", isAuthenticated, async (req, res) => {
  const { currentValue } = req.body;

  try {
    const [existing] = await pool.query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Check if goal is completed
    let status = existing[0].status;
    if (
      existing[0].target_value &&
      parseFloat(currentValue) >= parseFloat(existing[0].target_value)
    ) {
      status = "completed";
    }

    await pool.query(
      "UPDATE goals SET current_value = ?, status = ? WHERE id = ? AND user_id = ?",
      [currentValue, status, req.params.id, req.session.user.id]
    );

    if (status === "completed") {
      req.session.success = "Congratulations! Goal completed!";
    } else {
      req.session.success = "Progress updated!";
    }

    res.redirect("/goals/" + req.params.id);
  } catch (error) {
    console.error("Update progress error:", error);
    req.session.error = "Could not update progress";
    res.redirect("/goals/" + req.params.id);
  }
});

// Delete goal
router.post("/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).render("404", { title: "Goal Not Found" });
    }

    req.session.success = "Goal deleted successfully!";
    res.redirect("/goals");
  } catch (error) {
    console.error("Delete goal error:", error);
    res
      .status(500)
      .render("error", { title: "Error", message: "Could not delete goal" });
  }
});

module.exports = router;
