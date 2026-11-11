"""Verify route isolation, idempotency, and actual edge JavaScript behavior."""
import json
from pathlib import Path
import subprocess
import unittest

from route_template import PATHS, transform


class RoutingTests(unittest.TestCase):
    def test_additive_and_idempotent(self):
        original = {'Resources': {'WebsiteDistribution': {'Properties': {'DistributionConfig': {
            'Origins': [{'Id': 'PlatformUiOrigin'}],
            'CacheBehaviors': [{'PathPattern': '/gigs', 'TargetOriginId': 'GigsPlatformOrigin'}],
            'DefaultCacheBehavior': {'TargetOriginId': 'StaticSiteOrigin'},
        }}}, 'Unrelated': {'Type': 'AWS::S3::Bucket'}}}
        result = transform(original)
        self.assertEqual(transform(result), result)
        self.assertEqual(result['Resources']['Unrelated'], original['Resources']['Unrelated'])
        config = result['Resources']['WebsiteDistribution']['Properties']['DistributionConfig']
        self.assertEqual(config['CacheBehaviors'][0], original['Resources']['WebsiteDistribution']['Properties']['DistributionConfig']['CacheBehaviors'][0])
        self.assertEqual([b['PathPattern'] for b in config['CacheBehaviors'][1:]], PATHS)
        self.assertEqual(len(original['Resources']), 2)
        config['CacheBehaviors'][-1]['TargetOriginId'] = 'OtherOrigin'
        with self.assertRaises(AssertionError):
            transform(result)

    def test_edge_redirect_and_shell(self):
        code = Path(__file__).with_name('viewer-request.js').read_text()
        checks = r'''
const assert = require('assert');
function request(uri) { return {uri, headers: {}, querystring: {q: {multiValue: [{value:'a%2Fb'}, {value:'x%20y'}]}}}; }
for (const path of ['/community/timeline-wall', '/community/timeline-wall/']) {
 const out = handler({request:request(path)});
 assert.equal(out.statusCode, 301);
 assert.equal(out.headers.location.value, '/timeline-wall?q=a%2Fb&q=x%20y');
}
for (const path of ['/timeline-wall','/timeline-wall/']) {
 assert.equal(handler({request:request(path)}).uri, '/timeline-wall/index.html');
}
assert.equal(handler({request:request('/timeline-wall-preview/static/app.js')}).uri, '/timeline-wall-preview/static/app.js');
'''
        subprocess.run(['node', '-e', code + checks], check=True)


if __name__ == '__main__':
    unittest.main()
