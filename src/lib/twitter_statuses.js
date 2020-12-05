class TwitterStatuses {
    constructor(client) {
        this._client = client;
    }

    update(media) {
        return this._client.post('statuses/update', {
            status: 'These images are not mine. Please let me know if any of these are yours. I will delete them ASAP.',
            media_ids: media.id
        });
    }
}

module.exports = TwitterStatuses;
