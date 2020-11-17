// --------------------------------
//  projectAddShare
// --------------------------------
const task = async function(projectId, shareToName, permissions) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const projects = cluster.db("tracker").collection("Project");
  const thisUser = context.user;

  // Find project to add
  const project = await projects.findOne({ _id: projectId });
  if (project == null) {
    return { error: `Project id ${projectId} was not found` };
  }

  // Find user to add
  const shareUser = await users.findOne({ name: shareToName });
  if (shareUser == null) {
    return { error: `User ${shareToName} was not found` };
  }

  if (shareUser._id === thisUser.id) {
    return { error: `You already have access to project ${projectId}` };
  }

  const partition = `project=${project._id}`;

  if (shareUser.canWritePartitions && shareUser.canWritePartitions.includes(partition)) {
     return {error: `User ${shareToName} already has access to project ${projectId}`};
  }

  let addSet = {
    projects: { id: `${project.id}`, permissions: permissions}
  };

  switch (permissions) {
     case "r":
       addSet.partitionsRead = partition;
       break;

     case "rw":
       addSet.partitionsWrite = partition;
       break;
  }

  try {
    // Update the user to share with, indicating that he has access to this project
    return await collection.updateOne(
      { _id: shareUser._id },
      { $addToSet: addSet },
    );
  } catch (error) {
    return {error: error.toString()};
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}

