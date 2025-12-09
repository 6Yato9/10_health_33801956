// Authentication routes - Login, Register, Logout
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
const {
  isAuthenticated,
  isNotAuthenticated,
  validatePassword,
} = require("../middleware/auth");

// Helper to get base path for redirects
const getBasePath = () => process.env.BASE_PATH || "";

// Login page
router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("auth/login", {
    title: "Login - Fitness Tracker",
    errors: [],
  });
});

// Login POST
router.post("/login", isNotAuthenticated, async (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || !password) {
    errors.push("Please enter both username and password");
    return res.render("auth/login", {
      title: "Login - Fitness Tracker",
      errors,
    });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (users.length === 0) {
      errors.push("Invalid username or password");
      return res.render("auth/login", {
        title: "Login - Fitness Tracker",
        errors,
      });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      errors.push("Invalid username or password");
      return res.render("auth/login", {
        title: "Login - Fitness Tracker",
        errors,
      });
    }

    // Get user profile
    const [profiles] = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [user.id]
    );

    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile: profiles[0] || null,
    };

    req.session.success = "Welcome back, " + user.username + "!";
    res.redirect(getBasePath() + "/");
  } catch (error) {
    console.error("Login error:", error);
    errors.push("An error occurred. Please try again.");
    res.render("auth/login", { title: "Login - Fitness Tracker", errors });
  }
});

// Register page
router.get("/register", isNotAuthenticated, (req, res) => {
  res.render("auth/register", {
    title: "Register - Fitness Tracker",
    errors: [],
    formData: {},
  });
});

// Register POST
router.post("/register", isNotAuthenticated, async (req, res) => {
  const { username, email, password, confirmPassword, firstName, lastName } =
    req.body;
  const errors = [];

  // Validation
  if (!username || username.length < 3) {
    errors.push("Username must be at least 3 characters");
  }

  if (!email || !email.includes("@")) {
    errors.push("Please enter a valid email address");
  }

  // Password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  if (errors.length > 0) {
    return res.render("auth/register", {
      title: "Register - Fitness Tracker",
      errors,
      formData: { username, email, firstName, lastName },
    });
  }

  try {
    // Check if username or email exists
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      if (existingUsers[0].username === username) {
        errors.push("Username already taken");
      } else {
        errors.push("Email already registered");
      }
      return res.render("auth/register", {
        title: "Register - Fitness Tracker",
        errors,
        formData: { username, email, firstName, lastName },
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, passwordHash]
    );

    const userId = result.insertId;

    // Insert profile
    await pool.query(
      "INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (?, ?, ?)",
      [userId, firstName || null, lastName || null]
    );

    // Auto-login
    req.session.user = {
      id: userId,
      username: username,
      email: email,
      profile: { first_name: firstName, last_name: lastName },
    };

    req.session.success =
      "Account created successfully! Welcome to Fitness Tracker!";
    res.redirect(getBasePath() + "/");
  } catch (error) {
    console.error("Registration error:", error);
    errors.push("An error occurred during registration. Please try again.");
    res.render("auth/register", {
      title: "Register - Fitness Tracker",
      errors,
      formData: { username, email, firstName, lastName },
    });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect(getBasePath() + "/");
  });
});

// Profile page
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const [profiles] = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [req.session.user.id]
    );

    const [stats] = await pool.query(
      "SELECT * FROM user_stats WHERE user_id = ?",
      [req.session.user.id]
    );

    res.render("auth/profile", {
      title: "My Profile - Fitness Tracker",
      profile: profiles[0] || {},
      stats: stats[0] || {},
      errors: [],
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.render("auth/profile", {
      title: "My Profile - Fitness Tracker",
      profile: {},
      stats: {},
      errors: ["Could not load profile data"],
    });
  }
});

// Update profile
router.post("/profile", isAuthenticated, async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    heightCm,
    weightKg,
    activityLevel,
  } = req.body;
  const errors = [];

  try {
    // Check if profile exists
    const [existing] = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [req.session.user.id]
    );

    if (existing.length > 0) {
      // Update
      await pool.query(
        `UPDATE user_profiles SET 
                 first_name = ?, last_name = ?, date_of_birth = ?, 
                 gender = ?, height_cm = ?, weight_kg = ?, activity_level = ?
                 WHERE user_id = ?`,
        [
          firstName || null,
          lastName || null,
          dateOfBirth || null,
          gender || null,
          heightCm || null,
          weightKg || null,
          activityLevel || "moderate",
          req.session.user.id,
        ]
      );
    } else {
      // Insert
      await pool.query(
        `INSERT INTO user_profiles 
                 (user_id, first_name, last_name, date_of_birth, gender, height_cm, weight_kg, activity_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          firstName || null,
          lastName || null,
          dateOfBirth || null,
          gender || null,
          heightCm || null,
          weightKg || null,
          activityLevel || "moderate",
        ]
      );
    }

    // Update session
    req.session.user.profile = {
      first_name: firstName,
      last_name: lastName,
    };

    req.session.success = "Profile updated successfully!";
    res.redirect(getBasePath() + "/auth/profile");
  } catch (error) {
    console.error("Profile update error:", error);
    errors.push("Could not update profile. Please try again.");

    const [profiles] = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [req.session.user.id]
    );

    res.render("auth/profile", {
      title: "My Profile - Fitness Tracker",
      profile: profiles[0] || {},
      stats: {},
      errors,
    });
  }
});

module.exports = router;
