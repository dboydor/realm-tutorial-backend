// -------------------------------------------------------------------
//  projectAddOwner
//
//  Called from trigger: projectId is ObjectId and userId is String
// -------------------------------------------------------------------
const task = async function(projectId, userId) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");

  console.log(projectId)
  console.log(userId)

  // Find project to add
  const project = await projects.findOne({ _id: projectId });
  if (!project) {
      return { error: `Project id ${projectId} was not found` };
  }

  // Find user to add
  const thisUser = await users.findOne({ _id: userId });
  if (!thisUser) {
      return { error: `User ${userId} was not found` };
  }

  if (!thisUser.projects) {
      return { error: `User ${userId} is missing projects array!` };
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

