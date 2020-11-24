// --------------------------------
//  Test for canReadProject
// --------------------------------
const utils = require('../testUtils.js');
const canReadProject = require('./source.js');

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
    const result = await canReadProject("user=user1");
    expect(result).toEqual(false);
  });

  it('should allow access to read project', async () => {
    context.user.custom_data.addShare("user1", "project1", "r")

    const result = await canReadProject("project1");
    expect(result).toEqual(true);
  });

  it('should not allow access to write project', async () => {
    context.user.custom_data.addShare("user3", "project2", "rw")

    let result = await canReadProject("project2");
    expect(result).toEqual(false);
  });
});
