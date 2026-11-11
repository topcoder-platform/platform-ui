    // Public statistics shell; keep shared assets and all other hosts unchanged.
    if (host === 'statistics.topcoder-dev.com' || host === 'statistics.topcoder.com'
        || host === 'statistics.topcoder-dev.com:443' || host === 'statistics.topcoder.com:443') {
        if (request.uri.indexOf('/static/') === 0
            || ['/global.css', '/favicon.png', '/manifest.json', '/logo_512x512.png', '/robots.txt'].indexOf(request.uri) !== -1) {
            return request;
        }
        request.uri = '/statistics/index.html';
        return request;
    }
