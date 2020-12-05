const stream = require('stream');
const Media = require('./media');

function FetchWrapper(fetch, url) {
    const nullTransform = new stream.Transform({
        transform(chunk, encoding, callback) {
            callback(null, chunk);
        }
    });

    return new Promise((resolv, reject) => {
        fetch(url).then(response => {
            const contentType = response.headers.get('Content-Type');
            const bufs = [];

            response.body.pipe(nullTransform);

            nullTransform.on('data', chunk => bufs.push(chunk));
            nullTransform.on('end', () =>
                resolv(new Media(contentType, Buffer.concat(bufs)))
            );
            nullTransform.on('error', error => reject(error));
        });
    });
}

module.exports = FetchWrapper;
