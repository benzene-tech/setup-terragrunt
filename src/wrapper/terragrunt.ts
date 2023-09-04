#!/usr/bin/env node

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import {Listener} from "../lib/listener"

async function run() {
    const stdout = new Listener()
    const stderr = new Listener()
    const listeners = {
        stdout: stdout.listener,
        stderr: stderr.listener
    }

    const args = process.argv.slice(2)
    const exitCode = await exec.exec(process.env.TERRAGRUNT_CLI!, args, {
        listeners,
        ignoreReturnCode: true
    })

    core.setOutput(`stdout`, stdout.contents)
    core.setOutput(`stderr`, stderr.contents)
    core.setOutput(`exitcode`, exitCode.toString(10))

    if (exitCode !== 0) {
        throw new Error(stderr.contents)
    }
}

run().catch(error => {
    core.setFailed(error)
})
