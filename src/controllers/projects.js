// Import any needed model functions
import { getAllProjects, getUpcomingProjects, getProjectDetails } from '../models/projects.js';
import { getCategoriesByProjectId } from '../models/categories.js';
import { isValidId } from '../utils/validation.js';

// How many upcoming projects to list on the main projects page
const NUMBER_OF_UPCOMING_PROJECTS = 5;

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
        const err = new Error('Project Not Found');
        err.status = 404;
        return next(err);
    }

    const categories = await getCategoriesByProjectId(projectId);
    const title = 'Service Project Details';

    res.render('project', { title, project, categories });
};

// Export any controller functions
export { showProjectsPage, showProjectDetailsPage };
