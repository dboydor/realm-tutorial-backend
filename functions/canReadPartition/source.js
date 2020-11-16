// --------------------------------
//  canReadPartition
// --------------------------------
const task = async function(partition) {
  try {
    const thisUser = context.user;

    // The user custom data contains a canReadPartitions array that is managed
    // by a system function.
    const { canReadPartitions } = thisUser.custom_data;

    // If the user's canReadPartitions array contains the partition, they may read the partition
    return canReadPartitions && canReadPartitions.includes(partition);

  } catch (error) {
    console.error(error);
    return false;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
