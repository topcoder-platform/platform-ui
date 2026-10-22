const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(`${__dirname}/viewer-request.js`, 'utf8');
// CloudFront Functions provide `require('crypto')`; Node's module has the same createHash API.
const ctx = { require };
vm.runInNewContext(source, ctx);

/** Invokes the edge handler for a retired discussions.topcoder.com URL and returns its redirect. */
function redirect(uri, querystring = {}) {
    const result = ctx.handler({ request: { uri, headers: { host: { value: 'discussions.topcoder.com' } }, querystring } });
    assert.equal(result.statusCode, 301);
    assert.equal(result.headers['cache-control'].value, 'public, max-age=300');
    return result.headers.location.value;
}

test('opens the migrated Marathon Match Tournament 2026 forum instead of a challenge page', () => {
    assert.equal(redirect('/categories/marathon-match-tournament-2026'),
        'https://forums.topcoder.com/category/pfOG6mUrt7yvr3');
});

test('maps other migrated categories, ignoring case, trailing slashes, pagination and URL encoding', () => {
    assert.equal(redirect('/categories/marathon/'), 'https://forums.topcoder.com/category/pf-lT2LmF8Ri18');
    assert.equal(redirect('/categories/Rapid-Development-Matches-%28RDMs%29/p2'),
        'https://forums.topcoder.com/category/pfZ1xAJTTM4g2I');
});

test('keeps challenge categories on the challenge forum tab, preserving repeated and encoded parameters', () => {
    assert.equal(redirect('/categories/30c4a4b6-9a0d-4e7d-8c43-3f1e5f2c7f10', {
        utm_source: { value: 'a', multiValue: [{ value: 'a' }, { value: 'b' }] },
        q: { value: 'React%20%26%20Java' },
    }), 'https://topcoder.com/opportunities/challenge/30c4a4b6-9a0d-4e7d-8c43-3f1e5f2c7f10'
        + '?tab=forum&utm_source=a&utm_source=b&q=React%20%26%20Java');
});

test('opens migrated threads, including paginated legacy thread URLs', () => {
    assert.equal(redirect('/discussion/7407/topcoderpride'), 'https://forums.topcoder.com/thread/pfWSAz4X2umfLr');
    assert.equal(redirect('/discussion/4403/introducing-v-1-0-of-the-challenge-recommender-tool/p1', {
        new: { value: '1' },
    }), 'https://forums.topcoder.com/thread/pf20GFfnXUKBpR?new=1');
});

test('sends unmigrated threads, comments, unknown categories and other paths to the forums home', () => {
    for (const uri of ['/', '/categories', '/discussion/1/challenge-thread', '/discussion/comment/10196',
        '/categories/unknown-group', '/categories/%E0%A4%A', '/profile/tourist']) {
        assert.equal(redirect(uri), 'https://forums.topcoder.com/');
    }
    assert.equal(redirect('/discussions', { ref: { value: 'nav' } }), 'https://forums.topcoder.com/?ref=nav');
});

test('embeds the complete public import mapping within the CloudFront function size limit', () => {
    const ids = ctx.THREADS.match(/.{3}/g).map(value => parseInt(value, 36));
    assert.equal(ids.length, 1357);
    assert.ok(ids.every((id, index) => index === 0 || id > ids[index - 1]));
    assert.equal(Object.keys(ctx.CATEGORIES).length, 57);
    assert.ok(Buffer.byteLength(source) < 10240);
});
