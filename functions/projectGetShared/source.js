// --------------------------------
//  projectGetShared
//
//  Returns array with following values:
//     { name, projectId, permissions }
// --------------------------------
const task = async function() {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const thisUser = context.user;
  const projectPartition = `project=${thisUser.id}`;

  const filter = {
    $or: [
      {"partitionsRead": projectPartition}, // has my project id as a readable partition or
      {"partitionsWrite": projectPartition}, // has my project id as a writeable partition
    ], // and...
    _id: {$ne: thisUser.id} // ...is not me
  };

  const returnFields = {
    _id: 1,
    name: 1
  };

  let result = await users.aggregate(
    { $unwind: "$projects" },
    { $match: { _id: { $ne: thisUser.id }}},
    { $project: {
          name: 1,
          projects: 1
       }
    },
  )
  .toArray();

  result = result.map((row) => {
      return { name: row.name, projectId: row.projects.id, permission: row.projects.permissions }
  });

  return result;

  // Return list of users: [{_id, name}, ...]
  // return await users.find(filter, returnFields)
  //   .sort({_id: 1})
  //   .toArray();
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
