"""Publish the lookup page and public award types to the existing certificate image CDN."""
import argparse
import json
import re
from pathlib import Path

import boto3
from botocore.exceptions import ClientError


def publish(stage):
    account = {'dev': '811668436784', 'prod': '409275337247'}[stage]
    session = boto3.Session(region_name='us-east-1')
    if session.client('sts').get_caller_identity()['Account'] != account:
        raise ValueError('Selected AWS account does not match the stage')
    s3 = session.client('s3')
    bucket = 'tca-certificate-generator-s3-' + stage
    awards = set()
    for page in s3.get_paginator('list_objects_v2').paginate(Bucket=bucket, Prefix='certificate/'):
        for obj in page.get('Contents', []):
            match = re.fullmatch(r'certificate/[^/]+/((?:freeCodeCamp|tca)/[a-z0-9-]+)\.jpg', obj['Key'])
            if match and not match[1].endswith('-large-container'):
                awards.add(match[1])
    if not awards:
        raise ValueError('No certificate images found')

    directory = Path(__file__).parent / 'archive'
    files = [
        ('awards.json', 'application/json', json.dumps(sorted(awards)).encode()),
        ('lookup.js', 'text/javascript; charset=utf-8', (directory / 'lookup.js').read_bytes()),
        ('index.html', 'text/html; charset=utf-8', (directory / 'index.html').read_bytes()),
    ]
    for name, content_type, content in files:
        key = 'archive/' + name
        try:
            existing = s3.get_object(Bucket=bucket, Key=key)
        except ClientError as error:
            if error.response['Error']['Code'] != 'NoSuchKey':
                raise
            condition = {'IfNoneMatch': '*'}
        else:
            if existing['Body'].read() == content:
                continue
            if existing['Metadata'].get('application') != 'academy-certificate-lookup':
                raise ValueError('Unexpected existing object at ' + key)
            condition = {'IfMatch': existing['ETag']}
        s3.put_object(Bucket=bucket, Key=key, Body=content, ContentType=content_type,
                      CacheControl='public, max-age=60', Metadata={'application': 'academy-certificate-lookup'},
                      **condition)
    print(f'Published {stage} lookup for {len(awards)} award types')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=['dev', 'prod'])
    publish(parser.parse_args().stage)
