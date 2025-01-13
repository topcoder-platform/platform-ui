# Work Manager Dev Guide

The Work Manager is a part of the Topcoder website for creating and managing challenges. This document covers the Windows 10, Linux and MacOS setup of the development environment in detail.

## Local setup for work manager

### Install VS Code

[https://code.visualstudio.com/Download](https://code.visualstudio.com/Download)

You can use the default options when installing VS Code.



### Install Git

Before you begin contributing to the project, you'll need to have Git installed on your local machine. It’s essential for working in the community and contributing to the repository.

Follow the installation guides below for your operating system: 

#### For Windows:

1. **Download the Git Installer:**
   - Visit the [Windows Git Installation Guide](https://git-scm.com/downloads/win).
   - Click the link to download the Git installer.
   
2. **Run the Installer:**
   - Launch the downloaded installer and follow the installation wizard. You can usually accept the default settings, but make sure to select the option to add Git to your system PATH during installation. This makes Git accessible from any command prompt window.

3. **Verify the Installation:**
   - After installation is complete, open a command prompt or Git Bash and type the following command to check if Git was installed correctly:
     ```
     git --version
     ```
   - If Git is installed properly, you’ll see a version number displayed.

#### For Linux:

1. **Install Git via Package Manager:**
   - Most Linux distributions come with Git available in their package manager. You can install it by running one of the following commands based on your distribution:
     
     **For Ubuntu/Debian-based systems:**
     ```
     sudo apt update
     sudo apt install git
     ```

     **For Fedora:**
     ```
     sudo dnf install git
     ```

     **For CentOS/RHEL:**
     ```
     sudo yum install git
     ```

2. **Verify the Installation:**
   - Once Git is installed, open a terminal and run the following command to verify the installation:
     ```
     git --version
     ```
   - You should see the Git version number displayed in the terminal.

Make sure to check your installation after following these steps to confirm everything is set up correctly.

### Install NVM

Use the node version manager [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to easily and safely manage the required version of NodeJS (aka, node). Download and install it per the instructions for your development operating system. Installing a version of node via `nvm` will also install `npm`.

> **NOTE:** If the nvm command is not working it might be because the installation failed to update your paths variable properly. To try and fix this try installing nvm again using sudo.
Once nvm is installed, run:

```sh
nvm install <insert node version>
```

See [the nvm Github README](https://github.com/nvm-sh/nvm/blob/master/README.md#nvmrc) for more information on setting this up.

To validate the nvm, node or npm versions, you can try this in terminal:

```terminal
nvm --version
```

The output should look like this:

```terminal
copilot@DESKTOP-CEFAE6N MINGW64 ~
$ nvm --version
0.39.1

copilot@DESKTOP-CEFAE6N MINGW64 ~
$
```

### Hosts file update

For windows, open the file `C:\Windows\System32\drivers\etc\hosts` in VS Code.  We will add these two lines to the end of the file:

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

For mac and linux, the hosts file is normally located at `/etc/hosts` and we add the same two lines to that file as well.

This is how it should like:

```sh
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1	localhost
255.255.255.255	broadcasthost
::1             localhost
127.0.0.1       local.topcoder-dev.com
127.0.0.1       local.topcoder.com
```

### Check out the code

Now that all dependencies are set up, we can check out the code.  Note that this command will check out the work-manager source code into a directory named `work-manager`.

Run this command on the Git Bash command line:

```terminal
git clone https://github.com/topcoder-platform/work-manager.git
```

```terminal
copilot@DESKTOP-CEFAE6N MINGW64
$ git clone https://github.com/topcoder-platform/work-manager.git
Cloning into 'work-manager'...
remote: Enumerating objects: 9974, done.
remote: Counting objects: 100% (1507/1507), done.
remote: Compressing objects: 100% (507/507), done.
remote: Total 9974 (delta 1162), reused 1027 (delta 1000), pack-reused 8467 (from 3)
Receiving objects: 100% (9974/9974), 4.89 MiB | 2.82 MiB/s, done.
Resolving deltas: 100% (6727/6727), done.

copilot@DESKTOP-CEFAE6N MINGW64 ~
$
```

### Build and run the code

Now that we have the code, we can build it on the VS code terminal.  
The first `cd community-app` command just changes us to the directory we created above, after the code was cloned. 
At the root of the project directory you'll notice a file called `.nvmrc` which specifies the node version used by the project. The command `nvm use` will use the version specified in the file if no version is supplied on the command line.

* `cd work-manager`
* `nvm use` will warn you to install v12.17.0
* `nvm install v12.17.0`

```terminal
$nvm use
Found '/c/Users/copilot/work-manager/.nvmrc' with version <12.17.0>
Now using node v12.17.0 (npm v6.14.4)
```

Once we have the proper Node version installed (12.17.0), we will install the dependencies:

```terminal
npm i 
```
Once the dependencies have installed we run the app:
```terminal
npm run dev
```


### Install the proxy and run it

We need to proxy `https` requests through a local proxy since we don't have a valid SSL key.  To do this, we use the `local-ssl-proxy` package.  You can install this using this command.

* `npm i -g local-ssl-proxy` You only have to run this once to install the package
* `local-ssl-proxy -n local.topcoder-dev.com -s 443 -t 3000` Every time you want to run the proxy or work on the community app, you will need to run.  You will need to grant the proxy admin access.

**NOTE** - You should run the proxy in a *separate* terminal window, to ensure it's always running.

```terminal
$ npm i -g local-ss1-proxy
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

### Validation

To validate, we'll run Chrome without web security to avoid it complaining about the local proxy redirects. It will redirect you the login page where you can use the sample test user to login.

* Sample test user: `jcori` / `Appirio123`
