"""Add timeline routes to the current website template without replacing unrelated state."""
from copy import deepcopy
from pathlib import Path

PATHS = ['/timeline-wall', '/timeline-wall/*', '/community/timeline-wall',
         '/community/timeline-wall/*', '/timeline-wall-preview/*']


def transform(template):
    result = deepcopy(template)
    resources = result['Resources']
    config = resources['WebsiteDistribution']['Properties']['DistributionConfig']
    assert any(origin['Id'] == 'PlatformUiOrigin' for origin in config['Origins']), 'Missing platform origin'
    function = {
        'Type': 'AWS::CloudFront::Function',
        'Properties': {
            'Name': {'Fn::Sub': '${AppName}-${Environment}-timeline-request'},
            'AutoPublish': True,
            'FunctionConfig': {'Comment': 'Timeline wall migration and legacy redirect', 'Runtime': 'cloudfront-js-2.0'},
            'FunctionCode': Path(__file__).with_name('viewer-request.js').read_text(),
        },
    }
    existing = resources.get('TimelineWallViewerRequestFunction')
    assert existing is None or existing == function, 'Timeline function already has different code'
    resources['TimelineWallViewerRequestFunction'] = function
    behaviors = config.setdefault('CacheBehaviors', [])
    for path in PATHS:
        behavior = {
            'PathPattern': path, 'TargetOriginId': 'PlatformUiOrigin',
            'ViewerProtocolPolicy': 'redirect-to-https', 'AllowedMethods': ['GET', 'HEAD'],
            'CachedMethods': ['GET', 'HEAD'], 'Compress': True,
            'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
            'ResponseHeadersPolicyId': {'Ref': 'SecurityHeadersPolicy'},
            'FunctionAssociations': [{'EventType': 'viewer-request',
                'FunctionARN': {'Fn::GetAtt': ['TimelineWallViewerRequestFunction', 'FunctionARN']}}],
        }
        existing = next((item for item in behaviors if item['PathPattern'] == path), None)
        assert existing is None or existing == behavior, f'Route already owned: {path}'
        if existing is None:
            behaviors.append(behavior)
    return result


if __name__ == '__main__':
    import json
    import sys
    print(json.dumps(transform(json.load(sys.stdin)), separators=(',', ':')))
