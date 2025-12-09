// Authentication middleware

// Check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.session.error = "Please log in to access this page";
  res.redirect("/auth/login");
}

// Check if user is NOT logged in (for login/register pages)
function isNotAuthenticated(req, res, next) {
  if (!req.session.user) {
    return next();
  }
  res.redirect("/");
}

// Password validation function
// Requirements: 8+ chars, 1 lowercase, 1 uppercase, 1 number, 1 special char
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

module.exports = { isAuthenticated, isNotAuthenticated, validatePassword };
