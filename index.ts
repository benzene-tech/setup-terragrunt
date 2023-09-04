import core from "@actions/core";
import github from "@actions/github";
import tc from "@actions/tool-cache";
import exec from "@actions/exec";
import io from "@actions/io";

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
    const pathToCLI = await tc.downloadTool(`https://github.com/gruntwork-io/terragrunt/releases/download/${tag}/terragrunt_${platform[process.platform as keyof Object]}_${arch[process.arch as keyof Object]}${cliSuffix}`)
    if (process.platform !== `win32`) {
        await exec.exec(`chmod u+x`, [pathToCLI], {
            silent: true
        })
    }

    const cachedPath = await tc.cacheFile(pathToCLI, `terragrunt${cliSuffix}`, `Terragrunt`, tag)
    await io.rmRF(pathToCLI)

    if (installWrapper) {
        await exec.exec(`npm link`, [], {
            silent: true
        })

        core.exportVariable(`TERRAGRUNT_CLI`, core.toPlatformPath(`${cachedPath}/terragrunt${cliSuffix}`))
    } else {
        core.addPath(cachedPath)
    }

    core.setOutput(`version`, version)
    core.setOutput(`path`, cachedPath)

    core.info(`Installed Terragrunt version: ${version}`)
}

run().catch(error => {
    core.setFailed(error)
})
