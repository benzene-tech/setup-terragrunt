const core = require('@actions/core')
const github = require('@actions/github')
const tc = require('@actions/tool-cache')
const exec = require('@actions/exec')
const io = require('@actions/io')

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

    const suffix = process.platform === `win32` ? `.exe` : ``
    const pathToCLI = await tc.downloadTool(`https://github.com/gruntwork-io/terragrunt/releases/download/${tag}/terragrunt_${platform[process.platform]}_${arch[process.arch]}${suffix}`)
    if (process.platform !== `win32`) {
        await exec.exec(`chmod u+x`, [pathToCLI], {
            silent: true
        })
    }

    const sourceFile = installWrapper ? `${__dirname}/wrapper/dist/index.js` : pathToCLI
    const cachedPath = await tc.cacheFile(sourceFile, `terragrunt${suffix}`, `Terragrunt`, tag)
    core.addPath(cachedPath)

    if (installWrapper) {
        core.exportVariable(`TERRAGRUNT_CLI`, pathToCLI)
    } else {
        await io.rmRF(pathToCLI)
    }

    core.setOutput(`version`, version)

    core.info(`Installed Terragrunt version: ${version}`)
}

run().catch(error => {
    core.setFailed(error)
})
