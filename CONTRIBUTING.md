# Contributing
First of all, thank you for contributing to this project! To make sure everything fits nicely into the existing code, please read this document carefully before creating a pull request.

## Implementing your changes
### Creating a fork
You first need to create a fork of the [hockey-match-calendar](https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar) repository to commit your changes to it. Methods to fork a repository can be found in the [GitHub Documentation](https://docs.github.com/en/get-started/quickstart/fork-a-repo).


### Initializing your local repository
Clone the main repository:

```sh
git clone https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar.git
```

Then, go to your local folder:

```sh
cd hockey-match-calendar
```

Add git remote controls:

```sh
git remote add fork https://github.com/YOUR-USERNAME/hockey-match-calendar.git
git remote add upstream https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar.git
```

### Receive remote updates
To fetch the latest main branch:

```sh
git pull upstream main
```

## Choose a base branch
All additions must be made with the `main` branch as base. Name your new branch as denoted in the table below.
Replace `[issue]` with the ID of the issue you're implementing/fixing.

| Type of change          | Name of branch               |
|:------------------------|:-----------------------------|
| Documentation           | `docs/[issue]-name-of-issue` |
| Bug fixes               | `bug/[issue]-name-of-issue`  |
| New features / fetchers | `feat/[issue]-name-of-issue` |


```sh
# Switch to the 'main' branch.
git switch main

# Pull the latest changes.
git pull

# Create a new branch to work on
git switch --create feat/1234-name-issue
```

Commit your changes, then push the branch to your fork with `git push -u fork` and open a pull request on the [Hockey Match Calendar repository](https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar) following the template provided.