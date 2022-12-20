const core = require('@actions/core')
const github = require('@actions/github')
const tc = require('@actions/tool-cache')
const exec = require('@actions/exec')
const io = require('@actions/io')
const Listener = require('./lib/listener')

async function run() {
    const platform = {
        linux: `linux`,
        darwin: `darwin`,
        win32: `windows`
    }
    const arch = {
        x64: `amd64`,
        arm64: `arm64`
    }

    const token = core.getInput(`token`)
    const installWrapper = core.getBooleanInput(`install_wrapper`)

    const octokit = github.getOctokit(token)

    let tag = core.getInput(`version`)
    let version
    if (!tag) {
        const release = await octokit.rest.repos.getLatestRelease({
            owner: `gruntwork-io`,
            repo: `terragrunt`
        }).then(result => {
            return {
                tag: result.data.tag_name,
                version: result.data.name
            }
        })
        tag = release.tag
        version = release.version
    } else {
        tag = `v${tag}`
        version = octokit.rest.repos.getReleaseByTag({
            owner: `gruntwork-io`,
            repo: `terragrunt`,
            tag: tag
        }).then(result => {
            return result.data.name
        })
    }

    const terragruntPath = tc.find(`Terragrunt`, tag)
    if (terragruntPath !== ``) {
        core.notice(`terragrunt with ${tag} already installed`)
        core.addPath(terragruntPath)
        return
    }

    const cliSuffix = process.platform === `win32` ? `.exe` : ``
    const pathToCLI = await tc.downloadTool(`https://github.com/gruntwork-io/terragrunt/releases/download/${tag}/terragrunt_${platform[process.platform]}_${arch[process.arch]}${cliSuffix}`)
    if (process.platform !== `win32`) {
        await exec.exec(`chmod u+x`, [pathToCLI], {
            silent: true
        })
    }

    const stdout = new Listener()
    const stderr = new Listener()
    const listeners = {
        stdout: stdout.listener,
        stderr: stderr.listener
    }
    if (installWrapper) {
        await exec.exec(`npm link`, [], {
            silent: true
        })
        const exitCode = await exec.exec(`npm prefix`, [`-g`], {
            listeners,
            ignoreReturnCode: true
        })
        if (exitCode !== 0) {
            throw new Error(stderr.contents)
        }
        await exec.exec(`gci ${stdout.contents.trim()}`, [])

        core.exportVariable(`TERRAGRUNT_CLI`, pathToCLI)
    }

    const wrapperPathSuffix = process.platform === `win32` ? `\\terragrunt.cmd` : `/bin/terragrunt`
    const sourceFile = installWrapper ? `${stdout.contents.trim()}${wrapperPathSuffix}` : pathToCLI
    const wrapperSuffix = process.platform === `win32` ? `.cmd` : ``
    const targetFile = installWrapper ? `terragrunt${wrapperSuffix}` : `terragrunt${cliSuffix}`
    const cachedPath = await tc.cacheFile(sourceFile, targetFile, `Terragrunt`, tag)
    core.addPath(cachedPath)

    if (!installWrapper) {
        await io.rmRF(pathToCLI)
    }
    core.setOutput(`version`, version)
    core.info(`Installed Terragrunt version: ${version}`)
}

run().catch(error => {
    core.setFailed(error)
})
