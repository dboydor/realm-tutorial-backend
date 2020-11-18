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
    user: { id: "user1", custom_data: { _id: 'user1', _partition: 'user=user1', name: 'user1@mail.com', projects: [] }}
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

    buildUsers(3);
  });

  afterAll(async () => {
    await connection.close();
    await db.close();
  });

  beforeEach(async () => {
      const users = db.collection('User');
      context.user.custom_data = await users.findOne({_id: {$eq: "user1"}})
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('projectGetShared should not return projects', async () => {
    const result = await task();
    expect(result.length).toEqual(0);
  });

  it('projectGetShared should return many projects', async () => {
    addProjects("user1", 3, "r", "user2")
    addProjects("user1", 5, "rw", "user3")

    const users = db.collection('User');
    context.user.custom_data = await users.findOne({_id: {$eq: "user1"}})

    // console.log(context.user.custom_data)
    // const user2 = await users.findOne({_id: {$eq: "user2"}})
    // console.log(user2)
    // const user3 = await users.findOne({_id: {$eq: "user3"}})
    // console.log(user3)

    const result = await task();
    // console.log(result)

    expect(result.length).toEqual(8);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('projectId');
    expect(result[0]).toHaveProperty('permission');
    expect(result[0].name).toEqual("user2@mail.com");
    expect(result[2].name).toEqual("user2@mail.com");
    expect(result[4].name).toEqual("user3@mail.com");
    expect(result[7].name).toEqual("user3@mail.com");
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

    const users = db.collection('User');
    await users.insertMany(list);
  }

  addProjects = async (fromUserId, count, permission, toUserId) => {
    const users = db.collection('User');
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
