const Media = require('../../../src/lib/media');
const TwitterStatuses = require('../../../src/lib/twitter_statuses');

describe('Twitter Statuses', () => {
    client = null;
    instance = null;

    beforeEach(() => {
        client = {
            'post': jest.fn()
        };
        instance = new TwitterStatuses(client);
    });

    it('update status', () => {
        const media = new Media('image/jpeg', Buffer.alloc(1000));
        media.id = 'DUMMY';

        instance.update(media);

        expect(client.post).toHaveBeenCalledWith('statuses/update', {
            status:
                'These images are not mine. Please let me know if any of these are yours. I will delete them ASAP.',
            media_ids: 'DUMMY'
        });
    });
});
