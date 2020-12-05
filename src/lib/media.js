class Media {
  constructor(contentType, buf) {
    this._contentType = contentType;
    this._buf = buf;
    this._id = "";
  }

  get type() {
    return this._contentType;
  }

  get buf() {
    return this._buf;
  }

  get size() {
    return this._buf.length;
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = value;
  }
}

module.exports = Media;
