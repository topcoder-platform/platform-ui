"""Regression checks for isolated Gigs routing and private shell access."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest

spec = importlib.util.spec_from_file_location('route_template', Path(__file__).with_name('route-template.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class GigsRoutesTest(unittest.TestCase):
    """Verify the template transform never takes ownership of APIs or unrelated routes."""

    def test_preserves_existing_resources_and_is_idempotent(self):
        """Only two Gigs behaviors, one origin and two resources may be added."""
        template = {'Resources': {'WebsiteDistribution': {'Properties': {'DistributionConfig': {
            'Origins': [{'Id': 'LegacyAlbOrigin'}],
            'DefaultCacheBehavior': {'TargetOriginId': 'StaticSiteOrigin'},
            'CacheBehaviors': [{'PathPattern': '/__api/*', 'TargetOriginId': 'WebsiteApiOrigin'}],
        }}}}}
        result = module.add_gigs_routes(template, 'platform-ui.example.com')
        config = result['Resources']['WebsiteDistribution']['Properties']['DistributionConfig']
        self.assertEqual(['/__api/*', '/gigs', '/gigs/*'], [item['PathPattern'] for item in config['CacheBehaviors']])
        self.assertEqual({'TargetOriginId': 'StaticSiteOrigin'}, config['DefaultCacheBehavior'])
        self.assertEqual(1, len(template['Resources']))
        self.assertEqual(result, module.add_gigs_routes(result, 'platform-ui.example.com'))
        self.assertEqual('', config['Origins'][-1]['S3OriginConfig']['OriginAccessIdentity'])
        self.assertIn('OriginAccessControlId', config['Origins'][-1])

    def test_refuses_conflicting_route_ownership(self):
        """An existing incompatible /gigs behavior must be reviewed instead of overwritten."""
        template = {'Resources': {'WebsiteDistribution': {'Properties': {'DistributionConfig': {
            'Origins': [], 'DefaultCacheBehavior': {},
            'CacheBehaviors': [{'PathPattern': '/gigs', 'TargetOriginId': 'OtherOrigin'}],
        }}}}}
        with self.assertRaises(ValueError):
            module.add_gigs_routes(template, 'platform-ui.example.com')

    def test_request_preserves_canonical_host_and_encoded_query(self):
        """Execute the edge handler with apex/deep links and repeated encoded query values."""
        template = {'Resources': {'WebsiteDistribution': {'Properties': {'DistributionConfig': {
            'Origins': [], 'DefaultCacheBehavior': {},
        }}}}}
        result = module.add_gigs_routes(template, 'platform-ui.example.com')
        code = result['Resources']['GigsViewerRequestFunction']['Properties']['FunctionCode']['Fn::Sub']
        code = code.replace('${ApexDomainName}', 'example.com').replace('${CanonicalDomainName}', 'www.example.com')
        request = {'uri': '/gigs/software-engineer/apply', 'headers': {'host': {'value': 'example.com'}},
                   'querystring': {'search': {'value': 'C%2B%2B+Developer'},
                                   'ref': {'multiValue': [{'value': 'a%26b'}, {'value': 'campaign'}]},
                                   'empty': {'value': ''}}}
        redirect = json.loads(subprocess.check_output(
            ['node', '-e', code + '\nconsole.log(JSON.stringify(handler(' + json.dumps({'request': request}) + ')));'],
            text=True))
        self.assertEqual(301, redirect['statusCode'])
        self.assertEqual('https://www.example.com/gigs/software-engineer/apply'
                         '?search=C%2B%2B+Developer&ref=a%26b&ref=campaign&empty=',
                         redirect['headers']['location']['value'])
        request['headers']['host']['value'] = 'www.example.com'
        rewritten = json.loads(subprocess.check_output(
            ['node', '-e', code + '\nconsole.log(JSON.stringify(handler(' + json.dumps({'request': request}) + ')));'],
            text=True))
        self.assertEqual('/index.html', rewritten['uri'])
        self.assertEqual(request['querystring'], rewritten['querystring'])


if __name__ == '__main__':
    unittest.main()
