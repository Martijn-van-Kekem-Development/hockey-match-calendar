let json;

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
 * Add the total rows to the table.
 */
function addTotalRows() {
    const allContainer = document.getElementById("all_matches_body");
    allContainer.innerHTML = "";

    // Order paths by name
    const paths = json.total.sort((a, b) => a.name.toString().localeCompare(b.name));
    for (let row of paths) {
        allContainer.append(createTableRow(row));
    }
}

/**
 * Add the origin buttons to the DOM.
 */
function addOriginButtons() {
    const container = document.getElementById("container_originButtons");
    container.innerHTML = "";

    for (let origin of Object.values(json.origins)) {
        const listEl = document.createElement("li");
        const buttonEl = document.createElement("button");

        listEl.setAttribute("data-id", origin.id);
        buttonEl.textContent = origin.name;
        buttonEl.addEventListener("click", () => this.selectOrigin(origin.id));

        listEl.append(buttonEl);
        container.append(listEl);
    }

    selectOrigin(Object.keys(json.origins)[0]);
}

/**
 * Select an origin for the specific calendars.
 * @param origin
 */
function selectOrigin(origin) {
    if (!json.origins[origin]) return;

    // Remove currently active button
    const activeButton = document.querySelector("#container_originButtons li.selected");
    if (activeButton) activeButton.classList.remove("selected");

    // Select new button
    const newOriginButton = document.querySelector(`#container_originButtons li[data-id="${origin}"]`);
    newOriginButton.classList.add("selected");

    // Empty current container
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    // Sort paths
    const paths = json.origins[origin].paths.sort((a, b) =>
        ((a.index ?? 0) - (b.index ?? 0)) ||
        a.name.toString().localeCompare(b.name)
    );

    // Load content into table
    for (let row of paths) {
        container.append(this.createTableRow(row));
    }
}

/**
 * When the window has loaded.
 */
window.addEventListener("DOMContentLoaded", async () => {
    const files = await fetch("files.json", {cache: "no-store"});
    const data = await files.text();
    json = JSON.parse(data);

    addOriginButtons();
    addTotalRows();

    // // Clear current table
    // const compContainer = document.getElementById("competition_body");
    // compContainer.innerHTML = "";
    //
    // // Sort items
    // const paths = json.paths.fih.sort((a, b) =>
    //     ((a.index ?? 0) - (b.index ?? 0)) ||
    //     a.name.toString().localeCompare(b.name)
    // );



    document.getElementById("label_last_update").textContent = (new Date(json.lastUpdate)).toLocaleString();
})