// --------------------------------
//  projectRemoveShare
// --------------------------------
const task = async function(projectId, shareToEmail) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");
  const thisUser = context.user;

  // Find project to remove
  const project = await projects.findOne({ _id: projectId });
  if (!project) {
    return { error: `Project id ${projectId} was not found` };
  }

  const userToRemove = await users.findOne({ name: shareToEmail });
  if (userToRemove == null) {
    return { error: `User ${shareToEmail} was not found` };
  }

  if (userToRemove._id === thisUser.id) {
    return { error: "You cannot remove share from yourself" };
  }

  const { partitionsRead, partitionsWrite } = userToRemove;

  const projectPartition = `project=${project._id}`;

  if (   (!partitionsRead || !partitionsRead.includes(projectPartition))
      && (!partitionsWrite || !partitionsWrite.includes(projectPartition))) {
    return { error: `Project ${projectId} was not shared with user ${shareToEmail}` };
  }

  try {
    return await users.updateOne(
      { _id: userToRemove._id},
      { $pull: {
          partitionsRead: projectPartition,
          partitionsWrite: projectPartition,
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

