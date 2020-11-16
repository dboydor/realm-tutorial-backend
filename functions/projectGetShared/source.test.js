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
    user: { id: 'user1', _partition: 'user=user1', name: 'user1@mail.com', projects: [] }
  }

  buildUsers = async (count) => {
    const list = [];
    for (var x = 1; x <= count; x++) {
        list.push(
          { _id: `user${x}`,
            _partition: `user=user${x}`,
             canReadPartitions: [],
             canWriteParitions: [],
             name: `user${x}@mail.com`,
             projects: []
           }
        )
    }

    const users = db.collection('User');
    await users.insertMany(list);
  }

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
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

  it('should return any projects', async () => {
    const result = await task();
    expect(result.length).toEqual(0);
  });

  it('should return any projects', async () => {
    const users = db.collection('User');
    await users.updateOne(
      {_id: {$eq: "user2"}},
      { $addToSet: { canReadPartitions: "project=project1" }},
    )

    const user2 = await users.findOne({_id: {$eq: "user2"}})

    console.log(user2)

    const result = await task();
    console.log(result)
    //expect(result.length).toEqual(1);
  });
});
