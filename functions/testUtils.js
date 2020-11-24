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
      user: module.exports.createUser("user1")
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

  createUser: (id) => {
      let user = {
        id: id,
        custom_data: {
          _id: id,
          _partition: `user=${id}`,
          _projectsShare: [],
          name: `${id}@mail.com`,
          projects: []
        }
      }

      user.addShare = (function (partition, projectId, permission) {
          this.custom_data._projectsShare.push({ partition: partition, projectId: projectId, permission: permission })
      }).bind(user);

      return user;
  },

  buildUsers: async (data, count) => {
    const list = [];
    for (var x = 1; x <= count; x++) {
        list.push(module.exports.createUser(`user${x}`))
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

  buildProjects: async (data, userId, count, noLinkUsers) => {
    let partitions = [];
    let projectIds = [];

    const list = [];
    for (var x = 1; x <= count; x++) {
        list.push(
          { _id: `${userId}Project${x}`,
            _partition: `user=${userId}`,
            ownerId: userId,
            name: `Project #${x}`,
           }
        )

        partitions.push({ partition: `user=${userId}`, projectId: projectId, permission: "rw" })
        projectIds.push({ userId: userId, projectId: projectId, permission: "rw" });
    }

    const projects = await data.db.collection('Project');
    await projects.deleteMany({});
    await projects.insertMany(list);

    if (!noLinkUsers) {
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
    }
  },

  addProjects: async (data, fromUserId, count, permission, toUserId) => {
    const users = await data.db.collection('User');
    let partitions = [];
    let projects = [];

    // Add this project to fromUser
    for (let x = 1; x <= count; x++) {
        // In-memory instance
        context.user.custom_data.projects.push({ userId: fromUserId, projectId: "project" + x, permission: "o" })
        projects.push({ userId: fromUserId, projectId: "project" + x, permission: "o" })
    }

    let addSet = {
        projects: { $each: projects },
    }

    await users.updateOne(
      {_id: { $eq: fromUserId }},
      { $addToSet: addSet },
    )

    // Now add to the toUser
    partitions.length = 0;
    projects.length = 0;

    for (let x = 1; x <= count; x++) {
        partitions.push({ partition: `user=${fromUserId}`, projectId: "project" + x, permission: permission })
        projects.push({ id: fromUserId, projectId: "project" + x, permission: permission })
    }

    addSet = {
        _projectsShare: { $each: partitions },
        projects: { $each: projects },
    }

    await users.updateOne(
        {_id: { $eq: toUserId }},
        { $addToSet: addSet },
    )
  }
};

