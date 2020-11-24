// --------------------------------
//  Test for projectRemoveShare
// --------------------------------
const { MongoClient } = require('mongodb');
const utils = require('../testUtils.js');
const projectRemoveOwner = require('./source.js');
const projectAddOwner = require('../projectAddOwner/source.js');

describe('insert', () => {
  let data;

  beforeAll(async () => {
    data = await utils.init("removeOwner");
  });

  afterAll(async () => {
    await utils.destroy(data)
  });

  beforeEach(async () => {
      await utils.buildUsers(data, 3);
      await utils.buildProjects(data, "user1", 3, true);
      await utils.setGlobalUser(data, "user1")
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('should fail with invalid project id', async () => {
    const result = await projectRemoveOwner("badProject1", "user1");
    expect(result.error).toEqual("Project id badProject1 was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await projectRemoveOwner("user1Project1", "user1Bad");
    expect(result.error).toEqual("User user1Bad was not found");
  });

  it('should fail with project not owned', async () => {
    const user = await utils.getUser(data, "user2");

    const result = await projectRemoveOwner("user1Project1", "user2");
    expect(result.error).toEqual("Project user1Project1 is not owned by user user2");
  });

  it('should remove project as owner', async () => {
    // Add an owner
    await projectAddOwner("user1Project1", "user1")

    const result = await projectRemoveOwner("user1Project1", "user1");

    const user = await utils.getUser(data, "user1");
    // console.log(user)

    expect(user._projectsShare.length).toEqual(0);
    expect(user.projects.length).toEqual(0);
  });

  it('should remove project as owner multiple', async () => {
    // Add an owner
    await projectAddOwner("user1Project1", "user1")
    await projectAddOwner("user1Project2", "user1")
    await projectAddOwner("user1Project3", "user1")

    const result = await projectRemoveOwner("user1Project1", "user1");

    const user = await utils.getUser(data, "user1");
    // console.log(user)

    expect(user._projectsShare.length).toEqual(0);
    expect(user.projects.length).toEqual(2);
  });
});
