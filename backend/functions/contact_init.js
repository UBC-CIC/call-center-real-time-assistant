/**********************************************************************************************************************
 *  Code used and modified from https://github.com/amazon-connect/amazon-connect-realtime-transcription                                                                                                 *
 **********************************************************************************************************************/

var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
const DYNAMODB_DOC_EXPIRY_HOURS = 6

/**
 * Lambda function that is triggered via Amazon Connect event when a call is made. This function
 * creates a DynamoDB entry for the call metadata (such as id, caller phone number, call date and time-to-live for the
 * DynamoDB document)
 */
exports.handler = (event, context, callback) => {
    console.log("Event From Amazon Connect: " + JSON.stringify(event));

    let customerPhoneNumber = event.Details.ContactData.CustomerEndpoint.Address;
    let contactId = event.Details.ContactData.ContactId;

    //Sets the timezone environment variable for the Lambda function to east coast. You can change this to your preferred timezone, or remove this line to use UTC
    process.env.TZ = "America/New_York";
    let tableName = process.env.table_name;
    let currentTimeStamp = new Date().toString();
    let currentDate = new Date().toLocaleDateString();
    let TTL = Math.round(Date.now() / 1000) + DYNAMODB_DOC_EXPIRY_HOURS * 3600;

    //set up the database query to be used to update the customer information record in DynamoDB
    var paramsUpdate = {
        TableName: tableName,
        Key: {
            "ContactId": contactId
        },

        ExpressionAttributeValues: {
            ":var1": customerPhoneNumber,
            ":var2": currentDate,
            ":var3": currentTimeStamp,
            ":var4": TTL
        },

        UpdateExpression: "SET customerPhoneNumber = :var1, callDate = :var2, callTimestamp = :var3, ExpiresOn = :var4"
    };

    //update the customer record in the database with the new call information using the paramsUpdate query we setup above:
    docClient.update(paramsUpdate, function (err, data) {
        if (err) {
            console.log("Unable to update item. Error: ", JSON.stringify(err, null, 2));
            //callback(null, buildResponse(false));
        } else console.log("Updated item succeeded!: ", JSON.stringify(data, null, 2));

    });

    //callback(null, buildResponse(true));
    getTempCredentials(callback, contactId);
};

/**
 * Helper function to build and return REST response
 */
function buildResponse(isSuccess, data) {
    if (isSuccess) {
        return {
            lambdaResult: "Success",
            aid:data.Credentials.AccessKeyId,
            sak:data.Credentials.SecretAccessKey,
            sst:data.Credentials.SessionToken
        };
    } else {
        console.log("Lambda returned error to Connect");
        return {
            lambdaResult: "Error",
            aid:'',
            sak:'',
            sst:''
        };
    }
}

/**
 * Creates temporary STS credentials
 * @param callback
 * @param contactId
 */
function getTempCredentials(callback, contactId){
    var params = {
        DurationSeconds: 900,
        ExternalId: "AI_Powered_SA_for_AC",
        RoleArn: process.env.assume_role,
        RoleSessionName: contactId
    };
    var sts = new AWS.STS();
    sts.assumeRole(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(null, buildResponse(false, err));
        }
        else{
            //console.log(data);           // successful response
            callback(null, buildResponse(true, data));
        }

    });

}
