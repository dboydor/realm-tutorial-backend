// -------------------------------------------------------------------
//  eventProjectChanged
//
//  Handles database trigger for Project collection when records
//  added, removed or replaced
// -------------------------------------------------------------------
const task = async function (event) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");
  const project = event.fullDocument;
  const userId = project.ownerId;
  let result;

  switch (event.operationType) {
      case "insert":
        result = await context.functions.execute("projectAddOwner", project._id, userId);
        if (result && result.error) {
          return result;
        }
        break;

      case "delete":
        result = await context.functions.execute("projectRemoveOwner", project._id, userId);
        if (result && result.error) {
          return result;
        }
        break;

      case "replace":
        break;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
