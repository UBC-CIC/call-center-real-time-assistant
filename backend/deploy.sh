#!/usr/bin/env bash
# ./deploy.sh --existing-bucket-name <AWS_BUCKET_NAME> --aws-region <AWS_REGION> --aws-profile <AWS_PROFILE> --transcription-stack-name <TRANSCRIPTION_STACK_NAME> --assistant-stack-name <STACK_NAME>

bucketName=${2}
awsRegion=${4}
awsProfile=${6}
oldStackName=${8}
stackName=${10}

cd deployment

aws s3 sync . s3://${bucketName}/deployment --region ${awsRegion} --profile ${awsProfile}

cd ..

aws cloudformation deploy --capabilities CAPABILITY_IAM \
    --template ./template.yaml --stack-name ${stackName} \
    --parameter-overrides audioFileTranscribeStack=${oldStackName} existingS3BucketName=${bucketName} \
    --profile ${awsProfile} --region ${awsRegion}
