#!/usr/bin/env python3
"""Prepare a reviewable Gigs CloudFormation change and a narrow bucket-policy grant.

Uses the configured AWS CLI session without reading or writing credentials. This
command is read-only in AWS: output consists of local artifacts and a manifest.
Requires PyYAML for parsing CloudFormation's intrinsic YAML tags.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess

import yaml


class CloudFormationLoader(yaml.SafeLoader):
    """Parse CloudFormation YAML intrinsics as their JSON equivalents."""


def intrinsic(loader, tag, node):
    """Convert one scalar, list, or mapping intrinsic to CloudFormation JSON."""
    if isinstance(node, yaml.ScalarNode):
        value = loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    else:
        value = loader.construct_mapping(node)
    return {tag if tag in ('Ref', 'Condition') else 'Fn::' + tag: value}


CloudFormationLoader.add_multi_constructor('!', intrinsic)


def aws(*args):
    """Run a read-only AWS CLI request; return JSON or raise on command failure."""
    return json.loads(subprocess.check_output(['aws', *args, '--output', 'json'], text=True))


def prepare(stack_name, platform_distribution, directory):
    """Write current/proposed templates and policies for an existing website stack.

    Returns an artifact manifest. Raises on nonterminal stack state, unexpected
    origins, aliases, or policy conflicts. Preserves all existing policy grants.
    """
    directory.mkdir(parents=True, exist_ok=False)
    stack = aws('cloudformation', 'describe-stacks', '--stack-name', stack_name)['Stacks'][0]
    if stack['StackStatus'] not in ('CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'):
        raise ValueError('Website stack is not stable: ' + stack['StackStatus'])
    template_body = aws('cloudformation', 'get-template', '--stack-name', stack_name)['TemplateBody']
    template = yaml.load(template_body, Loader=CloudFormationLoader) if isinstance(template_body, str) else template_body
    website = aws('cloudformation', 'describe-stack-resource', '--stack-name', stack_name,
                  '--logical-resource-id', 'WebsiteDistribution')['StackResourceDetail']['PhysicalResourceId']
    platform = aws('cloudfront', 'get-distribution-config', '--id', platform_distribution)['DistributionConfig']
    origin_id = platform['DefaultCacheBehavior']['TargetOriginId']
    origin = next(item for item in platform['Origins']['Items'] if item['Id'] == origin_id)
    if 'S3OriginConfig' not in origin or origin.get('OriginPath'):
        raise ValueError('Expected an unprefixed platform-ui S3 origin')
    bucket = origin['DomainName'].split('.s3.')[0]
    identity = aws('sts', 'get-caller-identity')
    params = {item['ParameterKey']: item['ParameterValue'] for item in stack['Parameters']}
    if 'platform-ui.' + params['ApexDomainName'] not in platform['Aliases']['Items']:
        raise ValueError('Platform distribution and website environment do not match')
    spec = importlib.util.spec_from_file_location('route_template', Path(__file__).with_name('route-template.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    proposed = module.add_gigs_routes(template, bucket)
    policy = json.loads(aws('s3api', 'get-bucket-policy', '--bucket', bucket)['Policy'])
    grant = {
        'Sid': 'AllowWebsiteGigsShell',
        'Effect': 'Allow',
        'Principal': {'Service': 'cloudfront.amazonaws.com'},
        'Action': 's3:GetObject',
        'Resource': f'arn:aws:s3:::{bucket}/index.html',
        'Condition': {'StringEquals': {'AWS:SourceArn': f'arn:aws:cloudfront::{identity["Account"]}:distribution/{website}'}},
    }
    next_policy = json.loads(json.dumps(policy))
    existing = next((item for item in policy['Statement'] if item.get('Sid') == grant['Sid']), None)
    if existing and existing != grant:
        raise ValueError('Conflicting Gigs shell policy grant')
    if not existing:
        next_policy['Statement'].append(grant)
    artifacts = {
        'template-before.json': template,
        'template-after.json': proposed,
        'bucket-policy-before.json': policy,
        'bucket-policy-after.json': next_policy,
        'parameters.json': [{'ParameterKey': key, 'UsePreviousValue': True} for key in params],
    }
    for filename, value in artifacts.items():
        (directory / filename).write_text(json.dumps(value, indent=2) + '\n')
    manifest = {
        'account': identity['Account'], 'stack': stack_name, 'websiteDistribution': website,
        'platformDistribution': platform_distribution, 'platformBucket': bucket,
        'apex': params['ApexDomainName'], 'stackLastUpdated': str(stack.get('LastUpdatedTime', stack['CreationTime'])),
    }
    (directory / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stack', required=True)
    parser.add_argument('--platform-distribution', required=True)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(prepare(args.stack, args.platform_distribution, args.output), indent=2))
