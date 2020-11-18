// -------------------------------------------------------------------
//  canWritePartition
// -------------------------------------------------------------------
const task = async function(partition) {
  try {
    const thisUser = context.user;

    // The user custom data contains a partitionsWrite array that is managed
    // by a system function.
    const { partitionsOwn, partitionsWrite } = thisUser.custom_data;

    // If the user's partitionsOwn or partitionsWrite array contains the partition, they may write to it
    return (partitionsOwn && partitionsOwn.includes(partition)) ||
           (partitionsWrite && partitionsWrite.includes(partition));

  } catch (error) {
    console.error(error);
    return false;
  }
};

// Running as Mongo Realm function
exports = task;

// Running under Jest
try { module.exports = task; } catch (e) {}
