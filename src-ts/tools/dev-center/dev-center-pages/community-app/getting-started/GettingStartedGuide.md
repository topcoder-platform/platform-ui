# Community app

The community app is the web application that is a main part of the Topcoder website, including things like profile and challenge listings.
This document covers the Windows 10, Linux and MacOS setup of the development environment in detail.

## Build the community app on Windows 10

### Install Visual Studio Community 2013

[https://my.visualstudio.com/Downloads?q=visual%20studio%202013](https://my.visualstudio.com/Downloads?q=visual%20studio%202013)
or a premium version: [https://visualstudio.microsoft.com/vs/older-downloads/](https://visualstudio.microsoft.com/vs/older-downloads/) by clicking Donwload button for Visual Studio 2013 and Other Products

When installing

* You can uncheck the "Join the Visual Studio Experience Improvement Program"
* You only need to check "Microsoft Foundation Classes for C++" on the optional features selection screen

![](./images/VSCommunity0.png)

### Install VS Code

[https://code.visualstudio.com](https://code.visualstudio.com)

You can use the default options when installing VS Code.


### Install Git

[https://git-scm.com/download/win](https://git-scm.com/download/win)

When installing:

* Check checkbox for "Add a Git Bash Profile to Windows Terminal" (step 3)
* Use VS Code as Git's default editor (step 5)
* Checkout as-is commit as-is (step 10)
* Enable both experimental options (step 15)

![](./images/Git1.png)

### Install Python 2.7.18

[https://www.python.org/downloads/release/python-2718/](https://www.python.org/downloads/release/python-2718/)

You can install with the default options (shown below)

![](./images/Python1.png)


### Install NVM

After Git has been installed, run the "Git Bash" program from your start menu.

This will load the Git Bash command line, which is what we will use for all command line work going forward.

You will install NVM (https://github.com/nvm-sh/nvm) using this command.  You can copy / paste this onto the Git Bash command line and hit "Enter" to run it:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

### Edit the aliases file

The Git Bash program uses an "aliases" file for some initialisation of the shell.  We need to make changes to it so that:

* Python can be executed
* NVM works as expected

Open `C:\Program Files\Git\etc\profile.d\aliases.sh` in an explorer.

We will add these 3 lines underneath the `alias ll='ls -l'` line:

```sh
alias python='winpty C:\\Python27\\python.exe'

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

You will need to grant VS Code admin privileges to save the file once the edits are done.

The file should look like this:

```sh
# some good standards, which are not used if the user
# creates his/her own .bashrc/ .bash_profile

# --show-control-chars: help showing Korean or accented characters
alias ls='ls -F --color=auto --show-control-chars'
alias ll='ls -l'
alias python='winpty C:\\Python27\\python.exe'

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

case "$TERM" in
xterm*)
    # The following programs are known to require a Win32 Console
    # for interactive usage, therefore let’s launch them through
    # when run inside `mintty`
    for name in node ipython php php5 psql python2.7
    do
        case "$(type -p "$name" .exe 2>/dev/null)" in
        ''|/usr/bin/*) continue;;
        esac
        alias $name="winpty $name.exe”
    done
    ;;
esac
```

#### Aliases Validation

To validate the aliases changes, you will restart Git Bash, which will cause it to read in the new changes.  You should be able to execute these commands without error:

```terminal
python --version
```


```terminal
nvm --version
```

The output should look like this:

```terminal
copilot@DESKTOP-CEFAE6N MINGW64 ~
$ python --version
Python 2.7.18

copilot@DESKTOP-CEFAE6N MINGW64 ~
$ nvm --version
0.39.1

copilot@DESKTOP-CEFAE6N MINGW64 ~
$
```

### Hosts file update

Open the file `C:\Windows\System32\drivers\etc\hosts` in VS Code.  We will add these two lines to the end of the file:

```sh
127.0.0.1 local.topcoder-dev.com
127.0.0.1 local.topcoder.com
```

You will need to save the file using admin privileges.  The final file should look like this:

```sh
# Copyright (c) 1993-2000 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows
#
# This file contains the mappings of iP addresses to host names.
# entry should be kept on an individual line. The IP address should
# be placed in the first column followed by the corresponding hosts
# The IP address and the host name should be separated by at least
# space.
#
# Additionaly, comments (such as these) may be inserted on individual
# lines or following the machine name denoted by a '#' symbol.
#
# For example:
#
#    102.54.94.97   rhino.acme.com   # source server
#     38.25.63.10   x.acme.com       # x client host

# localhost name resolution is handled within DNS itself.
#    127.0.0.1   localhost
#          ::1   localhost
127.0.0.1 local.topcoder-dev.com
127.0.0.1 local.topcoder.com
```

### Install the proxy and run it

We need to proxy `https` requests through a local proxy since we don't have a valid SSL key.  To do this, we use the `local-ssl-proxy` package.  You can install this in the Git Bash application using this command.

* `npm i -g local-ssl-proxy` You only have to run this once to install the package
* `local-ssl-proxy -n local.topcoder-dev.com -s 443 -t 3000` Every time you want to run the proxy or work on the community app, you will need to run.  You will need to grant the proxy admin access.

**NOTE** - You should run the proxy in a *separate* Git Bash window, to ensure it's always running.

```terminal
copilot@DESKTOP-CEFAE6N MINGW64
$ pm i -g local-ss1-proxy
npm WARN deprecated nomnom@1.8.1: Package no longer supported. contact support@npmjs.com for more info.
npm WARN notice [SECURITY] underscore has the following vulnerability: 1 high. Go here for more details: https://github.com/advisories?query=underscore - Run `npm i npm@latest -g` to upgrade your pm version, and then `npm audit` to get more info.
c:\users\copilot\.num\versions\node\v8.11.2\bin\local-ss1-proxy
->
C:\Users\copilot\.nvm\versions\node\v8.11.2\bin\node_modules\local-ssl-proxy\bin\local-ssl-proxy + local-ss1-proxv@1.3.0
added 18 packages in 3.321s

copilot@DESKTOP-CEFAE6N MINGW64 ~
$ local-ss1-proxy -n local.topcoder-dev.com -s 443 -t 3000
Started proxy: https://local.topcoder-dev.com: 443 -> http://local.topcoder-dev.com:3000
```

### Check out the code

Now that all dependencies are set up, we can check out the code.  Note that this command will check out the community-app source code into a directory named `community-app`.

Run this command on the Git Bash command line:

```terminal
git clone https://github.com/topcoder-platform/community-app.git
```

```terminal
copilot@DESKTOP-CEFAE6N MINGW64
$ git clone https://github.com/topcoder-platform/community-app.git
Cloning into 'community-app'...
remote: Enumerating objects: 88177, done.
remote: Counting objects: 100% (981/981),done.
remote: Compressing objects: 100% (445/445), done.
remote: Total 88177 (delta 535), reused 905 (delta 485), pack-reused 87196
Receiving objects: 100% (88177/88177), 135.06 MiB | 8.73 MiB/s, done.
Resolving deltas: 100% (58839/58839). done.
hint: core.useBuiltinFSMonitor=true is deprecated;please set core.fsmonitor=true instead
hint: Disable this message with "git config advice.useCoreFSMonitorConfig flase"
warning: the following paths have collided (e.g. case-sensitive paths on a case-insensitive filesystem) and only one from the same colliding group is in the working three:

   'docs/contentful/Animations.md'
   'docs/contentful/animations.md'
   'docs/contentful/Viewport.md'
   'docs/contentful/viewport.md'

copilot@DESKTOP-CEFAE6N MINGW64 ~
$
```

### Build the code

Now that we have the code, we can build it on the Git Bash command line.  The first `cd community-app` command just changes us to the directory we created above, after the code was cloned.

* `cd community-app`
* `nvm use` will warn you to install v8.11.2
* `nvm install v8.11.2`

```terminal
copilot@DESKTOP-CEFAE6N MINGW64
$ nvm use
Found '/c/Users/copilot/community-app/.nvmrc' with version <v8.11.2>
N/A: version "V8.11.2 -> N/A" is not yet installed.

You need to run "nvm install v8.11.2" to install it before using it.

copilot@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ nvm install v8.11.2
Downloading and installing node v8.11.2...
Downloading https://nodejs.org/dist/v8.11.2/node-v8.11.2-win-x64.zip...
######################################################################### 100.0%
Computing checksum with sha256sum
Checksums matched!Now using node v8.11.2 (npm v5.6.0)
Creating default alias: default -> v8.11.2

copilot@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ node --version
v8.11.2
```


Once we have the proper Node version installed (8.11.2), we will install the dependencies:

**NOTE** this is a command that will take a long time and will build numerous dependencies.  This is the command that is most likely to fail.  If you have trouble here, make sure to copy / paste the entire output of the command into the forum so the copilot can help.

```terminal
npm i
```

```terminal
> sharp@o.20.8 install c:\users\copilot\community-app\node_modules\sharp
(node install/libvips && node install/d11-copy && prebuild-install)I1 (node-gyp rebuild && node install/d11-copy)

info sharp Downloading https://github.com/lovell/sharp-libvips/releases/download/v8.6.1/libvips-8.6.1-win32-x64.tar.gz
info sharp creating c:\users\copilot\community-app\node_modules\sharp\build\Release
info sharp Copying DLLs from C:\Users\copilot\community-app\node_modules \sharp\vendor\lib to c:\users\copilot\community-app\node_modules\sharp\build\Release

> core-js@2. 6.11 postinstall c:\Users\copilot\community-app\node _modules\core-js
> node -e "try{require('./postinstall'>}catch(e)(]"

Thank you for using core-js (https://github.com/zloirock/core-js) for polyfilling Javascript standard library!

The project needs your help! Please consider supporting of core-js on Open collective or Patreon:
> https://opencollective.com/core-js
> https://www.patreon.com/zloirock

Also, the author of core-js (https://github.com/zloirock) is looking for a good job -)

note-1: Pursfiedufreet;pasalhsalyssFea/ka)community-app/lnode_modules.lcore-js-pure
> core-js@2.6.11 postinstall c:\users\copilot\community-app\node_modules \tc-ui \node_modules\attr-accept \node_modules \core-js
> node -e "try{require('./postinstall ')}catch(e) {}

> husky@4. 2.5 postinstall c:\Users\copilot\community-app\node_modules \husky
> opencollective-postinstall I| exit 0

Thank you for using husky!
If you rely on this package, please consider supporting our open collective:
> https://opencollective.com/husky/donate

> node-sass4.14.1 postinstall c:\users\copilot\community-app\node_modules\node-sass
> node scripts/build.js

Binary found at C:\Users\copilot\community-app\node_modules\node-sass\vendor\win32-x64-57\binding.node
Testing binary
Binary is fine
(node: 3828) MaxListenersExceededwarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added. Use emitter.setMaxListeners () to increase limit

> community-app@1.0.0 postinstall c:\Users\copilot\community-app
> rimraf node _modules/navigation-component/node_modules/topcoder-react-utils && rimraf node_modules/topcoder-react-ui-kit/node_modules/topcoder-react-utils

npm WARN optional SKIPTING OPTZONAL DEPENDENCY: Fsevents@2. 1. 3 (node, nodules watchpack\node modules\fsevent:)
npm WARN notsup SKIPPING.OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.3: wanted {"os":"darwin", "arch", "any"} (current: {"os":"win32":"arch":"x64"})
npm WARN optional SKIPTING OPTZONAL DEPENDENCY: Fsevents@2. 1. 3 (node, nodules\fsevent:)
npm WARN notup SKIPPING.OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.3: wanted {"os":"darwin", "arch", "any"} (current: {"os":"win32":"arch":"x64"})

added 2976 packages in 488.193s

copilot@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$
```

With the dependencies now successfully installed, we can build the code.  You can do this whenever you want to rebuild the app as you make changes to it.

* `npm run clean` - This command cleans up any previous builds
* `source env.sh` - This command sets the environmental variables - **IMPORTANT**: before executing this command, ask admin for the env.sh file, then paste it into root folder of community-app
* `./node_modules/.bin/webpack --env=development --progress --profile --colors`  - This command builds the app
* `npm run` - This command will start the web server

```terminal
copilot@DESKTOP-CEFAE6N MINGW64 ~
$ cd community-app

copilot@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ npm run clean
> community-app@1.0.0 clean C:\Users\copilot\community-app
> rimraf build

copilot@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ export NODE_CONFIG_ENV=development

copilot@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ ./node_modules/.bin/webpack--env=development --progress--profile --colors 36% building 221/255 modules 34 active ...app\node_modules\object-assign\index.js
```


### Validation

To validate, we'll run Chrome without web security to avoid it complaining about the local proxy redirects.

Open Chrome and paste the linkf from below, or open a new Git Bash prompt and run:

* `"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-gpu --disable-features=IsolateOrigins,site-per-process --user-data-dir="C://ChromeDev"`

Paste this link:

[https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com](https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com)

Once Chrome is running, you should be able to open this link and login with a test user.

* Sample test user: `jgasperMobile12` / `Appirio123`



![](./images/InitialLoginInChrome.png)


You will need to tell Chrome to ignore the self-signed certificate warning by clicking the "Proceed to local.topcoder-dev.com" link

![](./images/PrivateConnectionWarning.png)

After successful login, you should see:

**Chrome browser**

![](./images/SuccessfulLogin.png)

**Git bash prompt running the server**

```terminal
    in App
    in Router
    in StaticRouter
    in Provider
Warning: componentwillmount has been renamed, and is not recommended for use. See https://fb/me/react-unsafe-component-lifecycles for details.

* Move code from componentwillMount to componentDidMount (preferred in most cases) or the constructor
please update the following components: Switch
    in Switch
    in div
    in Routes
    in Connect (Routes)
    in Route
    in withouter (connect (Routes))
    in div
    in App
    in Router
    in StaticRouter
    in Provider

::ffff:127.0.0.1 > 200 GET / 4023.838 ms - https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36
::ffff:127.0.0.1 > 200 GET /api
/cdn/public/static-assets/main-1655784239000.Css6.177 ms- https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff: 127.0.0.1 > Authenticated as: ("https://topcoder-dev.com/roles": ["Topcoder User"], . "https: //topc oder-dev.com/userId": "88778088". ."https://topcoder-dev.com/handle" "copilot" ev.com/user_id": "autho|88778088" "https://topcoder-dev.com/tcsso" "https://topcoder "88778088) 83dddf57fe737e45425da484c€6 d26e262b44810ba944668c61f8f42f47e94" lockIP ': false, "nickname' "copilot "https://topcoder-dev.com/active".true,"https://topcoder-dev.com/l "name" "copilot@topcoder.com "picture" "https://s.g avatar.com/avatar/5dzf2479df25f71bb56e3cbc160714c6?5=480&r=pg&d=https%3A%2F%2Fcdn.autho. com%2Favatars Egm.pna,iss" "updated_at' ''2022-06-21T04:08:23.9202"
"email" "copilot@topcoder.com' "sub" "autho|88778088" "aud": "email verified
::ffff:127.0.0.1 > 200 GET / 4023.838 ms - https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > Reauth scheduled in 86367.528 seconds
::ffff:127.0.0.1 > 200 POST /community-app-assets/api/logger 0.854 ms - https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36
```

You can also access a link on the community app page, like the one for the challenge listings:

![](./images/ChallengeListing.png)

## Build the community app on Linux

This documentation covers Ubuntu 22, as that is a fairly common Linux distribution.  The steps should be easy enough to follow for any Debian based distro, but you may need to make changes for certain things.  Other distros can follow the flow, but the individual commands and steps may differ, especially for installing the prerequisites.

### Install VS Code

VS Code can be installed directly from the `Ubuntu Software` application that's in the Ubuntu favourites by default.

![](./images/VSCode1.png)

### Open the terminal

To open the terminal, click "Activities" and search for "Terminal".  It would probably be a good idea to add the Terminal app to your favourites as it will be used extensively in these instructions.

### Install curl and wget

Curl is a basic network utility used when install prerequisites.

* Open the Terminal app
* Run `sudo apt install curl`

```terminal
copilot@topcoder-desktop:$ sudo apt install curl
[sudo] password for copilot:
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  libcur14
The following NEW packages will be installed:
  curl
The following packages will be upgraded:
  libcurl4
1 to upgrade, 1 to newly install, 0 to remove and 153 not to upgrade
Need to get 194 kB/484 kB of archives
After this operation, 454 kB of additional disk space will be used.
Do you want to continue? [Y/n] Y
Get:1 http://au.archive.ubuntu.com/ubuntu jammy-updates/main amd64 curl amd64 7.81.0-1ubuntu1.2 [194 kB]
Fetched 194 kB in 1s (372 kB/s)
(Reading database ... 160751 files and directories currently installed.)
Preparing to unpack .../libcur14 7.81.0-1ubuntu1.2_amd64.deb ...
Unpacking libcurl4: amd64 (7.81.0-1ubuntu1.2) over (7.81.0-1) ...
Selecting previously unselected package curl.
Preparing to unpack .../curl_7.81.0-1ubuntu1.2_amd64. deb ...
Unpacking curl (7.81.0-1ubuntu1.2) ...
Setting up libcurl4:amd64 (7.81.0-1ubuntu1.2) ...
Setting up curl (7.81.0-1ubuntu1.2) ...
Processing triggers for man-db(2.10.2-1) ...
Processing triggers for libc-bin(2.35-Oubuntu3) ...
```

wget is used to download files from the internet.  It may already be installed, but it doesn't hurt to make sure.

* Open the Terminal app
* Run `sudo apt install wget`

```terminal
copilot@topcoder-desktop:$ sudo apt install wget
[sudo] password for copilot:
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
wet is already the newest version (1.21.2-2ubuntul).
wet set to manually installed.
0 to upgrade, 0 to newly install, 0 to remove and 153 not to upgrade.
```

### Install build tools

Standard build tools are necessary when building the community app dependencies.  We can just install the `build-essential` package in Ubuntu:

* Open the Terminal app
* Run `sudo apt install build-essential`

```terminal
Setting up libctf-nobfdo:amd64(2.38-3ubuntu1) ...
Setting up libfakeroot:amd64(1.28-1ubuntu1) ...
Setting up libasan6: amd64 (11.2.0-19ubuntu1) ...
Setting up fakeroot (1.28-1ubuntu1) ...
update-alternatives: using /usr/bin/fakeroot-sysv to provide /usr/bin/fakeroot (fakeroot) in auto mode ...
Setting up libtirpc-dev:amd64(1.3.2-2build1) ...
Setting up rpcsvc-proto(1.4.2-Oubuntu6) ...
Setting up make (4.3-4.1build1) ...
Setting up libquadmatho:amd64(12-20220319-1ubuntu1) ...
Setting up libatomic1:amd64 (12-20220319-1ubuntu1) ...
Setting up libdpkg-perl(1.21.1ubuntu2.1) ...
Setting up libubsan1:amd64 (12-20220319-1ubuntu1) ...
Setting up libnsl-dev:amd64(1.3.0-2build2) ...
Setting up libcrypt-dev:amd64(1:4.4.27-1) ...
Setting up libbinutils:amd64(2.38-3ubuntu1) ...
Setting up libc-dev-bin(2.35-Oubuntu3) ...
Setting up libalgorithm-diff-xs-perl(0.04-6build3) ...
setting up libesan0:am64 (12-20220319-1ubuntu1) ...
Setting up libitm1:am64 (12-20220319-1ubuntu1) ...
Setting up libc-devtools (2.35-0ubuntu3) ...
Setting up libalgorithm-merge-perl(0.08-3) ...
Setting up libtsan0:amd64 (11.2.0-19ubuntu1) ...
Setting up libctf0:amd64 (2.38-3ubuntu1) ...
Setting up libgcc-11-dev:am64 (11.2.0-19ubuntu1) ...
Setting up libc6-dev:am64 (2.35-@ubuntu3) ...
Setting up binutils-x86-64-linux-gnu (2.38-3ubuntu1) ...
Setting up binutils (2.38-3ubuntu1) ...
Setting up dpkg-dev(1.21.1ubuntu2.1) ...
Setting up libstdc++-11-dev:amd64 (11.2.0-19ubuntu1) ...
Setting up gcc-11 (11.2.0-19ubuntu1) ...
Setting Up g++-11 (11.2.0-19ubuntu1) ...
Setting up gcc (4:11.2.0-1ubuntu1) ...
Setting up g++ (4:11.2.0-1ubuntu1) ...
update-alternatives: using /usr/bin/g++ to provide /usr/bin/c++ (C++) in auto mode ...
Setting up build-essential (12.9ubuntu3) ...
Processing triggers for man-db(2.10.2-1) ...
Processing triggers for libc-bin(2.35-0ubuntu3) ...
```

### Install Chrome

Chrome is a good default browser to use when developing the community app.  To install it, we will run the following commands from the Terminal app:

* `wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb` This downloads Chrome
* `sudo dpkg -i google-chrome-stable_current_amd64.deb` This installs Chrome


```terminal
copilot@topcoder-desktop:$ wgethttps://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
--2022-06-23 14:34:46-- https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
Resolving dl.google.com (dl.google.com)... 142.250.70.238, 2404:6800:4015:803::200e
Connecting to dl.google.com (dl.google.com)|142.250.70.238|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 85757216 (82M) [application/x-debian-package]
saving to: 'google-chrome-stable_current_amd64.deb'

google-chrome-stable_cu100%[==============================>] 81.78M 13.0MB/s in 6.35

2022-06-23 14:34:54 (13.0 MB/s) - 'google-chrome-stable_current_and64.deb' saved [85757216/85757216]

copilot@topcoder-desktop:$ sudo dpkg -i google-chrome-stable_current_amd64.deb
[sudo] password for copilot:
Selecting previously unselected package google-chrome-stable.
(Reading database ... 160758 files and directories currently installed.)
Preparing to unpack google-chrome-stable current_amd64.deb ...
Unpacking google-chrome-stable (103.0.5060.53-1) ...
Setting up google-chrome-stable (103.0.5060.53-1) ...
update-alternatives: ustng /usr/btn/google-chrome-stable to provide /usr/bin/x-www-browser (x-www-browser) in auto mode
update-alternatives: using /usr/bin/google-chrome-stable to provide /usr/bin/gnome-www-browser (gnome-www-browser) in auto mode
update-alternatives: ustng /usr/btn/google-chrome-stable to provide /usr/bin/google-chrome (google-chrome) in auto mode
Processing triggers for mailcap(3.70+nmulubuntu1) ...
Processing triggers for gnome-menus(3.36.0-1ubuntu3) ...
Processing triggers for desktop-ftle-utils(0.26-1ubuntu3) ...
Processing triggers for man-db (2.10.2-1) ...

```

### Install Git

Git can be installed directly from the terminal.

* Open the Terminal app
* Run `sudo apt install git`

```terminal
copilot@topcoder-desktop:$ sudo apt install git
[sudo] password for copilot:
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  git-man liberror-perl
Suggested packages:
  git-daemon-run | git-daemon-sysvinit git-doc git-email git-gut gitk gitweb
  git-cvs git-mediawiki git-svn
The following NEW packages will be installed:
  git git-man liberror-perl
0 to upgrade, 3 to newly install, 0 to remove and 154 not to upgrade
Need to get 4,108 kB of archives.
After this operation, 20.9 MB of additional disk space will be used.
Do you want to continue? [Y/n] Y
Get:1 http://au.archive.ubuntu.com/ubuntu jammy/main amd64 liberror-perl all 0.17029-1 [26.5 kB]
Get:2 http://au.archive.ubuntu.com/ubuntu jammy-updates/main amd64 git-man all 1:2.34.1-1ubuntu1.2 [952 kB]
Get:3 http://au.archive.ubuntu.com/ubuntu jammy-updates/main amd64 git amd64 1:2.34.1-1ubuntu1.2 [3,130 kB]
Fetched 4,108 kB in 2s (1,785 kB/s)
Selecting previously unselected package liberror-perl.
(Reading database ... 159766 ftles and directories currently installed.)
Preparing to unpack .../liberror-perl_0.17029-1_all.deb ...
Unpacking liberror-perl (0.17029-1) ...
Selecting previously unselected package git-man.
Preparing to unpack .../git-man 1%3a2.34.1-1ubuntu1.2 all.deb ...
Progress: [23%] [#############.....................................]
Selecting previously unselected package git.........................] ]
Preparing to unpack .../git_1%3a2.34.1-1ubuntu1.2_amd64.deb ........]
Unpacking git (1:2.34.1-1ubuntu1.2) ...
Setting up liberror-perl (0.17029-1) ...............................]
Setting up git-man(1:2.34.1-1ubuntu1.2) ............................]
Setting up git (1:2.34.1-1ubuntu1.2) ...............................]
Processing triggers for man-db(2.10.2-1) ...........................]

```

### Install nvm

The Node Version Manager [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm) is used to make sure our version of Node and npm match the deployment environment.

To install nsm run this command:

* Open the Terminal app
* `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`

```terminal
copilot@topcoder-desktop:$ curl-o-https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
% Total   % Received       % Xferd     Average     Speed    Time     Time     Time   Current
                                       Dload       Upload   Total    Spent    Left   Speed
100 15037 100 15037        0     0     27922           0  --:--:-- --:--:-- --:--:-- 27922

=> Downloading nvm from git to '/home/copilot/.nvm'
=> Cloning into '/home/copilot/.nvm'...
remote: Enumerating objects: 355, done.
remote: Counting objects: 100% (355/355), done.
remote: Compressing objects: 100% (302/302), done.
remote: Total 355 (delta 39), reused 170 (delta 28), pack-reused 0
Receiving objects: 100% (355/355), 228.98 KiB | 1.55 MB/s, done.
Resolving deltas: 100% (39/39), done.
* (HEAD detached at FETCH HEAD)
  master
=> Compressing and cleaning up git repository

=> Appending nvm source string to /home/copilot/.bashrc
=> Appending bash completion source string to /home/copilot/.bashrc
=> Close and reopen your terminal to start using nvm or run the following to use it now:

export NVM _DIR= "SHOME/.nvm"
[ -s "SNVM DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
[ -s "SNVM DIR/bash_completion" ] && \. "$NVM DIR/bash_completion"  # This loads nvm bash_completion

```

Note that after you have installed nvm you will need to restart your terminal app to ensure the new settings are loaded in.

You can test nvm by running:

* `nvm --version` in the terminal

```terminal
copilot@topcoder-desktop:$ nvm --version
0.39.1
```

### Install python 2.7.18

To install python 2.7.18, we first have to add the correct repository to pull it from for Ubuntu.

We will run these commands in the Terminal app:

* `sudo apt-add-repository universe`
* `sudo apt update`

```terminal
copilot@topcoder-desktop:$ sudo apt-add-repository universe
[sudo] password for copilot:
Adding component(s) 'universe' to all repositories.
Press [ENTER] to continue or Ctrl-c to cancel.
Hit:1 http://au.archive.ubuntu.com/ubuntu jammy InRelease
Hit:2 http://au.archive.ubuntu.com/ubuntu jammy-updates InRelease
Hit:3 http://au.archive.ubuntu.com/ubuntu jammy-backportsInRelease
Get:4 https: //dl.google.com/linux/chrome/deb stable InRelease [1,811 B]
Get:5 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]
Get:6 https://dl.google.com/linux/chrome/deb stable/main amd64 Packages [1,078 B]
Fetched 113 kB in 2s (67.9 kB/s)
Reading package lists... Done

copilot@topcoder-desktop:$ sudo apt update
Hit:1 http://au.archive.ubuntu.com/ubuntu jammy InRelease
Hit:2 http://au.archive.ubuntu.com/ubuntu jammy-updates InRelease
Hit:3 http://au.archive.ubuntu.com/ubuntu jammy-backports InRelease
Hit:4 https: //dl.google.com/linux/chrome/deb stable InRelease
Get:5 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]
Fetched 110 kB in 1s (75.8 kB/s)
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
153 packages can be upgraded. Run 'apt list --upgradable' to see them.
```

Then, we can install python 2.7.18:

* `sudo apt install python2`

```terminal
20.8 kB]
Get:4 http://au.archive.ubuntu.com/ubuntu jammy/universe amd64 libpython2.7-stdlib amd64 2.7.18
-13ubuntul [1,977 kB]
Get:5 http://au.archive.ubuntu.com/ubuntu jammy/universe amd64 python2.7 amd64 2.7.18-13ubuntu1 [250 kB]
Get:6 http://au.archive.ubuntu.com/ubuntu jammy/universe amd64 libpython2-stdlib amd64 2.7.18-3 [7,432 B]
Get:7 http://au.archive.ubuntu.com/ubuntu jammy/universe amd64 python2 amd64 2.7.18-3 [9,098 B]
Fetched 4,009 kB in 0s (13.9 MB/s)
Selecting previously unselected package libpython2.7-minimal:amd64
(Reading database ... 160871 files and directories currently installed.)
Preparing to unpack .../0-libpython2.7-minimal_2.7.18-13ubuntu1_amd64.deb ...
Unpacking libpython2.7-minimal:amd64 (2.7.18-13ubuntu1) ...
Selecting previously unselected package python2.7-minimal.
Preparing to unpack .../1-python2.7-minimal_2.7.18-13ubuntu1_amd64.deb ...
Unpacking python2.7-minimal (2.7.18-13ubuntu1) ...
Selecting previously unselected package python2-minimal.
Preparing to unpack .../2-python2-minimal_2.7.18-3_amd64.deb
Unpacking python2-minimal (2.7.18-3) ...
Selecting previously unselected package libpython2.7-stdlib:amd64.
Preparing to unpack .../3-libpythonz.7-stdlib_2.7.18-13ubuntu1_amd64.deb ...
Unpacking libpython2.7-stdlib:amd64 (2.7.18-13ubuntu1) ...
Selecting previously unselected package python2.7.
Preparing to unpack .../4-python2.7_2.7.18-13ubuntu1_amd64.deb ...
Unpacking python2.7 (2.7.18-13ubuntu1) ...
Selecting previously unselected package libpython2-stdlib:amd64.
Preparing to unpack .../5-libpython2-stdlib_2.7.18-3_amd64.deb ...
Unpacking libpython2-stdlib:amd64 (2.7.18-3) ...
Setting up libpython2.7-mintmal:amd64 (2.7.18-13ubuntu1) ...
Setting up python2.7-minimal (2.7.18-13ubuntu1) ...
Linking and byte-comptling packages for runtime python2.7...
Setting up python2-minimal (2.7.18-3) ...
Selecting previously unselected package python2.
(Reading database ... 161614 files and directories currently installed.)
Preparing to unpack .../python2 2.7.18-3_amd64.deb ...
Unpacking python2 (2.7.18-3) ...
Setting up libpython2.7-stdlib:amd64 (2.7.18-13ubuntu1) ...
Setting up python2.7 (2.7.18-13ubuntu1) ...
setting up libpython2-stdlib:amd64 (2.7.18-3) ...
Setting up python2 (2.7.18-3) ...
Processing triggers for desktop-file-utils (0.26-1ubuntu3) ...
Processing triggers for gnome-menus(3.36.0-1ubuntu3) ...
Processing triggers for man-db(2.10.2-1) ...
Processing triggers for mailcap(3.70+nmu1ubuntu1) ...
```

### Hosts file update

We need to edit `/etc/hosts` to add a couple of entries. We will add these two lines to the end of the file:

```
127.0.0.1 local.topcoder-dev.com
127.0.0.1 local.topcoder.com
```

To do this, open up the file in VSCode:

* `code /etc/hosts`

Add the lines above and then save the file, using `sudo`

```ini
127.0.0.1 localhost
127.0.1.1 copilot-desktop
# The following lines are desirable for IPv6 capable hosts
::1       ip6-localhost ip6-loopback
fe00: :0 ip6-localnet
ff00: :0 ip6-mcastprefix
ff02: :1 ip6-allnodes
ff02::2 ip6-allrouters
127.0.0.1 local.topcoder-dev.com
127.0.0.1 local.topcoder.com
```

### Install the initial node version

The community app requires Node 8.11.2.  You can install it by running this command:

* `nvm install v8.11.2`

```terminal
copilot@topcoder-desktop:$ nvm install v8.11.2
Downloading and installing node v8.11.2.
Downloading https://nodeis.org/dist/v8.11.2/node-v8.11.2-linux-x64.tar.xz...
#################################################################################### 100.0%
Computing checksum with sha256sum
Checksums matched!
Now using node v8.11.2 (npm v5.6.0)
Creating default alias: default -> v8.11.2
```

### Install the proxy and run it

We need to proxy `https` requests through a local proxy since we don't have a valid SSL key.  To do this, we use the `local-ssl-proxy` package.  You can install this in the Terminal app using these commands:

* `npm i -g local-ssl-proxy` You only have to run this once to install the package

**NOTE** - You should run the proxy in a *separate* Terminal window or tab, to ensure it's always running.
* `local-ssl-proxy -n local.topcoder-dev.com -s 3001 -t 3000` Every time you want to run the proxy or work on the community app, you will need to run this command

```terminal
copilot@topcoder-desktop:$ local-ssl-proxy -n local.topcoder-dev.com -s 3001 -t 3000
Started proxy: https://local.topcoder-dev.com:3001 -> http://local.topcoder-dev.com:3000
```

### Check out the code

Now that all dependencies are set up, we can check out the code.  Note that this command will check out the community-app source code into a directory named `community-app`.

Run this command on the Git Bash command line (you can open a Linux terminal or VS Code terminal and run these commands directly):

```terminal
git clone https://github.com/topcoder-platform/community-app.git
```

```terminal
copilot@topcoder-desktop:$ git clone https://github.com/topcoder-platform/community-app.git
Cloning into 'community-app'
remote: Enumerating objects: 88298, done.
remote: Counting objects: 100% (1102/1102), done.
remote: Compressing objects: 100% (524/524), done.
remote: Total 88298 (delta 585), reused 998 (delta 523), pack-reused 87196
Receiving objects: 100% (88298/88298),
135.19 MB | 3.38 MiB/s, done.
Resolving deltas: 100% (58896/58896),
done.
```

### Build and run the code

Now that we have the code, we can build it on the Terminal command line.  The first `cd community-app` command just changes us to the directory we created above, after the code was cloned.

* `cd community-app`
* `nvm use` will warn you to install v8.11.2

```terminal
copilot@topcoder-desktop:$ cd community-app
copilot@topcoder-desktop:~/community-app$ nvm use
Found '/home/copilot/community-app/.nvmrc' with version <v8.11.2>
Now using node v8.11.2 (npm v5.6.0)
```


Once we have the proper Node version installed (8.11.2), we will install the dependencies:

**NOTE** this is a command that will take a long time and will build numerous dependencies.  This is the command that is most likely to fail.  If you have trouble here, make sure to copy / paste the entire output of the command into the forum so the copilot can help.

* `npm i`

**NOTE** - If this appears to be stuck, try deleting the `package-lock.json` file and starting `npm i` again.  The `package-lock.json` will get regenerated as the modules are installed.

```terminal
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@^1.0.0 (node_modules/chokidar/node_module
s/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents01.2.13: wanted {"os": "darwin", "arch": "any"} (current: {"os": "Linux", "arch": "x64"})
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: sevents@~2.3.2 (node_modules/watchpack/node_modules/chokidar/node modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents02.3.2: wanted {"os": "darwin", "arch": "any"] (current: {"os": "Linux",, "arch": "x64"})
npm WARN @optimizely/js-sdk-datafile-manager@0.9.5 requires a peer of @react-native-async-storage/
async-storage@^1.2.0 but none is installed. You must install peer dependencies yourself.
npm WARN @optimizely/js-sdk-event-processor@0.9.5 requires a peer of @react-native-community/netinfo@5.9.4 but none is installed. You must install peer dependencies yourself.
npm WARN @optimizely/js-sdk-event-processor@0.9.5 requtres a peer of dreact-native-async-storage/async-storage@^1.2.0 but none is installed. You must install peer dependencies yourself.
npm WARN draft-js-markdown-shortcuts-plugin@0.3.0 requires a peer of draft-js-plugins-editor@~2.00-rc.1 || 2.0.0-rc2 || 2.0.0-rc1 || 2.0.0-beta12 but none is installed. You must install peer dependencies yourself.
npm WARN draft-is-markdown-shortcuts-plugin@0.3.0 requtres a peer of react@^15.0.0 but none is installed. You must install peer dependencies yourself.
npm WARN draft-js-markdown-shortcuts-plugin@0.3.0 requires a peer of react-dom@^15.0.0 but none is installed. You must install peer dependencies yourself.
npm WARN react-addons-css-transition-group@15.6.2 requires a peer of react@^15.4.2 but none is installed. You must install peer dependencies vourself.
npm WARN react-css-super-themr@2.3.0 requtres a peer of react@^0.14.0 || ^15.0.0-0 but none is installed. You must install peer dependencies yourself.
npm WARN react-dock@0.3.o requires a peer of @types/react@^16.3.18 but none is installed. You must install peer dependencies yourself.
npm WARN react-hot-loader04.13.0 requtres a peer of @types/react@^15.0.0 || ^16.0.0 || ^17.0.0 but none is installed. You must install peer dependencies yourself
npm WARN react-slick@0.15.4 requires a peer of react@^0.14.0 || ^15.0.1 but none is installed. You must install peer dependencies yourself.
npm WARN react-slick@0.15.4 requires a peer of react-dom@^0.14.0 || ^15.0.1 but none is installed. You must install peer dependencies vourself.
npm WARN redux-devtools-dock-monitor@1.2.0 requires a peer of @types/react@^16.3.18 but none is installed. You must install peer dependencies vourself.
npm WARN slick-carousel@1.8.1 requires a peer of jquery@»=1.8.0 but none is installed. You must install peer dependencies ourself.
npm WARN update-browserslist-db1.0.3 requires a peer of browserslist@»= 4.21.0 but none is installed. You must install peer dependencies yourself.

added 6 packages in 297.525s
```

With the dependencies now successfully installed, we can build the code.  You can do this whenever you want to rebuild the app as you make changes to it.

* `npm run clean` - This command cleans up any previous builds
* `source env.sh` - This command sets the environmental variables - **IMPORTANT**: before executing this command, ask admin for the env.sh file, then paste it into root folder of community-app
* `npm run build` - This command builds the app
* `npm run start` - This command will start the web server

```terminal
        ModuleConcatenation bailout: Module is not an ECMAScript module
        [29] 24712ms -> factory:305ms building:274ms = 25291ms
    [3] ./src/assets/fonts/opensans/opensans-italic-webfont.eot92 bytes {0} [built]
        ModuleConcatenation bailout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms building:274Ms = 25291ms
    [4] ./src/assets/fonts/opensans/opensans-semibold-webfont.eot92 bytes {0} [built]
       ModuleConcatenation bailout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms building:274Ms = 25291ms
    [5] ./src/assets/fonts/opensans/opensans-semibolditalic-webfont.eot92bytes{0}[built]
       ModuleConcatenation bailout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms building:274Ms = 25291ms
    [6] ./src/assets/fonts/opensans/opensans-bold-webfont.eot92 bytes {0} [built]
       ModuleConcatenation ballot: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms butlding:274Ms = 25291ms
    [7] ./src/assets/fonts/opensans/opensans-bolditalic-webfont.eot92 bytes {0} [built]
       ModuleConcatenation ballout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms butlding:274Ms = 25291ms
    [8] ./sc/assets/fonts/opensans/opensans-extrabold-webfont.eot92 bytes {0] [built]
       ModuleConcatenation ballout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms butlding:274Ms = 25291ms
    [9] ./src/assets/fonts/opensans/opensans-extraboldttaltc-webfont.eot92 bytes {0] [bullt]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms butlding:274Ms = 25291ms
    [10] ./src/assets/fonts/Akkurat/WiproAkkuratTT-Light.eot 92 bytes {0} [butlt]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms butlding:274Ms = 25291ms
    [11] ./src/assets/fonts/Akkurat/WiproAkkuratTTRegular.eot92 bytes {0} [butlt]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms butlding: 274Ms = 25291ms
    [12] ./src/assets/fonts/Akkurat/AkkuratMonoMono.eot 92 bytes {0} [built]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms building: 274Ms = 25291ms
    [13] ./src/assets/fonts/Akkurat/WiproAkkuratTT-Bold.eot92 bytes {0} [built]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms building: 274Ms = 25291ms
    [29] ./node modules/css-loader??ref--7-1!./node modules/postcss-loader/lib??ref--7-2!./node modules/resolve-url-loader!./nodemodules/sass-loader/dist/cjs.js??ref--7-41./src/styles/global.sess
 42.5 KiB {0} [built]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       factory: 3ms building: 24709Ms = 24712ms
       + 125 hidden modules
```

### Validation

To validate, we'll run Chrome without web security to avoid it complaining about the local proxy redirects.

Open a new Terminal app window and run:

* `google-chrome --disable-web-security --disable-gpu --disable-features=IsolateOrigins,site-per-process --user-data-dir="~/ChromeDev"`

Once Chrome is running, you should be able to open this link and login with a test user:

https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com:3001
* Sample test user: `jgasperMobile12` / `Appirio123`

![](./images/InitialLoginInChrome.png)

You will need to tell Chrome to ignore the self-signed certificate warning by clicking the "Proceed to local.topcoder-dev.com" link

![](./images/PrivateConnectionWarning.png)

After successful login, you should see:

**Chrome browser**

![](./images/SuccessfulLogin.png)

**Terminal app running the server**

```terminal
Gecko) Chrome/103.0.5060.53 Safari/537.36

::ffff: 127.0.0.1 > 200 GET /api/cdn/public/static-assets/fonts/35675c89f974f7811eeaf07e2dd5ba3.woff2.737 ms 25020 https: //local.topcoder-dev.com: 3001/api/cdn/public/static-assets/main-1655963662307.css Mozilla/5.0 (X11; Linux x86 64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36

::ffff: 127.0.0.1 > 200 GET /api/cdn/public/static-assets/fonts/816d43bc217485bc52e309cd1b356880.woff4.249 ms 24576 https: //local.topcoder-dev.com: 3001/api/cdn/public/static-assets/main-1655963662307.css Mozilla/5.0 (X11; Linux x86 64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36

::ffff: 127.0.0.1 > 200 GET /api/cdn/public/static-assets/fonts/8b18d656824460ad37616723e493bcd.woff4.674 ms 24808 https: //local.topcoder-dev.com: 3001/api/cdn/public/static-assets/main-1655963662307.c5s Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/ 537.36

::ffff: 127.0.0.1 > 200 GET /api/cdn/public/static-assets/main-1655963662307.js 8.031 ms - https://local.topcoder-dev.com: 3001/ Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/103.0.5060.53 Safari/537.36

::ffff:127.0.0.1 > Authenticated as: ("https: //topcoder-dev.com/roles": ["Topcoder User"], "https://topcoder-dev.com/userId": "88778088", "https://topcoder-dev.com/handle": "copilot", "https://topcoder-dev.com/user id": "autho|88778088","https://topcoder-dev.com/tesso":"88778088|83dddf57fe737e45425da484ce6d26e262644810ba944668C61f8f42f47eg4". "https://topcoder-dev.com/active": true, "https://topcoder-dev.com/blockIP": false, "nickname": "copilot" "name": "copilot@topcoder.com", "picture": "https: //s.gravatar.com/avatar/5d2f2479df25f71bb56e3cbc160714c6?s=480&r=pg&d=https%3A%2F%2Fcdn.autho.com2Favatars%2Fjm.png", "updated at": "2022-06-23T06:11:06.5917", "email": "copilot@topcoder.com", "email verified": true, "iss":"https://auth.topcoder-dev.com/", "sub": "autho|88778088", "aud": "BXWXUWnilVUPdN01t2Se29Tw2ZYNGZVH", "iat":1655964672, "exp":1656051072, "nonce": "YVhusxhrSzlack5MMlByUXROb3FnTlBRMmdOdFZlMFN2c0VNczBXRlEwMw==", "userId": 88778088, "handle": "copilot",
"roles" : ["Topcoder User"]}

::ffff: 127.0.0.1 > 200 POST /community-app-assets/api/logger 1.438 ms - https://local.topcoder-dev.com:3001/ Mozilla/5.0 (X11; Linux x86 64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36

::ffff: 127.0.0.1 > Reauth scheduled in 86339.804 seconds
::ffff:127.0.0.1 200 POST /community-app-assets/api/logger 0.508 mS - https://local.topcoder-dev.com:3001/ Mozilla/5.0 (X11; Linux x86 64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/103.0.5060.53 Safari/537.36
```

You can also access a link on the community app page, like the one for the challenge listings:

![](./images/ChallengeListing.png)

## Build the community app on Mac

### Install XCode

XCode can be installed directly from the Mac App Store.  Note that XCode is a large application and will take up a lot of disk space.

[https://apps.apple.com/au/app/xcode/id497799835?mt=12](https://apps.apple.com/au/app/xcode/id497799835?mt=12)

![](./images/XCode1.png)

### Install XCode command line tools

When XCode launches for the first time, it *should* install the necessary command line tools.  You can validate in the XCode preferences.  Alternatively, when you install Homebrew in the next step it will also install the command line tools.

![](./images/XCode2.png)

### Install VSCode

VSCode is the recommended IDE for Topcoder platform development.  You can download it here:

[https://code.visualstudio.com/Download](https://code.visualstudio.com/Download)

### Open the terminal

To open the terminal, click "Launchpad" and search for "Terminal".  It would probably be a good idea to add the Terminal app to your macOS dock as it will be used extensively in these instructions.

### Install homebrew

Homebrew is a package manager for developers on macOS.  It can be used to easily install dependencies.

[https://brew.sh](https://brew.sh)


We can install it by:

* Open the Terminal app
* Run `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
* Enter your macOS account password, when prompted
* Copy and paste the commands that Homebrew outputs at the end of the installation to ensure `brew` is registered properly.

```terminal
Last login: Wed Jul 6 16:33:40 on console
copilot@topcoder-Virtual-Machine ~ % /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

==> Checking for 'sudo' access (which may request your password)...
Password:
==> This script will install:
/opt/homebrew/bin/brew
/opt/homebrew/share/doc/homebrew
/opt/homebrew/share/man/man1/brew.1
/opt/homebrew/share/zsh/site-functions/_brew
/opt/homebrew/etc/bash_completion.d/brew
/opt/homebrew
==> The following new directories will be created:
/opt/homebrew/bin
/opt/homebrew/etc
/opt/homebrew/include
/opt/homebrew/lib
/opt/homebrew/sbin
/opt/homebrew/share
/opt/homebrew/var
/opt/homebrew/opt
/opt/homebrew/share/zsh
/opt/homebrew/share/zsh/site-functions
/opt/homebrew/var/homebrew
/opt/homebrew/var/homebrew/linked
/opt/homebrew/Cellar
/opt/homebrew/Caskroom
/opt/homebrew/Frameworks
==> The Xcode Command Line Tools will be installed.

Press RETURN/ENTER to continue or any other key to abort:
==> /usr/bin/sudo /usr/bin/install -d -o root -g wheel -m 0755 /opt/homebrew
==> /usr/bin/sudo /bin/mkdir -p /opt/homebrew/bin /opt/homebrew/etc /opt/homebrew/include /opt/homebrew/lib /opt/homebrew/sbin /opt/homebrew/share /opt/homebrew/varopt/homebrew/opt/opt/homebrew/share/zsh/opt/homebrew/share/zsh/site-functions/opt/homebrew/var/homebrew/opt/homebrew/var/homebrew/linked/opt/homebrew/Cellar/opt/homebrew/Caskroom/opt/homebrew/Frameworks
==> /usr/bin/sudo /bin/chmod ugarwx /opt/homebrew/bin /opt/homebrew/etc /opt/homebrew/include /opt/homebrew/lib /opt/homebrew/sbin /opt/homebrew/share /opt/homebrew/var /opt/homebrew/opt /opt/homebrew/share/zsh /opt/homebrew/share/zsh/site-functions /opt/homebrew/var/homebrew /opt/homebrew/var/homebrew/linked /opt/homebrew/Cellar
/opt/homebrew/Caskroom/opt/homebrew/Frameworks
==> /usr/bin/sudo /bin/chmod go-w/opt/homebrew/share/zsh/opt/homebrew/share/zsh/site-functions
==> /usr/bin/sudo /usr/sbin/chown copilot /opt/homebrew/bin /opt/homebrew/etc /opt/homebrew/include /opt/homebrew/lib /opt/homebrew/sbin /opt/homebrew/share /opt
/homebrew/var/opt/homebrew/opt/opt/homebrew/share/zsh/opt/homebrew/share/zsh/site-functions/opt/homebrew/var/homebrew/opt/homebrew/var/homebrew/linked/opt/homebrew/Cellar/opt/homebrew/Caskroom/opt/homebrew/Frameworks
==> /usr/bin/sudo /usr/bin/chgrp admin /opt/homebrew/bin /opt/homebrew/etc /opt/homebrew/include /opt/homebrew/lib /opt/homebrew/sbin /opt/homebrew/share /opt/homebrew/var/opt/homebrew/opt/opt/homebrew/share/zsh/opt/homebrew/share/zsh/site-functions/opt/homebrew/var/homebrew/opt/homebrew/var/homebrew/linked/opt/homebrew/Cellar/opt/homebrew/Caskroom/opt/homebrew/Frameworks
==> /usr/bin/sudo /usr/sbin/chown -R copilot:admin /opt/homebrew
==> /usr/bin/sudo /bin/mkdir -p /Users/copilot/Library/Caches/Homebrew
==> /usr/bin/sudo /bin/chmod g+rwx /Users/copilot/Library/Caches/Homebrew
==> /usr/bin/sudo /usr/sbin/chown -R copilot /Users/copilot/Library/Caches/Homebrew
==> Searching online for the Command Line Tools
==> /sr/bin/sudo /usr/bin/touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
```

### Install Chrome

Chrome is a good default browser to use when developing the community app.  You can download it and install it from [https://www.google.com/chrome/](https://www.google.com/chrome/)

### Install nvm

The Node Version Manager [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm) is used to make sure our version of Node and npm match the deployment environment.

To install nvm run this command:

* Open the Terminal app
* `brew install nvm`
* `mkdir ~/.nvm`
* Follow the steps to edit your `~/.zshrc` file shown at the end of the installation.  You can do this using VSCode.

```terminal
Last login: Thu Jul 7 16:40:44 on ttys000
copilot@topcoder-Virtual-Machine ~ % brew install nvm
==> Downloading https://ghcr.io/v2/homebrew/core/nvm/manifests/0.39.1_
######################################################### 100.0%
==>Downloadinghttps://ghcr.io/v2/homebrew/core/nvm/blobs/sha256:6014c8a2bf9421
==>Downloadingfromhttps://pkg-containers.githubusercontent.com/ghcr1/blobs/sh
######################################################### 100.0%
==> Pouring nvm--@.39.1_1.all.bottle.tar.gz
==> Caveats
Please note that upstream has asked us to make explicit managing
nvm via Homebrew is unsupported by them and you should check any
problems against the standard nvm install method prior to reporting.

You should create NVM's working directory if it doesn't exist:

   mkdir~/.nvm

Add the following to ~/.zshrc or your desired shell
configuration file:

   export NVM DIR="$HOME/.nvm"
   [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh" # This loads nvm
   [ -s "/opt/homebrew/opt/nvm/etc/bash completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash completion.d/nvm" # This loads nvm bash completion

You can set $NVM_DIR to any location, but leaving it unchanged from
/opt/homebrew/opt/nvm will destroy any nvm-installed Node installations
upon upgrade/reinstall.

Type `nvm help` for further information.
==> Summary
   /opt/homebrew/Cellar/nvm/0.39.1_1: 9 files, 184.1KB
==> Running 'brew cleanup nvm
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW NO ENV HINTS (see "man brew')

```

```sh
export NVM DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh" # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash completion.d/nvm" # This loads nvm bash completion
```

Note that after you have installed `nvm` and updated your `.zshrc` file you will need to restart your terminal app to ensure the new settings are loaded in.

You can test nvm by running:

* `nvm --version` in the terminal

```terminal
Last login: Fri Jul 8 14:10:49 on ttys000
copilot@topcoder-Virtual-Machine ~ % nvm --version
0.39.1
```
### Install python 2.7.18

You will need Python 2 to run community app.  If you are on newer macOS versions, it comes with Python 3 by default, but this will *not* work with community app.

To install Python 2 on new macOS versions (12+):

* Install the Python env manager:
  * `brew install pyenv`

```terminal
Last login: Fri Jul 8 14:10:59 on ttys000
copilot@topcoder-Virtual-Machine ~ % brew install pyenv
==> Downloading https://ghcr.io/v2/homebrew/core/m4/manifests/1.4.19
######################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/m4/blobs/sha256:89fa0d7d946f7c
==> Downloading from https://pkg-containers.githubusercontent.com/ghcr1/blobs/sh
######################################################### 100.0%
==> Downloadinghttps://ghcr.io/v2/homebrew/corelautoconf/manifests/2.71
######################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/autoconf/blobs/sha256:a3d366c98
==> Downloading from https://pkg-containers.githubusercontent.com/ghcr1/blobs/sh
######################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/ca-certificates/manifests/2022-
#=＃=＃
```

* Install Python 2:
  * `pyenv install 2.7.18`

```terminal
Last login: Fri Jul 8 14:13:11 on ttys000
copilot@topcoder-Virtual-Machine ~ % pyenv install 2.7.18
python-build: use openssl01.1 from homebrew
python-build: use readline from homebrew
Downloading Python-2.7.18.tar.xz.
=> https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tar.xz
Installing Python-2.7.18.
patching file configure
patching file configure.ac
patching file setup.py
patching file Mac/Tools/pythonw.c
patching file setup.py
patching file Doc/library/ctypes.rst
patching file Lib/test/test_str.py
patching file Lib/test/test_unicode.py
patching file Modules/_ctypes/_ctypes.c
patching file Modules/_ctypes/callproc.c
patching file Modules/_ctypes/ctypes.h
patching file Modules/_ctypes/callproc.c
patching file setup.py
patching file Mac/Modules/qt/setup.py
patching file setup.py
python-build: use readline from homebrew
python-build: use zlib from xcode sdk
```

* Tell the community app where to find the Python 2 version.  You'll need to either set this in your `.zshrc` file or run it whenever you want to build the community app:
  * `export PYTHON=$HOME/.pyenv/versions/2.7.18/bin/python`
  * `export PATH=$PATH:$HOME/.pyenv/versions/2.7.18/bin`

```sh
export NVM DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh" # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash completion.d/nvm" # This loads nvm bash completion
export PYTHON=$HOME/.pyenv/versions/2.7.18/bin/python
export PATH=$PATH: $HOME/.pyenv/versions/2.7.18/bin
```

### Hosts file update

We need to edit `/etc/hosts` to add a couple of entries.  The goal is that `local.topcoder-dev.com` will point to our local machine, to aid in login.

We will add these two lines to the end of the file:

```ini
127.0.0.1 local.topcoder-dev.com
127.0.0.1 local.topcoder.com
```

To do this, open up the `/etc/hosts` file in VSCode:

Add the lines above and then save the file, using `sudo`

```sh
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting. Do not change this entry.
##
127.0.0.1  localhost
255.255.255.255 broadcasthost
::1        localhost
127.0.0.1 local.topcoder-dev.com
127.0.0.1 local.topcoder.com
```

### Install the initial node version

The community app requires Node 8.11.2.  You can install it by running this command:

* `nvm install v8.11.2`

```terminal
Last login: Fri Jul 8 14:14:18 on ttys001
copilot@topcoder-Virtual-Machine ~ % nvm install v8.11.2
Downloading
and installing node v8.11.2.
Downloading https://nodejs.org/dist/v8.11.2/node-v8.11.2-darwin-x64.tar.xz..
#######################################                                71.4%
```

### Install the proxy and run it

We need to proxy `https` requests through a local proxy since we don't have a valid SSL key.  To do this, we use the `local-ssl-proxy` package.  You can install this in the Terminal app using these commands.

* `npm i -g local-ssl-proxy` You only have to run this once to install the package
* `local-ssl-proxy -n local.topcoder-dev.com -s 3001 -t 3000` Every time you want to run the proxy or work on the community app, you will need to run this command

**NOTE** - You should run the proxy in a *separate* Terminal window or tab, to ensure it's always running.

```terminal
Last login: Fri Jul 8 14:18:14 on ttys000
copilot@topcoder-Virtual-Machine ~ % pm i -9 local-ssl-proxy
npm WARN deprecated nomnom@1.8.1: Package no longer supported. Contact support@npmjs.com for more info.
npm WARN notice [SECURITY] underscore has the following vulnerability: 1 high. Go here for more details: https://github.com/advisories?query=underscore - Run npm i npm@latest -g to upgrade your pm version, and then `npm audit` to get more info.
/Users/copilot/.nvm/versions/node/v8.11.2/bin/local-ssl-proxy -> /Users/copilot/.nvm/versions/node/v8.11.2/lib/node_modules/local-ssl-proxy/bin/local-ssl-proxy
+ local-ssl-proxy@1.3.0
added 18 packages in 3.944s
```

```terminal
copilot@topcoder-Virtual-Machine ~ % local-ssl-proxy -n local.topcoder-dev.com
Started proxy: https://local.topcoder-dev.com:3001 > http://local.topcoder-dev.com:3000
```
### Check out the code

Now that all dependencies are set up, we can check out the code.  Note that this command will check out the community-app source code into a directory named `community-app`.

Run this command on the Git Bash command line:

`git clone https://github.com/topcoder-platform/community-app.git`

```terminal
Last login: Fri Jul 8 14:19:26 on ttys000
copilot@topdcoder-Virtual-Machine ~ % git clone https://github.com/topcoder-platform/community-app.git
Cloning into 'community-app'...
remote: Enumerating objects: 88794, done.
remote: Counting objects: 100% (1606/1606), done.
remote: Compressing objects: 100% (678/678), done
Receiving objects: 47% (41734/88794), 79.68 MiB | 19.17 MiB/s
```

### Build and run the code

Now that we have the code, we can build it on the Terminal command line.  The first `cd community-app` command just changes us to the directory we created above, after the code was cloned.

* `cd community-app`
* `nvm use` will warn you to install v8.11.2

```terminal
Last login: Fri Jul 8 14:41:06 on ttys001
copilot@topcoder-Virtual-Machine ~ % cd community-app
copilot@topcoder-Virtual-Machine community-app % nvm use
Found '/Users/copilot/community-app/.nvmrc' with version <v8.11.2>
Now using node v8.11.2 (npm v5.6.0)
copilot@topcoder-Virtual-Machine community-app %
```

Once we have the proper Node version installed (8.11.2), we will install the dependencies:

**NOTE** this is a command that will take a long time and will build numerous dependencies.  This is the command that is most likely to fail.  If you have trouble here, make sure to copy / paste the entire output of the command into the forum so the copilot can help.

* `npm i`

**NOTE** - If this appears to be stuck, try deleting the `package-lock.json` file and starting `npm i` again.  The `package-lock.json` will get regenerated as the modules are installed.

```terminal
Last login: Fri Jul 8 14:41:06 on ttys001
copilot@topcoder-Virtual-Machine ~ % cd community-app
copilot@topcoder-Virtual-Machine community-app % nvm use
Found '/Users/copilot/community-app/.nvmrc' with version <v8.11.29>
Now using node v8.11.2 (npm v5.6.0)
copilot@topcoder-Virtual-Machine community-app % npm i
((▋▋▋▋▋▋▋▋▋▋▋▋▋▋                )): loadIdealTree:loadAllDepsIntoIdealTree: sill install loadIdealTree
```

With the dependencies now successfully installed, we can build the code.  You can do this whenever you want to rebuild the app as you make changes to it.

* `npm run clean` This command cleans up any previous builds:
* `source env.sh` This command sets the environmental variables:
* `npm run build:dev`  This command builds the app
* `npm run dev` This command will start the web server

```terminal
cd Last login: Fri Jul 8 15:01:47 on ttys004
copilot@topcoder-Virtual-Machine ~ % cd community-app
copilot@topcoder-Virtual-Machine community-app % npm run clean
sour
> community-app1.0.0 clean /Users/copilot/community-app
> rimraf build

copilot@topcoder-Virtual-Machine community-app % source env.sh
copilot@topcoder-Virtual-Machine community-app % npm run build

> community-app©1.0.0 build /Users/copilot/community-app
> npm run clean && ./node_modules/.bin/webpack --env=production --progress --profile --colors --display-optimization-bailout

> community-app1.0.0 clean /Users/copilot/community-app
> rimraf build
67% building 1394/1448 modules 54 active ...core-js/modules/es7.reflect.metadata.js
```

```terminal
        ModuleConcatenation bailout: Module is not an ECMAScript module
        [29] 24712ms -> factory:305ms building:274ms = 25291ms
    [3] ./src/assets/fonts/opensans/opensans-italic-webfont.eot92 bytes {0} [built]
        ModuleConcatenation bailout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms building:274Ms = 25291ms
    [4] ./src/assets/fonts/opensans/opensans-semibold-webfont.eot92 bytes {0} [built]
       ModuleConcatenation bailout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms building:274Ms = 25291ms
    [5] ./src/assets/fonts/opensans/opensans-semibolditalic-webfont.eot92bytes{0}[built]
       ModuleConcatenation bailout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms building:274Ms = 25291ms
    [6] ./src/assets/fonts/opensans/opensans-bold-webfont.eot92 bytes {0} [built]
       ModuleConcatenation ballot: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms butlding:274Ms = 25291ms
    [7] ./src/assets/fonts/opensans/opensans-bolditalic-webfont.eot92 bytes {0} [built]
       ModuleConcatenation ballout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms butlding:274Ms = 25291ms
    [8] ./sc/assets/fonts/opensans/opensans-extrabold-webfont.eot92 bytes {0] [built]
       ModuleConcatenation ballout: Module is not an ECMAScript module
       [29] 24712ms -> factory: 305ms butlding:274Ms = 25291ms
    [9] ./src/assets/fonts/opensans/opensans-extraboldttaltc-webfont.eot92 bytes {0] [bullt]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms butlding:274Ms = 25291ms
    [10] ./src/assets/fonts/Akkurat/WiproAkkuratTT-Light.eot 92 bytes {0} [butlt]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms butlding:274Ms = 25291ms
    [11] ./src/assets/fonts/Akkurat/WiproAkkuratTTRegular.eot92 bytes {0} [butlt]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms butlding: 274Ms = 25291ms
    [12] ./src/assets/fonts/Akkurat/AkkuratMonoMono.eot 92 bytes {0} [built]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms building: 274Ms = 25291ms
    [13] ./src/assets/fonts/Akkurat/WiproAkkuratTT-Bold.eot92 bytes {0} [built]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       [29] 24712ms -> factory:305ms building: 274Ms = 25291ms
    [29] ./node modules/css-loader??ref--7-1!./node modules/postcss-loader/lib??ref--7-2!./node modules/resolve-url-loader!./nodemodules/sass-loader/dist/cjs.js??ref--7-41./src/styles/global.sess
 42.5 KiB {0} [built]
       ModuleConcatenation batlout: Module is not an ECMAScript module
       factory: 3ms building: 24709Ms = 24712ms
       + 125 hidden modules
```

### Validation

To validate, we'll run Chrome without web security to avoid it complaining about the local proxy redirects.

Open a new Terminal app window and run:

* `/Applications/Google\Chrome.app/Contents/MacOS/Google\Chrome --disable-web-security --ignore-certificate-errors --user-data-dir=/tmp/`

Once Chrome is running, you should be able to open this link and login with a test user.

* Sample test user: `jgasperMobile12` / `Appirio123`

[https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com:3001](https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com:3001)


You will need to tell Chrome to ignore the self-signed certificate warning by clicking the "Proceed to local.topcoder-dev.com" link

After successful login, you should see:

**Chrome browser**

![](./images/SuccessfulLogin.png)

**Validation**

You can also access a link on the community app page, like the one for the challenge listings:

![](./images/ChallengeListing.png)

