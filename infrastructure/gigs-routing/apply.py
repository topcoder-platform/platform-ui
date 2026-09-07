#!/usr/bin/env python3
"""Execute a reviewed Gigs change set after verifying its scope and current state.

Uses the configured AWS CLI session. Requires the directory created by prepare.py
and the name of an already-created CloudFormation change set. Does not deploy UI
code or wait for propagation; follow the runbook for release order and verification.
"""
import argparse
import json
from pathlib import Path
import subprocess

from prepare import aws


ALLOWED_CHANGES = {
    'GigsOriginAccessControl': 'Add',
    'GigsViewerRequestFunction': 'Add',
    'WebsiteDistribution': 'Modify',
    # Derived from the distribution; CloudFormation recalculates this parameter.
    'DistributionDomainDeployParameter': 'Modify',
}


def apply(directory, changeset):
    """Grant private shell access and execute a reviewed, unchanged Gigs plan.

    directory contains prepare.py artifacts; changeset identifies the pending
    change. Raises on credential mismatch, stale state, unexpected resource edits,
    replacements, or failed CLI commands. Rolls back the policy if execution fails.
    """
    manifest = json.loads((directory / 'manifest.json').read_text())
    before = json.loads((directory / 'bucket-policy-before.json').read_text())
    after = json.loads((directory / 'bucket-policy-after.json').read_text())
    if aws('sts', 'get-caller-identity')['Account'] != manifest['account']:
        raise ValueError('AWS session does not match the prepared account')
    current_stack = aws('cloudformation', 'describe-stacks', '--stack-name', manifest['stack'])['Stacks'][0]
    updated = str(current_stack.get('LastUpdatedTime', current_stack['CreationTime']))
    if updated != manifest['stackLastUpdated']:
        raise ValueError('The website stack changed; prepare and review a new plan')
    change = aws('cloudformation', 'describe-change-set', '--stack-name', manifest['stack'], '--change-set-name', changeset)
    if change['Status'] != 'CREATE_COMPLETE' or change['ExecutionStatus'] != 'AVAILABLE':
        raise ValueError('Change set is not ready to execute')
    for item in change.get('Changes', []):
        resource = item['ResourceChange']
        if ALLOWED_CHANGES.get(resource['LogicalResourceId']) != resource['Action']:
            raise ValueError('Unexpected change: ' + resource['LogicalResourceId'])
        if resource.get('Replacement') not in (None, 'False'):
            raise ValueError('Resource replacement is not allowed')
    current_policy = json.loads(aws('s3api', 'get-bucket-policy', '--bucket', manifest['platformBucket'])['Policy'])
    if current_policy != before:
        raise ValueError('Bucket policy changed; prepare and review a new plan')
    subprocess.run(['aws', 's3api', 'put-bucket-policy', '--bucket', manifest['platformBucket'],
                    '--policy', 'file://' + str((directory / 'bucket-policy-after.json').resolve())], check=True)
    try:
        subprocess.run(['aws', 'cloudformation', 'execute-change-set', '--stack-name', manifest['stack'],
                        '--change-set-name', changeset], check=True)
    except subprocess.CalledProcessError:
        latest_policy = json.loads(aws('s3api', 'get-bucket-policy', '--bucket', manifest['platformBucket'])['Policy'])
        if latest_policy == after:
            subprocess.run(['aws', 's3api', 'put-bucket-policy', '--bucket', manifest['platformBucket'],
                            '--policy', 'file://' + str((directory / 'bucket-policy-before.json').resolve())], check=True)
        raise
    print(json.dumps({'status': 'UPDATE_STARTED', 'stack': manifest['stack'], 'distribution': manifest['websiteDistribution']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifacts', required=True, type=Path)
    parser.add_argument('--changeset', required=True)
    args = parser.parse_args()
    apply(args.artifacts, args.changeset)
