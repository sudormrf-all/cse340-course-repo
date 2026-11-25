import db from './db.js';

/**
 * Signs a user up to volunteer for a project.
 * Returns true when a new signup was added, or false when the user was
 * already volunteering for that project (the primary key prevents duplicates).
 */
const addVolunteer = async (userId, projectId) => {
    const query = `
        INSERT INTO public.project_volunteer (project_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (project_id, user_id) DO NOTHING;
    `;

    const result = await db.query(query, [projectId, userId]);

    if (process.env.ENABLE_SQL_LOGGING === 'true' && result.rowCount > 0) {
        console.log(`User ${userId} is now volunteering for project ${projectId}`);
    }

    return result.rowCount > 0;
};

/**
 * Removes a user as a volunteer for a project.
 * Returns true when a signup was removed, or false when there was none.
 */
const removeVolunteer = async (userId, projectId) => {
    const query = `
        DELETE FROM public.project_volunteer
         WHERE project_id = $1
           AND user_id = $2;
    `;

    const result = await db.query(query, [projectId, userId]);

    if (process.env.ENABLE_SQL_LOGGING === 'true' && result.rowCount > 0) {
        console.log(`User ${userId} is no longer volunteering for project ${projectId}`);
    }

    return result.rowCount > 0;
};

/**
 * Checks whether a user is volunteering for a project.
 */
const isVolunteerForProject = async (userId, projectId) => {
    const query = `
        SELECT 1
          FROM public.project_volunteer
         WHERE project_id = $1
           AND user_id = $2;
    `;

    const result = await db.query(query, [projectId, userId]);

    return result.rows.length > 0;
};

/**
 * Returns every project a user has volunteered for, soonest first.
 */
const getProjectsByVolunteerId = async (userId) => {
    const query = `
        SELECT
            p.project_id,
            p.title,
            p.project_date AS date,
            p.location,
            p.organization_id,
            o.name AS organization_name
        FROM public.project_volunteer pv
        JOIN public.project p ON pv.project_id = p.project_id
        JOIN public.organization o ON p.organization_id = o.organization_id
        WHERE pv.user_id = $1
        ORDER BY p.project_date, p.title;
    `;

    const result = await db.query(query, [userId]);

    return result.rows;
};

// Export the model functions
export { addVolunteer, removeVolunteer, isVolunteerForProject, getProjectsByVolunteerId };
