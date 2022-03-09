# Platform UI (aka Topcoder UI)

This repo will contain all new web tools moving forward. 

It is written using React 17, Typescript 4, and Node 16.

## Instructions to serve locally

### Dependencies
- Node
- Yarn
- Typescript
- React Scripts

### To Serve

- Add the local topcoder domain to your hosts file

    > 127.0.0.1 		local.topcoder-dev.com

- Open a bash shell

\> git clone https://github.com/topcoder-platform/platform-ui.git

\> cd platform-ui

\> yarn install

\> yarn start

- go to https://local.topcoder-dev.com:3000/

*NOTE: SSL is required for authentication, so you must accept the invalid cert.*

### To create a personal config in order to track logs to your local environment

- Add <hostname> to src/config/app-host-environment.enum.ts
- Copy an existing config from src/config/environment.*.config.ts
- Rename new config environment.<hostname>.config.ts
- Rename config variable to EnvironmentConfig<HostName>
- Set the ENV variable to AppHostEnvironment.<hostnama>
- Add the switch case for the host name to src/config/environment.config.ts
- Prior to starting the server, set your host name:
\> export REACT_APP_HOST_ENV=<hostname>

#### For further convenience

- Copy start-ssl-*.sh
- Rename to start-ssl-<hostname>.sh
- Set the REACT_APP_HOST_ENV=<hostname>
- Add "start:<hostname>": "sh start-ssl-<hostname>.sh" to scripts in package.json

## How to Develop

The following descriptions correspond to the top-level directories within the 
src directory.

### config

Definitions of configurations for a specific host environment.

### header

Defines the entire header panel of the UI:

- Logo
- Tool Selectors
- Utility Selectors

// TODO: Search
// TODO: make the tools and utilities configurable

### lib

Shared code that should be stable and should not be modified unless expressly
intending to modify the *entire* Platform UI.

When using items in this directory, there are only 3 permissable locations
from which to import:

.ts or tsx:
- /lib

.tsx
- /lib/styles/index.scss

.scss
- /lib/styles

// TODO: more info about what exists in the lib

### tools

The majority of development should happen in subdirectories of the tools directory.

The Tool Selectors correlate 1:1 to directories within the tools directory.

The name of a tool's directory should correlate w/the name of the tool and its url.

I.e. src/tools/<tool-name> === platform.topcoder.com/<tool-name>
E.g. src/tools/self-service === platform.topcoder.com/self-service

// TODO: how to "register" a tool and add its route

### utils

Shared utilities that are not specific to a tool.

The Utility Selectors correlate 1:1 to directories within the utils directory.

The name of a util's directory should correlate w/the name of the util and its url.

I.e. src/utils/<util-name> === platform.topcoder.com/<util-name>
E.g. src/utils/profile === platform.topcoder.com/profile

// TODO: how to "register" a util and add its route
