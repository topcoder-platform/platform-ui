    // Timeline Wall owns this host; other platform sub-apps keep their existing behavior.
    if (host === 'timeline.topcoder-dev.com' || host === 'timeline.topcoder-dev.com:443') {
        if (request.uri.indexOf('/static/') === 0
            || request.uri.indexOf('/timeline-wall-preview/') === 0
            || ['/global.css', '/favicon.png', '/manifest.json', '/logo_512x512.png', '/robots.txt'].indexOf(request.uri) !== -1) {
            return request;
        }
        request.uri = '/timeline-wall/index.html';
        return request;
    }
