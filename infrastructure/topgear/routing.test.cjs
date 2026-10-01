const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ctx = {};
vm.runInNewContext(readFileSync(`${__dirname}/../sales/dev-viewer-request.js`, 'utf8'), ctx);

/** Builds a representative CloudFront request and invokes the edge handler. */
function route(host, uri, querystring = {}) {
    const request = { uri, headers: { host: { value: host } }, querystring };
    return { request, result: ctx.handler({ request }) };
}

test('redirects both legacy list paths only on dev Topgear, preserving encoded and repeated filters', () => {
    for (const path of ['/challenges', '/challenges/']) {
        const { result } = route('topgear.topcoder-dev.com', path, {
            'groups%5B%5D': { value: 'group-a' },
            'types[]': { value: 'CH', multiValue: [{ value: 'CH' }, { value: 'F2F' }] },
            search: { value: 'React%20%26%20Java' },
        });
        assert.equal(result.statusCode, 302);
        assert.equal(result.headers.location.value,
            '/opportunities/challenge?groups%5B%5D=group-a&types[]=CH&types[]=F2F&search=React%20%26%20Java');
        assert.equal(result.headers['cache-control'].value, 'no-store');
    }
    assert.equal(route('topgear.topcoder-dev.com:443', '/challenges').result.statusCode, 302);
});

test('preserves production, unrelated hosts, challenge details and assets', () => {
    for (const [host, path] of [
        ['topgear.topcoder.com', '/challenges'],
        ['platform-ui.topcoder-dev.com', '/challenges'],
        ['sales.topcoder-dev.com', '/'],
        ['topgear.topcoder-dev.com', '/challenges/123'],
        ['topgear.topcoder-dev.com', '/opportunities/challenge'],
        ['topgear.topcoder-dev.com', '/static/js/main.js'],
    ]) {
        const { request, result } = route(host, path);
        assert.equal(result, request);
        assert.equal(result.uri, path);
    }
});

test('preserves the existing isolated Contact and Accounts deployments', () => {
    assert.equal(route('contact.topcoder-dev.com', '/').result.uri, '/contact-app/index.html');
    assert.equal(route('account-settings.topcoder-dev.com', '/settings').result.uri,
        '/accounts-preferences-app/index.html');
    assert.equal(route('account-settings.topcoder-dev.com', '/static/js/old.js').result.uri,
        '/static/js/old.js');
});
