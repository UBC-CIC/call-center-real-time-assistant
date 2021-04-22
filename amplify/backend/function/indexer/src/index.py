from __future__ import print_function

import boto3
import certifi
import json
import os
from aws_requests_auth.aws_auth import AWSRequestsAuth
from elasticsearch import Elasticsearch, RequestsHttpConnection
import logging
import time

# Log level
logging.basicConfig()
LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

# Parameters
REGION = os.getenv("REGION")
# TODO Get this from SSM here ot pass it into cloudformation template through SSM
ES_ENDPOINT = os.getenv("ES_DOMAIN")
ES_INDEX = "transcripts"

# Create the auth token for the sigv4 signature
SESSION = boto3.session.Session()
CREDENTIALS = SESSION.get_credentials().get_frozen_credentials()
AWS_AUTH = AWSRequestsAuth(
    aws_access_key=CREDENTIALS.access_key,
    aws_secret_access_key=CREDENTIALS.secret_key,
    aws_token=CREDENTIALS.token,
    aws_host=ES_ENDPOINT,
    aws_region=REGION,
    aws_service='es'
)

# Connect to the elasticsearch cluster using aws authentication. The lambda function
# must have access in an IAM policy to the ES cluster.
ES_CLIENT = Elasticsearch(
    hosts=[{'host': ES_ENDPOINT, 'port': 443}],
    http_auth=AWS_AUTH,
    use_ssl=True,
    verify_certs=True,
    ca_certs=certifi.where(),
    timeout=120,
    connection_class=RequestsHttpConnection
)


def index_transcript(event):
    res = ES_CLIENT.index(index=ES_INDEX, body=event, id=event['contactId'])
    return res



def handler(event, context):
    print('received event:')
    print(event)

    return index_transcript(event)

