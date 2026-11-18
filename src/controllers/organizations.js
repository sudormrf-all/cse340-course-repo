// Import any needed model functions
import { body, validationResult } from 'express-validator';
import {
    getAllOrganizations,
    getOrganizationDetails,
    createOrganization,
    updateOrganization
} from '../models/organizations.js';
import { getProjectsByOrganizationId } from '../models/projects.js';
import { isValidId, notFoundError } from '../utils/validation.js';

// Server-side validation rules for the new and edit organization forms
const organizationValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Organization name is required')
        .isLength({ min: 3, max: 150 })
        .withMessage('Organization name must be between 3 and 150 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Organization description is required')
        .isLength({ max: 500 })
        .withMessage('Organization description cannot exceed 500 characters'),
    body('contactEmail')
        .normalizeEmail()
        .notEmpty()
        .withMessage('Contact email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
];

// The edit form also lets the user change the logo file name
const logoFilenameValidation = [
    body('logoFilename')
        .trim()
        .notEmpty()
        .withMessage('Logo filename is required')
        .isLength({ max: 255 })
        .withMessage('Logo filename cannot exceed 255 characters')
];

// Define any controller functions
const showOrganizationsPage = async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Our Partner Organizations';

    res.render('organizations', { title, organizations });
};

const showOrganizationDetailsPage = async (req, res, next) => {
    const organizationId = req.params.id;
    // Only a valid database ID can match an organization
    const organizationDetails = isValidId(organizationId) ? await getOrganizationDetails(organizationId) : null;

    // No organization with this ID: forward a 404 to the global error handler
    if (!organizationDetails) {
        return next(notFoundError('Organization Not Found'));
    }

    const projects = await getProjectsByOrganizationId(organizationId);
    const title = 'Organization Details';

    res.render('organization', { title, organizationDetails, projects });
};

const showNewOrganizationForm = async (req, res) => {
    const title = 'Add New Organization';

    res.render('new-organization', { title });
};

const processNewOrganizationForm = async (req, res) => {
    // Send the user back to the form with every validation error
    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect('/new-organization');
    }

    const { name, description, contactEmail } = req.body;
    // New organizations start with the placeholder logo
    const logoFilename = 'placeholder-logo.png';

    const organizationId = await createOrganization(name, description, contactEmail, logoFilename);

    req.flash('success', 'Organization added successfully!');
    res.redirect(`/organization/${organizationId}`);
};

const showEditOrganizationForm = async (req, res, next) => {
    const organizationId = req.params.id;
    const organizationDetails = isValidId(organizationId) ? await getOrganizationDetails(organizationId) : null;

    if (!organizationDetails) {
        return next(notFoundError('Organization Not Found'));
    }

    const title = 'Edit Organization';

    res.render('edit-organization', { title, organizationDetails });
};

const processEditOrganizationForm = async (req, res, next) => {
    const organizationId = req.params.id;

    // Make sure the organization exists before trying to update it
    if (!isValidId(organizationId) || !(await getOrganizationDetails(organizationId))) {
        return next(notFoundError('Organization Not Found'));
    }

    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect(`/edit-organization/${organizationId}`);
    }

    const { name, description, contactEmail, logoFilename } = req.body;

    await updateOrganization(organizationId, name, description, contactEmail, logoFilename);

    req.flash('success', 'Organization updated successfully!');
    res.redirect(`/organization/${organizationId}`);
};

// Export any controller functions
export {
    showOrganizationsPage,
    showOrganizationDetailsPage,
    showNewOrganizationForm,
    processNewOrganizationForm,
    showEditOrganizationForm,
    processEditOrganizationForm,
    organizationValidation,
    logoFilenameValidation
};
