import express from 'express';

import { showHomePage } from './controllers/index.js';
import {
    showOrganizationsPage,
    showOrganizationDetailsPage,
    showNewOrganizationForm,
    processNewOrganizationForm,
    showEditOrganizationForm,
    processEditOrganizationForm,
    organizationValidation,
    logoFilenameValidation
} from './controllers/organizations.js';
import {
    showProjectsPage,
    showProjectDetailsPage,
    showNewProjectForm,
    processNewProjectForm,
    showEditProjectForm,
    processEditProjectForm,
    projectValidation
} from './controllers/projects.js';
import {
    showCategoriesPage,
    showCategoryDetailsPage,
    showNewCategoryForm,
    processNewCategoryForm,
    showEditCategoryForm,
    processEditCategoryForm,
    showAssignCategoriesForm,
    processAssignCategoriesForm,
    categoryValidation
} from './controllers/categories.js';
import { testErrorPage } from './controllers/errors.js';

const router = express.Router();

router.get('/', showHomePage);
router.get('/organizations', showOrganizationsPage);
router.get('/projects', showProjectsPage);
router.get('/categories', showCategoriesPage);

// Route for organization details page
router.get('/organization/:id', showOrganizationDetailsPage);

// Route for service project details page
router.get('/project/:id', showProjectDetailsPage);

// Route for category details page
router.get('/category/:id', showCategoryDetailsPage);

// Routes for creating a new organization
router.get('/new-organization', showNewOrganizationForm);
router.post('/new-organization', organizationValidation, processNewOrganizationForm);

// Routes for editing an organization
router.get('/edit-organization/:id', showEditOrganizationForm);
router.post('/edit-organization/:id', organizationValidation, logoFilenameValidation, processEditOrganizationForm);

// Routes for creating a new service project
router.get('/new-project', showNewProjectForm);
router.post('/new-project', projectValidation, processNewProjectForm);

// Routes for editing a service project
router.get('/edit-project/:id', showEditProjectForm);
router.post('/edit-project/:id', projectValidation, processEditProjectForm);

// Routes for assigning categories to a service project
router.get('/assign-categories/:projectId', showAssignCategoriesForm);
router.post('/assign-categories/:projectId', processAssignCategoriesForm);

// Routes for creating a new category
router.get('/new-category', showNewCategoryForm);
router.post('/new-category', categoryValidation, processNewCategoryForm);

// Routes for editing a category
router.get('/edit-category/:id', showEditCategoryForm);
router.post('/edit-category/:id', categoryValidation, processEditCategoryForm);

// error-handling routes
router.get('/test-error', testErrorPage);

export default router;
