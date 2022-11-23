# Topcoder Universal Navigation

The Platform UI project uses the Topcoder Universal navigation ([README](https://github.com/topcoder-platform/universal-navigation)).

## Uni-nav Versions

The Uni-nav is a hosted JS library. There are currently dev and prod versions of the library located at:

https://uni-nav.topcoder.com/tc-universal-nav-1.js

https://uni-nav.topcoder-dev.com/tc-universal-nav-1.js

The URL is set at build time with the [Global Config](../lib/global-config.model.ts) `UNIVERSAL_NAV.URL` property.

>See the [Local Environment Setup](../../README.md#local-environment-setup) section of the main README for instructions on how to set your environment configuration.

>See the [Uni-Nav Version README](https://github.com/topcoder-platform/universal-navigation#versioning) for more information about versioning.

## Uni-nav Initialization

The Header uses the `tcUniNav` method to initialize the nav with:

- active tool name
- active tool root route
- current user, if logged in
- action handler callbacks (e.g. navigation, log in, sign up)

Because the Platform UI hosts multiple tools, each time the user navigates to a new tool, the Header updates the uni-nav w/the active tool info.
