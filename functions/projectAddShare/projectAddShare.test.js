// --------------------------------
//  Test for projectGetShared
// --------------------------------
const { MongoClient } = require('mongodb');
const task = require('./source.js');

describe('insert', () => {
  let connection;
  let db;
  let context = {
    services: {},
    user: { id: "user1",
            custom_data: {
                _id: 'user1',
                _partition: 'user=user1',
                name: 'user1@mail.com',
                projects: []
            }
          }
  }

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    db = await connection.db(global.__MONGO_DB_NAME__);

    global.context = context;
    global.context.services.get = () => {
      return {
        db: () => {
            return db;
        }
      }
    }

    await buildUsers(3);
    await buildProjects("user1", 3);
  });

  afterAll(async () => {
    await connection.close();
    await db.close();
  });

  beforeEach(async () => {
      const users = await db.collection('User');
      context.user.custom_data = await users.findOne({_id: {$eq: "user1"}})
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------
  it('should fail with invalid project id', async () => {
    const result = await task("badProject1", "user2@mail.com", "r");
    expect(result.error).toEqual("Project id badProject1 was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await task("user1Project1", "user2@bad.com", "r");
    expect(result.error).toEqual("User user2@bad.com was not found");
  });

  it('should fail because user already owns this project', async () => {
    const result = await task("user1Project1", "user1@mail.com", "r");
    expect(result.error).toEqual("You already have access to project user1Project1");
  });

  it('should fail because user already owns this project', async () => {
    const result = await task("user1Project1", "user1@mail.com", "r");
    expect(result.error).toEqual("You already have access to project user1Project1");
  });

  it('should add project as read share', async () => {
    await task("user1Project1", "user2@mail.com", "r");
    const user = await getUser("user2");

    expect(user.partitionsOwn.length).toEqual(0);
    expect(user.partitionsRead.length).toEqual(1);
    expect(user.partitionsWrite.length).toEqual(0);
    expect(user.projects.length).toEqual(1);

    const result = await task("user1Project1", "user2@mail.com", "r");
    expect(result.error).toEqual("User user2@mail.com already has read access to project user1Project1");
  });

  it('should add project as write share', async () => {
    await task("user1Project1", "user2@mail.com", "rw");
    const user = await getUser("user2");

    // Cumulative from test above
    expect(user.partitionsOwn.length).toEqual(0);
    expect(user.partitionsRead.length).toEqual(1);
    expect(user.partitionsWrite.length).toEqual(1);
    expect(user.projects.length).toEqual(2);

    const result = await task("user1Project1", "user2@mail.com", "rw");
    expect(result.error).toEqual("User user2@mail.com already has write access to project user1Project1");
  });

  // ---------------------------------------
  //  Utilities
  // ---------------------------------------

  buildUsers = async (count) => {
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

    const users = await db.collection('User');
    await users.deleteMany({});
    await users.insertMany(list);
  }

  getUser = async (userId) => {
    const users = await db.collection('User');
    return await users.findOne({_id: {$eq: userId}})
  }

  buildProjects = async (userId, count) => {
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

    const projects = await db.collection('Project');
    await projects.deleteMany({});
    await projects.insertMany(list);

    let addSet = {
        projects: { $each: projectIds },
        partitionsOwn: { $each: partitions },
    }

    const users = await db.collection('User');

    await users.updateOne(
      {_id: { $eq: userId }},
      { $addToSet: addSet },
    )

    context.user.custom_data = await users.findOne({_id: {$eq: userId}});
  }

  addProjects = async (fromUserId, count, permission, toUserId) => {
    const users = await db.collection('User');
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
});
