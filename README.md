# Platform UI (aka Topcoder UI)

The Platform UI is the official Topcoder web app to host all modern user interfaces to be used by all users.

All future user interfaces at Topcoder will be implemented here. Pre-existing user interfaces will be ported to here over time until this is the only user interface any user sees when interacting with Topcoder.

>**NOTE:** The information in this file describes our coding standards and best practices. All new code should follow these guidelines both when coding new features as well as porting old features. Please take the time to read through this file in detail.

- [Source Control & CI/CD](#source-control--cicd)
- [Local Development](#local-development)
- [Application Structure](#application-structure)
- [Coding Practices](#coding-practices)
- [Tools](#tools)

---

# Source Control & CI/CD

- [Deployments](#deployments)
- [Pull Requests](#pull-requests)
- [Branching](#branching)
- [Commits](#commits)

## Deployments

The app uses CircleCI for CI/CD.

The `dev` branch is auto-deployed to the dev environment: https://platform-mvp.topcoder-dev.com.

The `master` branch is auto-deployed to the production environment: https://platform-ui.topcoder.com.

## Pull Requests

If a Jira ticket requires any code changes, it should have its own pull request.

PRs should be named as follows:

`[TICKET-###] [Short Description] -> [target-branch-name]`

e.g. `GAME-174 Upload Badge Image Fix -> dev`

PRs should also have a description that includes a link to the Jira ticket and a summary of what the PR is changing.

## Branching

All branches use `dev` as their source. All merges to `dev` should be made via [pull request](#pull-requests) and should be approved by application owner(s).

When working on Jira tickets, a branch should correspond with a single ticket.

When using subtasks, each parent ticket should have its own branch off `dev`, and all subtasks branches should be merged into the parent ticket branch instead of directly to `dev`.

Use the following naming convention for branches in order to link associated Git PRs and branches to the tickets:

`[TICKET-###]_[short-description]`

e.g.: `PROD-1516_work-issue`

## Commits
We use [Smart Commits](https://bigbrassband.com/git-integration-for-jira/documentation/smart-commits.html#bbb-nav-basic-examples) to link comments and time tracking to tickets. You would enter the following as your commit message:

`[TICKET #] #comment <commit message> #time <jira-formatted time>`

e.g.: `PROD-001 #comment adding readme notes #time 45m`









# Local Development

- [Local Environment Setup](#local-environment-setup)
- [Tool-specific Setup](#tool-specific-setup)
- [Yarn Commands](#yarn-commands)

## Local Environment Setup

### Dependencies
- Node
- Yarn
- Typescript
- React Scripts

This app uses React 18, Typescript 4, and Node 16.

### IDE

Use the [VS Code](https://code.visualstudio.com/download) IDE for MFE development.

### nvm
Use the node version manager [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to easily and safely manage the required version of NodeJS (aka, node). Download and install it per the instructions for your development operating system. Installing a version of node via `nvm` will also install `npm`.

Once nvm is installed, run:

>% nvm install <insert node version>


At the root of the project directory you'll notice a file called `.nvmrc` which specifies the node version used by the project. The command `nvm use` will use the version specified in the file if no version is supplied on the command line.
See [the nvm Github README](https://github.com/nvm-sh/nvm/blob/master/README.md#nvmrc) for more information on setting this up.

>**NOTE:** The current node version mentioned in the `.nvmrc` is `16.15.0`

You can verify the versions of `nvm`, `node`, and `npm` using the commands below.
| Command           | Supported Version  |
| ----------------- | -------- |
| `% npm -v`        | 8.5.5    |
| `% node -v`       | v16.15.0 |
| `% nvm --version` | 0.39.1   |
| `% nvm current`   | v15.15.0 |


>**NOTE:** The `yarn start` command requires the `NVM_DIR` env variable is set.

```zsh
export NVM_DIR=~/.nvm
```

If you don't have this set globally, you can create your own [personal config](#personal-config) to define your local nvm dir.

### Hosting
You will need to add the following line to your hosts file. The hosts file is normally located at `/etc/hosts` (Mac). Do not overwrite the existing localhost entry also pointing to 127.0.0.1.

```
127.0.0.1      local.topcoder-dev.com
```
### Serving

1. Open a bash shell
2. Run the following commands

>% git clone https://github.com/topcoder-platform/platform-ui.git

>% cd platform-ui

>% yarn install

>% yarn start

3. Go to https://local.topcoder-dev.com

>**NOTE**: The site must run on port 443 in order for auth0 to work and for the site to load properly. Mac users will need to run the app with elevated permissions.

### Local SSL

SSL is required for authentication to work properly.

The `yarn start` command serves the site using the cert and key in the /ssl directory, which authorize the `https://local.topcoder-dev.com`URL.

By overriding the app to use <b>port 443</b>, you can use the authorized URL and trust the root CA to avoid SSL errors in the browser.

>**NOTE:** Mac users will require running the app with elevated permissions in order to use a port lower than 500.

For easier development, it is recommended that you add this certificate to your trusted root authorities and as a trused cert in your browser. Google your browser and OS for more info on how to trust cert authorities.

Otherwise, you will need to override the exception each time you load the site. Firefox users may need to user an incognito browser in order to override the exception.

### Personal Config

1. Add [hostname] to [`/src-ts/config/environments/app-host-environment.type.ts`](/src-ts/config/environments/app-host-environment.type.ts)
2. Copy an existing config from [`/src-ts/config/environments/environment.*.config.ts`](/src-ts/config/environments/environment.brooke.config.ts)
3. Rename new config `environment.[hostname].config.ts`
4. Rename config variable to `EnvironmentConfig[HostName]`
5. Set the `ENV` variable to `[hostname]`
6. Add the switch case for the host name to [`/src-ts/config/environments/environment.config.ts`](/src-ts/config/environments/environment.config.ts)
7. Prior to starting the server, set your host name:
```% export REACT_APP_HOST_ENV=[hostname]```

>**NOTE:** Individual tools (e.g. [Learn tool](/src-ts/tools/learn/README.md)) can have their own configuration, which can be configured the same way as the global config.

#### For further convenience

1. Copy start-ssl-*.sh
2. Rename to start-ssl-[hostname].sh
3. Set the REACT_APP_HOST_ENV=[hostname]
4. Add "start:[hostname]": "sh start-ssl-[hostname].sh" to scripts in package.json


## Tool-specific setup

Each [Tool](#tools) can have its own setup requirements. Please see each tool's [README](#tools) for further information.

## yarn Commands

| Command               | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `yarn start`          | Serve dev mode build with the default config |
| `yarn start:<dev>`    | Serve dev mode build with dev's personal config |
| `yarn build`          | Build dev mode build with the default config and outputs static files in /builds |
| `yarn build:prod`     | Build prod mode build with the prod config and outputs static files in /builds |
| `yarn lint:ts`        | Run eslint against ts/x files and outputs report |
| `yarn lint:ts:fix`    | Run eslint against ts/x files, fixes auto-fixable issues, and  outputs report |
| `yarn lint:js`        | Run eslint against js/x files and outputs report |
| `yarn lint:js:fix`    | Run eslint against js/x files, fixes auto-fixable issues, and  outputs report |
| `yarn lint`           | Run eslint against js/x and ts/x files and outputs report |
| `yarn lint:fix`       | Run eslint against js/x and ts/x files, fixes auto-fixable issues, and  outputs report |
| `yarn test`           | Run unit tests, watching for changes and re-running per your specifications |
| `yarn test:no-watch`  | Run unit tests once, without watching for changes or re-running |
| `yarn cy:run`         | Run e2e tests once in local command with the site is running    |
| `yarn cy:ci`          | Run e2e tests once by circle ci                                 |
| `yarn report:coverage`| Generate e2e coverage report in html format                     |
| `yarn report:coverage:text`  | Generate e2e coverage report in text format              |





# Application Structure

- [Folder Structure](#folder-structure)
- [Adding a Tool or Util](#adding-a-tool-or-util)

## Folder Structure

The folder structure of the app has the following goals:

- Hierarchy represents dependence
- Limit nesting
- Limit the number of folders w/in a given parent
- Easy to find items (familiar to React engineers)
- Short names
- Ubiquitous language

### /src & /src-ts

The Work Tool is currently migrating from javascript to typescript. That's why in the root of the repository there are two source folders(`src` and `src-ts`).

>**NOTE:** All work should be done in the /src-ts directory unless expressly instructed otherwise.

### /src-ts/config

Definitions of configurations for a specific host environment. See the [Personal Config](#personal-config) section for further info.

### /src-ts/header

Defines the entire header panel of the UI:

- Logo
- Tool Selectors
- Utility Selectors

### /src-ts/lib

Shared code that should be stable and should not be modified unless expressly
intending to modify the *entire* Platform UI.

When using items in this directory, there are only 3 permissable locations
from which to import:

.ts or tsx:
- /src-ts/lib

.tsx
- /src-ts/lib/styles/index.scss

.scss
- /src-ts/lib/styles/includes
- /src-ts/lib/styles/typography
- /src-ts/lib/styles/variables

See the [Styling](#styling) section for more details about stylesheets

### /src-ts/tools

The majority of development should happen in subdirectories of the tools directory.

The Tool Selectors on the site [Header](#src-tsheader) correlate 1:1 to directories within the tools directory.

The name of a tool's directory should correlate w/the name of the tool and its url.

```
i.e. /src-ts/tools/[tool-name] == platform-ui.topcoder.com/[tool-name]
e.g. /src-ts/tools/work == platform-ui.topcoder.com/work
```

>**NOTE:** Tools should not import modules from any directories other than lib. If it is necessary to import from outside the lib, the shared code should generally be moved to lib.

### /src-ts/utils

This directory includes shared utilities that are not specific to a tool (e.g. Profile Settings.)

The Utility Selectors in the site [Header](#src-tsheader) correlate 1:1 to directories within the utils directory.

The name of a util's directory should correlate w/the name of the util and its url.

```
i.e. /src-ts/utils/[util-name] == platform-ui.topcoder.com/[util-name]
e.g. /src-ts/utils/profile == platform-ui.topcoder.com/profile
```

>**NOTE:** Utils should not import modules from any directories other than lib. If it is necessary to import from outside the lib, the shared code should generally be moved to lib.

## Adding a Tool or Util

All of the routes for a given tool or util (including root, section, and subsection routes) should be
defined in a top-level file in the tool/util folder.

```
i.e. [toolName]Routes in /src-ts/tools/[tool-name]/[tool-name].routes.ts
i.e. [utilName]Routes in src-ts/utils/[util-name]/[util-name].routes.ts

e.g. workRoutes in /src-ts/tools/work/work.routes.tsx
e.g. settingsRoutes in src-ts/tools/settings/settings.routes.tsx
```

These routes then need to be added to the routes file for the parent tools/utils:

```
/src-ts/tools/tools.routes.ts
/src-ts/utils/utils.routes.ts
```

Simply adding the routes to one of thes files above will register the tool/util
with the application and will display the new component.

### Lazy loading and code splitting

When loading a route component, please use the `lazyLoad()` method defined in the application lib.

| param | description|
| ----- | ---------- |
| `moduleImport: () => Promise<any>` | Function which imports the desired module |
| `namedExport?: string` | The name of the exported module (if the module has named exports) |

Eg:
```
// Lazy load the WelcomePage component
const WelcomePage: LazyLoadedComponent = lazyLoad(() => import('./welcome'), 'WelcomePage')
...
// Use the component as route element
export const learnRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <WelcomePage />,
                ...
            },
            ...
        ]
    }
]
```


### Platform Route

The PlatformRoute model has several useful options:

| property | description |
| ---------------- | ---------------------------------------- |
| `children: Array<PlatformRoute>` | The children property defines subsections that will inherit the url path from the parent. |
| `element: JSX.Element` | The element property is the JSX element that should appear at the specified URL. |
| `disabled?: boolean` | When a route is marked as disabled, it will not be registered and will the URL will return a 404. |
| `hide?: boolean` | When a route is hidden, it will be registered and the URL will be available through deep-linking but will not be visible in either the Tools or Utils Selectors. This is useful for handling redirects for obsolete routes. |
| `authRequired?: boolean` | Requiring authentication for a route means that users who are not logged in will be redirected to the Login Form when they try to access the route. |
| `route: string` | The route property is the path to the route, relative to its parent(s). |
| `title: string` | The title property is the text that will appear in the Tools or Utils Selectors (this is irrelevant on hidden routes). |
| `rolesRequired: Array<string>` | Requiring roles for a route means that users who do not own the roles will be presented with restricted page when they try to access the route. |





# Coding Practices
- [Linting](#linting)
- [Styling](#styling)
- [Icons](#icons)

## Linting

### Rules

Javascript rules: [src/.eslintrc.js](src/.eslintrc.js)

Typescript rules: [src-ts/.eslintrc.js](src-ts/.eslintrc.js)


### Command Line

#### View All Lint Errors

>% yarn lint

#### Fix All Auto-fixable and View All Non-fixable Lint Errors

>% yarn lint:fix

See the [yarn commmands](#yarn-commands) for further options.

### VS Code

VS Code has several plugins and settings that make linting easy.

#### Format on Save

The most useful feature is to automatically apply all lint rules any time you save a file.

1) Code → Preferences → Settings

2) Search for “save” to find the setting
   - Editor: Code Actions on Save

3) Click the “Edit in settings.json” link

4) Add the following config:
    ```
    {
        ...
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true,
        },
    }
    ```

#### ESLint Plugin

Created by Microsoft, this plugin will allow you to see lint errors in the Problems panel.

>**WARNING:** Other lint plugins can interfere with ESLint, so it is recommended that you uninstall/disable all other lint plugins (e.g. TSLint, Prettier, etc).

## Styling

We use [Sass](https://sass-lang.com/) for styling, which is a preprocessor scripting language that compiles to CSS and allows for the use of variables, nested rules, mixins, functions, etc.

**Variables** can be used to store any CSS value that you want to reuse throughout your stylesheets. Variables are prefixed with the $ symbol.

e.g. styles.scss
```
$primary-color: #333;

body {
  color: $primary-color;
}
```

**Mixins** let you create groups of CSS declarations that you want to reuse throughout your site. You can also pass in values to make your mixin more flexible, and you call them using `@include`.

e.g. styles.scss
```
@mixin theme($theme: DarkGray) {
  background: $theme;
  color: #fff;
}

.info {
  @include theme;
}
.alert {
  @include theme($theme: DarkRed);
}
```

Shared stylesheets are located in `src-ts/lib/styles/`. We use variables and mixins for handling padding, colors and breakpoints in the application, among others. To reference these in your SCSS files, simply add the following line at the top of your file.

```
@import '[path to]/lib/styles/includes';
@import '[path to]/lib/styles/typography';
@import '[path to]/lib/styles/variables';
```

### Colors & Gradients

Colors and Gradients are defined as variables in `src-ts/lib/styles/_palette.scss`.

>**WARNING:** Do not use any colors that are not already defined in the palette. If a mockup you are working from has a different color, find the color in the palette that is closest.

### Padding

Padding for various screen sizes are defined as variables in `src-ts/lib/styles/_layout.scss`. This file also contains a mixin called `pagePaddings` that determines the correct padding to use for the current screen size based on breakpoints.

### Breakpoints

Breakpoint mixins are defined in `src-ts/lib/styles/_breakpoints.scss` and can be used to apply different styling based on the screen width.

Here is an example that applies a different height value than the default to a css class selector if the screen is considered small (376px - 464px).

_breakpoints.scss
```
$sm-min: 376px;
$sm-max: 464px;

@mixin sm {
  @media (min-width: #{$sm-min}) and (max-width: #{$sm-max}){
    @content;
  }
}
```

example.scss
```
@import '../lib/styles';

.example {
  height: 100px;
  @include sm {
    height: 50px;
  }
}
```

Mobile UIs use xs, sm, and md breakpoints. Larger breakpoints are desktop UIs.

For specifying mobile CSS, you can use @include ltemd:
```
.exampleDesktopContent {
  display: flex;
  width: 100%;
  flex-direction: column;

  @include ltemd {
    flex-direction: row;
  }
}
```


>**WARNING:** Do not add any breakpoints!

## Icons

### Heroicons
We use the SVG icons library [Heroicons](https://heroicons.com/), where each icon is available in an `outline` or `solid` version.

We import both sets of icons in the file `src-ts/lib/svgs/index.ts`.
```
import * as IconOutline from '@heroicons/react/outline'
import * as IconSolid from '@heroicons/react/solid'
```

Then, to use an icon from either of these sets, you would import the corresponding set into your JSX file and reference the icon of your choice as a component:

e.g.:
```
<IconOutline.InformationCircleIcon width={28} height={28} />
```

### Custom SVGs
Custom SVGs can also be imported and used directly as a React component. Save your SVG in its own index (i.e. "barrel" file within your tool (e.g. /src-ts/tools/my-tool/my-tool/lib/svgs), and then import the SVG into the barrel file as a component:
```
import { ReactComponent as CustomSVG } from './customSvg.svg'
```

The export the svg from the barrel file to be used w/in your tool:
```
export { CustomSVG }
```
See the /src-ts/lib/svgs for an example.

>**NOTE:** Custom SVGs should be saved w/in a given tool. Only global SVGs should be in the main /lib/svgs directory.

### Styling Icons

You can style an SVG icon by overwritting its properties through CSS (height, width, fill, etc.).
There are also existing mixins located in `src-ts/lib/styles/_icons.scss` with pre-defined widths and heights for various icon sizes.

e.g.:
```
.logo-link {
    svg {
        width: calc($space-xxl + $space-xxxxl);
        height: $space-xl;
        fill: none;

        path {
            fill: $tc-white;
        }
    }
}

.no-logo-link {
    svg {
      @include icon-lg;
    }
}
```

>**NOTE** - all SVGs require explicit `width` and `height` in the Safari browser in order to be rendered properly, otherwise they'll be rendered to the _default_ size and probably will crop out of view








# Tools

The following summarizes the various [tools](#adding-a-tool-or-util) in the Platform UI.

- [Dev Center](#dev-center)
- [Gamification Admin](#gamification-admin)
- [Learn](#learn)
- [Work](#work)

## Dev Center

A community-led project to document how to work with Topcoder internal applications.

[Dev Center README](./src-ts/tools/dev-center/README.md)
[Dev Center Routes](./src-ts/tools/dev-center/dev-center.routes.tsx)

## Gamification Admin

Application that allows administrators to CRUD badges and de/assign them to specific users.

[Gamification Admin README TBD](./src-ts/tools/gamification-admin/README.md)
[Gamification Admin Routes](./src-ts/tools/gamification-admin/gamification-admin.routes.tsx)

## Learn

Application that serves 3rd-party educational content.

[Learn README](./src-ts/tools/learn/README.md)
[Learn Routes](./src-ts/tools/learn/learn.routes.tsx)

## Work

Application that allows customers to submit/start challenges self-service.

[Work README TBD](./src-ts/tools/work/README.md)
[Work Routes](./src-ts/tools/work/work.routes.tsx)
