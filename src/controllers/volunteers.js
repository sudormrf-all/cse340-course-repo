// Import any needed model functions
import { getProjectDetails } from '../models/projects.js';
import { addVolunteer, removeVolunteer } from '../models/volunteers.js';
import { isValidId, notFoundError } from '../utils/validation.js';

/**
 * Where to send the user after they stop volunteering: back to their dashboard
 * when they clicked Remove there, otherwise to the project's page.
 * Only these two places are allowed, so the form can't redirect anywhere else.
 */
const getReturnPath = (req, projectId) => {
    return req.body?.returnTo === 'dashboard' ? '/dashboard' : `/project/${projectId}`;
};

// Define any controller functions
const processAddVolunteer = async (req, res, next) => {
    const projectId = req.params.projectId;
    // Only a valid database ID can match a project
    const project = isValidId(projectId) ? await getProjectDetails(projectId) : null;

    // No project with this ID: forward a 404 to the global error handler
    if (!project) {
        return next(notFoundError('Project Not Found'));
    }

    const added = await addVolunteer(req.session.user.user_id, projectId);

    if (added) {
        req.flash('success', `Thank you for volunteering for ${project.title}!`);
    } else {
        req.flash('info', `You are already volunteering for ${project.title}.`);
    }

    res.redirect(`/project/${projectId}`);
};

const processRemoveVolunteer = async (req, res, next) => {
    const projectId = req.params.projectId;
    // Only a valid database ID can match a project
    const project = isValidId(projectId) ? await getProjectDetails(projectId) : null;

    // No project with this ID: forward a 404 to the global error handler
    if (!project) {
        return next(notFoundError('Project Not Found'));
    }

    const removed = await removeVolunteer(req.session.user.user_id, projectId);

    if (removed) {
        req.flash('success', `You are no longer volunteering for ${project.title}.`);
    } else {
        req.flash('info', `You were not volunteering for ${project.title}.`);
    }

    res.redirect(getReturnPath(req, projectId));
};

// Export any controller functions
export { processAddVolunteer, processRemoveVolunteer };
