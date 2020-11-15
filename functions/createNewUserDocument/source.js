// --------------------------------
//  createNewUserDocument
// --------------------------------
const task = async function createNewUserDocument({user}) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");

  return users.insertOne({
    _id: user.id,
    _partition: `user=${user.id}`,
    name: user.data.email,
    canReadPartitions: [],
    canWritePartitions: [],
    projects: [],
  });
};

// Running under Jest
if (global.__MONGO_URI__) {
  module.exports = task;
// Running as Mongo Realm function
} else {
  exports = task;
}
