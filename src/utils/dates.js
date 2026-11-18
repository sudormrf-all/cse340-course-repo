/**
 * Formats a Date as YYYY-MM-DD, the value format an <input type="date"> needs.
 *
 * Uses the local date parts (not toISOString) because the pg driver turns a
 * DATE column into local midnight; converting to UTC could shift it a day.
 */
const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export { formatDateForInput };
