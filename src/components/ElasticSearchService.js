import {Endpoint, HttpRequest, Signer} from "aws-sdk";
import {Auth} from "aws-amplify";

const region = 'us-west-2';
const domain = 'search-transcript-indexer-zumaoft7xahmz2i7b4nxtqr6ge.us-west-2.es.amazonaws.com';
const index = 'transcripts';
const type = '_doc';


export default async function indexDocument(contactId, document) {
    let endpoint = new Endpoint(domain);
    let request = new HttpRequest(endpoint, region);

    request.method = 'PUT';
    request.path += index + '/' + type + '/' + contactId;
    request.body = JSON.stringify(document);
    request.headers['host'] = domain;
    request.headers['Content-Type'] = 'application/json';
    // Content-Length is only needed for DELETE requests that include a request
    // body, but including it for all requests doesn't seem to hurt anything.
    // request.headers['Content-Length'] = Buffer.byteLength(request.body);

    var credentials = await Auth.currentCredentials();
    var signer = new Signer.V4(request, 'es');
    signer.addAuthorization(credentials, new Date());

    // var client = new AWS.HttpClient();
    // client.handleRequest(request, null, function(response) {
    //     console.log(response.statusCode + ' ' + response.statusMessage);
    //     var responseBody = '';
    //     response.on('data', function (chunk) {
    //         responseBody += chunk;
    //     });
    //     response.on('end', function (chunk) {
    //         console.log('Response body: ' + responseBody);
    //     });
    // }, function(error) {
    //     console.log('Error: ' + error);
    // });
}