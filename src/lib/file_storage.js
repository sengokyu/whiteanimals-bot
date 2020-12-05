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
    const result = response.result;

    if (result.has_more) {
      result.entries.concat(await this._listEntriesContinue(result.cursor));
    }

    return result.entries;
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
    const result = response.result;

    if (result.has_more) {
      result.entries.concat(await this._listEntriesContinue(result.cursor));
    }

    return result.entries;
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

  async _selectRandomOne(entries) {
    const index = await this._random(entries.length);

    return entries[index].path_lower;
  }

  async pickUrl(dirPath) {
    const entries = await this._listEntries(dirPath);

    if (entries.length === 0) {
      return null;
    }

    const path = await this._selectRandomOne(entries);
    const response = await this._dbx.filesGetTemporaryLink({ path });

    return response.result.link;
  }
}

module.exports = FileStorage;
