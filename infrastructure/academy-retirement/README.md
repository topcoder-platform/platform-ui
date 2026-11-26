# Academy retirement

The Academy hosts send visitors to the corresponding Topcoder homepage. Earned course certificates, completion pages, validation IDs, and hiring-manager views redirect to the existing certificate routes under `https://platform-ui.<domain>/academy/`. This also accepts historical `/learn/` links. Members can find their awards on their Topcoder profile. The Learning Paths API, member API, certificate image generator, certificate image buckets and `certificate.<domain>` provide award data, downloads and social previews independently of freeCodeCamp.

The fragment belongs immediately after the shared viewer-request function reads the Host header. In dev the function is `platform-sales-dev-viewer-request` on `EFA7R1KH3UX5M`. In production it is `platform-topgear-prod-viewer-request` on `EE83GX7FG0PB8`. When updating either function, start with its current live code and preserve the other hosts' routing. Run `node --test infrastructure/academy-retirement/routing.test.cjs` and test the composed function in CloudFront DEVELOPMENT before publishing. To roll back the routing change, remove just this fragment and publish using the current ETag.

## Archived awards

Some early awards have a public certificate image and no corresponding Learning Paths completion row. The lookup at `/archive/index.html` on the certificate image CDN checks the original handle against the available award types. The catalogue contains only provider names and award slugs. Members can reach the lookup from their profile's Education and Certifications section.

Run `python3 infrastructure/academy-retirement/publish-archive.py dev` or `prod` with the matching AWS session to publish the lookup or refresh its catalogue. It reads certificate object names and writes the three lookup files under `archive/`.
