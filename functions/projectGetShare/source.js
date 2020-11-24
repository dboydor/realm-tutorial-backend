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

  const conditions = [
      { _id: { $ne: thisUser.id }}, // ...is not me
  ]

  let result = await users.aggregate(
    { $unwind: "$_projectsShare" }, // One row for each project share
    { $match: { $and: conditions }},
    { $project: {
          name: 1,
          _projectsShare: 1
       }
    },
  )
  .toArray();

  // Flatten result
  return result.map((row) => {
      return { name: row.name, projectId: row._projectsShare.projectId, permission: row._projectsShare.permission }
  });
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
