import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('site_release', Path(__file__).parents[1] / 'site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.m = site.read_manifest(Path(__file__).parents[1] / 'dev.json')
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)

    def artifact(self):
        build = self.root / 'build'
        build.mkdir()
        (build / 'index.html').write_text('<html>reviewed</html>')
        (build / 'asset-manifest.json').write_text('{}')
        return build

    def test_artifact_rejects_changed_bytes_and_cross_environment(self):
        root = self.artifact()
        metadata = self.root / 'artifact.json'
        data = dict(source='a' * 40, environment='dev', configSha256=self.m['buildConfig']['sha256'], files=site.file_digests(root))
        metadata.write_text(json.dumps(data))
        site.verify_artifact(self.m, root, metadata, 'a' * 40)
        with self.assertRaises(site.d.DeployError):
            site.verify_artifact(self.m, root, metadata, 'b' * 40)
        data['environment'] = 'prod'
        metadata.write_text(json.dumps(data))
        with self.assertRaises(site.d.DeployError):
            site.verify_artifact(self.m, root, metadata, 'a' * 40)
        data['environment'] = 'dev'
        metadata.write_text(json.dumps(data))
        (root / 'index.html').write_text('unreviewed')
        with self.assertRaises(site.d.DeployError):
            site.verify_artifact(self.m, root, metadata, 'a' * 40)

    def test_symlink_cannot_include_files_outside_artifact(self):
        root = self.artifact()
        (root / 'credentials').symlink_to('/etc/passwd')
        with self.assertRaises(site.d.DeployError):
            site.file_digests(root)

    def test_public_configuration_does_not_accept_aws_or_private_keys(self):
        variables = {k: 'fixture' for k in site.REQUIRED_VARIABLES}
        variables['REACT_APP_HOST_ENV'] = 'dev'
        data = dict(schemaVersion=1, environment='dev', variables=variables)
        path = self.root / 'config.json'
        def save():
            path.write_text(json.dumps(data))
            self.m['buildConfig']['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        save()
        self.assertEqual(site.config_values(self.m, path), variables)
        variables['AWS_SECRET_ACCESS_KEY'] = 'fixture'
        save()
        with self.assertRaises(site.d.DeployError):
            site.config_values(self.m, path)
        variables.pop('AWS_SECRET_ACCESS_KEY')
        variables['REACT_APP_HOST_ENV'] = 'prod'
        save()
        with self.assertRaises(site.d.DeployError):
            site.config_values(self.m, path)

    def test_pinned_configuration_rejects_unreviewed_update(self):
        path = self.root / 'config.json'
        path.write_text('{}')
        with self.assertRaises(site.d.DeployError):
            site.config_values(self.m, path)

    def test_cross_account_manifest_is_rejected(self):
        self.m['accountId'] = '409275337247'
        path = self.root / 'manifest.json'
        path.write_text(json.dumps(self.m))
        with self.assertRaises(site.d.DeployError):
            site.read_manifest(path)

    def test_no_tag_or_foreign_checkout_can_use_release_role(self):
        env = {'CIRCLE_BRANCH': 'dev', 'CIRCLE_PROJECT_USERNAME': 'topcoder-platform',
               'CIRCLE_PROJECT_REPONAME': 'platform-ui', 'CIRCLE_SHA1': 'a' * 40}
        with patch.dict(os.environ, env, clear=True), patch.object(site.subprocess, 'check_output', return_value='a' * 40 + '\n'):
            self.assertEqual(site.check_job(self.m), 'a' * 40)
            with patch.dict(os.environ, {'CIRCLE_TAG': 'dev-unreviewed'}):
                with self.assertRaises(site.d.DeployError):
                    site.check_job(self.m)
            with patch.dict(os.environ, {'CIRCLE_BRANCH': 'feature'}):
                with self.assertRaises(site.d.DeployError):
                    site.check_job(self.m)

    def test_production_accepts_master_and_rejects_other_branches_and_tags(self):
        manifest = site.read_manifest(Path(__file__).parents[1] / 'prod.json')
        env = {'CIRCLE_BRANCH': 'master', 'CIRCLE_PROJECT_USERNAME': 'topcoder-platform',
               'CIRCLE_PROJECT_REPONAME': 'platform-ui', 'CIRCLE_SHA1': 'a' * 40}
        with patch.dict(os.environ, env, clear=True), patch.object(site.subprocess, 'check_output', return_value='a' * 40 + '\n'):
            self.assertEqual(site.check_job(manifest), 'a' * 40)
            for branch in ('dev', 'prod', 'feature'):
                with self.subTest(branch=branch), patch.dict(os.environ, {'CIRCLE_BRANCH': branch}):
                    with self.assertRaises(site.d.DeployError):
                        site.check_job(manifest)
            with patch.dict(os.environ, {'CIRCLE_TAG': 'release-test'}):
                with self.assertRaises(site.d.DeployError):
                    site.check_job(manifest)

    def test_manifest_cannot_redirect_production_to_a_different_branch(self):
        manifest = site.read_manifest(Path(__file__).parents[1] / 'prod.json')
        for branch in ('dev', 'prod', 'feature'):
            with self.subTest(branch=branch):
                manifest['branch'] = branch
                path = self.root / 'prod.json'
                path.write_text(json.dumps(manifest))
                with self.assertRaises(site.d.DeployError):
                    site.read_manifest(path)

    def test_build_identity_cannot_write_site_and_deployer_cannot_read_build_config(self):
        build = site.policy(self.m, 'build')
        deploy = site.policy(self.m, 'deploy')
        self.assertNotIn('s3:PutObject', json.dumps(build))
        self.assertNotIn(self.m['buildConfig']['key'], json.dumps(deploy))
        for policy in [build, deploy]:
            self.assertLessEqual(len(site.d.compact(policy)), 2048)
            deny = policy['Statement'][0]
            self.assertEqual(deny['Effect'], 'Deny')
            self.assertIn('ssm:*', deny['Action'])
            self.assertIn('s3:DeleteObjectVersion', deny['Action'])

    def test_asset_upload_failure_never_promotes_entrypoints(self):
        root = self.artifact()
        aws = FakeAWS(self.m, fail_sync=True)
        with patch.object(site, 'check_job', return_value='a' * 40), patch.object(site, 'verify_artifact'), patch.object(site, 'authenticate', return_value=aws), patch.dict(os.environ, {'CIRCLE_BUILD_NUM': '1'}):
            with self.assertRaises(site.d.DeployError):
                site.deploy(self.m, root, self.root / 'artifact.json', self.root / 'receipt.json')
        self.assertFalse(aws.puts)

    def test_failed_public_verification_restores_previous_shells(self):
        root = self.artifact()
        aws = FakeAWS(self.m)
        with patch.object(site, 'check_job', return_value='a' * 40), patch.object(site, 'verify_artifact'), patch.object(site, 'authenticate', return_value=aws), patch.object(site, 'invalidate', return_value='invalidation'), patch.object(site, 'urlopen', side_effect=OSError('network')), patch.dict(os.environ, {'CIRCLE_BUILD_NUM': '1'}):
            with self.assertRaises(OSError):
                site.deploy(self.m, root, self.root / 'artifact.json', self.root / 'receipt.json')
        self.assertEqual(len(aws.puts), 8)
        self.assertTrue(all(body == b'previous' for _, body in aws.puts[-4:]))
        self.assertEqual([key for key, _ in aws.puts[-4:]],
                         ['asset-manifest.json', 'index.html', 'gigs/index.html', 'timeline-wall/index.html'])


class FakeAWS:
    def __init__(self, manifest, fail_sync=False):
        self.m, self.fail_sync, self.puts = manifest, fail_sync, []

    def call(self, service, operation, extra=(), **kw):
        if operation == 'get-distribution':
            return {'Distribution': {'Status': 'Deployed', 'DistributionConfig': {'Enabled': True,
                'Aliases': {'Items': [self.m['publicUrl'].removeprefix('https://')]},
                'Origins': {'Items': [{'Id': 'origin', 'DomainName': self.m['bucket'] + '.s3.us-east-1.amazonaws.com'}]},
                'DefaultCacheBehavior': {'TargetOriginId': 'origin'}}}}
        if operation == 'get-bucket-versioning':
            return {'Status': 'Enabled'}
        if operation == 'get-object':
            Path(extra[0]).write_bytes(b'previous')
            return {'VersionId': 'before'}
        if operation == 'put-object':
            self.puts.append((kw['Key'], Path(extra[1]).read_bytes()))
            return {}
        raise AssertionError(operation)

    def sync(self, *args):
        if self.fail_sync:
            raise site.d.DeployError('upload failed')


if __name__ == '__main__':
    unittest.main()
