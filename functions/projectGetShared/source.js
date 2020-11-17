// --------------------------------
//  projectGetShared
//
//  Returns array with following values:
//     { name, projectId, permission }
// --------------------------------
const task = async function() {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const thisUser = context.user;
  const projectPartition = `project=${thisUser.id}`;

  const { partitionsOwn } = thisUser.custom_data;

  console.log(partitionsOwn)

  let result = await users.aggregate(
    { $unwind: "$projects" }, // One row for each project
    { $match: { _id: { $ne: thisUser.id }}}, // ...is not me
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
