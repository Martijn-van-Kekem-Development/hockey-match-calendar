let fetchers = {};
const origins = {};
let activeOrigin = null;

/**
 * When the copy URL link is clicked
 * @param evt The event that fired
 * @param tableRow The table row where the link was clicked in.
 * @returns {Promise<void>}
 */
async function copyURL(evt, tableRow) {
    evt.preventDefault();
    await navigator.clipboard.writeText(evt.target.href);

    // Temporarily change text to a check mark to indicate success.
    const currentText = evt.target.textContent;
    evt.target.textContent = "Copied!";
    evt.target.classList.add("copied");
    setTimeout(() => {
        evt.target.textContent = currentText
        evt.target.classList.remove("copied");
    }, 1500);

    gtag('event', 'calendar_download', {
        cal_path: evt.target.getAttribute("href"),
        cal_url: evt.target.href,
        origin_id: location.hash.substring(1),
        cal_name: tableRow.firstChild.textContent
    });
}

/**
 * Create a new table row.
 * @param data The row data.
 * @returns {HTMLTableRowElement}
 */
function createTableRow(data) {
    let tableRow = document.createElement("tr");

    let nameCol = document.createElement("td");
    nameCol.textContent = data.name ?? "";
    tableRow.append(nameCol);

    let matchesCol = document.createElement("td");
    matchesCol.innerHTML = `${data.count}`;
    tableRow.append(matchesCol);

    let urlCol = document.createElement("td");
    let copyEl = document.createElement("a");
    copyEl.href = `${data.path}`;
    copyEl.addEventListener("click", e => copyURL(e, tableRow));
    copyEl.textContent = "Copy URL";
    urlCol.append(copyEl);
    tableRow.append(urlCol);

    return tableRow;
}

/**
 * When an origin is clicked.
 * @param e
 * @param origin
 */
function onOriginClick(e, origin) {
    // Clear hash if button was already active
    if (origin.id === window.location.hash.substring(1)) {
        e.preventDefault();
        e.stopPropagation();
        window.location.hash = "";
    }
}

/**
 * Add the origin buttons to the DOM.
 */
async function addOriginButtons() {
    fetchers = await (await fetch("ics/fetchers.json")).json();

    const container = document.getElementById("container_originButtons");
    container.innerHTML = "";

    let originData = Object.values(fetchers).sort((a,b) =>
        (a.index ?? 0) - (b.index ?? 0) || a.name.localeCompare(b.name));

    for (let origin of originData) {
        const listEl = document.createElement("li");
        const linkEl = document.createElement("a");

        const fullNameEl = document.createElement("span");
        fullNameEl.classList.add("full");
        const abbreviationEl = document.createElement("span");
        abbreviationEl.classList.add("abbr");

        fullNameEl.textContent = `${origin.name} (${origin.abbreviation})`;
        abbreviationEl.textContent = origin.abbreviation;

        listEl.setAttribute("data-id", origin.id);
        linkEl.append(fullNameEl, abbreviationEl);
        linkEl.href = `#${origin.id}`;
        linkEl.addEventListener("click", e => onOriginClick(e, origin))

        listEl.append(linkEl);
        container.append(listEl);
    }

    // Remove loading spinner
    document.getElementById("container_origin").classList.remove("loading");

    window.addEventListener("hashchange",
        () => selectOrigin(location.hash.substring(1), true));

    if (fetchers[location.hash.substring(1)])
        // Fetcher in URL exists, so open that.
        await selectOrigin(location.hash.substring(1));
    else
        // Set default fetcher.
        await selectOrigin(null);
}

/**
 * Get the origin button belonging to the given origin.
 * @param origin The origin to get the button for.
 * @returns {Element}
 */
function getOriginButton(origin) {
    return document.querySelector(`#container_originButtons li[data-id="${origin}"]`);
}

/**
 * Select an origin for the specific calendars.
 * @param origin The origin
 * @param userClick Whether this was a user click action.
 */
async function selectOrigin(origin, userClick) {
    origin = origin ?? "";
    const activeButton = document.querySelector("#container_originButtons li.selected");

    // Clear both warning banners
    document.getElementById("warning_team").classList.add("hidden");
    document.getElementById("warning_official").classList.add("hidden");

    // Reset both dropdowns
    document.getElementById("team").value = "null";
    document.getElementById("official").value = "null";

    const newOriginButton = getOriginButton(origin);
    if (!newOriginButton) {
        // New origin doesn't exist, so reset.
        window.location.hash = ``;
        if (activeButton) activeButton.classList.remove("selected");
        document.getElementById("container_origin").classList.add("select");
        return;
    }

    // Remove full-screen select.
    document.getElementById("container_origin").classList.remove("select");

    if (activeButton) activeButton.classList.remove("selected");
    newOriginButton.classList.add("selected", "loading");
    activeOrigin = origin;

    // Empty current container
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    // Fetch origin if necessary
    if (!origins[origin]) {
        origins[origin] = await (await fetch(`ics/${origin}/paths.json`, {cache: "no-store"})).json();
    }

    // Update last update timestamp
    document.getElementById("label_last_update").textContent = parseDate(new Date(origins[origin].lastUpdate));

    // Filter out official paths from the main list
    origins[origin].mainPaths = origins[origin].paths.filter(path => !path.type || path.type !== 'official');

    // Prepare dropdowns and show initial paths
    prepareClubs(origin);
    prepareOfficials(origin);
    showMainPaths(origin);
    
    newOriginButton.classList.remove("loading");
    prepareClubSelector();
    prepareOfficialSelector();

    if (userClick) {
        gtag('event', 'origin_select', {
            origin_id: origin,
            origin_full_name: fetchers[origin].name,
            origin_name: fetchers[origin].abbreviation
        });
    }

    document.title = `${fetchers[origin].name} calendars - Hockey Match Calendar | By Martijn van Kekem`;
}

/**
 * Show the main paths for an origin
 * @param origin The origin to show paths for
 */
function showMainPaths(origin) {
    const container = document.getElementById("specific_body");
    container.innerHTML = "";
    
    // Sort and display main paths
    const paths = origins[origin].mainPaths.sort((a, b) => 
        ((a.index ?? 0) - (b.index ?? 0)) || a.name.toString().localeCompare(b.name));
    
    for (let row of paths) {
        container.append(createTableRow(row));
    }
}

/**
 * Pad a string with zeroes at the start.
 * @param input The input string.
 * @returns {string | string}
 */
function padStart(input) {
    input = String(input);
    while(input.length < 2)
        input = `0${input}`;

    return input;
}

/**
 * Parse the date object to a string.
 * @param date The date to parse.
 * @returns {string}
 */
function parseDate(date) {
    return `${padStart(date.getDate())}-${padStart(date.getMonth() + 1)}-${
        date.getFullYear()} ${padStart(date.getHours())}:${padStart(date.getMinutes())}`;
}

/**
 * Prepare the team picker.
 */
function prepareClubs(origin) {
    const selectContainer = document.getElementById("team");
    selectContainer.querySelectorAll(`option:not([value="null"])`).forEach(e => e.remove());
    selectContainer.setAttribute("data-origin", origin);

    // Add clubs to list.
    const clubs = Object.values(origins[origin].clubs)
        .sort((a,b) => a.name.localeCompare(b.name));

    for (let club of clubs) {
        const optionEl = document.createElement("option");
        optionEl.textContent = club.name;
        optionEl.value = club.id;
        selectContainer.append(optionEl);
    }

    const teamSelector = document.getElementById("container_team");
    teamSelector.classList.toggle("hidden", selectContainer.children.length <= 1);
}

/**
 * Select a new club.
 * @param origin The origin.
 * @param newClub The new club
 */
function clubChanged(origin, newClub) {
    // Sort paths
    let paths = newClub === "null" ? origins[origin].paths : origins[origin].clubs[newClub].paths;
    paths = paths.sort((a, b) => ((a.index ?? 0) - (b.index ?? 0)) || a.name.toString().localeCompare(b.name));

    // Empty current container
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    // Load content into table
    for (let row of paths) {
        container.append(this.createTableRow(row));
    }

    const warningNotification = document.getElementById("warning_team");
    warningNotification.classList.toggle("hidden", newClub === "null");
    if (newClub !== "null")
        document.getElementById("team_selected").textContent = origins[origin].clubs[newClub].name;
}

/**
 * Prepare the club selector.
 */
function prepareClubSelector() {
    const selectContainer = document.getElementById("team");
    selectContainer.addEventListener("change", () => {
        clubChanged(selectContainer.getAttribute("data-origin"), selectContainer.value)
    });
}

/**
 * Prepare the officials picker.
 */
function prepareOfficials(origin) {
    const selectContainer = document.getElementById("official");
    selectContainer.querySelectorAll(`option:not([value="null"])`).forEach(e => e.remove());
    selectContainer.setAttribute("data-origin", origin);

    // Get officials from paths
    const officials = origins[origin].paths
        .filter(path => path.type === 'official')
        .map(path => ({
            name: path.name,
            country: path.country,
            pathKey: path.path.split('/officials/')[1].split('/')[0] // Extract official key from path
        }))
        .sort((a,b) => a.name.localeCompare(b.name));

    // Only show officials selector if we have officials
    const officialSelector = document.getElementById("container_official");
    if (!officials || officials.length === 0) {
        officialSelector.classList.add("hidden");
        return;
    }

    officialSelector.classList.remove("hidden");

    // Add officials to dropdown
    for (let official of officials) {
        const optionEl = document.createElement("option");
        optionEl.textContent = official.name;
        optionEl.value = official.pathKey;
        selectContainer.append(optionEl);
    }
}

/**
 * Select a new official.
 * @param origin The origin.
 * @param newOfficial The new official
 */
function officialChanged(origin, newOfficial) {
    // Clear club selection
    document.getElementById("team").value = "null";

    // Empty current container
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    if (newOfficial === "null") {
        // Show all paths when "All officials" is selected
        showMainPaths(origin);
        document.getElementById("warning_official").classList.add("hidden");
        return;
    }

    // Find official data from the paths
    const officialPath = origins[origin].paths
        .find(path => {
            if (path.type !== 'official') return false;
            // Get the ICS path from the path property
            return path.path === `ics/${origin}/officials/${newOfficial}/all-matches.ics`;
        });

    if (!officialPath) return;

    // Show only this official's calendar
    container.append(createTableRow({
        name: "All matches",
        path: officialPath.path,
        count: officialPath.count
    }));

    // Show warning with display name
    const warningNotification = document.getElementById("warning_official");
    warningNotification.classList.remove("hidden");
    // Get the display name from the original name property
    const displayName = officialPath.name;
    document.getElementById("official_selected").textContent = displayName;
}

/**
 * Prepare the official selector.
 */
function prepareOfficialSelector() {
    const selectContainer = document.getElementById("official");
    selectContainer.addEventListener("change", () => {
        officialChanged(selectContainer.getAttribute("data-origin"), selectContainer.value)
    });
}

/**
 * When the window has loaded.
 */
window.addEventListener("DOMContentLoaded", async () => {
    await addOriginButtons();
    prepareClubSelector();
    prepareOfficialSelector();
})