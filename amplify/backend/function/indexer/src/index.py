from __future__ import print_function

import boto3
import os
from elasticsearch import Elasticsearch, RequestsHttpConnection
import logging
from requests_aws4auth import AWS4Auth

# Log level
logging.basicConfig()
LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

# Get environment variables and setup ES variables
REGION = os.getenv("REGION")
ES_DOMAIN = os.getenv("ES_DOMAIN")
ES_INDEX = "transcripts"
ES_CLIENT = boto3.client('es')
response = ES_CLIENT.describe_elasticsearch_domain(DomainName=ES_DOMAIN)
ES_ENDPOINT = response['DomainStatus']['Endpoint']

# Create AWS auth tool
CREDENTIALS = boto3.Session().get_credentials()
AWS_AUTH = AWS4Auth(CREDENTIALS.access_key,
                    CREDENTIALS.secret_key,
                    REGION, "es",
                    session_token=CREDENTIALS.token)

# Create elasticsearch connection client
try:
    ES_CLIENT = Elasticsearch(
        hosts=[{'host': ES_ENDPOINT, 'port': 443}],
        http_auth=AWS_AUTH,
        use_ssl=True,
        verify_certs=True,
        timeout=120,
        connection_class=RequestsHttpConnection
    )
except Exception as err:
    print("Unable to connect to ElasticSearch")
    print(err)


def index_transcript(document):
    """
    Indexes passed in data to Elasticsearch
    :param document: Document to index into Elasticsearch
    :return: The HTTP response of the index operation
    """
    res = ES_CLIENT.index(index=ES_INDEX, body=document, id=document['contactId'])
    return res


def handler(event, context):
    print('received event:')
    print(event)
    return index_transcript(event)
