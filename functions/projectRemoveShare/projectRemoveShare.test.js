// --------------------------------
//  Test for projectRemoveShare
// --------------------------------
const { MongoClient } = require('mongodb');
const utils = require('../testUtils.js');
const projectRemoveShare = require('./source.js');

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
    const result = await projectRemoveShare("project1Bad", "user2");
    expect(result.error).toEqual("Project id project1Bad was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await projectRemoveShare("user1Project1", "userBad");
    expect(result.error).toEqual("User userBad was not found");
  });

  it('should fail because user already owns this project', async () => {
    const result = await projectRemoveShare("user1Project1", "user1@mail.com");
    expect(result.error).toEqual("You cannot remove share from yourself");
  });

  it('should fail because user already owns this project', async () => {
    //console.log(await utils.getUser(data, "user2"))

    const result = await projectRemoveShare("user1Project1", "user2@mail.com");
    expect(result.error).toEqual("Project user1Project1 was not shared with user user2");
  });

  it('should remove project from projects share', async () => {
    await utils.addProjects(data, "user1", 3, "r", "user2")
    //await utils.addProjects(data, "user1", 5, "rw", "user3")

    const result = await projectRemoveShare("user1Project1", "user2@mail.com");

    const user = await utils.getUser(data, "user2");
    // console.log(user)

    expect(user._projectsShare.length).toEqual(2);
    const found = user.projects.find(project => project.id === "user1Project1");
    expect(found).toEqual(undefined);
  });
});
