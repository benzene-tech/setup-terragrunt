#!/usr/bin/env node

const core = require('@actions/core')
const exec = require('@actions/exec')
const Listener = require('./lib/listener')

async function run() {
    const stdout = new Listener()
    const stderr = new Listener()
    const listeners = {
        stdout: stdout.listener,
        stderr: stderr.listener
    }

    const args = process.argv.slice(2)
    const options = {
        listeners,
        ignoreReturnCode: true
    }
    const exitCode = await exec.exec(process.env.TERRAGRUNT_CLI, args, options)

    core.setOutput('stdout', stdout.contents)
    core.setOutput('stderr', stderr.contents)
    core.setOutput('exitcode', exitCode.toString(10))

    if (exitCode !== 0) {
        throw new Error(stderr.contents)
    }
}

run().catch(error => {
    core.setFailed(error)
})
