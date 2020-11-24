// -------------------------------------------------------------------
//  eventCreatedUser
//
//  Handles authentication trigger when new user created
// -------------------------------------------------------------------
const task = async function ({user}) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");

  return users.insertOne({
    _id: user.id,
    _partition: `user=${user.id}`,
    _projectsShare: [],
    name: user.data.email,
    projects: [],
  });
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
