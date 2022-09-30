const core = require('@actions/core');
const { execSync } = require("child_process");
const { homedir } = require('os');

try {
    core.addPath('/home/linuxbrew/.linuxbrew/bin')
    execSync('brew install terragrunt');
}
catch (error) {
    core.setFailed(error.message);
}
