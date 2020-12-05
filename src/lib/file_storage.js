const crypto = require("crypto");

/**
 *  Dropboxの特定パス内から、一時URLを一件取り出します。
 */
class FileStorage {
  /**
   *
   * @param {Dropbox} dbx
   */
  constructor(dbx, limit) {
    this._dbx = dbx;
    this._limit = limit;
  }

  async _listEntriesContinue(cursor) {
    const response = await this._dbx.filesListFolderContinue({
      cursor: cursor,
    });

    if (response.has_more) {
      response.entries.concat(await this._listEntriesContinue(response.cursor));
    }

    return response.entries;
  }

  async _listEntries(path) {
    const params = {
      path: path,
      recursive: true,
      include_media_info: false,
      include_deleted: false,
    };

    if (this._limit) {
      params.limit = this._limit;
    }

    const response = await this._dbx.filesListFolder(params);

    if (response.has_more) {
      response.entries.concat(await this._listEntriesContinue(response.cursor));
    }

    return response.entries;
  }

  _random(max) {
    return new Promise((resolv, reject) => {
      crypto.randomBytes(4, (err, buf) => {
        if (err) {
          reject(err);
        }

        const num = buf.readUInt32LE();

        resolv(num % max);
      });
    });
  }

  async pickUrl(path) {
    const entries = await this._listEntries(path);

    if (entries.length === 0) {
      return null;
    }

    const index = await this._random(entries.length);

    return this._dbx
      .filesGetTemporaryLink({
        path: entries[index].path_lower,
      })
      .then((result) => result.link);
  }
}

module.exports = FileStorage;
