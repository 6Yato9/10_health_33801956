# FitTracker - Fitness Tracking Application

A web application for tracking workouts and fitness goals, built with Node.js, Express, EJS, and MySQL.

## Features

- **User Authentication**: Register and login with secure password hashing
- **Workout Tracking**: Log workouts with exercises, sets, reps, weights, and duration
- **Goal Setting**: Create and track fitness goals with progress indicators
- **Exercise Library**: Browse a comprehensive library of exercises
- **Search**: Search for exercises, workouts, and users
- **User Profiles**: Manage personal fitness information

## Technology Stack

- **Backend**: Node.js, Express.js
- **Templating**: EJS (Embedded JavaScript)
- **Database**: MySQL
- **Authentication**: bcrypt for password hashing, express-session for sessions
- **Styling**: Custom CSS

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd fitness-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   Create a MySQL user and database:

   ```sql
   CREATE USER 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop';
   GRANT ALL PRIVILEGES ON health.* TO 'health_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

   Run the database scripts:

   ```bash
   mysql -u health_app -p < create_db.sql
   mysql -u health_app -p < insert_test_data.sql
   ```

4. **Configure environment variables**

   The `.env` file is already configured with default values:

   ```
   HEALTH_HOST='localhost'
   HEALTH_USER='health_app'
   HEALTH_PASSWORD='qwertyuiop'
   HEALTH_DATABASE='health'
   HEALTH_BASE_PATH='http://localhost:8000'
   ```

5. **Start the application**

   ```bash
   node index.js
   ```

   The application will be available at `http://localhost:8000`

## Default Login Credentials

- **Username**: gold
- **Password**: smiths123ABC$

## Project Structure

```
fitness-tracker/
├── config/
│   └── database.js       # Database connection configuration
├── middleware/
│   └── auth.js           # Authentication middleware
├── public/
│   └── css/
│       └── style.css     # Application styles
├── routes/
│   ├── main.js           # Home, about, search, exercises routes
│   ├── auth.js           # Authentication routes
│   ├── workouts.js       # Workout CRUD routes
│   ├── goals.js          # Goals CRUD routes
│   └── api.js            # JSON API endpoints
├── views/
│   ├── partials/
│   │   ├── header.ejs    # Page header with navigation
│   │   └── footer.ejs    # Page footer
│   ├── auth/
│   │   ├── login.ejs     # Login page
│   │   ├── register.ejs  # Registration page
│   │   └── profile.ejs   # User profile page
│   ├── workouts/
│   │   ├── list.ejs      # Workouts list
│   │   ├── form.ejs      # Workout form (create/edit)
│   │   └── detail.ejs    # Workout detail view
│   ├── goals/
│   │   ├── list.ejs      # Goals list
│   │   ├── form.ejs      # Goal form (create/edit)
│   │   └── detail.ejs    # Goal detail view
│   ├── home.ejs          # Home page
│   ├── about.ejs         # About page
│   ├── search.ejs        # Search page
│   ├── exercises.ejs     # Exercise library
│   ├── exercise-detail.ejs # Exercise detail
│   ├── 404.ejs           # 404 error page
│   └── error.ejs         # General error page
├── create_db.sql         # Database schema
├── insert_test_data.sql  # Test data
├── index.js              # Application entry point
├── package.json          # Node.js dependencies
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── links.txt             # Application URLs
└── README.md             # This file
```

## Database Schema

The application uses the following main tables:

- **users**: User accounts with authentication
- **user_profiles**: Extended user information
- **exercises**: Exercise library
- **exercise_categories**: Exercise categorization
- **workouts**: User workout sessions
- **workout_exercises**: Exercises performed in workouts
- **goals**: User fitness goals

## API Endpoints

- `GET /api/exercises` - List exercises (with optional filters)
- `GET /api/categories` - List exercise categories
- `GET /api/stats` - Get user statistics (authenticated)
- `GET /api/workouts/recent` - Get recent workouts (authenticated)
- `GET /api/exercises/:id/calories` - Calculate calories for an exercise
- `GET /api/search` - Search exercises

## Password Requirements

New user passwords must contain:

- At least 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&\* etc.)

## License

ISC
