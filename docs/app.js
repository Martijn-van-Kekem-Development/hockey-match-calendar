const origins = {};

/**
 * When the copy URL link is clicked
 * @param evt The event that fired
 * @returns {Promise<void>}
 */
async function copyURL(evt) {
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
    copyEl.addEventListener("click", e => copyURL(e));
    copyEl.textContent = "Copy URL";
    urlCol.append(copyEl);
    tableRow.append(urlCol);

    return tableRow;
}

/**
 * Add the origin buttons to the DOM.
 */
async function addOriginButtons() {
    const fetchers = await (await fetch("ics/fetchers.json")).json();

    const container = document.getElementById("container_originButtons");
    container.innerHTML = "";

    let originData = Object.values(fetchers).sort((a,b) =>
        (a.index ?? 0) - (b.index ?? 0) || a.name.localeCompare(b.name));

    for (let origin of originData) {
        const listEl = document.createElement("li");
        const buttonEl = document.createElement("button");

        listEl.setAttribute("data-id", origin.id);
        buttonEl.textContent = origin.name;
        buttonEl.addEventListener("click", () => selectOrigin(origin.id));

        listEl.append(buttonEl);
        container.append(listEl);
    }

    await selectOrigin(originData[0].id);
}

/**
 * Select an origin for the specific calendars.
 * @param origin The origin
 */
async function selectOrigin(origin) {
    if (!origins[origin]) {
        // Fetch origin
        origins[origin] = await (await fetch(`ics/${origin}/paths.json`)).json();
    }

    // Remove currently active button
    const activeButton = document.querySelector("#container_originButtons li.selected");
    if (activeButton) activeButton.classList.remove("selected");

    // Select new button
    const newOriginButton = document.querySelector(`#container_originButtons li[data-id="${origin}"]`);
    newOriginButton.classList.add("selected");

    // Update last update timestamp
    document.getElementById("label_last_update").textContent = parseDate(new Date(origins[origin].lastUpdate));
    prepareClubs(origin);
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
    return `${padStart(date.getDate())}-${padStart(date.getMonth())}-${
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

    clubChanged(origin, "null");
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
 * When the window has loaded.
 */
window.addEventListener("DOMContentLoaded", async () => {
    await addOriginButtons();
    prepareClubSelector();
})