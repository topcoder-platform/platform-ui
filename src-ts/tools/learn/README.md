# Instructions for Running the Learn Tool Locally

## Learn Config

The Learn tool has its own configuration defined in the [/src-ts/tools/learn/learn-config](/src-ts/tools/learn/learn-config/learn.config.ts) directory.

The default configuration expects both the FCC Client and API to be running locally. In most cases, developers probably won't want to run both locally. 

>**See** [/src-ts/tools/learn/learn-config/learn.bsouza.config.ts](/src-ts/tools/learn/learn-config/learn.bsouza.config.ts) for an example of how to override the FCC source URLs to use the dev env config.

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

### Add Local FQDN to Hosts file

In order to use passthrough authentication between the Platform UI and the FCC app, both apps need to use the same domain so they can read each other's cookies.

So you'll need to add the following to your hosts file to use the `topcoder-dev.com` domain.

```
127.0.0.1      fcc.topcoder-dev.com
```

### Override Platform UI Port

Platform UI runs on port 3000 by default, so you will need to override it so that it doesn't conflict with the FCC API.

>**NOTE:** It's highly recommended that you use <b>port 443</b> for convenience.

>**See** [Main App README #local-ssl](/README.md#local-ssl) for more info about local SSL.

>**See** [/ssl README](/ssl/README.md) for more info about self-signed certs.

