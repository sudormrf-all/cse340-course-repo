// Import any needed model functions
import { body, validationResult } from 'express-validator';
import {
    getAllProjects,
    getUpcomingProjects,
    getProjectDetails,
    createProject,
    updateProject
} from '../models/projects.js';
import { getAllOrganizations } from '../models/organizations.js';
import { getCategoriesByProjectId } from '../models/categories.js';
import { isValidId, notFoundError } from '../utils/validation.js';
import { formatDateForInput } from '../utils/dates.js';

// How many upcoming projects to list on the main projects page
const NUMBER_OF_UPCOMING_PROJECTS = 5;

// Server-side validation rules for the new and edit project forms.
// Length limits match the database columns (and the forms' maxlength).
const projectValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 150 })
        .withMessage('Title must be between 3 and 150 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 255 })
        .withMessage('Location cannot exceed 255 characters'),
    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('organizationId')
        .notEmpty()
        .withMessage('Organization is required')
        .isInt({ min: 1 })
        .withMessage('Please select a valid organization')
];

// Define any controller functions
const showProjectsPage = async (req, res) => {
    const projects = await getUpcomingProjects(NUMBER_OF_UPCOMING_PROJECTS);
    const allProjects = await getAllProjects();
    const title = 'Upcoming Service Projects';

    res.render('projects', { title, projects, allProjects });
};

const showProjectDetailsPage = async (req, res, next) => {
    const projectId = req.params.id;
    // Only a valid database ID can match a project
    const project = isValidId(projectId) ? await getProjectDetails(projectId) : null;

    // No project with this ID: forward a 404 to the global error handler
    if (!project) {
        return next(notFoundError('Project Not Found'));
    }

    const categories = await getCategoriesByProjectId(projectId);
    const title = 'Service Project Details';

    res.render('project', { title, project, categories });
};

const showNewProjectForm = async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Add New Service Project';

    res.render('new-project', { title, organizations });
};

const processNewProjectForm = async (req, res) => {
    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect('/new-project');
    }

    const { title, description, location, date, organizationId } = req.body;

    try {
        const newProjectId = await createProject(title, description, location, date, organizationId);

        req.flash('success', 'New service project created successfully!');
        res.redirect(`/project/${newProjectId}`);
    } catch (error) {
        // For example, the selected organization no longer exists
        console.error('Error creating new project:', error.message);
        req.flash('error', 'There was an error creating the service project.');
        res.redirect('/new-project');
    }
};

const showEditProjectForm = async (req, res, next) => {
    const projectId = req.params.id;
    const project = isValidId(projectId) ? await getProjectDetails(projectId) : null;

    if (!project) {
        return next(notFoundError('Project Not Found'));
    }

    const organizations = await getAllOrganizations();
    // The date input needs the date as YYYY-MM-DD
    const projectDate = formatDateForInput(project.date);
    const title = 'Edit Service Project';

    res.render('edit-project', { title, project, projectDate, organizations });
};

const processEditProjectForm = async (req, res, next) => {
    const projectId = req.params.id;

    // Make sure the project exists before trying to update it
    if (!isValidId(projectId) || !(await getProjectDetails(projectId))) {
        return next(notFoundError('Project Not Found'));
    }

    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect(`/edit-project/${projectId}`);
    }

    const { title, description, location, date, organizationId } = req.body;

    try {
        await updateProject(projectId, title, description, location, date, organizationId);

        req.flash('success', 'Service project updated successfully!');
        res.redirect(`/project/${projectId}`);
    } catch (error) {
        console.error('Error updating project:', error.message);
        req.flash('error', 'There was an error updating the service project.');
        res.redirect(`/edit-project/${projectId}`);
    }
};

// Export any controller functions
export {
    showProjectsPage,
    showProjectDetailsPage,
    showNewProjectForm,
    processNewProjectForm,
    showEditProjectForm,
    processEditProjectForm,
    projectValidation
};
