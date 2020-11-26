// -------------------------------------------------------------------
//  projectGetShared
//
//  Finds all this users projects shared with other users
//
//  Returns array with following values:
//     { name, projectId, permission }
// -------------------------------------------------------------------
const task = async function(projectId) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const thisUser = context.user.custom_data;

  const conditions = [
      { _id: { $ne: thisUser._id }}, // ...is not me
  ]

  let result = await users.aggregate([
    { $match: { $and: conditions }},
    { $project: {
          name: 1,
          _projectsShare: 1
       }
    },
    { $unwind: "$_projectsShare" }, // One row for each project share
  ])
  .toArray();

  // Flatten result
  return result
      .filter((row) => { return row._projectsShare.projectId === projectId })
      .map((row) => {
          return { name: row.name, projectId: row._projectsShare.projectId, permission: row._projectsShare.permission }
      });
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
