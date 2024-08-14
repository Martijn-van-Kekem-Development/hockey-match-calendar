# Contributing

## Introduction
Hockey Match Calendar (short: HMC) is an application that fetches hockey matches from various sources, and combines
these matches into `.ics` files that can be subscribed to by hockey fans.

If you're reading this document, you're probably interested in contributing to this project. We very much appreciate this effort!
Please read the document outlined below carefully, to make sure your contributions are consistent with the existing code base.

## Explanation of the existing code
### Fetching matches
Matches are fetched by a class that extends the abstract [`Fetcher`](./src/Fetchers/Fetcher.ts) class. 
This fetcher class must implement the `fetch()` method, where the data is fetched from the source and parsed into one 
or more [`Competition`](./src/Objects/Competition.ts) classes, containing zero or more [`Match`](./src/Objects/Match.ts) objects.

### Defining fetchers
The available fetchers are defined in [`Main`](./src/Main.ts) by adding them to the `fetchers()` method. Each fetcher
must have a unique ID and base URL and a (not necessarily unique) name, index.

### Abbreviations
By default, each calendar event title will have the following format:

`🏑 OG W01 | Netherlands - China`

Here:
- `🏑` denotes the icon. This is a 🏑 for future matches, and a ✅ for completed matches.
- `OG` denotes the competition abbreviation. See below.
- `W01` denotes the match type abbreviation. See below.
- `Netherlands - China` denotes the home- and away playing team.

#### Competition abbreviations
The competition that a match is part of is abbreviated and included in the title of each calendar event.
These are specified in [`competition-abbreviations.json`](./includes/competition-abbreviations.json) 
where the key is a regex string and the value is the resulting abbreviation.

Each competition abbreviation must have one or more corresponding entries in the 
[`./tests/includes/competition-abbreviations.json`](./tests/includes/competition-abbreviations.json) file, 
where the competition title is specified as the `in` key, and the correct abbreviation is specified as the `out` key.

If no corresponding abbreviation is found, the first letter of each word will be used to abbreviate the competition.

#### Match type abbreviations
By default, a match will be denoted in the form of `MXX` or `WXX`, with `M` for Men's matches, and `W` for Women's matches.
`XX` denotes the index of a match in the competition.

Custom match type abbreviations can be specified in [`match-type-abbreviations.json`](./includes/match-type-abbreviations.json)
where the key is a regex string and the value is the resulting abbreviation.

Each match type abbreviation must have one or more corresponding entries in the
[`./tests/includes/match-type-abbreviations.json`](./tests/includes/match-type-abbreviations.json) file, 
where the match title is specified as the `in` key, and the correct abbreviation is specified as the `out` key.

## Setup your environment
You first need to create a fork of the [hockey-match-calendar](https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar) repository to commit your changes to it. Methods to fork a repository can be found in the [GitHub Documentation](https://docs.github.com/en/get-started/quickstart/fork-a-repo).

After that, clone the repository:
```sh
git clone https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar && cd hockey-match-calendar
```

Add git remote controls:

```sh
git remote add fork https://github.com/YOUR-USERNAME/hockey-match-calendar.git
git remote add upstream https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar.git
```

Install the required dependencies:
```sh
npm install
```

### Choose a base branch
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

## Creating the calendar files
#### Run all fetchers
```sh
npm run fetch-all
```

#### Run a specific fetchers
```sh
npm run fetch [fetcher-id]
```

The created calendar files will be placed in `./docs/ics/[fetcher-id]`.

**Warning**: if you're using the website, make sure to save the fetchers if you've changed any of them:
```sh
npm run save-fetchers
```

## Publishing your contributions
As soon as you have completed implementing your contributions, follow the steps below.

First, make sure all test cases are passing.
```sh
npm test
```
Secondly, verify that the linter returns no errors.
```sh
npm lint
```

After that, make sure an issue exists for the contribution you're making. If that's not the case, create one 
first [here](https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar/issues).

Finally, create a pull request [here](https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar/pulls)
to merge your branch into main.

## Support
If you have any questions or problems while contributing to this project, feel free to ask a question on the 
[issue page](https://github.com/Martijn-van-Kekem-Development/hockey-match-calendar/issues) for this repository.