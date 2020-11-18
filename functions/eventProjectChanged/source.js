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

  switch (event.operationType) {
      case "INSERT":
        const result = await context.functions.execute("projectAddOwner", projectId, userId);
        if (result && result.error) {
          return result;
        }
        break;

      case "DELETE":
        const result = await context.functions.execute("projectRemoveOwner", projectId, userId);
        if (result && result.error) {
          return result;
        }
        break;

      case "REPLACE":
        break;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
