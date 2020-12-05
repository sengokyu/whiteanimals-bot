const TwitterMedia = require("../../../src/lib/twitter_media");
const Media = require("../../../src/lib/media");

describe("Twitter Media", () => {
  client = null;
  instance = null;

  beforeEach(() => {
    client = {
      post: jest.fn(),
    };
    instance = new TwitterMedia(client);
  });

  it("INITを呼ぶ", () => {
    const media = new Media("image/jpeg", Buffer.alloc(1000));

    instance.init(media);

    expect(client.post).toHaveBeenCalledWith(
      "media/upload",
      {
        command: "INIT",
        media_type: "image/jpeg",
        total_bytes: 1000,
      },
      expect.any(Function)
    );
  });

  it("FINALIZEを呼ぶ", () => {
    const media = new Media("image/jpeg", Buffer.alloc(10));
    media.id = "DUMMY";
    instance.finalize(media);

    expect(client.post).toHaveBeenCalledWith(
      "media/upload",
      {
        command: "FINALIZE",
        media_id: "DUMMY",
      },
      expect.any(Function)
    );
  });
});
