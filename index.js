const core = require('@actions/core')
const github = require('@actions/github')
const tc = require('@actions/tool-cache')
const exec = require('@actions/exec')
const fs = require("fs")

async function run() {
    const platform = {
        linux: 'linux',
        darwin: 'darwin',
        win32: 'windows'
    }
    const arch = {
        x64: 'amd64',
        arm64: 'arm64'
    }

    const token = core.getInput('token')

    let version = core.getInput('version')
    if (!version) {
        const octokit = github.getOctokit(token)

        version = await octokit.rest.repos.getLatestRelease({
            owner: 'gruntwork-io',
            repo: 'terragrunt'
        }).then(result => {
            return result.data.tag_name
        })
    } else {
        version = `v${version}`
    }

    const terragruntPath = tc.find('Terragrunt', version)
    if (terragruntPath !== '') {
        core.notice(`terragrunt with ${version} already installed`)
        core.addPath(terragruntPath)
        return
    }

    const suffix = process.platform === 'win32' ? '.exe' : ''
    const pathToCLI = await tc.downloadTool(`https://github.com/gruntwork-io/terragrunt/releases/download/${version}/terragrunt_${platform[process.platform]}_${arch[process.arch]}${suffix}`)
    if (process.platform !== 'win32') {
        await exec.exec('chmod u+x', [pathToCLI], {
            silent: true
        })
    } else {
        fs.renameSync(pathToCLI, `${pathToCLI}${suffix}`)
    }
    core.exportVariable('TERRAGRUNT_CLI', pathToCLI)

    const cachedPath = await tc.cacheFile(`${__dirname}/wrapper/dist/index.js`, `terragrunt`, 'Terragrunt', version)
    core.addPath(cachedPath)

    core.setOutput('version', version)
}

run().catch(error => {
    core.setFailed(error)
})
