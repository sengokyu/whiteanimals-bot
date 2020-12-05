const lambda = require("../../../src/handlers/get-and-post");

describe("lambdaHandler", () => {
  it("defined", () => {
    expect(lambda.lambdaHandler).toBeTruthy();
  });
});
