// -------------------------------------------------------------------
//  Test for projectAddShare
// -------------------------------------------------------------------
const { MongoClient } = require('mongodb');
const utils = require('../testUtils.js');
const projectAddShare = require('./source.js');
const projectRemoveShare = require('../projectRemoveShare/source.js');

describe('insert', () => {
  let data;

  beforeAll(async () => {
    data = await utils.init("addShare");

    // This function needs access to projectRemoveShare function
    context.functions = {
        execute: async (func, projectId, userId) => {
            await projectRemoveShare(projectId, userId);
        }
    }
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
    const result = await projectAddShare("badProject1", "user2@mail.com", "r");
    expect(result.error).toEqual("Project id badProject1 was not found");
  });

  it('should fail with invalid user id', async () => {
    const result = await projectAddShare("user1Project1", "user2@bad.com", "r");
    expect(result.error).toEqual("User user2@bad.com was not found");
  });

  it('should fail because user already owns this project', async () => {
    const result = await projectAddShare("user1Project1", "user1@mail.com", "r");
    expect(result.error).toEqual("You already have access to project user1Project1");
  });

  it('should fail because user already owns this project', async () => {
    const result = await projectAddShare("user1Project1", "user1@mail.com", "r");
    expect(result.error).toEqual("You already have access to project user1Project1");
  });

  it('should add project as read share', async () => {
    await projectAddShare("user1Project1", "user2@mail.com", "r");
    const user = await utils.getUser(data, "user2");

    expect(user._projectsShare.length).toEqual(1);
    expect(user.projects.length).toEqual(1);

    const result = await projectAddShare("user1Project1", "user2@mail.com", "r");
    expect(result.error).toEqual("User user2@mail.com already has 'r' access to project user1Project1");
  });

  it('should add project as write share', async () => {
    await projectAddShare("user1Project1", "user2@mail.com", "rw");
    const user = await utils.getUser(data, "user2");

    expect(user._projectsShare.length).toEqual(1);
    expect(user.projects.length).toEqual(1);

    const result = await projectAddShare("user1Project1", "user2@mail.com", "rw");
    expect(result.error).toEqual("User user2@mail.com already has 'rw' access to project user1Project1");
  });

  it('should switch project from read share to write share', async () => {
    await utils.addProjects(data, "user1", 3, "r", "user2")

    await projectAddShare("user1Project1", "user2@mail.com", "rw");
    const user = await utils.getUser(data, "user2");
    //console.log(user)

    expect(user._projectsShare.length).toEqual(3);
    expect(user.projects.length).toEqual(3);

    const found = user.projects.find(project => project.projectId === "user1Project1");
    expect(found.permission).toEqual("rw");
  });

  it('should switch project from write share to read share', async () => {
    await utils.addProjects(data, "user1", 5, "rw", "user2")

    await projectAddShare("user1Project1", "user2@mail.com", "r");
    const user = await utils.getUser(data, "user2");

    expect(user._projectsShare.length).toEqual(5);
    expect(user.projects.length).toEqual(5);

    const found = user.projects.find(project => project.projectId === "user1Project1");
    expect(found.permission).toEqual("r");
  });
});
