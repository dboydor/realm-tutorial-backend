// -------------------------------------------------------------------
//  projectAddShare
// -------------------------------------------------------------------
const task = async function(projectId, shareToEmail, permission) {
    const cluster = context.services.get("mongodb-atlas");
    const users = cluster.db("tracker").collection("User");
    const projects = cluster.db("tracker").collection("Project");
    const thisUser = context.user.custom_data;
    const ObjectId = (id) => { return !context.runningAsSystem ? id : new BSON.ObjectId(id) }

    // Find project to add
    const project = await projects.findOne({ _id: ObjectId(projectId) });
    if (!project) {
        return { error: `Project id ${projectId} was not found` };
    }

    // Find user to add
    const shareUser = await users.findOne({ name: shareToEmail });
    if (!shareUser) {
        return { error: `User ${shareToEmail} was not found` };
    }

    if (shareUser._id === thisUser._id) {
        return { error: `You already have access to project ${projectId}` };
    }

    const { _projectsShare } = shareUser;

    if (!_projectsShare) {
        return { error: `User ${shareToEmail} is missing _projectsShare array!` };
    }

    const alreadyExists = !!_projectsShare.find(project => {
        return project.projectId === projectId && project.permission === permission
    });

    if (alreadyExists) {
        return { error: `User ${shareToEmail} already has '${permission}' access to project ${projectId}` };
    }

    let addSet = {
        _projectsShare: {
            userId: thisUser._id,
            projectId: projectId,
            permission: permission
        },
        projects: {
            userId: thisUser._id,
            projectId: projectId,
            permission: permission
        }
    };

    const permissionOpposite = permission == "rw" ? "r" : "rw"

    // Project share permission is being changed
    const removePrevious = !!_projectsShare.find(project => {
        return project.projectId === projectId && project.permission === permissionOpposite;
    });

    try {
        // If this share was already defined with a different permission, remove
        // the old version first
        if (removePrevious) {
            const result = await context.functions.execute("projectRemoveShare", projectId, shareToEmail);
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
