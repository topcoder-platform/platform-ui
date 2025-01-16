# Platform UI

The Platform UI is the official Topcoder web app to host all modern user interfaces to be used by all users.

All future user interfaces at Topcoder will be implemented here. Pre-existing user interfaces will be ported to here over time until this is the only user interface any user sees when interacting with Topcoder.

## Local Environment Setup

### Install VS Code

Preferably, use the VS Code IDE for development.

[https://code.visualstudio.com/download](https://code.visualstudio.com/download)

### GIT

Install git on your local machine. This is trivial for working in the community.
You can follow these guides for installing GIT:

- [Windows](https://devcenter.topcoder.com/getting-started#23-install-git)
- [Linux](https://devcenter.topcoder.com/getting-started#197-install-git)

### nvm

Use the node version manager [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to easily and safely manage the required version of NodeJS (aka, node). Download and install it per the instructions for your development operating system. Installing a version of node via `nvm` will also install `npm`.

> **NOTE:** If the nvm command is not working it might be because the installation failed to update your paths variable properly. To try and fix this try installing nvm again using sudo.

Once nvm is installed, run:

```sh
nvm install <insert node version>
```

At the root of the project directory you'll notice a file called `.nvmrc` which specifies the node version used by the project. The command `nvm use` will use the version specified in the file if no version is supplied on the command line.
See [the nvm Github README](https://github.com/nvm-sh/nvm/blob/master/README.md#nvmrc) for more information on setting this up.

> **NOTE:** The current node version mentioned in the `.nvmrc` is `22.13.0`

You can verify the versions of `nvm`, `node`, and `npm` using the commands below.

| Command       | Supported Version |
| ------------- | ----------------- |
| `% npm -v`  | 10.9.2            |
| `% node -v` | v22.13.0          |

> **NOTE:** The `yarn start` command requires the `NVM_DIR` env variable is set.

```sh
export NVM_DIR=~/.nvm
```

### Hosting

You will need to add the following line to your hosts file. The hosts file is normally located at `/etc/hosts` (Mac & Linux) or %SYSTEMROOT%\System32\drivers\etc\hosts (Windows). Do not overwrite the existing localhost entry also pointing to 127.0.0.1.

```
127.0.0.1      local.topcoder-dev.com
```

### Building and serving the application

1. Open a terminal
2. Run the following commands

```sh
git clone https://github.com/topcoder-platform/platform-ui.git
cd platform-ui
yarn install
yarn start
```

3. Go to https://local.topcoder-dev.com

> **NOTE**: The site must run on port 443 in order for auth0 to work and for the site to load properly. Mac users will need to run the app with elevated permissions, as in:

```sh
sudo yarn start
```

Run following command to allow node to run apps on ports lowert than 500 (Mac & Linux):

```sh
sudo setcap 'cap_net_bind_service=+ep' `which node`
```

### Local SSL

SSL is required for authentication to work properly.

The `yarn start` command serves the site using the cert and key in the /ssl directory, which authorize the `https://local.topcoder-dev.com` URL.

By overriding the app to use **port 443**, you can use the authorized URL and trust the root CA to avoid SSL errors in the browser.

> **NOTE:** Mac and Linux users will require running the app with elevated permissions in order to use a port lower than 500.

Easy way to overcome elevated permissions is to make use of:

```sh
sudo setcap 'cap_net_bind_service=+ep' `which node`
```

For easier development, it is recommended that you add this certificate to your trusted root authorities and as a trused cert in your browser. Google your browser and OS for more info on how to trust cert authorities.

Otherwise, you will need to override the exception each time you load the site. Firefox users may need to user an incognito browser in order to override the exception.

## yarn Commands

| Command             | Description                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| yarn start          | Serve dev mode build with the default config                                           |
| yarn build          | Build dev mode build with the default config and outputs static files in /build        |
| yarn build:prod     | Build prod mode build with the prod config and outputs static files in /build          |
| yarn demo           | Serves the built files (by running yarn:build) for local testing                       |
| yarn lint           | Run eslint against js/x and ts/x files and outputs report                              |
| yarn lint:fix       | Run eslint against js/x and ts/x files, fixes auto-fixable issues, and  outputs report |
| yarn sb             | Start the storybook dev server                                                         |
| yarn sb:build       | Build the assets for storybook                                                         |

## App specific setup

Each Application can have its own setup requirements. Please see each apps's README for further information.

### Applications hosted under Platform UI

#### Platform App
This is the "router" app under the whole sum of all Platform UI applications. It will just load all applications and serve one based on the specific route
It also renders the [Universal Navigation](https://github.com/topcoder-platform/universal-navigation)'s header & footer.

Located `src/apps/platform`.

#### Account Settings
App that manages user's own settings.

Located `src/apps/accounts`.

#### Dev Center
A community-led project to document how to work with Topcoder internal applications.

Located `src/apps/dev-center`.

#### Gamification Admin
Application that allows administrators to CRUD badges and de/assign them to specific users.

Located `src/apps/gamification-admin`.

#### Learn
Application that serves 3rd-party educational content.

Located `src/apps/learn`.

#### Onboarding App
Application that helps new users with the onboarding on our platform.

Located `src/apps/onboarding`.

#### Profiles App
Application that allows users to manage their own profile data, and allows visitors to view user details and participation statistics for a specific member.

Located `src/apps/profiles`.

#### Talent Search App
This is an internal app for finding members based on skills and other search facets.

Located `src/apps/talent-search`.

#### Skills Manager
Admin app that allows one to manage the standardized skills.

Located `src/apps/skills-manager`.

#### Self Service
Application that allows customers to submit/start challenges self-service.

Located `src/apps/self-service`.

#### Wallet App
This app allows members to manage details regarding their payments.

Located `src/apps/wallet`.

#### Wallet Admin App
This app allows admins to manage settings regarding payments, payment methods and tax forms.

Located `src/apps/wallet-admin`.

