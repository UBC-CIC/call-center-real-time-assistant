#!/usr/bin/env bash
# ./deploy.sh --existing-bucket-name <AWS_BUCKET_NAME> --aws-region <AWS_REGION> --aws-profile <AWS_PROFILE> --transcription-stack-name <TRANSCRIPTION_STACK_NAME> --assistant-stack-name <STACK_NAME>

cd deployment

aws s3 sync . s3://${existing-bucket-name}/deployment --region ${aws-region} --profile ${aws-profile}

cd ..

aws cloudformation deploy --capabilities CAPABILITY_IAM \
    --template ./template.yaml --stack-name ${stack-name} \
    --parameter-overrides audioFileTranscribeStack=${transcription-stack-name} existingS3BucketName=${existing-bucket-name} \
    --profile ${aws-profile} --region ${aws-region}
