// --------------------------------
//  Test for canWritePartition
// --------------------------------
const utils = require('../testUtils.js');
const canWritePartition = require('./source.js');

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
        custom_data: utils.createUser("user1")
      }
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('should not allow access', async () => {
    const result = await canWritePartition("user=user2");
    expect(result).toEqual(false);
  });

  it('should allow access to partition', async () => {
    context.user.custom_data.addShare("user3", "project2", "r")
    context.user.custom_data.addShare("user2", "project1", "r")

    let result = await canWritePartition("user=user2");
    expect(result).toEqual(true);

    result = await canWritePartition("user=user3");
    expect(result).toEqual(true);
  });

  it('should allow access to own partition', async () => {
    const result = await canWritePartition("user=user1");
    expect(result).toEqual(true);
  });
});
