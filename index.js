// Fitness Tracker Application
// Main entry point

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 8000;

// Import database and routes
const { testConnection } = require("./config/database");
const mainRoutes = require("./routes/main");
const authRoutes = require("./routes/auth");
const workoutRoutes = require("./routes/workouts");
const goalRoutes = require("./routes/goals");
const apiRoutes = require("./routes/api");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fitness-tracker-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Make session data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  delete req.session.success;
  delete req.session.error;
  next();
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", mainRoutes);
app.use("/auth", authRoutes);
app.use("/workouts", workoutRoutes);
app.use("/goals", goalRoutes);
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "Error",
    message: "Something went wrong!",
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Fitness Tracker app listening on port ${PORT}`);
  console.log(
    `Visit: ${process.env.HEALTH_BASE_PATH || `http://localhost:${PORT}`}`
  );

  // Test database connection on startup
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error(
      "WARNING: Database connection failed. Some features may not work."
    );
    console.error(
      "Make sure MySQL is running and the database is set up correctly."
    );
  }
});
