// --------------------------------
//  Test for projectGetShare
// --------------------------------
const utils = require('../testUtils.js');
const projectGetShare = require('./source.js');

describe('insert', () => {
  let data;

  beforeAll(async () => {
      data = await utils.init("getShare");
  });

  afterAll(async () => {
      await utils.destroy(data)
  });

  beforeEach(async () => {
      await utils.buildUsers(data, 3);
      await utils.setGlobalUser(data, "user1")
  });

  // ---------------------------------------
  //  Tests
  // ---------------------------------------

  it('should not return projects', async () => {
      const result = await projectGetShare();
      expect(result.length).toEqual(0);
  });

  it('should return many projects', async () => {
      await utils.addProjects(data, "user1", 3, "r", "user2")
      await utils.addProjects(data, "user1", 5, "rw", "user3")

      // Refresh global user
      await utils.setGlobalUser(data, "user1")

      // console.log(context.user.custom_data)
      // console.log(await utils.getUser(data, "user2"))
      // console.log(await utils.getUser(data, "user3"))

      const result = await projectGetShare("user1Project1");
      // console.log(result)

      expect(result.length).toEqual(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('projectId');
      expect(result[0]).toHaveProperty('permission');
      expect(result[0].name).toEqual("user2@mail.com");
      expect(result[0].projectId).toEqual("user1Project1");
      expect(result[1].name).toEqual("user3@mail.com");
      expect(result[1].projectId).toEqual("user1Project1");
  });
});
