// Import any needed model functions
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { createUser, emailExists, authenticateUser, getAllUsers } from '../models/users.js';
import { getProjectsByVolunteerId } from '../models/volunteers.js';

// bcrypt cost factor: each step doubles the work needed to hash (and to guess) a password
const SALT_ROUNDS = 10;

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
const MAX_PASSWORD_BYTES = 72;

// Server-side validation rules for the registration form
const registrationValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Name must be 100 characters or fewer'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .bail()
        .isEmail()
        .withMessage('Please enter a valid email address')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Email must be 100 characters or fewer')
        .bail()
        .toLowerCase()
        .custom(async (email) => {
            if (await emailExists(email)) {
                throw new Error('An account with that email already exists');
            }
        }),
    body('password')
        .isString()
        .withMessage('Password is required')
        .bail()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .bail()
        .custom((password) => Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES)
        .withMessage(`Password must be ${MAX_PASSWORD_BYTES} characters or fewer`)
];

/**
 * Starts a fresh session (with a new session ID) at login, so an ID that
 * existed before the user logged in can't be reused to act as them.
 */
const regenerateSession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
};

// Define any controller functions
const showUserRegistrationForm = (req, res) => {
    res.render('register', { title: 'Register' });
};

const processUserRegistrationForm = async (req, res) => {
    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect('/register');
    }

    const { name, email, password } = req.body;

    try {
        // Hash the password with a random salt; only the hash is stored
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(password, salt);

        await createUser(name, email, passwordHash);

        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);

        // 23505 = unique violation: someone registered this email at the same moment
        const message = error.code === '23505'
            ? 'An account with that email already exists'
            : 'Registration failed. Please try again.';
        req.flash('error', message);
        res.redirect('/register');
    }
};

const showLoginForm = (req, res) => {
    res.render('login', { title: 'Login' });
};

const processLoginForm = async (req, res) => {
    // Anything other than plain text fields can't be a valid login
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    try {
        const user = email && password ? await authenticateUser(email, password) : null;

        if (!user) {
            // Same message whether the email or the password was wrong,
            // so the form doesn't reveal which emails have accounts
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        await regenerateSession(req);
        req.session.user = user;

        if (res.locals.NODE_ENV === 'development') {
            console.log('User logged in:', user);
        }

        req.flash('success', 'Login successful!');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error logging in:', error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
};

const processLogout = (req, res) => {
    if (req.session.user) {
        delete req.session.user;
    }

    req.flash('success', 'Logout successful!');
    res.redirect('/login');
};

/**
 * Middleware: lets the request continue only for logged-in users.
 * Everyone else is sent to the login page.
 */
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash('error', 'You must be logged in to access that page.');
        return res.redirect('/login');
    }

    next();
};

/**
 * Middleware factory: requireRole('admin') returns a middleware function that
 * lets the request continue only for logged-in users with that role.
 *
 * @param {string} role - The role name required, e.g. 'admin' or 'user'
 * @returns {Function} Express middleware function
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            req.flash('error', 'You must be logged in to access that page.');
            return res.redirect('/login');
        }

        if (req.session.user.role_name !== role) {
            req.flash('error', 'You do not have permission to access that page.');
            return res.redirect('/dashboard');
        }

        next();
    };
};

const showDashboard = async (req, res) => {
    const user = req.session.user;
    const volunteerProjects = await getProjectsByVolunteerId(user.user_id);

    res.render('dashboard', {
        title: 'Dashboard',
        name: user.name,
        email: user.email,
        roleName: user.role_name,
        volunteerProjects
    });
};

const showUsersPage = async (req, res) => {
    const users = await getAllUsers();
    const title = 'Registered Users';

    res.render('users', { title, users });
};

// Export any controller functions
export {
    showUserRegistrationForm,
    processUserRegistrationForm,
    registrationValidation,
    showLoginForm,
    processLoginForm,
    processLogout,
    requireLogin,
    requireRole,
    showDashboard,
    showUsersPage
};
