const { MongoClient } = require('mongodb');

module.exports = {
  init: async (dbName) => {
    const data = {};

    data.connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    data.db = await data.connection.db(dbName);

    let context = {
      services: {},
      user: {
        id: "user1",
        custom_data: {
          _id: 'user1',
          _partition: 'user=user1',
          name: 'user1@mail.com',
          projects: []
        }
      }
    }

    global.context = context;
    global.context.services.get = () => {
      return {
        db: () => {
            return data.db;
        }
      }
    }

    return data;
  },

  destroy: async (data) => {
    await data.db.dropDatabase();
    await data.connection.close();
    await data.db.close();
  },

  buildUsers: async (data, count) => {
    const list = [];
    for (var x = 1; x <= count; x++) {
        list.push(
          { _id: `user${x}`,
            _partition: `user=user${x}`,
             partitionsOwn: [],
             partitionsRead: [],
             partitionsWrite: [],
             name: `user${x}@mail.com`,
             projects: []
           }
        )
    }

    const users = data.db.collection('User');
    await users.deleteMany({});
    await users.insertMany(list);
  },

  getUser: async (data, userId) => {
    const users = await data.db.collection('User');
    return await users.findOne({_id: {$eq: userId}})
  },

  setGlobalUser: async (data, userId) => {
    context.user.custom_data = await module.exports.getUser(data, userId);
  },

  buildProjects: async (data, userId, count) => {
    let partitions = [];
    let projectIds = [];

    const list = [];
    for (var x = 1; x <= count; x++) {
        list.push(
          { _id: `${userId}Project${x}`,
            _partition: `project=${userId}Project${x}`,
             name: `Project #${x}`,
           }
        )

        partitions.push(`project=${userId}Project${x}`)
        projectIds.push({ projectId: `${userId}Project${x}`, permission: "rw" });
    }

    const projects = await data.db.collection('Project');
    await projects.deleteMany({});
    await projects.insertMany(list);

    let addSet = {
        projects: { $each: projectIds },
        partitionsOwn: { $each: partitions },
    }

    const users = await data.db.collection('User');

    await users.updateOne(
      {_id: { $eq: userId }},
      { $addToSet: addSet },
    )

    await module.exports.setGlobalUser(data, userId);
  },

  addProjects: async (data, fromUserId, count, permission, toUserId) => {
    const users = await data.db.collection('User');
    let partitions = [];
    let projects = [];

    // Add this project to fromUser
    for (let x = 1; x <= count; x++) {
        // In-memory instance
        context.user.custom_data.partitionsOwn.push("project=" + fromUserId + "Project" + x)
        context.user.custom_data.projects.push({ projectId: fromUserId + "Project" + x, permission: "o" })

        partitions.push("project=" + fromUserId + "Project" + x)
        projects.push({ projectId: fromUserId + "Project" + x, permission: "o" })
    }

    let addSet = {
        projects: { $each: projects },
        partitionsOwn: { $each: partitions },
    }

    await users.updateOne(
      {_id: { $eq: fromUserId }},
      { $addToSet: addSet },
    )

    // Now add to the toUser
    partitions.length = 0;
    projects.length = 0;

    for (let x = 1; x <= count; x++) {
        partitions.push("project=" + fromUserId + "Project" + x)
        projects.push({ projectId: fromUserId + "Project" + x, permission: permission })
    }

    addSet = {
        projects: { $each: projects },
    }

    if (permission == "r") {
        addSet.partitionsRead = { $each: partitions };
    } else {
        addSet.partitionsWrite = { $each: partitions };
    }

    await users.updateOne(
      {_id: { $eq: toUserId }},
      { $addToSet: addSet },
    )
  }
};

