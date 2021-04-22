import {Auth} from "aws-amplify";
import config from "../aws-exports"
import AWS from "aws-sdk";


export default async function invokeLambda(payload) {
    let credentials = await Auth.currentCredentials();
    let lambda = new AWS.Lambda({
        credentials: credentials,
        region: config.aws_project_region
    });
    let params = {
        //TODO Check if this can avoid being hardcoded
        FunctionName: 'indexer-dev',
        Payload: JSON.stringify(payload)
    };
    lambda.invoke(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else     console.log(data);
    });
}