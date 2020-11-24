// -------------------------------------------------------------------
//  projectRemoveShare
// -------------------------------------------------------------------
const task = async function(projectId, userId) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");
  const thisUser = context.user;

  // Find project to remove
  const project = await projects.findOne({ _id: projectId });
  if (!project) {
    return { error: `Project id ${projectId} was not found` };
  }

  const userToRemove = await users.findOne({ id: userId });
  if (userToRemove == null) {
    return { error: `User ${userId} was not found` };
  }

  if (userToRemove._id === thisUser.id) {
    return { error: "You cannot remove share from yourself" };
  }

  const { _projectsShare } = userToRemove.custom_data;

  if (_projectsShare.find(project => project.projectId === projectId) === null) {
      return { error: `Project ${projectId} was not shared with user ${userToRemove.name}` };
  }

  try {
      return await users.updateOne(
        { _id: userToRemove._id},
        { $pull: {
            _projectsShare: { projectId: `${projectId}` },
            projects: { id: `${projectId}` }
          }
        });
  } catch (error) {
      return { error: error.toString() };
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}

