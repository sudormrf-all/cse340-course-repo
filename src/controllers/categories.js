// Import any needed model functions
import { getAllCategories, getCategoryDetails } from '../models/categories.js';
import { getProjectsByCategoryId } from '../models/projects.js';

// Define any controller functions
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Categories';

    res.render('categories', { title, categories });
};

const showCategoryDetailsPage = async (req, res, next) => {
    const categoryId = req.params.id;

    // IDs are whole numbers; anything else cannot match a category
    const categoryDetails = /^\d+$/.test(categoryId) ? await getCategoryDetails(categoryId) : null;

    // No category with this ID: forward a 404 to the global error handler
    if (!categoryDetails) {
        const err = new Error('Category Not Found');
        err.status = 404;
        return next(err);
    }

    const projects = await getProjectsByCategoryId(categoryId);
    const title = 'Category Details';

    res.render('category', { title, categoryDetails, projects });
};

// Export any controller functions
export { showCategoriesPage, showCategoryDetailsPage };
