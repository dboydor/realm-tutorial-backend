// --------------------------------
//  projectGetShared
//
//  Returns array with following values:
//     { name, projectId, permissions }
// --------------------------------
const task = async function() {
  const cluster = context.services.get("mongodb-atlas");
  const collection = cluster.db("tracker").collection("User");
  const thisUser = context.user;
  const projectPartition = `project=${thisUser.id}`;

  const filter = {
    $or: [
      {"canReadPartitions": projectPartition}, // has my project id as a readable partition or
      {"canWritePartitions": projectPartition}, // has my project id as a writeable partition
    ], // and...
    _id: {$ne: thisUser.id} // ...is not me
  };

  const returnFields = {
    _id: 1,
    name: 1
  };

  // Return list of users: [{_id, name}, ...]
  return await collection.find(filter, returnFields)
    .sort({_id: 1})
    .toArray();
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
