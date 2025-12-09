# FitTracker - Fitness Tracking Application

A full-stack web application for tracking workouts and fitness goals. This application allows users to log their exercises, set fitness goals, track progress, and browse an exercise library.

## Features

- **User Authentication**: Secure registration and login system using bcrypt password hashing
- **Workout Tracking**: Log workouts with multiple exercises, including sets, reps, weights, and duration
- **Goal Setting**: Create fitness goals with target values and track progress over time
- **Exercise Library**: Browse and search a comprehensive database of exercises categorized by type
- **Search Functionality**: Search across exercises, workouts, and users
- **User Profiles**: Manage personal information and view fitness statistics
- **Responsive Design**: Mobile-friendly interface with modern CSS styling

## Technology Stack

| Technology            | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| **Node.js**           | Server-side JavaScript runtime environment                         |
| **Express.js**        | Web application framework for routing and middleware               |
| **EJS**               | Templating engine for rendering dynamic HTML pages                 |
| **MySQL**             | Relational database for storing user data, workouts, and exercises |
| **bcrypt**            | Password hashing library for secure authentication                 |
| **express-session**   | Session management for user login state                            |
| **express-validator** | Input validation and sanitization                                  |
| **dotenv**            | Environment variable management                                    |

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- npm (Node Package Manager)

### Setup Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up the database**

   First, log into MySQL and create the database user:

   ```sql
   CREATE USER 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';
   GRANT ALL PRIVILEGES ON health.* TO 'health_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

   Then run the database scripts:

   ```bash
   mysql -u root -p
   SOURCE create_db.sql;
   SOURCE insert_test_data.sql;
   ```

3. **Start the application**

   ```bash
   node index.js
   ```

   The application will be available at `http://localhost:8000`

## Default Login Credentials

- **Username**: gold
- **Password**: smiths

## Project Structure

```
fitness-tracker/
├── config/
│   └── database.js          # MySQL connection pool configuration
├── middleware/
│   └── auth.js              # Authentication and validation middleware
├── public/
│   └── css/
│       └── style.css        # Application stylesheet
├── routes/
│   ├── main.js              # Public routes (home, about, search, exercises)
│   ├── auth.js              # Authentication routes (login, register, profile)
│   ├── workouts.js          # Workout CRUD operations
│   ├── goals.js             # Goal CRUD operations
│   └── api.js               # JSON API endpoints for AJAX requests
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Navigation and page header
│   │   └── footer.ejs       # Page footer with scripts
│   ├── auth/
│   │   ├── login.ejs        # User login form
│   │   ├── register.ejs     # User registration form
│   │   └── profile.ejs      # User profile management
│   ├── workouts/
│   │   ├── list.ejs         # Paginated workout list
│   │   ├── form.ejs         # Create/edit workout form
│   │   └── detail.ejs       # Single workout view
│   ├── goals/
│   │   ├── list.ejs         # Goals list with filtering
│   │   ├── form.ejs         # Create/edit goal form
│   │   └── detail.ejs       # Goal detail with progress
│   ├── home.ejs             # Landing page with dashboard
│   ├── about.ejs            # About page
│   ├── search.ejs           # Search results page
│   ├── exercises.ejs        # Exercise library listing
│   ├── exercise-detail.ejs  # Single exercise view
│   ├── 404.ejs              # Not found error page
│   └── error.ejs            # General error page
├── create_db.sql            # Database schema definition
├── insert_test_data.sql     # Sample data for testing
├── index.js                 # Application entry point
├── package.json             # Dependencies and scripts
├── .env                     # Environment configuration
└── .gitignore               # Git ignore rules
```

## Code Explanation

### Entry Point (index.js)

The main application file that:

- Loads environment variables using `dotenv`
- Configures Express middleware (body parsing, static files, sessions)
- Sets up EJS as the view engine
- Mounts route handlers for different URL paths
- Implements error handling middleware

### Database Configuration (config/database.js)

Creates a MySQL connection pool using `mysql2` with promise support. The pool manages multiple database connections efficiently and reads credentials from environment variables.

### Authentication Middleware (middleware/auth.js)

Contains three key functions:

- `isAuthenticated`: Protects routes that require login
- `isNotAuthenticated`: Redirects logged-in users away from login/register pages
- `validatePassword`: Enforces password complexity rules (8+ chars, uppercase, lowercase, number, special character)

### Routes

| Route File    | Base Path   | Description                                           |
| ------------- | ----------- | ----------------------------------------------------- |
| `main.js`     | `/`         | Public pages: home, about, search, exercise library   |
| `auth.js`     | `/auth`     | User authentication: login, register, logout, profile |
| `workouts.js` | `/workouts` | Workout management with exercise associations         |
| `goals.js`    | `/goals`    | Goal tracking with progress updates                   |
| `api.js`      | `/api`      | JSON endpoints for dynamic content loading            |

### Views (EJS Templates)

EJS templates use `<%- include() %>` for partials and `<%= %>` for variable output. Key patterns:

- Partials (`header.ejs`, `footer.ejs`) provide consistent layout
- Conditional rendering with `<% if (user) { %>` for auth-dependent content
- Loops with `<% items.forEach(item => { %>` for listing data
- Form handling with pre-populated values for edit operations

## Database Schema

### Tables

| Table                 | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `users`               | User accounts with hashed passwords                 |
| `user_profiles`       | Extended user info (height, weight, activity level) |
| `exercise_categories` | Exercise type categorization                        |
| `exercises`           | Exercise library with calories and muscle groups    |
| `workouts`            | User workout sessions                               |
| `workout_exercises`   | Junction table linking workouts to exercises        |
| `goals`               | User fitness goals with progress tracking           |

### Database Views

- `user_workout_summary`: Aggregated workout statistics per user
- `exercise_category_stats`: Exercise counts by category

## API Endpoints

| Endpoint                      | Method | Auth | Description                                              |
| ----------------------------- | ------ | ---- | -------------------------------------------------------- |
| `/api/exercises`              | GET    | No   | List exercises with optional category/difficulty filters |
| `/api/categories`             | GET    | No   | List all exercise categories                             |
| `/api/stats`                  | GET    | Yes  | Get logged-in user's workout/goal statistics             |
| `/api/workouts/recent`        | GET    | Yes  | Get user's 5 most recent workouts                        |
| `/api/exercises/:id/calories` | GET    | No   | Calculate calories burned for an exercise                |
| `/api/search`                 | GET    | No   | Search exercises by name                                 |

## Password Requirements

New user passwords must contain:

- At least 8 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&\* etc.)

## Session Management

User sessions are managed using `express-session` with the following configuration:

- Sessions stored in memory (use Redis/database for production)
- 24-hour session expiry
- Session data includes user ID, username, and email
- Flash messages for success/error notifications

## Security Features

- Password hashing with bcrypt (cost factor 10)
- Session-based authentication
- Input validation on forms
- SQL injection prevention via parameterized queries
- Protected routes with authentication middleware
