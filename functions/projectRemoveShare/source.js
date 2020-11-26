// -------------------------------------------------------------------
//  projectRemoveShare
// -------------------------------------------------------------------
const task = async function(projectId, shareToEmail) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");
  const thisUser = context.user.custom_data;
  const ObjectId = (id) => { return !context.runningAsSystem ? id : new BSON.ObjectId(id) }

  // Find project to remove
  const project = await projects.findOne({ _id: ObjectId(projectId) });
  if (!project) {
    return { error: `Project id ${projectId} was not found` };
  }

  const userToRemove = await users.findOne({ name: shareToEmail });
  if (!userToRemove) {
    return { error: `User ${shareToEmail} was not found` };
  }

  if (userToRemove._id === thisUser._id) {
    return { error: "You cannot remove share from yourself" };
  }

  const { _projectsShare } = userToRemove;

  if (!_projectsShare) {
      return { error: `User ${shareToEmail} is missing _projectsShare array!` };
  }

  if (!_projectsShare.find(project => project.projectId === projectId)) {
      return { error: `Project ${projectId} was not shared with user ${userToRemove._id}` };
  }

  try {
      return await users.updateOne(
        { _id: userToRemove._id},
        { $pull: {
            _projectsShare: { projectId: `${projectId}` },
            projects: { projectId: `${projectId}` }
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

