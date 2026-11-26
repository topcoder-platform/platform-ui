const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const test = require('node:test');

const fragment = fs.readFileSync(path.join(__dirname, 'platform-host-fragment.js'), 'utf8');
const route = vm.runInNewContext('(function(request,host){' + fragment + '\nreturn request;})');

for (const domain of ['topcoder-dev.com', 'topcoder.com']) {
    test(domain + ' retires course delivery and preserves old certificate links', () => {
        const host = 'academy.' + domain;
        for (const uri of ['/', '/learn', '/freeCodeCamp/course/module/lesson', '/tca-certifications/example/enroll']) {
            assert.equal(route({uri}, host).headers.location.value, 'https://' + domain + '/');
        }
        for (const uri of ['/freeCodeCamp/course/certificate', '/freeCodeCamp/course/a%20b/certificate',
            '/freeCodeCamp/course/completed', '/tca-certifications/slug/handle/certificate',
            '/tca-certifications/slug/handle/certification', '/certificate/id']) {
            for (const prefix of ['', '/learn']) {
                const req = {uri: prefix + uri, querystring: {'view-style': {value: 'large-container'},
                    tag: {multiValue: [{value:'a%2Bb'}, {value:'b'}]}}};
                assert.equal(route(req, host + ':443').headers.location.value,
                    'https://platform-ui.' + domain + '/academy' + uri + '?view-style=large-container&tag=a%2Bb&tag=b');
            }
            const target = {uri: '/academy' + uri};
            assert.equal(route(target, 'platform-ui.' + domain), target);
        }
        for (const alias of ['academy.', 'platform-ui.', 'platform-mvp.']) {
            assert.equal(route({uri:'/learn/historical-id'}, alias + domain).headers.location.value,
                'https://platform-ui.' + domain + '/academy/certificate/historical-id');
        }
        const other = {uri: '/'};
        for (const alias of ['profiles.', 'certificate.', 'platform-ui.', 'topgear.']) {
            assert.equal(route(other, alias + domain), other);
        }
    });
}
