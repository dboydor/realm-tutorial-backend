// --------------------------------
//  Test for projectAddShared
// --------------------------------
const { MongoClient } = require('mongodb');
const utils = require('../testUtils.js');
const task = require('./source.js');

describe('insert', () => {
  let data;

  beforeAll(async () => {
    data = await utils.init();

    await utils.buildUsers(data, 3);
    await utils.buildProjects(data, "user1", 3);
  });

  afterAll(async () => {
    await utils.destroy(data)
  });

  beforeEach(async () => {
      await utils.setGlobalUser(data, "user1")
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
    const user = await utils.getUser(data, "user2");

    expect(user.partitionsOwn.length).toEqual(0);
    expect(user.partitionsRead.length).toEqual(1);
    expect(user.partitionsWrite.length).toEqual(0);
    expect(user.projects.length).toEqual(1);

    const result = await task("user1Project1", "user2@mail.com", "r");
    expect(result.error).toEqual("User user2@mail.com already has read access to project user1Project1");
  });

  it('should add project as write share', async () => {
    await task("user1Project1", "user2@mail.com", "rw");
    const user = await utils.getUser(data, "user2");

    // Cumulative from test above
    expect(user.partitionsOwn.length).toEqual(0);
    expect(user.partitionsRead.length).toEqual(1);
    expect(user.partitionsWrite.length).toEqual(1);
    expect(user.projects.length).toEqual(2);

    const result = await task("user1Project1", "user2@mail.com", "rw");
    expect(result.error).toEqual("User user2@mail.com already has write access to project user1Project1");
  });
});
