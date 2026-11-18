// Largest value a PostgreSQL INTEGER (SERIAL) column can hold
const MAX_DATABASE_ID = 2147483647;

/**
 * Checks whether a route parameter could be a real database ID:
 * digits only, and within the range of a PostgreSQL integer.
 * Anything else cannot match a record, so controllers treat it as not found.
 */
const isValidId = (id) => {
    return /^\d+$/.test(id) && Number(id) >= 1 && Number(id) <= MAX_DATABASE_ID;
};

/**
 * Builds a 404 error for the global error handler, for records that don't exist.
 */
const notFoundError = (message) => {
    const err = new Error(message);
    err.status = 404;
    return err;
};

export { isValidId, notFoundError };
