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
    const result = await task("user=user1");
    expect(result).toEqual(false);
  });

  it('should allow access to read project', async () => {
    context.user.addShare("user=user1", "project1", "r")

    const result = await task("project1");
    expect(result).toEqual(true);
  });

  it('should not allow access to write project', async () => {
    context.user.addShare("user=user3", "project2", "rw")

    let result = await task("project2");
    expect(result).toEqual(false);
  });
});