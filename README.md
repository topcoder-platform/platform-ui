# Platform UI (aka Topcoder UI)

The Platform UI is the official Topcoder web app to host all modern user interfaces to be used by all users.

All future user interfaces at Topcoder will be implemented here. Pre-existing user interfaces will be ported to here over time until this is the only user interface any user sees when interacting with Topcoder.

>**NOTE:** The information in this file describes our coding standards and best practices. All new code should follow these guidelines both when coding new features as well as porting old features. Please take the time to read through this file in detail.

- [Source Control & CI/CD](#source-control--cicd)
- [Local Development](#local-development)
- [Application Structure](#application-structure)
- [Coding Practices](#coding-practices)
- [All Apps](#applications-hosted-under-platform-ui)

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
- [App specific Setup](#app-specific-setup)
- [Yarn Commands](#yarn-commands)

## Local Environment Setup

### Dependencies
- Node
- Yarn
- Typescript
- React Scripts

This app uses React 18, Typescript 4, and Node 22.

### IDE

Use the [VS Code](https://code.visualstudio.com/download) IDE for MFE development.

### nvm
Use the node version manager [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to easily and safely manage the required version of NodeJS (aka, node). Download and install it per the instructions for your development operating system. Installing a version of node via `nvm` will also install `npm`.

>**NOTE:** If the nvm command is not working it might be because the installation failed to update your paths variable properly. To try and fix this try installing nvm again using sudo.

Once nvm is installed, run:

>% nvm install <insert node version>


At the root of the project directory you'll notice a file called `.nvmrc` which specifies the node version used by the project. The command `nvm use` will use the version specified in the file if no version is supplied on the command line.
See [the nvm Github README](https://github.com/nvm-sh/nvm/blob/master/README.md#nvmrc) for more information on setting this up.

>**NOTE:** The current node version mentioned in the `.nvmrc` is `22.13.0`

You can verify the versions of `nvm`, `node`, and `npm` using the commands below.
| Command           | Supported Version  |
| ----------------- | -------- |
| `% npm -v`        | 8.5.5    |
| `% node -v`       | v22.13.0 |
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

1. Open a terminal
2. Run the following commands

>% git clone https://github.com/topcoder-platform/platform-ui.git

>% cd platform-ui

>% yarn install

>% yarn start

3. Go to https://local.topcoder-dev.com

>**NOTE**: The site must run on port 443 in order for auth0 to work and for the site to load properly. Mac users will need to run the app with elevated permissions, as in:

>% sudo yarn start

Run following command to allow node to run apps on ports lowert than 500:

```
sudo setcap 'cap_net_bind_service=+ep' `which node`
```

### Local SSL

SSL is required for authentication to work properly.

The `yarn start` command serves the site using the cert and key in the /ssl directory, which authorize the `https://local.topcoder-dev.com`URL.

By overriding the app to use <b>port 443</b>, you can use the authorized URL and trust the root CA to avoid SSL errors in the browser.

>**NOTE:** Mac users will require running the app with elevated permissions in order to use a port lower than 500.

Easy way to overcome elevated permissions is to make use of:

```
sudo setcap 'cap_net_bind_service=+ep' `which node`
```

For easier development, it is recommended that you add this certificate to your trusted root authorities and as a trused cert in your browser. Google your browser and OS for more info on how to trust cert authorities.

Otherwise, you will need to override the exception each time you load the site. Firefox users may need to user an incognito browser in order to override the exception.


## App specific setup

Each [Application](#applications-hosted-under-platform-ui) can have its own setup requirements. Please see each apps's [README](#applications-hosted-under-platform-ui) for further information.

## yarn Commands

| Command                      | Description                                                                              |
| ---------------------        | -------------------------------------------------------------------------------------    |
| `yarn start`                 | Serve dev mode build with the default config                                             |
| `yarn build`                 | Build dev mode build with the default config and outputs static files in /build          |
| `yarn build:prod`            | Build prod mode build with the prod config and outputs static files in /build            |
| `yarn demo`                  | Serves the built files (by running yarn:build) for local testing                         |
| `yarn lint`                  | Run eslint against js/x and ts/x files and outputs report                                |
| `yarn lint:fix`              | Run eslint against js/x and ts/x files, fixes auto-fixable issues, and  outputs report   |
| `yarn test`                  | Run unit tests, watching for changes and re-running per your specifications              |
| `yarn test:no-watch`         | Run unit tests once, without watching for changes or re-running                          |
| `yarn cy:run`                | Run e2e tests once in local command with the site is running                             |
| `yarn cy:ci`                 | Run e2e tests once by circle ci                                                          |
| `yarn report:coverage`       | Generate e2e coverage report in html format                                              |
| `yarn report:coverage:text`  | Generate e2e coverage report in text format                                              |

# Application Structure

- [The Platform App](#the-platform-app)
- [Folder Structure](#folder-structure)
- [Typescript Versus Javascript](#ts-versus-js)
- [Adding a new Platform UI application](#adding-a-new-platform-ui-application)

# The Platform App

Under "src/apps/platform" is to be found the "mainframe" of the platform application.
This application only loads and serves all the other applications, and serves as the main router of the whole platform UI.
It also renders the [Universal Navigation](https://github.com/topcoder-platform/universal-navigation)'s header & footer.

## Folder Structure

The goal for the PlatformUI is to eventually host as many apps from the Topcoder environment as possible.
To accomodate this, each individual app has it's own "workspace" that is to be found under "src/apps".
They can share components and common utilities by using libraries created under "src/libs", eg. "src/libs/ui".

The global (common) configuration files of the applications are to be found under "src/config/environments".

Note that we have some aliases defined in `craco.confg.js` and `tsconfig.paths.json`. These are defined for easier imports:
- `~` refers to 'src', so imports can be much cleaner: `import { Button } from  '~/libs/ui'`
- in scss, you can point to the global ui styles, mixins & variables by using `@import '@libs/ui/styles/includes';`
- you can define a new allias for a new app, eg. the earn app has it's own alias, and it can be used as `@import '@earn/styles/variables';`

### TS versus JS
At the moment, a few applications are imported from different codebases as they are, only a few updates have been made to them, hence they are written in javascript rather than typescript.
**The goal** is to have all applications transitioned to typescript eventuall.
So, if you write any new component/any new application, please use typescript, as we'll eventually deprecate the JS code.

### /src/apps

This is where all the applications under platform-ui will be created and live. Each application can have it's own configuration & setup.

### /src/config

Global (common) configurations shared between all apps under platform-ui
Import with `~/config`;

### /src-ts/libs

Shared code that should be stable and should not be modified unless expressly
intending to modify the *entire* Platform UI.

As obvious as it may sound, but within the libraries themselves, we should **not**, import anything from the apps fodlers.
The libraries should be standalone, at most they should rely on other libraries (eg. libs/core will import from libs/ui pages related to Auth).

See the [Styling](#styling) section for more details about stylesheets

>**NOTE:** Apps should not import modules from anywhere other than libs. If it is necessary to import from outside the libs, the shared code should generally be moved to a lib under libs.

## Adding a new Platform UI application

All of the routes for a given app (including root, section, and subsection routes) should be
defined in a top-level file in it's own app folder.

```
i.e. [appName]Routes in /src/apps/[app-name]/src/[app-name].routes.ts

e.g. learnRoutes in /src/apps/learn/src/learn.routes.tsx
e.g. selfServiceRoutes in src/apps/self-service/src/self-service.routes.tsx
```

These routes then need to be imported in the Plaform App's [platformRoutes](./src/apps/platform/src/platform.routes.tsx):

```
import { learnRoutes } from '~/apps/learn'
import { selfServiceRoutes } from '~/apps/self-service'


export const appRoutes: Array<PlatformRoute> = [
    ...selfServiceRoutes,
    ...learnRoutes,
]
```

### Lazy loading and code splitting

When loading a route component, please use the `lazyLoad()` method defined in `~/libs/core`.

| param                              | description                                                           |
| ---------------------------------- | --------------------------------------------------------------------- |
| `moduleImport: () => Promise<any>` | Function which imports the desired module                             |
| `namedExport?: string`            | The name of the exported module (if the module has named exports)      |

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

| property                              | description                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children: Array<PlatformRoute>`      | The children property defines subsections that will inherit the url path from the parent.                                                                  |
| `element: JSX.Element`                | The element property is the JSX element that should appear at the specified URL.                                                                           |
| `disabled?: boolean`                  | When a route is marked as disabled, it will not be registered and will the URL will return a 404.                                                          |
| `authRequired?: boolean`              | Requiring authentication for a route means that users who are not logged in will be redirected to the Login Form when they try to access the route.        |
| `route: string`                       | The route property is the path to the route, relative to its parent(s).                                                                                    |
| `title: string`                       | The title property is the used for routes identification                                                                                                   |
| `rolesRequired: Array<string>`        | Requiring roles for a route means that users who do not own the roles will be presented with restricted page when they try to access the route.            |



# Coding Practices
- [Linting](#linting)
- [Styling](#styling)
- [Icons](#icons)

## Linting

### Rules

Typescript rules: [src/.eslintrc.js](src/.eslintrc.js)
Javascript rules are set as "overrides" under the same linting rules: [src/.eslintrc.js](src/.eslintrc.js)


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

Shared stylesheets are located in `src/libs/ui/lib/styles/`.
We use variables and mixins for handling padding, colors and breakpoints in the application, among others. To reference these in your SCSS files, simply add the needed lines at the top of your file.

```
@import '@libs/ui/styles/includes';
@import '@libs/ui/styles/typography';
@import '@libs/ui/styles/variables';
```

### Colors & Gradients

Colors and Gradients are defined as variables in `src/libs/ui/lib/styles/_palette.scss`.

>**WARNING:** Do not use any colors that are not already defined in the palette. If a mockup you are working from has a different color, find the color in the palette that is closest.

### Padding

Padding for various screen sizes are defined as variables in `src/libs/ui/lib/styles/_layout.scss`.
This file also contains a mixin called `pagePaddings` that determines the correct padding to use for the current screen size based on breakpoints.

### Breakpoints

Breakpoint mixins are defined in `src/libs/ui/lib/styles/_breakpoints.scss` and can be used to apply different styling based on the screen width.

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

We import both sets of icons in the file `src/libs/ui/lib/components/svgs/index.ts`.
```
import * as IconOutline from '@heroicons/react/outline'
import * as IconSolid from '@heroicons/react/solid'
```

Then, to use an icon from either of these sets, you would import the corresponding set into your JSX file and reference the icon of your choice as a component:

e.g.:
```
import { IconOutline } from '~/libs/ui'

...

<IconOutline.InformationCircleIcon width={28} height={28} />
```

### Custom SVGs
Custom SVGs can also be imported and used directly as a React component. Save your SVG in its own index (i.e. "barrel" file within your app (e.g. /src/apps/my-app/src/lib/svgs), and then import the SVG into the barrel file as a component:
```
import { ReactComponent as CustomSVG } from './customSvg.svg'
```

The export the svg from the barrel file to be used w/in your app:
```
export { CustomSVG }
```
See the /src/libs/ui/lib/components/svgs for an example.

>**NOTE:** Custom SVGs should be saved w/in a given app. Only global SVGs should be in the main /src/libs/ui/lib/components/svgs directory.

### Styling Icons

You can style an SVG icon by overwritting its properties through CSS (height, width, fill, etc.).
There are also existing mixins located in `src/libs/ui/lib/styles/_icons.scss` with pre-defined widths and heights for various icon sizes.

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








# Applications hosted under Platform UI

The following summarizes the various [apps](#adding-a-new-platform-ui-application) in the Platform UI.

- [Platform App](#platform-app)
- [Dev Center](#dev-center)
- [Earn](#earn)
- [Gamification Admin](#gamification-admin)
- [Learn](#learn)
- [Self Service](#self-service)

## Platform App

This is the "router" app under the whole sum of all Platform UI applications. It will just load all applications and serve one based on the specific route
It also renders the [Universal Navigation](https://github.com/topcoder-platform/universal-navigation)'s header & footer.

[Platform README](./src/apps/platform/README.md)
[Platform Routes](./src/apps/platform/src/platform.routes.tsx)

## Dev Center

A community-led project to document how to work with Topcoder internal applications.

[Dev Center README](./src/apps/dev-center/README.md)
[Dev Center Routes](./src/apps/dev-center/src/dev-center.routes.tsx)

## Earn

The application that displays the list of challenges & gigs: opportunity feed

[Earn README](./src/apps/earn/README.md)
[Earn Routes](./src/apps/earn/src/earn.routes.tsx)

## Gamification Admin

Application that allows administrators to CRUD badges and de/assign them to specific users.

[Gamification Admin README TBD](./src/apps/gamification-admin/README.md)
[Gamification Admin Routes](./src/apps/gamification-admin/src/gamification-admin.routes.tsx)

## Learn

Application that serves 3rd-party educational content.

[Learn README](./src/apps/learn/README.md)
[Learn Routes](./src/apps/learn/src/learn.routes.tsx)

## Self Service

Application that allows customers to submit/start challenges self-service.

[Work README TBD](./src/apps/self-service/README.md)
[Work Routes](./src/apps/self-service/src/self-service.routes.tsx)
