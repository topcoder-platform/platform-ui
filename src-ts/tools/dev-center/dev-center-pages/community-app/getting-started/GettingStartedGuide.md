# Community app

The community app is the web application that is a main part of the Topcoder website, including things like profile and challenge listings.  
This document covers the Windows 10 setup of the development environment in detail.

## Install Visual Studio Community 2013

[https://my.visualstudio.com/Downloads?q=visual%20studio%202013](https://my.visualstudio.com/Downloads?q=visual%20studio%202013)

When installing

* You can uncheck the "Join the Visual Studio Experience Improvement Program"
* You only need to check "Microsoft Foundation Classes for C++" on the optional features selection screen

![](./images/VSCommunity0.png)
![](./images/VSCommunity1.png)
![](./images/VSCommunity2.png)
![](./images/VSCommunity3.png)

## Install VS Code

[https://code.visualstudio.com](https://code.visualstudio.com)

You can use the default options when installing VS Code.


## Install Git

[https://git-scm.com/download/win](https://git-scm.com/download/win)

When installing:

* Check checkbox for "Add a Git Bash Profile to Windows Terminal" (step 3)
* Use VS Code as Git's default editor (step 5)
* Checkout as-is commit as-is (step 10)
* Enable both experimental options (step 15)

![](./images/Git1.png)
![](./images/Git2.png)
![](./images/Git3.png)
![](./images/Git4.png)
![](./images/Git5.png)
![](./images/Git6.png)
![](./images/Git7.png)
![](./images/Git8.png)
![](./images/Git9.png)
![](./images/Git10.png)

## Install Python 2.7.18

[https://www.python.org/downloads/release/python-2718/](https://www.python.org/downloads/release/python-2718/)

You can install with the default options (shown below)

![](./images/Python1.png)
![](./images/Python2.png)
![](./images/Python3.png)
![](./images/Python4.png)
![](./images/Python5.png)


## Install NVM

After Git has been installed, run the "Git Bash" program from your start menu.

This will load the Git Bash command line, which is what we will use for all command line work going forward.

You will install NVM (https://github.com/nvm-sh/nvm) using this command.  You can copy / paste this onto the Git Bash command line and hit "Enter" to run it:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

## Edit the aliases file

The Git Bash program uses an "aliases" file for some initialisation of the shell.  We need to make changes to it so that:

* Python can be executed
* NVM works as expected

We will add these 3 lines underneath the `alias ll='ls -l'` line:

```sh
alias python='winpty C: \\Python27\\python-exe"
export NVM DIR="$HOME/.nvm"
[-s"$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
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

### Aliases Validation

To validate the aliases changes, you will restart Git Bash, which will cause it to read in the new changes.  You should be able to execute these commands without error:

```terminal
python --version
```


```terminal
nvm --version
```

The output should look like this:

```terminal
jmgas@DESKTOP-CEFAE6N MINGW64 ~
$ python --version
Python 2.7.18

jmgas@DESKTOP-CEFAE6N MINGW64 ~
$ nvm --version
0.39.1

jmgas@DESKTOP-CEFAE6N MINGW64 ~
$
```

## Hosts file update

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

## Install the proxy and run it

We need to proxy `https` requests through a local proxy since we don't have a valid SSL key.  To do this, we use the `local-ssl-proxy` package.  You can install this in the Git Bash application using this command.

* `npm i -g local-ssl-proxy` You only have to run this once to install the package
* `local-ssl-proxy -n local.topcoder-dev.com -s 443 -t 3000` Every time you want to run the proxy or work on the community app, you will need to run.  You will need to grant the proxy admin access.

**NOTE** - You should run the proxy in a *separate* Git Bash window, to ensure it's always running.

```terminal
jmgas@DESKTOP-CEFAE6N MINGW64
$ pm i -g local-ss1-proxy
npm WARN deprecated nomnom@1.8.1: Package no longer supported. contact support@npmjs.com for more info.
npm WARN notice [SECURITY] underscore has the following vulnerability: 1 high. Go here for more details: https://github.com/advisories?query=underscore - Run `npm i npm@latest -g` to upgrade your pm version, and then `npm audit` to get more info.
c: lusers\jmgas\.num\versions\node\v8.11.2\bin\local-ss1-proxy
->
C:\Users\jmgas\.nvm\versions\node\v8.11.2\bin\node_modules\local-ssl-proxy\bin\local-ssl-proxy + local-ss1-proxv@1.3.0
added 18 packages in 3.321s

jmgas@DESKTOP-CEFAE6N MINGW64 ~
$ local-ss1-proxy -n local.topcoder-dev.com -s 443 -t 3000
Started proxy: https://local.topcoder-dev.com: 443 -> http://local.topcoder-dev.com:3000
```

## Check out the code

Now that all dependencies are set up, we can check out the code.  Note that this command will check out the community-app source code into a directory named `community-app`.

Run this command on the Git Bash command line:

```terminal
git clone https://github.com/topcoder-platform/community-app.git
```

```terminal
jmgas@DESKTOP-CEFAE6N MINGW64
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

jmgas@DESKTOP-CEFAE6N MINGW64 ~
$
```

## Build the code

Now that we have the code, we can build it on the Git Bash command line.  The first `cd community-app` command just changes us to the directory we created above, after the code was cloned.

* `cd community-app`
* `nvm use` will warn you to install v8.11.2
* `nvm install v8.11.2`

```terminal
jmgas@DESKTOP-CEFAE6N MINGW64
$ nvm use
Found '/c/Users/jmgas/community-app/.nvmrc' with version <v8.11.2>
N/A: version "V8.11.2 -> N/A" is not yet installed.

You need to run "nvm install v8.11.2" to install it before using it.

jmgas@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ nvm install v8.11.2
Downloading and installing node v8.11.2...
Downloading https://nodejs.org/dist/v8.11.2/node-v8.11.2-win-x64.zip...
######################################################################## 100.0%
Computing checksum with sha256sum
Checksums matched!Now using node v8.11.2 (npm v5.6.0)
Creating default alias: default -> v8.11.2

jmgas@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ node --version
v8.11.2
```


Once we have the proper Node version installed (8.11.2), we will install the dependencies:

**NOTE** this is a command that will take a long time and will build numerous dependencies.  This is the command that is most likely to fail.  If you have trouble here, make sure to copy / paste the entire output of the command into the forum so the copilot can help.

```terminal
npm i
```

```terminal
> sharp@o.20.8 install c: \users\jmgas\community-app\node_modules\sharp
(node install/libvips && node install/d11-copy && prebuild-install)I1 (node-gyp rebuild && node install/d11-copy)

info sharp Downloading https://github.com/lovell/sharp-libvips/releases/download/v8.6.1/libvips-8.6.1-win32-x64.tar.gz
info sharp creating c: \users\jmgas\community-app\node_modules\sharp\build\Release
info sharp Copying DLLs from C: \Users\jmgas\ community-app\node_modules \sharp\vendor\lib to c: \users\jmgas\ community-app\node_modules\sharp\build\Release

> core-js@2. 6.11 postinstall c: \Users\jmgas\ community-app\node _modules\ core-js
> node -e "try{require('./postinstall'›}catch(e)(]"

Thank you for using core-js (https://github.com/zloirock/core-js) for polyfilling Javascript standard library!

The project needs your help! Please consider supporting of core-js on Open collective or Patreon:
> https://opencollective.com/core-js
> https://www.patreon.com/zloirock

Also, the author of core-js (https://github.com/zloirock) is looking for a good job -)

note-1: Pursfiedufreet;pasalhsalyssFea/ka)community-app/lnode_modules.lcore-js-pure
> core-js@2.6.11 postinstall c: \users\jmgas\ community-app\node_modules \tc-ui \node_modules\attr-accept \node_modules \core-js
> node -e "try{require('./postinstall ')}catch(e) {}

> husky@4. 2.5 postinstall c: \Users\jmgas\community-app\node_modules \husky
> opencollective-postinstall I| exit 0

Thank you for using husky!
If you rely on this package, please consider supporting our open collective:
> https://opencollective.com/husky/donate

> node-sass4.14.1 postinstall c: \users\jmgas\community-app\node_modules\node-sass
> node scripts/build.js

Binary found at C: \Users\jmgas\community-app\node_modules\node-sass\vendor\win32-x64-57\binding.node
Testing binary
Binary is fine
(node: 3828) MaxListenersExceededwarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added. Use emitter.setMaxListeners () to increase limit

> community-app@1.0.0 postinstall c: \Users \jmgas \ community-app
> rimraf node _modules/navigation-component/node_modules/topcoder-react-utils && rimraf node_modules/topcoder-react-ui-kit/node_modules/topcoder-react-utils

npm WARN optional SKIPTING OPTZONAL DEPENDENCY: Fsevents@2. 1. 3 (node, nodules watchpack\node modules\fsevent:)
npm WARN notsup SKIPPING.OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.3: wanted {"os":"darwin", "arch", "any"} (current: {"os":"win32":"arch":"x64"})
npm WARN optional SKIPTING OPTZONAL DEPENDENCY: Fsevents@2. 1. 3 (node, nodules\fsevent:)
npm WARN notup SKIPPING.OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.3: wanted {"os":"darwin", "arch", "any"} (current: {"os":"win32":"arch":"x64"})

added 2976 packages in 488.193s

jmgas@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$
```

With the dependencies now successfully installed, we can build the code.  You can do this whenever you want to rebuild the app as you make changes to it.

* `npm run clean` This command cleans up any previous builds:
* `source env.sh` This command sets the environmental variables:
* `./node_modules/.bin/webpack --env=development --progress --profile --colors`  This command builds the app
* `npm run` This command will start the web server

```terminal
jmgas@DESKTOP-CEFAE6N MINGW64 ~
$ cd community-app

jmgas@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ npm run clean
> community-app@1.0.0 clean C:\Users\jmgas\community-app
> rimraf build

jmgas@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ export NODE_CONFIG_ENV=development

jmgas@DESKTOP-CEFAE6N MINGW64 ~/community-app (develop)
$ ./node_modules/.bin/webpack--env=development --progress--profile --colors 36% building 221/255 modules 34 active ...app\node_modules\object-assign\index.js
```


## Validation

To validate, we'll run Chrome without web security to avoid it complaining about the local proxy redirects.

Open a new Git Bash prompt and run:

* `C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-gpu --disable-features=IsolateOrigins,site-per-process --user-data-dir="C://ChromeDev`

Once Chrome is running, you should be able to open this link and login with a test user.

* Sample test user: `jgasperMobile12` / `Appirio123`

[https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com](https://accounts-auth0.topcoder-dev.com/?retUrl=https://local.topcoder-dev.com)


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

::ffff: 127.0.0.1 > Authenticated as: ("https://topcoder-dev.com/roles": ["Topcoder User"], . "https: //topc oder-dev.com/userId": "88778088". ."https://topcoder-dev.com/handle" "jgaspermobile12" ev.com/user_id": "autho|88778088" "https://topcoder-dev.com/tcsso" "https://topcoder "88778088) 83dddf57fe737e45425da484c€6 d26e262b44810ba944668c61f8f42f47e94" lockIP ': false, "nickname' "jgaspermobile12 "https://topcoder-dev.com/active".true,"https://topcoder-dev.com/l "name" "jmgasper+mobile12@gmail.com "picture" "https://s.g avatar.com/avatar/5dzf2479df25f71bb56e3cbc160714c6?5=480&r=pg&d=https%3A%2F%2Fcdn.autho. com%2Favatars Egm.pna,iss" "updated_at' ''2022-06-21T04:08:23.9202"
"email" "jmgasper+mobile12@gmail.com' "sub" "autho|88778088" "aud": "email verified
::ffff:127.0.0.1 > 200 GET / 4023.838 ms - https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36

::ffff:127.0.0.1 > Reauth scheduled in 86367.528 seconds
::ffff:127.0.0.1 > 200 POST /community-app-assets/api/logger 0.854 ms - https://local.topcoder-dev.com/Mozilla/5.0 (windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) chrome/102/0/0/0 Safari/537.36
```

You can also access a link on the community app page, like the one for the challenge listings:

![](./images/ChallengeListing.png)
