#!/usr/bin/env node

import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function run() {
    let stdout = ``
    let stderr = ``

    const args = process.argv.slice(2)
    const exitCode = await exec.exec(process.env.TERRAGRUNT_CLI!, args, {
        listeners: {
            stdout: (data: Buffer) => {
                stdout += data.toString()
            },
            stderr: (data: Buffer) => {
                stderr += data.toString()
            }
        },
        ignoreReturnCode: true
    })

    core.setOutput(`stdout`, stdout)
    core.setOutput(`stderr`, stderr)
    core.setOutput(`exitcode`, exitCode.toString())

    if (exitCode !== 0) {
        throw new Error(stderr)
    }
}

run().catch(error => {
    core.setFailed(error)
})
