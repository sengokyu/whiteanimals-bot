const AWS = require("aws-sdk");
const Fetch = require("node-fetch");
const Dropbox = require("dropbox").Dropbox;
const Twitter = require("twitter");
const FileStorage = require("../lib/file_storage");
const fetchWrapper = require("../lib/fetch_wrapper");
const TwitterMedia = require("../lib/twitter_media");
const TwitterStatuses = require("../lib/twitter_statuses");
const AWS_REGION = process.env.AWS_REGION;
const SECRET_NAME = "prod/WhiteAnimalsBot";

const retrieveSecrets = function () {
  return new Promise((resolv, reject) => {
    const client = new AWS.SecretsManager({
      region: AWS_REGION,
    });

    client.getSecretValue({ SecretId: SECRET_NAME }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        if ("SecretString" in data) {
          resolv(JSON.parse(data.SecretString));
        } else {
          reject(data);
        }
      }
    });
  });
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 * @param {string} event.resource - Resource path.
 * @param {string} event.path - Path parameter.
 * @param {string} event.httpMethod - Incoming request's method name.
 * @param {Object} event.headers - Incoming request headers.
 * @param {Object} event.queryStringParameters - query string parameters.
 * @param {Object} event.pathParameters - path parameters.
 * @param {Object} event.stageVariables - Applicable stage variables.
 * @param {Object} event.requestContext - Request context, including authorizer-returned key-value pairs, requestId, sourceIp, etc.
 * @param {Object} event.body - A JSON string of the request payload.
 * @param {boolean} event.body.isBase64Encoded - A boolean flag to indicate if the applicable request payload is Base64-encode
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 * @param {string} context.logGroupName - Cloudwatch Log Group name
 * @param {string} context.logStreamName - Cloudwatch Log stream name.
 * @param {string} context.functionName - Lambda function name.
 * @param {string} context.memoryLimitInMB - Function memory.
 * @param {string} context.functionVersion - Function version identifier.
 * @param {function} context.getRemainingTimeInMillis - Time in milliseconds before function times out.
 * @param {string} context.awsRequestId - Lambda request ID.
 * @param {string} context.invokedFunctionArn - Function ARN.
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * @returns {boolean} object.isBase64Encoded - A boolean flag to indicate if the applicable payload is Base64-encode (binary support)
 * @returns {string} object.statusCode - HTTP Status Code to be returned to the client
 * @returns {Object} object.headers - HTTP Headers to be returned
 * @returns {Object} object.body - JSON Payload to be returned
 *
 */
exports.lambdaHandler = async (event, context) => {
  const secrets = await retrieveSecrets();

  const DbxPath = "";
  const dbx = new Dropbox({
    accessToken: secrets.DROPBOX_ACCESS_TOKEN,
    fetch: Fetch,
  });
  const client = new Twitter({
    consumer_key: secrets.TWITTER_CONSUMER_KEY,
    consumer_secret: secrets.TWITTER_CONSUMER_SECRET,
    access_token_key: secrets.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: secrets.TWITTER_ACCESS_TOKEN_SECRET,
  });
  const fileStorage = new FileStorage(dbx);
  const twiMedia = new TwitterMedia(client);
  const twiStatuses = new TwitterStatuses(client);

  await fileStorage
    .pickUrl(DbxPath)
    .then((url) => fetchWrapper(Fetch, url))
    .then((media) => twiMedia.init(media))
    .then((media) => twiMedia.append(media))
    .then((media) => twiMedia.finalize(media))
    .then((media) => twiStatuses.update(media))
    .catch(console.error);
};
