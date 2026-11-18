// Import any needed model functions
import { body, validationResult } from 'express-validator';
import {
    getAllCategories,
    getCategoryDetails,
    getCategoriesByProjectId,
    updateCategoryAssignments,
    createCategory,
    updateCategory,
    categoryNameExists
} from '../models/categories.js';
import { getProjectsByCategoryId, getProjectDetails } from '../models/projects.js';
import { isValidId, notFoundError } from '../utils/validation.js';

// Server-side validation rules for the new and edit category forms
const categoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .bail()
        .isLength({ min: 3, max: 100 })
        .withMessage('Category name must be between 3 and 100 characters')
        .bail()
        // Category names are unique; when editing, the category may keep its own name
        .custom(async (name, { req }) => {
            const excludeId = isValidId(req.params.id) ? req.params.id : null;
            if (await categoryNameExists(name, excludeId)) {
                throw new Error('A category with that name already exists');
            }
        })
];

// Define any controller functions
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Categories';

    res.render('categories', { title, categories });
};

const showCategoryDetailsPage = async (req, res, next) => {
    const categoryId = req.params.id;

    // Only a valid database ID can match a category
    const categoryDetails = isValidId(categoryId) ? await getCategoryDetails(categoryId) : null;

    // No category with this ID: forward a 404 to the global error handler
    if (!categoryDetails) {
        return next(notFoundError('Category Not Found'));
    }

    const projects = await getProjectsByCategoryId(categoryId);
    const title = 'Category Details';

    res.render('category', { title, categoryDetails, projects });
};

const showNewCategoryForm = async (req, res) => {
    const title = 'Add New Category';

    res.render('new-category', { title });
};

const processNewCategoryForm = async (req, res) => {
    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect('/new-category');
    }

    const { name } = req.body;

    const categoryId = await createCategory(name);

    req.flash('success', 'Category added successfully!');
    res.redirect(`/category/${categoryId}`);
};

const showEditCategoryForm = async (req, res, next) => {
    const categoryId = req.params.id;
    const categoryDetails = isValidId(categoryId) ? await getCategoryDetails(categoryId) : null;

    if (!categoryDetails) {
        return next(notFoundError('Category Not Found'));
    }

    const title = 'Edit Category';

    res.render('edit-category', { title, categoryDetails });
};

const processEditCategoryForm = async (req, res, next) => {
    const categoryId = req.params.id;

    // Make sure the category exists before trying to update it
    if (!isValidId(categoryId) || !(await getCategoryDetails(categoryId))) {
        return next(notFoundError('Category Not Found'));
    }

    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });
        return res.redirect(`/edit-category/${categoryId}`);
    }

    const { name } = req.body;

    await updateCategory(categoryId, name);

    req.flash('success', 'Category updated successfully!');
    res.redirect(`/category/${categoryId}`);
};

const showAssignCategoriesForm = async (req, res, next) => {
    const projectId = req.params.projectId;
    const projectDetails = isValidId(projectId) ? await getProjectDetails(projectId) : null;

    if (!projectDetails) {
        return next(notFoundError('Project Not Found'));
    }

    const categories = await getAllCategories();
    const assignedCategories = await getCategoriesByProjectId(projectId);
    const title = 'Assign Categories to Project';

    res.render('assign-categories', { title, projectId, projectDetails, categories, assignedCategories });
};

const processAssignCategoriesForm = async (req, res, next) => {
    const projectId = req.params.projectId;

    if (!isValidId(projectId) || !(await getProjectDetails(projectId))) {
        return next(notFoundError('Project Not Found'));
    }

    // No boxes checked sends nothing; one box sends a string; several send an array
    const selectedCategoryIds = req.body.categoryIds || [];
    const categoryIdsArray = Array.isArray(selectedCategoryIds) ? selectedCategoryIds : [selectedCategoryIds];

    // Ignore anything that could not be a real category ID, and any duplicates
    const validCategoryIds = [...new Set(categoryIdsArray.filter(isValidId))];

    await updateCategoryAssignments(projectId, validCategoryIds);

    req.flash('success', 'Categories updated successfully.');
    res.redirect(`/project/${projectId}`);
};

// Export any controller functions
export {
    showCategoriesPage,
    showCategoryDetailsPage,
    showNewCategoryForm,
    processNewCategoryForm,
    showEditCategoryForm,
    processEditCategoryForm,
    showAssignCategoriesForm,
    processAssignCategoriesForm,
    categoryValidation
};
