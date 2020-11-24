// -------------------------------------------------------------------
//  Test for projectAddShare
// -------------------------------------------------------------------
const { MongoClient } = require('mongodb');
const utils = require('../testUtils.js');
const task = require('./source.js');
const taskRemoveShare = require('../projectRemoveShare/source.js');

describe('insert', () => {
  let data;

  beforeAll(async () => {
    data = await utils.init("addOwner");

    // This function needs access to projectRemoveShare function
    context.functions = {
        execute: async (func, projectId, shareToEmail) => {
            await taskRemoveShare(projectId, shareToEmail);
        }
    }
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
    const result = await task("badProject1", "user1");
    expect(result.error).toEqual("Project id badProject1 was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await task("user1Project1", "userBad", "r");
    expect(result.error).toEqual("User userBad was not found");
  });

  it('should add project to owner', async () => {
    await task("user1Project1", "user1");
    const user = await utils.getUser(data, "user1");
    // console.log(user)

    const partition = `project=user1Project1`;

    expect(user._projectsShare.length).toEqual(0);
    expect(user.projects.length).toEqual(1);
    const found = user.projects.find(project => project.projectId === "user1Project1");
    expect(found.permission).toEqual("o");

    const result = await task("user1Project1", "user1");
    expect(result.error).toEqual("User user1 already owner of project user1Project1");
  });
});
