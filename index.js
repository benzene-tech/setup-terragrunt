const core = require('@actions/core')
const github = require('@actions/github')
const tc = require('@actions/tool-cache')
const { execSync } = require("child_process")

async function run() {
    try {
        const platform = {
            linux: 'linux',
            darwin: 'darwin',
            win32: 'windows'
        };

        const arch = {
            x64: 'amd64',
            arm64: 'arm64'
        }

        const token = core.getInput('token')
        if (token === '')
            throw new Error('token undefined')

        version = core.getInput('version')
        if (version === '') {
            const octokit = github.getOctokit(token)

            version = await octokit.rest.repos.getLatestRelease({
                owner: 'gruntwork-io',
                repo: 'terragrunt'
            }).then(result => {
                return result.data.tag_name
            })
        }
        else
            version = `v${version}`

        const terragruntPath = tc.find('Terragrunt', version);
        if (terragruntPath !== '') {
            core.info(`terragrunt with ${version} already installed`)
            core.addPath(terragruntPath);
            return
        }

        const suffix = process.platform === 'win32' ? '.exe' : ''
        const pathToCLI = await tc.downloadTool(`https://github.com/gruntwork-io/terragrunt/releases/download/${version}/terragrunt_${platform[process.platform]}_${arch[process.arch]}${suffix}`)

        if (process.platform !== 'win32')
            execSync(`chmod u+x ${pathToCLI}`)

        const cachedPath = await tc.cacheFile(pathToCLI, `terragrunt${suffix}`, 'Terragrunt', version)
        core.addPath(cachedPath)

        core.setOutput('version', version)
    }
    catch (error) {
        core.setFailed(error.message)
    }
}

run()
