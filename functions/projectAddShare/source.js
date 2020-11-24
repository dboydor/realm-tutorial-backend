// --------------------------------
//  projectAddShare
// --------------------------------
const task = async function(projectId, shareToEmail, permission) {
    const cluster = context.services.get("mongodb-atlas");
    const users = cluster.db("tracker").collection("User");
    const projects = cluster.db("tracker").collection("Project");
    const thisUser = context.user;

    // Find project to add
    const project = await projects.findOne({ _id: projectId });
    if (!project) {
        return { error: `Project id ${projectId} was not found` };
    }

    // Find user to add
    const shareUser = await users.findOne({ name: shareToEmail });
    if (shareUser == null) {
        return { error: `User ${shareToEmail} was not found` };
    }

    if (shareUser._id === thisUser.id) {
        return { error: `You already have access to project ${projectId}` };
    }

    if (shareUser.partitionsRead && shareUser.partitionsRead.includes(partition)) {
        return { error: `User ${shareToEmail} already has read access to project ${projectId}` };
    }

    const { _projectsShare } = shareUser.custom_data;
    const alreadyExists = _projectsShare.find(project => {
        return project.projectId === projectId && project.permission === permission
    }) != null;

    if (alreadyExists) {
        return { error: `User ${shareToEmail} already has ${permission} access to project ${projectId}` };
    }

    const partition = `user=${thisUser.id}`;

    let addSet = {
        _projectsShare: {
            partition: partition,
            projectId: projectId,
            permission: permission
        },
        projects: {
            userId: thisUser.id,
            projectId: projectId,
            permission: permission
        }
    };

    const permissionOpposite = permission == "rw" ? "r" : "rw"

    // Project share permission is being changed
    const removePrevious = _projectsShare.find(project => {
        return project.projectId === projectId && project.permission === permissionOpposite;
    }) != null;

    try {
        // If this share was already defined with a different permission, remove
        // the old version first
        if (removePrevious) {
            const result = await context.functions.execute("projectRemoveShare", projectId, shareUser.id);
            if (result && result.error) {
                return result;
            }
        }

        // Update the user to share with, indicating that he has access to this project
        return await users.updateOne(
            { _id: shareUser._id },
            { $addToSet: addSet},
        );
    } catch (error) {
        return { error: error.toString() };
    }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
