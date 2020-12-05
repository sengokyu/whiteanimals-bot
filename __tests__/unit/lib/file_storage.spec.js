const FileStorage = require("../../../src/lib/file_storage");

const createPromise = (result) => new Promise((resolv) => resolv(result));

describe("FileStorage", () => {
  let dbx;
  let instance;

  beforeEach(() => {
    dbx = {
      filesListFolder: jest.fn(),
      filesListFolderContinue: jest.fn(),
      filesGetTemporaryLink: jest.fn(),
    };

    instance = new FileStorage(dbx);
  });

  it("filesListFolderを呼び出す", async () => {
    const res1 = {
      result: { entries: [], has_more: false },
    };

    dbx.filesListFolder.mockReturnValueOnce(createPromise(res1));

    const actual = await instance.pickUrl("test-path");

    expect(dbx.filesListFolder).toHaveBeenCalledWith({
      path: "test-path",
      recursive: true,
      include_media_info: false,
      include_deleted: false,
    });
    expect(dbx.filesListFolderContinue).not.toHaveBeenCalled();
    expect(dbx.filesGetTemporaryLink).not.toHaveBeenCalled();
    expect(actual).toBeNull();
  });

  it("続いてfilesListFolderContinueを呼び出す", async () => {
    const dummyCursor = {};
    const res1 = {
      result: { entries: [], has_more: true, cursor: dummyCursor },
    };
    const res2 = {
      result: { entries: [], has_more: false },
    };

    dbx.filesListFolder.mockReturnValueOnce(createPromise(res1));
    dbx.filesListFolderContinue.mockReturnValueOnce(createPromise(res2));

    const actual = await instance.pickUrl("test-path");

    expect(dbx.filesListFolder).toHaveBeenCalled();
    expect(dbx.filesListFolderContinue).toHaveBeenCalledWith({
      cursor: dummyCursor,
    });
    expect(dbx.filesGetTemporaryLink).not.toHaveBeenCalled();
    expect(actual).toBeNull();
  });

  it("filesGetTemporaryLinkが呼ばれる", async (done) => {
    const res1 = {
      result: { link: "http://hoge.example.com/" },
    };
    const res2 = {
      result: { entries: [{ path_lower: "hoge" }], has_more: false },
    };

    dbx.filesGetTemporaryLink.mockReturnValueOnce(createPromise(res1));
    dbx.filesListFolder.mockReturnValueOnce(createPromise(res2));

    const actual = instance.pickUrl("test-path");

    await expect(actual).resolves.toBe("http://hoge.example.com/");

    expect(dbx.filesGetTemporaryLink).toHaveBeenCalledWith({
      path: "hoge",
    });

    done();
  });

  it("filesListFolderContinueを再帰的に呼び出す", async () => {
    const dummyCursor1 = {};
    const dummyCursor2 = {};
    const res1 = {
      result: { entries: [], has_more: true, cursor: dummyCursor1 },
    };
    const res2 = {
      result: { entries: [], has_more: true, cursor: dummyCursor2 },
    };
    const res3 = {
      result: { entries: [], has_more: false },
    };

    dbx.filesListFolder.mockReturnValueOnce(createPromise(res1));
    dbx.filesListFolderContinue.mockReturnValueOnce(res2);
    dbx.filesListFolderContinue.mockReturnValueOnce(res3);

    const actual = await instance.pickUrl("test-path");

    expect(dbx.filesListFolder).toHaveBeenCalled();
    expect(dbx.filesListFolderContinue).toHaveBeenCalledTimes(2);
    expect(dbx.filesListFolderContinue).toHaveBeenCalledWith({
      cursor: dummyCursor1,
    });
    expect(dbx.filesListFolderContinue).toHaveBeenCalledWith({
      cursor: dummyCursor2,
    });
  });
});
