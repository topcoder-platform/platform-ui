"""Execute the hostname fragment and check the surrounding platform routes are unchanged."""
from pathlib import Path
import subprocess
import unittest


class HostRoutingTest(unittest.TestCase):
    def test_host_shell_and_asset_isolation(self):
        fragment = Path(__file__).with_name('platform-host-fragment.js').read_text()
        source = 'function handler(event) { var request = event.request; var host = request.headers.host.value;\n'
        source += fragment + '\nreturn request; }\n'
        checks = r'''
const assert = require('node:assert/strict');
function run(host, uri) { return handler({ request: { headers: {host: {value: host}}, uri } }).uri; }
for (const env of ['topcoder-dev.com', 'topcoder.com']) {
 for (const port of ['', ':443']) {
  for (const uri of ['/', '/design', '/statistics', '/statistics/qa']) {
   assert.equal(run('statistics.' + env + port, uri), '/statistics/index.html');
  }
  for (const uri of ['/static/js/main.js', '/global.css', '/manifest.json']) {
   assert.equal(run('statistics.' + env + port, uri), uri);
  }
 }
 for (const host of ['platform-ui.', 'sales.', 'timeline.', 'topgear.', 'account-settings.']) {
  for (const uri of ['/', '/design', '/challenges']) assert.equal(run(host + env, uri), uri);
 }
}
'''
        subprocess.run(['node', '-e', source + checks], check=True)
