import db from './db.js'

const getAllCategories = async() => {
    const query = `
        SELECT category_id, name
          FROM public.category
      ORDER BY name;
    `;

    const result = await db.query(query);

    return result.rows;
}

const getCategoryDetails = async (categoryId) => {
    const query = `
        SELECT
            category_id,
            name
        FROM public.category
        WHERE category_id = $1;
    `;

    const queryParams = [categoryId];
    const result = await db.query(query, queryParams);

    // Return the first row of the result set, or null if no rows are found
    return result.rows.length > 0 ? result.rows[0] : null;
};

const getCategoriesByProjectId = async (projectId) => {
    const query = `
        SELECT
            c.category_id,
            c.name
        FROM public.category c
        JOIN public.project_category pc ON c.category_id = pc.category_id
        WHERE pc.project_id = $1
        ORDER BY c.name;
    `;

    const queryParams = [projectId];
    const result = await db.query(query, queryParams);

    return result.rows;
};

/**
 * Links one category to one project. Used by updateCategoryAssignments.
 */
const assignCategoryToProject = async (categoryId, projectId) => {
    const query = `
        INSERT INTO public.project_category (category_id, project_id)
        VALUES ($1, $2);
    `;

    await db.query(query, [categoryId, projectId]);
};

/**
 * Replaces a project's categories with the given list of category IDs.
 */
const updateCategoryAssignments = async (projectId, categoryIds) => {
    // Remove the current assignments, then add the selected ones
    const deleteQuery = `
        DELETE FROM public.project_category
         WHERE project_id = $1;
    `;

    await db.query(deleteQuery, [projectId]);

    for (const categoryId of categoryIds) {
        await assignCategoryToProject(categoryId, projectId);
    }
};

/**
 * Inserts a new category and returns its new ID.
 */
const createCategory = async (name) => {
    const query = `
        INSERT INTO public.category (name)
        VALUES ($1)
        RETURNING category_id;
    `;

    const result = await db.query(query, [name]);

    if (result.rows.length === 0) {
        throw new Error('Failed to create category');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new category with ID:', result.rows[0].category_id);
    }

    return result.rows[0].category_id;
};

/**
 * Updates an existing category's name and returns its ID.
 */
const updateCategory = async (categoryId, name) => {
    const query = `
        UPDATE public.category
           SET name = $1
         WHERE category_id = $2
     RETURNING category_id;
    `;

    const result = await db.query(query, [name, categoryId]);

    if (result.rows.length === 0) {
        throw new Error('Category not found');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Updated category with ID:', categoryId);
    }

    return result.rows[0].category_id;
};

/**
 * Checks whether another category already uses this name (ignoring case).
 * Category names must be unique. Pass excludeCategoryId when editing, so a
 * category can keep its own name.
 */
const categoryNameExists = async (name, excludeCategoryId = null) => {
    const query = `
        SELECT 1
          FROM public.category
         WHERE LOWER(name) = LOWER($1)
           AND ($2::integer IS NULL OR category_id <> $2::integer);
    `;

    const result = await db.query(query, [name, excludeCategoryId]);

    return result.rows.length > 0;
};

// Export the model functions
export {
    getAllCategories,
    getCategoryDetails,
    getCategoriesByProjectId,
    updateCategoryAssignments,
    createCategory,
    updateCategory,
    categoryNameExists
};
