# Instructions for Running the Learn Tool Locally

## Learn Config

The Learn tool has its own configuration defined in the [/src-ts/tools/learn/learn-config](/src-ts/tools/learn/learn-config/learn.config.ts) directory.

The default configuration expects both the FCC Client and API to be running locally. In most cases, developers probably won't want to run both locally.

>**NOTE** There is a known issue when running the learn app locally with the FCC hosted in the dev environment. The FCC API appears to throw 403 errors when loading a new lesson; however, this does not affect the usage of the site and can be safely ignored. See [TCA-595](https://topcoder.atlassian.net/browse/TCA-595) for more details.

>**See** the [main app README](/README.md#personal-config) for instructions for creating a personal config.

## Freecodecamp app

Currently, the only provider we use is Freecodecamp (FCC).

We run the FCC app seperately and embed it in an iframe in the Platform UI app.

Repo: https://github.com/topcoder-platform/freeCodeCamp

### Run FCC Locally

FCC has a great README for setting up the app locally: https://github.com/topcoder-platform/freeCodeCamp/blob/dev/docs/how-to-setup-freecodecamp-locally.md.

FCC uses the following ports:

| APP | PORT | SSL PROXY |
| --- | ---- | --- |
| API | 3000 | 44311 |
| CLIENT | 8000 | 4431 |

### Override Platform UI Port

Platform UI runs on port 3000 by default, so you will need to override it so that it doesn't conflict with the FCC API.

>**NOTE:** It's highly recommended that you use <b>port 443</b> for convenience.

>**See** [Main App README #local-ssl](/README.md#local-ssl) for more info about local SSL.

>**See** [/ssl README](/ssl/README.md) for more info about self-signed certs.

### Add Local FQDN to Hosts file

In order to use passthrough authentication between the Platform UI and the FCC app, both apps need to use the same domain so they can read each other's cookies.

So you'll need to add the following to your hosts file to use the `topcoder-dev.com` domain.

```
127.0.0.1      fcc.topcoder-dev.com
```
