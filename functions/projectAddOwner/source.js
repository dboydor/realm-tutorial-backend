// --------------------------------
//  projectAddOwner
// --------------------------------
const task = async function(projectId, userId) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");
  const ObjectId = (id) => { return !context.runningAsSystem ? id : new BSON.ObjectId(id) }

  // Find project to add
  const project = await projects.findOne({ _id: ObjectId(projectId) });
  if (!project) {
      return { error: `Project id ${projectId} was not found` };
  }

  // Find user to add
  const thisUser = await users.findOne({ _id: ObjectId(userId) });
  if (thisUser == null) {
      return { error: `User ${userId} was not found` };
  }

  if (thisUser.projects.find(project => project.projectId === projectId)) {
      return { error: `User ${userId} already owner of project ${projectId}`};
  }

  let addSet = {
      projects: { userId: userId, projectId: projectId, permission: "o" }
  };

  try {
      // Update the user, indicating that he owns this project
      return await users.updateOne(
        { _id: thisUser._id },
        { $addToSet: addSet },
      );
  } catch (error) {
      return { error: error.toString() };
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}

