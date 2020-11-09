// --------------------------------
//  projectAddShare
// --------------------------------
exports = async function(projectId, email, permissions) {
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
  const shareUser = await users.findOne({ name: email });
  if (shareUser == null) {
    return { error: `User ${email} was not found` };
  }

  if (shareUser._id === thisUser.id) {
    return { error: "You already have access to project ${projectId}" };
  }

  const partition = `project=${project._id}`;

  if (shareUser.canWritePartitions && shareUser.canWritePartitions.includes(partition)) {
     return {error: `User ${email} is already a member of your team`};
  }

  let addSet = {
    projects: `${project.id}`,
  };

  switch (permissions) {
     case "r":
       addSet.canReadPartitions = partition;
       break;

     case "rw":
       addSet.canWritePartitions = partition;
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
