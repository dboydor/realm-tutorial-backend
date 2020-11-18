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

  const partition = `project=${project._id}`;

  let addSet = {
    projects: { id: `${projectId}`, permission: permission}
  };

  switch (permission) {
     case "r":
        if (shareUser.partitionsRead && shareUser.partitionsRead.includes(partition)) {
           return { error: `User ${shareToEmail} already has read access to project ${projectId}`};
        }

        addSet.partitionsRead = partition;
        break;

     case "rw":
        if (shareUser.partitionsWrite && shareUser.partitionsWrite.includes(partition)) {
           return { error: `User ${shareToEmail} already has write access to project ${projectId}`};
        }

        addSet.partitionsWrite = partition;
        break;
  }

  try {
    // Update the user to share with, indicating that he has access to this project
    return await users.updateOne(
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

