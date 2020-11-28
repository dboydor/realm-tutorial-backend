// -------------------------------------------------------------------
//  projectRemoveOwner
//
//  Called from trigger: projectId is ObjectId and userId is String
// -------------------------------------------------------------------
const task = async function(projectId, userId) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");

  // Find project to remove
  const project = await projects.findOne({ _id: projectId });
  if (!project) {
      return { error: `Project id ${projectId} was not found` };
  }

  const thisUser = await users.findOne({ _id: userId });
  if (!thisUser) {
      return { error: `User ${userId} was not found` };
  }

  if (project.ownerId !== thisUser._id) {
      return { error: `Project ${projectId} is not owned by user ${userId}` };
  }

  try {
      return await users.updateOne(
        { _id: thisUser._id},
        { $pull: {
            projects: { projectId: `${projectId}` }
          }
        }
      );
  } catch (error) {
      return { error: error.toString() };
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}

