// --------------------------------
//  addTeamMember
// --------------------------------
exports = async function(email) {
  const cluster = context.services.get("mongodb-atlas");
  const collection = cluster.db("tracker").collection("User");
  const filter = { name: email };
  const thisUser = context.user;

  // Find user to add
  const newMember = await collection.findOne(filter);
  if (newMember == null) {
    return {error: `User ${email} not found`};
  }

  if (newMember._id === thisUser.id) {
    return {error: "You are already on your own team!"};
  }

  const projectPartition = `project=${thisUser.id}`;

  if (newMember.canWritePartitions && newMember.canWritePartitions.includes(projectPartition)) {
     return {error: `User ${email} is already a member of your team`};
  }

  try {
    // Update the new member's user, indicating that he has access
    // to this user's project
    return await collection.updateOne(
      {_id: newMember._id},
      {$addToSet: {
          canWritePartitions: projectPartition,
          memberOf: {
            name: `${thisUser.custom_data.name}'s Project`,
            partition: projectPartition,
          }
        }
      });
  } catch (error) {
    return {error: error.toString()};
  }
};
