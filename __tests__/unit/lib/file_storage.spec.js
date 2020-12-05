const FileStorage = require('../../../src/lib/file_storage');

describe('FileStorage', () => {
    let dbx;
    let instance;

    beforeEach(() => {
        dbx = {
            filesListFolder:jest.fn(),
            filesListFolderContinue:jest.fn(),
            filesGetTemporaryLink:jest.fn()
        };

        instance = new FileStorage(dbx);
    });

    it('filesListFolderを呼び出す', async () => {
        dbx.filesListFolder.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [], has_more: false });
            })
        );

        const actual = await instance.pickUrl('test-path');

        expect(dbx.filesListFolder).toHaveBeenCalledWith({
            path: 'test-path',
            recursive: true,
            include_media_info: false,
            include_deleted: false
        });
        expect(dbx.filesListFolderContinue).not.toHaveBeenCalled();
        expect(dbx.filesGetTemporaryLink).not.toHaveBeenCalled();
        expect(actual).toBeNull();
    });

    it('続いてfilesListFolderContinueを呼び出す', async () => {
        const dummyCursor = {};

        dbx.filesListFolder.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [], has_more: true, cursor: dummyCursor });
            })
        );

        dbx.filesListFolderContinue.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [], has_more: false });
            })
        );

        const actual = await instance.pickUrl('test-path');

        expect(dbx.filesListFolder).toHaveBeenCalled();
        expect(dbx.filesListFolderContinue).toHaveBeenCalledWith({
            cursor: dummyCursor
        });
        expect(dbx.filesGetTemporaryLink).not.toHaveBeenCalled();
        expect(actual).toBeNull();
    });

    it('filesGetTemporaryLinkが呼ばれる', async done => {
        dbx.filesGetTemporaryLink.mockReturnValueOnce(
            new Promise(resolv => resolv({ link: 'http://hoge.example.com/' }))
        );
        dbx.filesListFolder.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [{ path_lower: 'hoge' }], has_more: false });
            })
        );

        const actual = instance.pickUrl('test-path');

        await expect(actual).resolves.toBe('http://hoge.example.com/');

        expect(dbx.filesGetTemporaryLink).toHaveBeenCalledWith({
            path: 'hoge'
        });

        done();
    });

    it('filesListFolderContinueを再帰的に呼び出す', async () => {
        const dummyCursor1 = {};
        const dummyCursor2 = {};

        dbx.filesListFolder.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [], has_more: true, cursor: dummyCursor1 });
            })
        );

        dbx.filesListFolderContinue.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [], has_more: true, cursor: dummyCursor2 });
            }));
        dbx.filesListFolderContinue.mockReturnValueOnce(
            new Promise(resolv => {
                resolv({ entries: [], has_more: false });
            })
        );

        const actual = await instance.pickUrl('test-path');

        expect(dbx.filesListFolder).toHaveBeenCalled();
        expect(dbx.filesListFolderContinue).toHaveBeenCalledTimes(2);
        expect(dbx.filesListFolderContinue).toHaveBeenCalledWith({
            cursor: dummyCursor1
        });
        expect(dbx.filesListFolderContinue).toHaveBeenCalledWith({
            cursor: dummyCursor2
        });
    });
});
