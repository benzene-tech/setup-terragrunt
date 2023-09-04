# Setup Terragrunt

This action installs terragrunt CLI in runners.

## Usage

```yaml
- uses: benzene-tech/setup-terragrunt@v2
  with:
    # Terragrunt version to be installed. Otherwise, installs latest version
    # For example, 0.38.10
    version: ''
    # Token to get latest release.
    # Default: ${{ github.token }}
    token: ''
```

## Scenarios

- [Install latest version](#install-latest-version)
- [Install specifc version](#install-specifc-version)
- [Install using Personal access token](#install-using-personal-access-token)

### Install latest version

```yaml
- uses: benzene-tech/setup-terragrunt@v2
```

### Install specifc version

```yaml
- uses: benzene-tech/setup-terragrunt@v2
  with:
    version: 0.38.10
```

### Install using Personal access token

```yaml
- uses: benzene-tech/setup-terragrunt@v2
  with:
    token: ${{ secrets.TOKEN }}
```
