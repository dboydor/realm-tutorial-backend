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
      case "insert":
        const result = await context.functions.execute("projectAddOwner", projectId, userId);
        if (result && result.error) {
          return result;
        }
        break;

      case "delete":
        const result = await context.functions.execute("projectRemoveOwner", projectId, userId);
        if (result && result.error) {
          return result;
        }
        break;

      case "replace":
        break;
  }
  /*
    A Database Trigger will always call a function with a event.
    Documentation on ChangeEvents: https://docs.mongodb.com/manual/reference/change-events/

    Access the _id of the changed document:
    const docId = event.documentKey._id;

    Access the latest version of the changed document
    (with Full Document enabled for Insert, Update, and Replace operations):
    const fullDocument = event.fullDocument;

    const updateDescription = event.updateDescription;

    See which fields were changed (if any):
    if (updateDescription) {
      const updatedFields = updateDescription.updatedFields; // A document containing updated fields
    }

    See which fields were removed (if any):
    if (updateDescription) {
      const removedFields = updateDescription.removedFields; // An array of removed fields
    }
  */
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
