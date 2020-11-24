// -------------------------------------------------------------------
//  canWritePartition
// -------------------------------------------------------------------
const task = async function (partition) {
  try {
      const thisUser = context.user;

      // If the user id is in the partition, we own it
      if (partition.indexOf(thisUser.id) != -1) {
          return true;
      }

      // The user custom data contains a partitionsWrite array that is managed
      // by a system function.
      const { _projectsShare } = thisUser.custom_data;

      return !!_projectsShare.find(project => project.partition === partition
  } catch (error) {
      console.error(error);
      return false;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
