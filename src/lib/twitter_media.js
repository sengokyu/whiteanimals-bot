class TwitterMedia {
    constructor(client) {
        this._client = client;
    }

    init(media) {
        return this._makePost({
            command: 'INIT',
            media_type: media.type,
            total_bytes: media.size
        }).then(data => {
            media.id = data.media_id_string;
            return media;
        });
    }

    append(media) {
        return this._makePost({
            command: 'APPEND',
            media_id: media.id,
            media: media.buf,
            segment_index: 0
        }).then(() => media);
    }

    finalize(media) {
        return this._makePost({
            command: 'FINALIZE',
            media_id: media.id
        }).then(() => media);
    }

    _makePost(params) {
        return new Promise((resolv, reject) => {
            this._client.post(
                'media/upload',
                params,
                (error, data, response) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolv(data);
                    }
                }
            );
        });
    }
}

module.exports = TwitterMedia;
