#!/usr/bin/env python3
"""Build and release Platform UI with branch-bound OIDC and no parameter access."""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from urllib.request import Request, urlopen

sys.path.insert(0, '/tmp/tc-deploy-scripts')
import tcdeploy as d

PUBLIC_VARIABLES = frozenset({
    'REACT_APP_UPLOADS_API_URL',
    'REACT_APP_HOST_ENV', 'REACT_APP_PAYLOAD_CMS_DEFAULT_ACCESS_TOKEN',
    'REACT_APP_PAYLOAD_CMS_EDU_ACCESS_TOKEN', 'REACT_APP_MEMBER_VERIFY_LOOKER',
    'REACT_APP_SPRIG_ENV_ID', 'REACT_APP_RESTRICT_TALENT_SEARCH',
    'REACT_APP_ENABLE_EMSI_SKILLS', 'REACT_APP_ENABLE_TCA_CERT_MONETIZATION',
})
REQUIRED_VARIABLES = PUBLIC_VARIABLES - {
    'REACT_APP_UPLOADS_API_URL',
    'REACT_APP_MEMBER_VERIFY_LOOKER', 'REACT_APP_SPRIG_ENV_ID',
    'REACT_APP_RESTRICT_TALENT_SEARCH', 'REACT_APP_ENABLE_EMSI_SKILLS',
    'REACT_APP_ENABLE_TCA_CERT_MONETIZATION',
}
NO_CACHE = 'no-cache,no-store,max-age=0'
OPERATIONS = {
    'sts': {'get-caller-identity'},
    's3api': {'get-object', 'head-object', 'put-object', 'get-bucket-versioning'},
    'cloudfront': {'get-distribution', 'create-invalidation', 'get-invalidation'},
}


def read_manifest(path):
    m = json.loads(Path(path).read_text(), object_pairs_hook=d.unique_object)
    expected = {'schemaVersion', 'environment', 'branch', 'region', 'accountId',
                'repository', 'circleciOrgId', 'circleciProjectId', 'buildRoleArn',
                'deployRoleArn', 'bucket', 'distributionId', 'publicUrl', 'buildConfig'}
    d.require(set(m) == expected and m['schemaVersion'] == 1, 'Invalid site manifest')
    env = m['environment']
    d.require(env in ('dev', 'prod') and m['branch'] == {'dev': 'dev', 'prod': 'master'}[env],
              'Expected dev branch for development or master branch for production')
    account = {'dev': '811668436784', 'prod': '409275337247'}[env]
    d.require(m['accountId'] == account and m['region'] == 'us-east-1', 'Wrong AWS target')
    d.require(m['repository'] == 'github.com/topcoder-platform/platform-ui', 'Wrong repository')
    d.require(m['circleciOrgId'] == '947bef5e-1669-415d-b83c-4fc85155b7df' and
              m['circleciProjectId'] == '444cff42-4443-4f44-a0df-29da98e46ed3', 'Wrong CircleCI project')
    for phase in ('build', 'deploy'):
        d.require(m[phase + 'RoleArn'] == f'arn:aws:iam::{account}:role/platform-ui-{env}-{phase}', 'Wrong role')
    suffix = '-dev' if env == 'dev' else ''
    d.require(m['bucket'] == f'platform-mvp.topcoder{suffix}.com' and
              m['publicUrl'] == f'https://platform-ui.topcoder{suffix}.com', 'Wrong site target')
    d.require(m['distributionId'] == {'dev': 'EFA7R1KH3UX5M', 'prod': 'EE83GX7FG0PB8'}[env], 'Wrong distribution')
    c = m['buildConfig']
    d.require(set(c) == {'bucket', 'key', 'versionId', 'sha256'} and
              c['bucket'] == 'tc-platform-' + env and c['key'] == f'deployment/platform-ui/{env}-browser-config.json' and
              isinstance(c['versionId'], str) and c['versionId'] not in ('', 'null') and
              re.fullmatch(r'[a-f0-9]{64}', c['sha256']), 'Invalid versioned browser config')
    return m


def check_job(m):
    d.require(os.environ.get('CIRCLE_BRANCH') == m['branch'] and not os.environ.get('CIRCLE_TAG'), 'Wrong deployment branch or tag')
    d.require(os.environ.get('CIRCLE_PROJECT_USERNAME') == 'topcoder-platform' and
              os.environ.get('CIRCLE_PROJECT_REPONAME') == 'platform-ui', 'Wrong CircleCI repository')
    sha = os.environ.get('CIRCLE_SHA1', '')
    d.require(re.fullmatch(r'[a-f0-9]{40}', sha), 'Invalid source revision')
    actual = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    d.require(actual == sha, 'Checkout differs from pipeline revision')
    return sha


def policy(m, phase):
    statements = [
        {'Effect': 'Deny', 'Action': ['ssm:*', 'secretsmanager:*', 'kms:Decrypt', 'sts:AssumeRole*',
                                     's3:DeleteObject', 's3:DeleteObjectVersion'], 'Resource': '*'},
        {'Effect': 'Allow', 'Action': 'sts:GetCallerIdentity', 'Resource': '*'},
    ]
    if phase == 'build':
        c = m['buildConfig']
        statements.append({'Effect': 'Allow', 'Action': 's3:GetObjectVersion',
                           'Resource': f'arn:aws:s3:::{c["bucket"]}/{c["key"]}',
                           'Condition': {'StringEquals': {'s3:VersionId': c['versionId']}}})
    else:
        statements += [
            {'Effect': 'Allow', 'Action': ['s3:ListBucket', 's3:GetBucketLocation', 's3:GetBucketVersioning'],
             'Resource': 'arn:aws:s3:::' + m['bucket']},
            {'Effect': 'Allow', 'Action': ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject', 's3:AbortMultipartUpload'],
             'Resource': 'arn:aws:s3:::' + m['bucket'] + '/*'},
            {'Effect': 'Allow', 'Action': ['cloudfront:GetDistribution', 'cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
             'Resource': f'arn:aws:cloudfront::{m["accountId"]}:distribution/{m["distributionId"]}'},
        ]
    result = {'Version': '2012-10-17', 'Statement': statements}
    d.require(len(d.compact(result)) <= 2048, 'Session policy exceeds STS limit')
    return result


class SiteAWS:
    def __init__(self, env):
        self.env = env

    def call(self, service, operation, extra=(), **parameters):
        d.require(operation in OPERATIONS.get(service, set()), 'Unreviewed AWS operation')
        command = ['aws', service, operation, '--region', 'us-east-1', '--output', 'json', '--no-cli-pager']
        input_text = d.compact(parameters)
        if service == 's3api' and operation == 'get-object':
            # The CLI streaming download does not support cli-input-json.
            # Only reviewed, public object coordinates may enter its argv.
            d.require({'Bucket', 'Key'} <= set(parameters) <= {'Bucket', 'Key', 'VersionId'},
                      'Unreviewed S3 download parameters')
            for name, option in (('Bucket', '--bucket'), ('Key', '--key'), ('VersionId', '--version-id')):
                if name in parameters:
                    command.extend((option, parameters[name]))
            input_text = None
        else:
            command.extend(('--cli-input-json', 'file:///dev/stdin'))
        command.extend(extra)
        result = d.execute(command, self.env, input_text)
        return json.loads(result) if result.strip() else {}

    def sync(self, root, bucket, patterns, cache):
        # Separate asset upload from entry-point promotion; never delete old assets.
        d.execute(['aws', 's3', 'sync', str(root), 's3://' + bucket, '--region', 'us-east-1',
                   '--only-show-errors', '--no-follow-symlinks', '--cache-control', cache, *patterns],
                  self.env, timeout=1800)


def authenticate(m, phase):
    check_job(m)
    token = os.environ.get('CIRCLE_OIDC_TOKEN_V3')
    d.require(isinstance(token, str) and len(token) > 100, 'CircleCI OIDC V3 is required')
    response = d.AWS(m['region']).call('sts', 'assume-role-with-web-identity',
        RoleArn=m[phase + 'RoleArn'], RoleSessionName='platform-ui-' + str(int(time.time())),
        WebIdentityToken=token, DurationSeconds=3600, Policy=d.compact(policy(m, phase)))
    c = response.get('Credentials', {})
    d.require(all(isinstance(c.get(k), str) and c[k] for k in ['AccessKeyId', 'SecretAccessKey', 'SessionToken', 'Expiration']), 'Incomplete STS credentials')
    d.require(re.fullmatch(r'ASIA[A-Z0-9]{16}', c['AccessKeyId']), 'Temporary credentials required')
    expiry = datetime.fromisoformat(c['Expiration'].replace('Z', '+00:00'))
    d.require(3300 <= (expiry - datetime.now(timezone.utc)).total_seconds() <= 3660, 'Unexpected STS expiry')
    env = d.clean_environment(m['region'])
    env.update(AWS_ACCESS_KEY_ID=c['AccessKeyId'], AWS_SECRET_ACCESS_KEY=c['SecretAccessKey'], AWS_SESSION_TOKEN=c['SessionToken'])
    aws = SiteAWS(env)
    identity = aws.call('sts', 'get-caller-identity')
    d.require(identity.get('Account') == m['accountId'] and identity.get('Arn', '').startswith(
        f'arn:aws:sts::{m["accountId"]}:assumed-role/platform-ui-{m["environment"]}-{phase}/'), 'Wrong STS identity')
    return aws


def config_values(m, path):
    raw = Path(path).read_bytes()
    d.require(hashlib.sha256(raw).hexdigest() == m['buildConfig']['sha256'], 'Browser config digest changed')
    value = json.loads(raw, object_pairs_hook=d.unique_object)
    d.require(set(value) == {'schemaVersion', 'environment', 'variables'} and
              value['schemaVersion'] == 1 and value['environment'] == m['environment'], 'Wrong browser config environment')
    # Older pinned browser-config objects still contain retired Filestack fields.
    # Ignore them so both environments can roll out without republishing those objects.
    retired = {'REACT_APP_FILESTACK_API_KEY', 'REACT_APP_FILESTACK_SUBMISSION_CONTAINER'}
    variables = {key: val for key, val in value['variables'].items() if key not in retired}
    d.require(isinstance(variables, dict) and REQUIRED_VARIABLES <= set(variables) <= PUBLIC_VARIABLES, 'Unreviewed browser config variable')
    d.require(all(isinstance(v, str) and len(v) < 10000 and '\n' not in v and '\r' not in v for v in variables.values()), 'Invalid browser config value')
    d.require(variables['REACT_APP_HOST_ENV'] == m['environment'] and all(variables[k] for k in REQUIRED_VARIABLES), 'Missing browser configuration')
    return variables


def fetch_config(m, output):
    aws = authenticate(m, 'build')
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    c = m['buildConfig']
    aws.call('s3api', 'get-object', extra=(str(output),), Bucket=c['bucket'], Key=c['key'], VersionId=c['versionId'])
    output.chmod(0o600)
    config_values(m, output)
    print('Verified pinned browser configuration; values withheld')


def file_digests(root):
    root = Path(root)
    d.require(root.is_dir() and not root.is_symlink(), 'Expected build directory')
    result = {}
    for p in sorted(root.rglob('*')):
        d.require(not p.is_symlink(), 'Build artifact cannot contain symlinks')
        if not p.is_file():
            continue
        name = p.relative_to(root).as_posix()
        d.require(not any(ord(c) < 32 or c == '\\' for c in name) and not any(x in ('', '.', '..') for x in name.split('/')), 'Unsafe artifact filename')
        d.require(p.stat().st_size < 200_000_000, 'Oversized artifact file')
        result[name] = hashlib.sha256(p.read_bytes()).hexdigest()
    d.require(0 < len(result) < 20000 and {'index.html', 'asset-manifest.json'} <= set(result), 'Incomplete build artifact')
    return result


def build(m, config, output):
    sha = check_job(m)
    variables = config_values(m, config)
    # Node and package hooks receive no AWS credentials, OIDC token or org-global variables.
    env = {'PATH': os.environ['PATH'], 'HOME': os.environ.get('HOME', '/tmp'), 'LANG': 'C.UTF-8',
           'CI': 'true', 'LOGICAL_ENV': m['environment'], 'NODE_OPTIONS': '--max-old-space-size=8192', **variables}
    d.execute(['yarn', 'build'], env, timeout=2700)
    files = file_digests('build')
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_text(json.dumps({'source': sha, 'environment': m['environment'],
        'configSha256': m['buildConfig']['sha256'], 'files': files}, sort_keys=True) + '\n')
    print('Built source ' + sha + '; artifact digests recorded')


def verify_artifact(m, root, metadata, source):
    actual = json.loads(Path(metadata).read_text(), object_pairs_hook=d.unique_object)
    d.require(set(actual) == {'source', 'environment', 'configSha256', 'files'} and
              actual['source'] == source and actual['environment'] == m['environment'] and
              actual['configSha256'] == m['buildConfig']['sha256'], 'Artifact provenance differs')
    d.require(actual['files'] == file_digests(root), 'Artifact bytes differ from build')


def put(aws, m, key, path, source):
    digest = hashlib.sha256(Path(path).read_bytes()).digest()
    aws.call('s3api', 'put-object', extra=('--body', str(path)), Bucket=m['bucket'], Key=key,
        ContentType='text/html' if key.endswith('.html') else 'application/json', CacheControl=NO_CACHE,
        ChecksumSHA256=base64.b64encode(digest).decode(), Metadata={'source-revision': source})


def invalidate(aws, m, reference):
    result = aws.call('cloudfront', 'create-invalidation', DistributionId=m['distributionId'],
        InvalidationBatch={'Paths': {'Quantity': 1, 'Items': ['/*']}, 'CallerReference': reference})
    identifier = result['Invalidation']['Id']
    deadline = time.monotonic() + 1200
    while time.monotonic() < deadline:
        state = aws.call('cloudfront', 'get-invalidation', DistributionId=m['distributionId'], Id=identifier)['Invalidation']['Status']
        if state == 'Completed':
            return identifier
        d.require(state == 'InProgress', 'Invalidation failed')
        time.sleep(10)
    raise d.DeployError('CloudFront invalidation timed out')


def deploy(m, root, metadata, receipt):
    sha = check_job(m)
    root = Path(root)
    verify_artifact(m, root, metadata, sha)
    aws = authenticate(m, 'deploy')
    dist = aws.call('cloudfront', 'get-distribution', Id=m['distributionId'])['Distribution']
    cfg = dist['DistributionConfig']
    origins = cfg['Origins']['Items']
    d.require(dist['Status'] == 'Deployed' and cfg['Enabled'] and len(origins) == 1 and
              origins[0]['DomainName'] == m['bucket'] + '.s3.us-east-1.amazonaws.com' and
              not origins[0].get('OriginPath') and m['publicUrl'].removeprefix('https://') in cfg['Aliases'].get('Items', []) and cfg['DefaultCacheBehavior']['TargetOriginId'] == origins[0]['Id'], 'CloudFront origin differs from reviewed site')
    d.require(aws.call('s3api', 'get-bucket-versioning', Bucket=m['bucket']).get('Status') == 'Enabled', 'Enable bucket versioning before release')
    release = sha + '-' + os.environ.get('CIRCLE_BUILD_NUM', '')
    d.require(re.fullmatch(r'[a-f0-9]{40}-[0-9]{1,12}', release), 'Invalid release identity')
    entries = {'asset-manifest.json': root / 'asset-manifest.json', 'index.html': root / 'index.html', 'gigs/index.html': root / 'index.html', 'timeline-wall/index.html': root / 'index.html', 'statistics/index.html': root / 'index.html'}
    with tempfile.TemporaryDirectory(prefix='platform-ui-rollback-') as directory:
        previous = {}
        for number, key in enumerate(entries):
            target = Path(directory) / str(number)
            try:
                info = aws.call('s3api', 'get-object', extra=(str(target),), Bucket=m['bucket'], Key=key)
                previous[key] = (target, info.get('VersionId'))
            except d.DeployError as exc:
                if key not in ('gigs/index.html', 'timeline-wall/index.html', 'statistics/index.html') or not re.search(r'\((NoSuchKey|404)\)|: (NoSuchKey|404)$', str(exc)):
                    raise
                previous[key] = previous['index.html']
        promoted = False
        try:
            aws.sync(root, m['bucket'], ['--exclude', '*', '--include', 'static/*'], 'public,max-age=31536000,immutable')
            aws.sync(root, m['bucket'], ['--exclude', 'static/*', '--exclude', 'index.html', '--exclude', 'gigs/index.html', '--exclude', 'timeline-wall/index.html', '--exclude', 'statistics/index.html', '--exclude', 'asset-manifest.json'], NO_CACHE)
            for key, path in entries.items():
                promoted = True
                put(aws, m, key, path, sha)
            invalidation = invalidate(aws, m, 'platform-ui-' + release)
            request = Request(m['publicUrl'] + '/index.html', headers={'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=30) as response:
                public = response.read(10_000_000)
            d.require(hashlib.sha256(public).digest() == hashlib.sha256((root / 'index.html').read_bytes()).digest(), 'Public HTML differs from approved build')
        except Exception:
            if promoted:
                for key, (path, _) in previous.items():
                    put(aws, m, key, path, 'rollback-' + sha)
                invalidate(aws, m, 'platform-ui-rollback-' + release)
            raise
    Path(receipt).parent.mkdir(parents=True, exist_ok=True)
    Path(receipt).write_text(json.dumps({'source': sha, 'environment': m['environment'], 'release': release,
        'invalidationId': invalidation, 'previousEntryVersions': {k: v[1] for k, v in previous.items()},
        'publicIndexSha256': hashlib.sha256(public).hexdigest(), 'verifiedAt': datetime.now(timezone.utc).isoformat()}, indent=2) + '\n')
    print('Verified ' + m['environment'] + ' site release ' + release)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('action', choices=['config', 'build', 'deploy'])
    p.add_argument('--manifest', required=True)
    p.add_argument('--config', default='/tmp/release/browser-config.json')
    p.add_argument('--root', default='/tmp/release/build')
    p.add_argument('--metadata', default='/tmp/release/artifact.json')
    p.add_argument('--receipt', default='/tmp/release/deployment-receipt.json')
    a = p.parse_args()
    m = read_manifest(a.manifest)
    if a.action == 'config':
        fetch_config(m, a.config)
    elif a.action == 'build':
        build(m, a.config, a.metadata)
    else:
        deploy(m, a.root, a.metadata, a.receipt)


if __name__ == '__main__':
    try:
        main()
    except (d.DeployError, OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        print('Platform UI release stopped; inspect the reviewed configuration or operator receipt. No credentials were logged.', file=sys.stderr)
        sys.exit(1)
