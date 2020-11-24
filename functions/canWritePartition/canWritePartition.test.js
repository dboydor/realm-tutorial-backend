// --------------------------------
//  Test for canWritePartition
// --------------------------------
const utils = require('../testUtils.js');
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
      context.user = utils.createUser("user1")
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('should not allow access', async () => {
    const result = await task("user=user2");
    expect(result).toEqual(false);
  });

  it('should allow access to partition', async () => {
    context.user.addShare("user=user3", "project2", "r")
    context.user.addShare("user=user2", "project1", "r")

    let result = await task("user=user2");
    expect(result).toEqual(true);

    result = await task("user=user3");
    expect(result).toEqual(true);
  });

  it('should allow access to own partition', async () => {
    const result = await task("user=user1");
    expect(result).toEqual(true);
  });
});
