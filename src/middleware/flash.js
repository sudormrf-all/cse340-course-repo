// The kinds of flash messages the site supports (each matches an .alert CSS class)
const FLASH_TYPES = ['success', 'error', 'warning', 'info'];

const emptyFlashStore = () => Object.fromEntries(FLASH_TYPES.map(type => [type, []]));

/**
 * Flash message middleware.
 *
 * Messages are kept in the session, so they survive a redirect and are shown
 * on the next page that renders them. Reading messages also clears them.
 *
 *   req.flash('success', 'Saved!')  -> stores a message
 *   req.flash('error')              -> returns (and clears) all error messages
 *   req.flash()                     -> returns (and clears) every message, by type
 */
const flash = (req, res, next) => {
    req.flash = (type, message) => {
        // Create the message store if this session doesn't have one yet
        // (including a brand-new session started at login)
        if (!req.session.flash) {
            req.session.flash = emptyFlashStore();
        }

        // Store a new message
        if (type && message) {
            if (!req.session.flash[type]) {
                req.session.flash[type] = [];
            }
            req.session.flash[type].push(message);
            return;
        }

        // Read and clear one type of message
        if (type) {
            const messages = req.session.flash[type] || [];
            req.session.flash[type] = [];
            return messages;
        }

        // Read and clear all messages
        const allMessages = req.session.flash;
        req.session.flash = emptyFlashStore();
        return allMessages;
    };

    // Give templates the function itself (not its result), so messages are only
    // read and cleared when a page is actually rendered, not before a redirect
    res.locals.flash = req.flash;

    next();
};

export default flash;
