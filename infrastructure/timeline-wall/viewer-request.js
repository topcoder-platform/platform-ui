// Associated only with the timeline routes and the isolated preview asset prefix.
// CloudFront query values are already encoded: preserve them, including repeats.
function handler(event) {
    var request = event.request;
    if (request.uri === '/community/timeline-wall' || request.uri.indexOf('/community/timeline-wall/') === 0) {
        var query = [];
        Object.keys(request.querystring || {}).forEach(function (name) {
            var item = request.querystring[name];
            var values = item.multiValue && item.multiValue.length ? item.multiValue : [item];
            values.forEach(function (entry) { query.push(name + '=' + (entry.value || '')); });
        });
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                location: { value: '/timeline-wall' + (query.length ? '?' + query.join('&') : '') },
                'cache-control': { value: 'public, max-age=300' }
            }
        };
    }
    if (request.uri.indexOf('/timeline-wall-preview/') !== 0) {
        request.uri = '/timeline-wall/index.html';
    }
    return request;
}
