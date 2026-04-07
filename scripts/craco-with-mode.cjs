#!/usr/bin/env node
/**
 * Invokes craco with --mode derived from LOGICAL_ENV with sane defaults.
 * Bash parameter expansion (${VAR:-default}) in package.json does not run on Windows CMD/PowerShell,
 * which breaks craco-plugin-env and leads to a blank page / failed bundle load.
 */
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')

function getCracoCli() {
    return require.resolve('@craco/craco/dist/bin/craco.js')
}

const action = process.argv[2]

if (!action || !['start', 'build', 'build-dev'].includes(action)) {
    process.stderr.write('Usage: node scripts/craco-with-mode.cjs <start|build|build-dev>\n')
    process.exit(1)
}

const mode = process.env.LOGICAL_ENV
    || (action === 'start' || action === 'build-dev' ? 'dev' : 'prod')

const env = { ...process.env }
if (action === 'build') {
    env.CI = 'false'
}
if (action === 'start') {
    // Serve at https://local.topcoder-dev.com (add 127.0.0.1 local.topcoder-dev.com to hosts if needed).
    env.HOST = 'local.topcoder-dev.com'
    // Respect HTTPS setting from environment (set by start.sh)
    if (!env.HTTPS) {
        env.HTTPS = 'true'
    }
    // Respect PORT setting from environment (set by start.sh to 443)
    if (!env.PORT) {
        env.PORT = '443'
    }
}

const cracoArgs = action === 'start'
    ? ['start', '--mode', mode]
    : ['build', '--mode', mode]

const result = spawnSync(process.execPath, [getCracoCli(), ...cracoArgs], {
    cwd: root,
    env,
    stdio: 'inherit',
})

process.exit(result.status === null ? 1 : result.status)
