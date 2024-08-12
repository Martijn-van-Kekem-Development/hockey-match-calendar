# Hockey Match Calendar
This script automatically pulls past, active, and upcoming matches from various sources and converts them into neat ics-files for you to subscribe to.

## How does this work?
The script automatically fetches all past, in progress, and upcoming competitions from the configured sources, together with the matches that belong to that competition.
The script will generate an .ics file for every competition separately, and a big .ics file containing all (men's/women's) matches.

Do not import the .ics file manually, rather subscribe to the calendar, so you'll receive updates.
The script will append a checkmark and the final score to matches that have been completed.

## Creating the calendar files
1. Run `npm install`.
2. Run `npm run fetch [fetcher-id]` or `npm run fetch-all` to create the files for all fetchers.
3. Run `npm run save-fetchers`.

The files will now be generated under `./docs/ics/[fetcher-id]`

## Adding your own sources
Adding your own sources is as easy as following the steps below:
1. Make sure your intended fetcher exists in `./src/Fetchers` and that your fetcher implements the abstract `Fetcher` class.
2. Add your fetcher to the `fetchers()` method in `./src/Main.ts`, making sure it has a unique ID.
3. Follow the steps below [Creating the calendar files](#creating-the-calendar-files).

## Getting started
Visit [this link](https://hockeycal.vankekem.com) to view all available .ics calendars.
Copy the link of the calendar you want to subscribe to and add it to the calendar client of your liking.

## Support
If you appreciate the work I've done on this project and want to buy me a coffee, you can [click here](https://buymeacoffee.com/martijnvankekem).
