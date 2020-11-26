// -------------------------------------------------------------------
//  canWritePartition
// -------------------------------------------------------------------
const task = async function (partition) {
  try {
      const thisUser = context.user.custom_data;

      // If the user id is in the partition, we own it
      if (partition.indexOf(thisUser._id) != -1) {
          return true;
      }

      // The user custom data contains a projects share array that is managed
      // by a system function.
      const { _projectsShare } = thisUser;

      if (!_projectsShare) {
          return false;
      }

      return !!_projectsShare.find(project => partition === `user=${project.userId}`)
  } catch (error) {
      console.error(error);
      return false;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
