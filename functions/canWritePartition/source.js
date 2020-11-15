// --------------------------------
//  canWritePartition
// --------------------------------
const task = async function(partition) {
  try {
    const thisUser = context.user;

    // The user custom data contains a canWritePartitions array that is managed
    // by a system function.
    const { canWritePartitions } = thisUser.custom_data;

    // If the user's canWritePartitions array contains the partition, they may write to it
    return canWritePartitions && canWritePartitions.includes(partition);

  } catch (error) {
    console.error(error);
    return false;
  }
};

// Running under Jest
if (global.__MONGO_URI__) {
  module.exports = task;
// Running as Mongo Realm function
} else {
  exports = task;
}
