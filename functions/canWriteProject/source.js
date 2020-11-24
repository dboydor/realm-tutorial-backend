// -------------------------------------------------------------------
//  canWriteProject
// -------------------------------------------------------------------
const task = async function (projectId) {
  try {
      // The user custom data contains a projectsShare array that is managed
      // by a system function.
      const { _projectsShare } = context.user.custom_data;

      return !!_projectsShare.find(project => {
          return project.projectId === projectId && project.permission === "rw"
      })
  } catch (error) {
      console.error(error);
      return false;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
