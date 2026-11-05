"""Exercise the pinned CLI against a local S3 fixture; no AWS access is needed."""
import base64
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
from pathlib import Path
import shutil
import tempfile
import threading
import unittest
from urllib.parse import parse_qs, urlsplit

spec = importlib.util.spec_from_file_location('site_cli_release', Path(__file__).parents[1] / 'site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


@unittest.skipUnless(shutil.which('aws'), 'Requires the AWS executor; also runs in config-dev/config-prod')
class StreamingS3Tests(unittest.TestCase):
    def setUp(self):
        self.requests = []
        requests = self.requests

        class Handler(BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.1'

            def log_message(self, *args):
                pass

            def do_GET(self):
                requests.append(('GET', self.path, dict(self.headers), b''))
                body = b'{"safe":"fixture"}'
                self.send_response(200)
                self.send_header('Content-Length', str(len(body)))
                self.send_header('ETag', '"fixture"')
                self.send_header('x-amz-version-id', 'pinned+/=version')
                self.end_headers()
                self.wfile.write(body)

            def do_PUT(self):
                body = self.rfile.read(int(self.headers['Content-Length']))
                requests.append(('PUT', self.path, dict(self.headers), body))
                self.send_response(200)
                self.send_header('Content-Length', '0')
                self.send_header('ETag', '"fixture"')
                self.end_headers()

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.thread.join)
        self.addCleanup(self.server.shutdown)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.endpoint = f'http://127.0.0.1:{self.server.server_port}'
        env = site.d.clean_environment('us-east-1')
        env.update(AWS_ACCESS_KEY_ID='fixture-access-key', AWS_SECRET_ACCESS_KEY='fixture-secret-key')
        self.aws = site.SiteAWS(env)

    def test_versioned_download_uses_exact_key_and_version(self):
        output = self.root / 'config.json'
        result = self.aws.call('s3api', 'get-object',
            extra=('--endpoint-url', self.endpoint, str(output)),
            Bucket='fixture-bucket', Key='deployment/browser config.json', VersionId='pinned+/=version')
        self.assertEqual(output.read_bytes(), b'{"safe":"fixture"}')
        self.assertEqual(result['VersionId'], 'pinned+/=version')
        self.assertEqual(len(self.requests), 1)
        method, path, _, _ = self.requests[0]
        self.assertEqual(method, 'GET')
        self.assertEqual(urlsplit(path).path, '/fixture-bucket/deployment/browser%20config.json')
        self.assertEqual(parse_qs(urlsplit(path).query), {'versionId': ['pinned+/=version']})

    def test_entrypoint_upload_preserves_body_metadata_and_checksum(self):
        body = b'<html>reviewed fixture</html>'
        output = self.root / 'index.html'
        output.write_bytes(body)
        checksum = base64.b64encode(hashlib.sha256(body).digest()).decode()
        self.aws.call('s3api', 'put-object',
            extra=('--endpoint-url', self.endpoint, '--body', str(output)),
            Bucket='fixture-bucket', Key='gigs/index.html', ContentType='text/html',
            CacheControl=site.NO_CACHE, ChecksumSHA256=checksum,
            Metadata={'source-revision': 'fixture-revision'})
        self.assertEqual(len(self.requests), 1)
        method, path, headers, actual = self.requests[0]
        headers = {k.lower(): v for k, v in headers.items()}
        self.assertEqual((method, path, actual), ('PUT', '/fixture-bucket/gigs/index.html', body))
        self.assertEqual(headers['x-amz-meta-source-revision'], 'fixture-revision')
        self.assertEqual(headers['cache-control'], site.NO_CACHE)
        self.assertEqual(headers['content-type'], 'text/html')
        self.assertEqual(headers['x-amz-checksum-sha256'], checksum)


if __name__ == '__main__':
    unittest.main()
