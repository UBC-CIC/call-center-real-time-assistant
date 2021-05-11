:: deploy.bat existing-bucket-name:<AWS_BUCKET_NAME> aws-region:<AWS_REGION> aws-profile:<AWS_PROFILE> transcription-stack-name:<TRANSCRIPTION_STACK_NAME> stack-name:<STACK_NAME>
@echo off
SET tempvar1=%~1
SET tempvar2=%~2
SET tempvar3=%~3
SET tempvar4=%~4
SET tempvar5=%~5
SET existing-bucket-name=%tempvar1:~21,250%
SET aws-region=%tempvar2:~11,250%
SET aws-profile=%tempvar3:~12,250%
SET transcription-stack-name=%tempvar4:~25,250%
SET stack-name=%tempvar5:~11,250%

CALL cd deployment

CALL aws s3 sync . s3://%existing-bucket-name%/deployment --region %aws-region% --profile %aws-profile%

CALL cd ..

CALL aws cloudformation deploy --capabilities CAPABILITY_IAM --template ./template.yaml --stack-name %stack-name% ^
--parameter-overrides audioFileTranscribeStack=%transcription-stack-name% existingS3BucketName=%existing-bucket-name% ^
--profile %aws-profile% --region %aws-region%
