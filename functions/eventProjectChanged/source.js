// -------------------------------------------------------------------
//  eventProjectChanged
//
//  Handles database trigger for Project collection when records
//  added, removed or replaced
// -------------------------------------------------------------------
const task = async function (event) {
  const cluster = context.services.get("mongodb-atlas");
  const users = cluster.db("tracker").collection("User");

  if (!event.fullDocument) {
      return { error: `Event's fullDocument is undefined: ${JSON.stringify(event)}` };
  }

  const project = event.fullDocument;

  if (!project.ownerId) {
      return { error: `Project's ownerId is undefined: ${JSON.stringify(project)}` };
  }

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
          // TODO: Need function to remove this partition from all users it might have been shared with
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
