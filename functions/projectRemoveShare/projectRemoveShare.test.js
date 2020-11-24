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
    const result = await task("project1Bad", "user2");
    expect(result.error).toEqual("Project id project1Bad was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await task("user1Project1", "userBad");
    expect(result.error).toEqual("User userBad was not found");
  });

  it('should fail because user already owns this project', async () => {
    const result = await task("user1Project1", "user1");
    expect(result.error).toEqual("You cannot remove share from yourself");
  });

  it('should fail because user already owns this project', async () => {
    // console.log(await utils.getUser(data, "user2"))

    const result = await task("user1Project1", "user2");
    expect(result.error).toEqual("Project user1Project1 was not shared with user user2");
  });

  it('should remove project from projects share', async () => {
    await utils.addProjects(data, "user1", 3, "r", "user2")
    //await utils.addProjects(data, "user1", 5, "rw", "user3")

    const result = await task("user1Project1", "user2");

    const user = await utils.getUser(data, "user2");
    // console.log(user)

    const partition = `project=user1Project1`;

    expect(user.custom_data._projectsShare.length).toEqual(0);
    const found = user.custom_data.projects.find(project => project.id === "user1Project1");
    expect(found).toEqual(undefined);
  });
});
