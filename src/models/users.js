import bcrypt from 'bcrypt';
import db from './db.js';

/**
 * Inserts a new user and returns the new user's ID.
 * Every new account starts with the standard 'user' role; admins are promoted
 * in the database (see src/setup.sql).
 */
const createUser = async (name, email, passwordHash) => {
    const defaultRole = 'user';

    const query = `
        INSERT INTO public.users (name, email, password_hash, role_id)
        VALUES ($1, $2, $3, (SELECT role_id FROM public.roles WHERE role_name = $4))
        RETURNING user_id;
    `;

    const result = await db.query(query, [name, email, passwordHash, defaultRole]);

    if (result.rows.length === 0) {
        throw new Error('Failed to create user');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new user with ID:', result.rows[0].user_id);
    }

    return result.rows[0].user_id;
};

/**
 * Finds a user by email (their username), including their role name and
 * password hash. Returns null if no user has that email.
 * Emails are compared ignoring case, so Admin@Example.com matches admin@example.com.
 */
const findUserByEmail = async (email) => {
    const query = `
        SELECT
            u.user_id,
            u.name,
            u.email,
            u.password_hash,
            r.role_name
        FROM public.users u
        JOIN public.roles r ON u.role_id = r.role_id
        WHERE LOWER(u.email) = LOWER($1);
    `;

    const result = await db.query(query, [email]);

    return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Checks whether an account already uses this email (ignoring case).
 */
const emailExists = async (email) => {
    const query = `
        SELECT 1
          FROM public.users
         WHERE LOWER(email) = LOWER($1);
    `;

    const result = await db.query(query, [email]);

    return result.rows.length > 0;
};

/**
 * Compares a plain-text password with a stored bcrypt hash.
 * bcrypt reads the salt and cost from the hash itself, so nothing else is needed.
 */
const verifyPassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

/**
 * Checks an email and password. Returns the user (without the password hash)
 * when they match, or null when they don't.
 */
const authenticateUser = async (email, password) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return null;
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
        return null;
    }

    // Never keep the password hash in the session
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

/**
 * Returns every registered user with their role, for the admin users page.
 */
const getAllUsers = async () => {
    const query = `
        SELECT
            u.user_id,
            u.name,
            u.email,
            r.role_name
        FROM public.users u
        JOIN public.roles r ON u.role_id = r.role_id
        ORDER BY u.name, u.email;
    `;

    const result = await db.query(query);

    return result.rows;
};

// Export the model functions
export { createUser, emailExists, authenticateUser, getAllUsers };
