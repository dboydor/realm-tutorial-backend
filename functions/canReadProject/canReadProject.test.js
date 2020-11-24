// --------------------------------
//  Test for canWritePartition
// --------------------------------
const task = require('./source.js');

describe('insert', () => {
  let connection;
  let db;
  let context = {
    services: {},
    user: null
  }

  beforeAll(async () => {
    global.context = context;
  });

  afterAll(async () => {
  });

  beforeEach(async () => {
      context.user = {
        id: "user1",
        custom_data: {
          _id: 'user1',
          _partition: 'user=user1',
          _projectsOwn: [],
          name: 'user1@mail.com'
        }}
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('should not allow access', async () => {
    const result = await task("user=user1");
    expect(result).toEqual(false);
  });

  it('should not allow access to read partition', async () => {
    context.user.custom_data.partitionsRead.push("user=user1")

    const result = await task("user=user1");
    expect(result).toEqual(false);
  });

  it('should allow access to write partition', async () => {
    context.user.custom_data.partitionsWrite.push("user=user1")
    context.user.custom_data.partitionsWrite.push("project=user1Project2")

    let result = await task("user=user1");
    expect(result).toEqual(true);

    result = await task("project=user1Project2");
    expect(result).toEqual(true);

    result = await task("project=user1Project3");
    expect(result).toEqual(false);
  });

  it('should allow access to own partition', async () => {
    context.user.custom_data.partitionsOwn.push("user=user1")
    context.user.custom_data.partitionsOwn.push("project=user1Project2")

    let result = await task("user=user1");
    expect(result).toEqual(true);

    result = await task("project=user1Project2");
    expect(result).toEqual(true);

    result = await task("project=user1Project3");
    expect(result).toEqual(false);
  });
});
