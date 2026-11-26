    // Academy course delivery is retired. Platform UI still renders earned certificates.
    var academyHost = host.replace(/:443$/, '');
    var academyMatch = /^(academy|platform-ui|platform-mvp)\.(topcoder(?:-dev)?\.com)$/.exec(academyHost);
    if (academyMatch) {
        var academyPath = request.uri;
        var legacyLearn = /^\/learn\//i.test(academyPath);
        var platformAcademy = /^\/academy(?:\/|$)/i.test(academyPath);
        if (academyMatch[1] === 'academy' || legacyLearn || platformAcademy) {
            if (legacyLearn || platformAcademy) academyPath = academyPath.replace(/^\/(?:learn|academy)/i, '');
            if (legacyLearn && /^\/[^/]+\/?$/.test(academyPath)) academyPath = '/certificate' + academyPath;
            var isAward = /^\/certificate\/[^/]+\/?$/i.test(academyPath)
                || /^\/[^/]+\/[^/]+\/(?:completed|certificate|[^/]+\/certificate)\/?$/i.test(academyPath)
                || /^\/tca-certifications\/[^/]+\/[^/]+\/certification\/?$/i.test(academyPath);
            var domain = academyMatch[2];
            var location = 'https://' + domain + '/';
            if (isAward) {
                if (academyMatch[1] === 'platform-ui' && platformAcademy) return request;
                location = 'https://platform-ui.' + domain + '/academy' + academyPath;
                var parts = [];
                var query = request.querystring || {};
                Object.keys(query).forEach(function (key) {
                    (query[key].multiValue || [query[key]]).forEach(function (entry) {
                        parts.push(key + '=' + entry.value);
                    });
                });
                if (parts.length) location += '?' + parts.join('&');
            }
            return {
                statusCode: 301,
                statusDescription: 'Moved Permanently',
                headers: {
                    location: { value: location },
                    'cache-control': { value: 'public, max-age=300' }
                }
            };
        }
    }
