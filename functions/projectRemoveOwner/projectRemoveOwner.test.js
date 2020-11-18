// --------------------------------
//  Test for projectRemoveShare
// --------------------------------
const { MongoClient } = require('mongodb');
const utils = require('../testUtils.js');
const task = require('./source.js');

describe('insert', () => {
  let data;

  beforeAll(async () => {
    data = await utils.init("removeShare");
  });

  afterAll(async () => {
    await utils.destroy(data)
  });

  beforeEach(async () => {
      await utils.buildUsers(data, 3);
      await utils.buildProjects(data, "user1", 3);
      await utils.setGlobalUser(data, "user1")
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('should fail with invalid project id', async () => {
    const result = await task("badProject1", "user2@mail.com");
    expect(result.error).toEqual("Project id badProject1 was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await task("user1Project1", "user2@bad.com");
    expect(result.error).toEqual("User user2@bad.com was not found");
  });

  it('should fail because user already owns this project', async () => {
    const result = await task("user1Project1", "user1@mail.com");
    expect(result.error).toEqual("You cannot remove share from yourself");
  });

  it('should fail because user already owns this project', async () => {
    // console.log(await utils.getUser(data, "user2"))

    const result = await task("user1Project1", "user2@mail.com");
    expect(result.error).toEqual("Project user1Project1 was not shared with user user2@mail.com");
  });

  it('should remove project from read share', async () => {
    await utils.addProjects(data, "user1", 3, "r", "user2")
    //await utils.addProjects(data, "user1", 5, "rw", "user3")

    const result = await task("user1Project1", "user2@mail.com");

    const user = await utils.getUser(data, "user2");
    //console.log(user)

    const partition = `project=user1Project1`;

    expect(user.partitionsOwn.length).toEqual(0);
    expect(user.partitionsRead.includes(partition)).toEqual(false);
    expect(user.partitionsWrite.length).toEqual(0);
    const found = user.projects.find(project => project.projectId === "user1Project1");
    expect(found).toEqual(undefined);
  });

  it('should remove project from write share', async () => {
    await utils.addProjects(data, "user1", 5, "rw", "user3")

    const result = await task("user1Project1", "user3@mail.com");

    const user = await utils.getUser(data, "user3");
    //console.log(user)

    const partition = `project=user1Project1`;

    expect(user.partitionsOwn.length).toEqual(0);
    expect(user.partitionsRead.length).toEqual(0);
    expect(user.partitionsWrite.includes(partition)).toEqual(false);
    const found = user.projects.find(project => project.projectId === "user1Project1");
    expect(found).toEqual(undefined);
  });
});
