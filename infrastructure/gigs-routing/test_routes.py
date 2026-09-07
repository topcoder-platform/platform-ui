"""Regression checks for isolated Gigs routing and private shell access."""
import importlib.util
from pathlib import Path
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


if __name__ == '__main__':
    unittest.main()
