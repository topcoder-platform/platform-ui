#!/usr/bin/env python3
"""Extend the existing website CloudFormation template with the Gigs SPA routes.

This is a pure transform: read the current template as JSON on stdin and write
JSON on stdout. Supply the platform-ui bucket name as the sole argument. Deploy
with the accompanying AWS CLI runbook; no credentials are read by this program.
"""
import copy
import json
import sys


def add_gigs_routes(template, bucket):
    """Return a copy with exact/deep Gigs behaviors and a private S3 origin.

    template is a CloudFormation JSON object, bucket is the existing platform-ui
    bucket. Raises ValueError for conflicting resources or unexpected website
    topology. All existing parameters, resources, policies, and behaviors remain.
    """
    output = copy.deepcopy(template)
    resources = output['Resources']
    config = resources['WebsiteDistribution']['Properties']['DistributionConfig']
    new_resources = {
        'GigsOriginAccessControl': {
            'Type': 'AWS::CloudFront::OriginAccessControl',
            'Properties': {
                'OriginAccessControlConfig': {
                    'Name': {'Fn::Sub': '${AppName}-${Environment}-gigs'},
                    'OriginAccessControlOriginType': 's3',
                    'SigningBehavior': 'always',
                    'SigningProtocol': 'sigv4',
                },
            },
        },
        'GigsViewerRequestFunction': {
            'Type': 'AWS::CloudFront::Function',
            'Properties': {
                'Name': {'Fn::Sub': '${AppName}-${Environment}-gigs-request'},
                'AutoPublish': True,
                'FunctionConfig': {
                    'Comment': 'Serve the platform-ui shell for exact and nested Gigs pages',
                    'Runtime': 'cloudfront-js-2.0',
                },
                'FunctionCode': {'Fn::Sub': (
                    'function handler(event) {\n'
                    '  var request = event.request;\n'
                    '  var host = request.headers.host ? request.headers.host.value.toLowerCase() : "";\n'
                    '  if (host === "${ApexDomainName}") {\n'
                    '    var query = [];\n'
                    '    Object.keys(request.querystring).forEach(function (name) {\n'
                    '      var item = request.querystring[name];\n'
                    '      var values = item.multiValue && item.multiValue.length ? item.multiValue : [item];\n'
                    '      values.forEach(function (entry) {\n'
                    # CloudFront passes percent encoding through; do not encode it a second time.
                    '        query.push(name + "=" + (entry.value || ""));\n'
                    '      });\n'
                    '    });\n'
                    '    return {\n'
                    '      statusCode: 301,\n'
                    '      statusDescription: "Moved Permanently",\n'
                    '      headers: {\n'
                    '        location: { value: "https://${CanonicalDomainName}" + request.uri\n'
                    '          + (query.length ? "?" + query.join("&") : "") },\n'
                    '        "cache-control": { value: "public, max-age=300" }\n'
                    '      }\n'
                    '    };\n'
                    '  }\n'
                    '  request.uri = "/index.html";\n'
                    '  return request;\n'
                    '}\n'
                )},
            },
        },
    }
    for key, value in new_resources.items():
        if key in resources and resources[key] != value:
            raise ValueError('Conflicting resource: ' + key)
        resources[key] = value
    origin = {
        'Id': 'GigsPlatformOrigin',
        'DomainName': {'Fn::Sub': bucket + '.s3.${AWS::Region}.${AWS::URLSuffix}'},
        'OriginAccessControlId': {'Fn::GetAtt': ['GigsOriginAccessControl', 'Id']},
        'S3OriginConfig': {'OriginAccessIdentity': ''},
    }
    origins = config['Origins']
    existing_origin = next((item for item in origins if item['Id'] == origin['Id']), None)
    if existing_origin and existing_origin != origin:
        raise ValueError('Conflicting Gigs platform origin')
    if not existing_origin:
        origins.append(origin)
    behavior = {
        'TargetOriginId': origin['Id'],
        'ViewerProtocolPolicy': 'redirect-to-https',
        'AllowedMethods': ['GET', 'HEAD'],
        'CachedMethods': ['GET', 'HEAD'],
        'Compress': True,
        # The shell must follow the latest platform-ui release immediately.
        'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
        'FunctionAssociations': [{
            'EventType': 'viewer-request',
            'FunctionARN': {'Fn::GetAtt': ['GigsViewerRequestFunction', 'FunctionARN']},
        }],
    }
    if config['DefaultCacheBehavior'].get('ResponseHeadersPolicyId'):
        behavior['ResponseHeadersPolicyId'] = config['DefaultCacheBehavior']['ResponseHeadersPolicyId']
    behaviors = config.get('CacheBehaviors', [])
    for path in ['/gigs', '/gigs/*']:
        desired = dict(behavior, PathPattern=path)
        existing = next((item for item in behaviors if item['PathPattern'] == path), None)
        if existing and existing != desired:
            raise ValueError('Conflicting route behavior: ' + path)
        if not existing:
            behaviors.append(desired)
    config['CacheBehaviors'] = behaviors
    return output


if __name__ == '__main__':
    if len(sys.argv) != 2 or not sys.argv[1].replace('.', '').replace('-', '').isalnum():
        sys.exit('Usage: route-template.py PLATFORM_UI_BUCKET < current-template.json')
    json.dump(add_gigs_routes(json.load(sys.stdin), sys.argv[1]), sys.stdout, indent=2)
