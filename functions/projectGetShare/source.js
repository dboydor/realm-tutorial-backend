// -------------------------------------------------------------------
//  projectGetShared
//
//  Finds all this users projects shared with other users
//
//  Returns array with following values:
//     { name, projectId, permission }
// -------------------------------------------------------------------
const task = async function() {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const thisUser = context.user;
  const { partitionsOwn } = thisUser.custom_data;

  // Create a filter to find any users that have access
  // to any of the projects of this user
  const canReadWrite = []
  partitionsOwn.forEach((partition) => {
      canReadWrite.push({ partitionsRead: partition });
      canReadWrite.push({ partitionsWrite: partition })
  })

  const conditions = [
      { _id: { $ne: thisUser.id }}, // ...is not me
  ]

  if (canReadWrite.length) {
      conditions.push({ $or: canReadWrite })
  }

  let result = await users.aggregate(
    { $unwind: "$projects" }, // One row for each project
    { $match: { $and: conditions }},
    { $project: {
          name: 1,
          projects: 1
       }
    },
  )
  .toArray();

  // Flatten result
  return result.map((row) => {
      return { name: row.name, projectId: row.projects.projectId, permission: row.projects.permission }
  });
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
