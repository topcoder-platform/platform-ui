var crypto = require('crypto');

/** Vanilla category URL codes migrated to forums.topcoder.com, mapped to their Vanilla CategoryIDs. */
var CATEGORIES = {
    '2021-topcoder-open': 1439,
    '2022-topcoder-open': 3850,
    '2023-topcoder-open': 8071,
    'active-gig-workers': 1098,
    'algorithm': 1429,
    'brand-ambassadors': 3495,
    'chat-with-mvps': 1436,
    'competitive-programming': 8460,
    'copilot-discussions': 1438,
    'copilots-evolution': 1181,
    'data-science': 8461,
    'design': 1427,
    'design-general-discussion': 1446,
    'development': 1428,
    'development-general-discussion': 1449,
    'external-competitions': 1437,
    'fast-challenge-discussion': 9615,
    'freelance-gig-work': 2743,
    'general': 1,
    'general-algorithm-discussions': 1451,
    'general-data-science-discussion': 8462,
    'general-discussion': 1435,
    'general-marathon-discussions': 1454,
    'general-qa-discussions': 2529,
    'gig-work-discusssions': 1433,
    'informix-general-discussion': 15233,
    'informix-migration-new-review-ui': 15232,
    'learning': 1426,
    'marathon': 1430,
    'marathon-match-tournament-2026': 16108,
    'marathon-match-tournament-final': 15243,
    'marathon-matches': 1455,
    'mit_6-s099': 11043,
    'new-here-getting-started': 1432,
    'news': 1425,
    'opportunity': 1445,
    'past-public-marathon-matches': 15361,
    'payment-discussions': 1434,
    'payments-trolley': 14717,
    'private': 1097,
    'qa': 1469,
    'rapid-development-matches-(rdms)': 1450,
    'reviewer-discussions': 1431,
    'skill-building-for-algorithm': 1452,
    'skill-building-for-design': 1447,
    'skill-building-for-development': 1448,
    'srms': 1453,
    'talk-to-a-recruiter': 2744,
    'tco21-finalists': 4749,
    'thrive': 1443,
    'topcoder-academy': 8692,
    'topcoder-marathon-match-tournament-discussion': 15244,
    'topcoder-meetups': 10138,
    'topcoder-nation': 2257,
    'topcoder-news-updates': 1441,
    'topcoder-webinars': 1440,
    'trolley-discussion': 14718
};

/** Sorted migrated public Vanilla DiscussionIDs, each as three base-36 digits. */
var THREADS =
    '0we0zc1q41vw1vx1vy1vz1w01x81zp1zq1zu1zv1zw2ai2bo2br2bs2bt2bu2bv2bw2bx2c42d92f42f82fa2fg2fl2g72gs' +
    '2gt2hb2ii2jo2lj2lk2lt2ml2mm2mo2n22n62ng2nh2oo2p72pa2ps2pt2py2q22q32re2sk2sy2sz2t02w12w72w82xj2xo' +
    '2zs32232532a32e34b34d34n34z35q36j36l36t36v37k37t37u37v38d38e39939t3aj3be3bm3cb3ch3cj3d63dx3ea3eb' +
    '3ec3ff3h43j33kb3mc3mk3nb3nc3nd3ne3ns3o93on3oq3t93uu3vm3xn3yf3yj3zl41z42144444a45e45l45z47547747y' +
    '48148l48o49p49s4a14a64b04b24bh4bm4bn4c54cd4co4cq4dw4dx4e04ek4et4eu4ev4ew4ex4fh4fi4fq4h34h44hv4i4' +
    '4i74i84i94ia4il4im4io4jc4jg4jh4ji4js4kn4lb4ld4le4lf4m24mg4n34n64n94ne4ny4oc4op4pe4pq4qr4rx4s34sc' +
    '4sl4sm4vm4w84wr4ww4wx4x24xk4zk50d50e50h51f52352s53153g53q55f57159j5dn5dp5du5ec5f75go5gr5hc5i45n5' +
    '5nz5pr5pt5pu5pv5px5qy5r25rl5ry5ti5tj5tp5tw5tx5ty5u05u35ug5ul5un5up5uq5ur5us5ut5uu5v65v75v85v95va' +
    '5vb5vi5vk5vl5vm5vn5vo5vp5vq5vr5vs5vt5vu5vv5vw5vy5w05w95we5wf5wh5wj5wm5xd5xl5xn5xq5y260q61b61c61g' +
    '61y62v62x63p64965z67768o6916a46a86bi6bo6by6cq6cs6d26dm6dn6ex6fz6hp6hq6kt6lz6m16o06qk6qp6qt6qu6rm' +
    '6rv6s76sd6sl6t26ue6uh6uz6v06v16wv6xg6xn6ys70l70x70z71071971g72w73274776c7757at7f67fb7g57gv7h07i4' +
    '7jm7jy7k37kc7ke7li7lz7oc7ov7q37qu7qv7sr7t17te7tf7tg7th7x47x57x67yk7z77z87za7zb7zp81a83a83y83z84h' +
    '84i87z88w8a18bu8bv8bx8c98cl8d78d88dc8dd8de8e18e98eq8ex8g48g58gg8gk8j68jj8k08k68kc8ki8lw8ly8m08m6' +
    '8n78p58pl8qf8qs8r18rr8rs8rt8sp8t98tl8vg8vm8vn8vo8vx8xg8xr8xu8xx8xy8y88yb8yh8ym8z790490f919928936' +
    '93z94i95295495o96a96b97c97d98098a98j99f99i99j9b49cb9cd9cv9cw9cz9d09d39d49dn9f09fk9g29gm9gy9hf9i0' +
    '9j39j49jl9mm9mn9mx9nt9o49p79pm9pp9ps9q29qh9qj9qo9qq9rj9rk9rl9tr9tw9tx9ud9ue9uf9ug9v99va9vb9vc9vd' +
    '9ve9vv9x39x99xf9xo9y99yv9yw9z49z8a0fa0ga0ya1ba1ca1ga27a2ia48a4ua5ea5ga5ra5ta63a65a6ha6qa7aa7la7x' +
    'a86a8ga95a96a9taa4aa5aauabrabsabtacwafxag0ag1aguah0aizaj6ajgajiak7albalcaldalqalsannanoaolap1aqt' +
    'ariarjaseaspasvaszat0atcau2aucaufaujaukausautauuauwavbaveavfay0aybaypazaazfb0ib18b2gb2ub33b3hb3j' +
    'b3kb4vb4wb5pb5ub68b6jb7tb8jb8xbakbb0bbmbbubbzbc6bdfbe2bembeobepbeybfibfwbfxbfzbg0bg2bg3bgkbgxbh2' +
    'bhebhfbhgblkbn4bnhbnkbnlbnnbnpbnqbnrbo4bo8bo9bpkbqrbrwbs0bs1bs3bsbbshbsjbsnbt4btfbtgbtnbtubtvbuh' +
    'buvbx6bxmby5byabyibz7bzbbzcbzdbzebzjbzkbzlbzmbzobzqbzrbztbzubzvbzwbzxbzyc01c04c05c06c0ec0fc0hc0i' +
    'c0zc11c12c13c14c16c17c1ic26c31c5oc5rc5tc61c6xc6zc7lc89c8lc8mc8tc9mc9yca7ca9caucaxcaycb0cbocbtcbu' +
    'cbvcckcclccnccocctccvcekcfjcfwcg4cg7chxchychzci0ciacidciecinciociwcj3cj4cjncjrcjscjxcjyck4ck7ck9' +
    'ckfckkcklcktclacldclfcllclxclzcm0cmmcn7cnecnycp7cphcplcracrmcsqct5ctycufcumcuxcvgcvicvpcwtcwwcyg' +
    'cyhcyocyqcyrcz0cz2czcd0ld1hd2bd2cd2dd2ed2fd2gd2hd2td4ed4vd51d67d6ud74d7gd8sd9td9xdbedcddcldcmddv' +
    'degdeydf3dgqdkudl0dl1dl3dlbdm0dm2doedoydp0dp8dpadpcdpddpedrgdrodrpdt4dt7dtfdu2du3dv7dwhdwwdxedxv' +
    'dypdz6e11e2te3re3ye56e5ze69e6be6de6ne6pe6qe6re73e74e8oe95e9jeareciecnecped4ed5ed8edpedqedree6eed' +
    'eehegheh4eh7ehqehuei1ejcek3ekoelyemjenkepcerderferherlermes5eshesiesyetietveu7eudeueexleynezaezb' +
    'ezcezdezqf0cf0if0jf0kf0pf0rf0sf27f2tf2uf2vf2wf2xf36f37f39f49f4jf4kf50f5cf5jf5lf5mf5nf6if6nf7gf7r' +
    'f87f8pf91fa1fa2fagfaufbmfdrfemfenfeofepfeqferfesfetff1ff7fg2fg8fhkfhpfhqfhsfiufiwfk6fkmfkxfl8fl9' +
    'fmkfngfnmfobfoqfp2fp5fpkfplfpmfpnfpsfptfpzfq3fq6ft9fvtfwmfx0fxmfxqfxrfyrfyxfzbfzlg17g1cg1sg26g2m' +
    'g2qg31g5bg60g61g62g6fg89gajgargavgaxgb3gb7gb9gbhgbkgcsgdqgeggeqgf3gg1gg3gh4gh7ghhghyghzgi0gi1gi3' +
    'gi5gidgjsgjugk6gm1gmugn5gnhgo2go3gpsgpvgpxgq3gqagqbgrbgregrwgtbgtcgu0guggukgwugyegyhgyvgzlgzmh21' +
    'h34h5bh5gh5ih5nh6mh6nh6ph80hachathbdhbvhbyhc0heaheghejheqhfhhg1hg3hg4hg6hgihhuhhxhhyhiohlghnahnc' +
    'hndhoshothqmhsjhthhtihtnhtuhu1humhunhy3hzji0xi1ki2hi3ai4li4si5oi5ti6ji7ai7zi89i9di9fib4ib5ib6ibh' +
    'ibiibjibmiddig2ihniiaiibiiciidiieiifiigiihiiiiijiikiiliioiiqiiriiwiizij1ijlijsijuijwikmiksilmimn' +
    'iokiomiozip0ip8iqbiqhirqirriu2iuaiujiuviw4j0jj1bj1qj1vj29j3ij3qj83j8cj8zjbljbujd6jdkjdlje4jfljgr' +
    'jhxji4ji8ji9jiajicjidjivjjjjjqjlhjmnjq6jqljqqjrnjt4jt5jt6juxjv6jvnjvojvpjvsjw1jw2jw3jw4jw6jwujy5' +
    'jy6jyxk04k0sk4xk5ck6jkd3kerkf0kf1kggkghkizkmrknzkpbkphkpwkqvkr0krdks1ks3kstoc6ofeohhoq6oqroxuoxz' +
    'p2hp35p43p7cpbcpccpijpm2po0pr7ptjpwdpzapzbq1zq7dq8yqefqexqikqizqnmqq0qq2qq3qq4qq5qqiqqjqsuqt4qta' +
    'qtbqvlqy1qyer42r59rexrgvrgxrv8rxms0ms3ns7us9hsdvsmisoksy2t0bt0nt12t14t4ft4gt4ht4it4kt4lt4mt4nt4z' +
    't5ctagtahtcqteftegtgitv5tw6tyzu2vubhubi';

/**
 * Builds the forums ID created for a Vanilla row, matching forums-api-v6 `publicImportId`.
 * @param {string} type Import entity type. @param {number} sourceId Vanilla ID. @returns {string} Forums ID.
 * @throws Never.
 */
function forumsId(type, sourceId) {
    return 'pf' + crypto.createHash('sha256')
        .update('vanilla-public-v1:' + type + ':' + sourceId)
        .digest('base64url')
        .slice(0, 12);
}

/**
 * Checks whether the forums public import migrated a Vanilla discussion.
 * @param {number} id Vanilla DiscussionID. @returns {boolean} True when the ID is in THREADS.
 * @throws Never.
 */
function migratedThread(id) {
    var low = 0;
    var high = THREADS.length / 3 - 1;
    while (low <= high) {
        var mid = (low + high) >> 1;
        var value = parseInt(THREADS.substr(mid * 3, 3), 36);
        if (value === id) return true;
        if (value < id) low = mid + 1;
        else high = mid - 1;
    }
    return false;
}

/**
 * Redirects retired Vanilla discussions.topcoder.com URLs at CloudFront before contacting any origin.
 * Challenge categories (UUID URL codes) open the challenge forum tab; migrated categories and threads
 * open their forums.topcoder.com copies; other paths open the forums home. Query parameters are kept.
 * @param {Object} event CloudFront viewer-request event. @returns {Object} Permanent HTTPS redirect.
 * @throws No exceptions for valid CloudFront request events; performs no network I/O.
 */
function handler(event) {
    var request = event.request;
    var category = request.uri.match(/^\/categories\/([^/]+)(?:\/p\d+)?\/?$/);
    var thread = request.uri.match(/^\/discussion\/(\d+)(?:\/|$)/);
    var location = 'https://forums.topcoder.com/';
    var parts = [];
    if (category) {
        var code = category[1].toLowerCase();
        try {
            code = decodeURIComponent(code);
        } catch (error) {
            // Malformed percent encoding cannot match a category; keep the raw code.
        }
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(code)) {
            location = 'https://topcoder.com/opportunities/challenge/' + code;
            parts.push('tab=forum');
        } else if (Object.prototype.hasOwnProperty.call(CATEGORIES, code)) {
            location += 'category/' + forumsId('category', CATEGORIES[code]);
        }
    } else if (thread && migratedThread(Number(thread[1]))) {
        location += 'thread/' + forumsId('discussion', Number(thread[1]));
    }
    var query = request.querystring || {};
    Object.keys(query).forEach(function (key) {
        var values = query[key].multiValue || [query[key]];
        values.forEach(function (entry) {
            parts.push(key + '=' + entry.value);
        });
    });
    if (parts.length) {
        location += '?' + parts.join('&');
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
