/**
 * Routes the Contact and Accounts dev hosts to their isolated S3 shells.
 * Sales and every other Platform UI host use the shared root build deployed by CircleCI.
 * @param {Object} event CloudFront viewer-request event containing the URI and Host header.
 * @returns {Object} Request with an app-specific SPA fallback; assets and unrelated hosts are preserved.
 * @throws No exceptions for valid CloudFront request events; performs no network I/O.
 */
function handler(event) {
    var request = event.request;
    var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';
    var prefix = '';
    if (host === 'contact.topcoder-dev.com' || host === 'contact.topcoder-dev.com:443') {
        prefix = '/contact-app/';
    } else if (host === 'account-settings.topcoder-dev.com' || host === 'account-settings.topcoder-dev.com:443') {
        // Keep shared assets available to Accounts pages opened before its isolated deployment.
        if (request.uri.indexOf('/static/') === 0
            || ['/global.css', '/favicon.png', '/manifest.json', '/logo_512x512.png', '/robots.txt'].indexOf(request.uri) !== -1) {
            return request;
        }
        prefix = '/accounts-preferences-app/';
    }
    if (prefix && request.uri.indexOf(prefix) !== 0) {
        request.uri = prefix + 'index.html';
    }
    return request;
}
