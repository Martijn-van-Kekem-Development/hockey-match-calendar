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
 * @param country The country
 */
function addTotalRows(country) {
    const allContainer = document.getElementById("all_matches_body");
    allContainer.innerHTML = "";

    // Order paths by name
    let paths = country === "null" ? json.total : json.countries[country].total;
    paths = paths.sort((a, b) => a.name.toString().localeCompare(b.name));
    for (let row of paths) {
        allContainer.append(createTableRow(row));
    }
}

/**
 * Add the origin buttons to the DOM.
 * @param country The country to add the origin buttons for
 */
function addOriginButtons(country) {
    const container = document.getElementById("container_originButtons");
    container.innerHTML = "";

    let origins = (country === "null") ? (json.origins) : (json.countries[country].origins);
    let originData = Object.values(origins).sort((a,b) => 
        (a.index ?? 0) - (b.index ?? 0) || a.name.localeCompare(b.name));
    
    for (let origin of originData) {
        const listEl = document.createElement("li");
        const buttonEl = document.createElement("button");

        listEl.setAttribute("data-id", origin.id);
        buttonEl.textContent = origin.name;
        buttonEl.addEventListener("click", () => selectOrigin(country, origin.id));

        listEl.append(buttonEl);
        container.append(listEl);
    }

    selectOrigin(country, originData[0].id);
}

/**
 * Select an origin for the specific calendars.
 * @param country The country for this origin.
 * @param origin The origin
 */
function selectOrigin(country, origin) {
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
    let paths = country === "null" ? json.origins[origin].paths : json.countries[country].origins[origin].paths;
    paths = paths.sort((a, b) => ((a.index ?? 0) - (b.index ?? 0)) || a.name.toString().localeCompare(b.name));

    // Load content into table
    for (let row of paths) {
        container.append(this.createTableRow(row));
    }
}

/**
 * Prepare the country picker.
 */
function prepareCountry() {
    const selectContainer = document.getElementById("country");
    selectContainer.addEventListener("change", () => countryChanged(selectContainer.value));

    // Add countries to list.
    for (let country of Object.keys(json.countries).sort((a,b) => a.localeCompare(b))) {
        const optionEl = document.createElement("option");
        optionEl.textContent = country;
        optionEl.value = country;
        selectContainer.append(optionEl);
    }
}

/**
 * Select a new country.
 * @param newCountry The new country
 */
function countryChanged(newCountry) {
    addOriginButtons(newCountry);
    addTotalRows(newCountry);

    const warningNotification = document.getElementById("warning_country");
    warningNotification.classList.toggle("hidden", newCountry === "null");
    if (newCountry !== "null")
        document.getElementById("country_selected").textContent = newCountry;
}

/**
 * When the window has loaded.
 */
window.addEventListener("DOMContentLoaded", async () => {
    const files = await fetch("files.json", {cache: "no-store"});
    const data = await files.text();
    json = JSON.parse(data);

    prepareCountry();
    countryChanged("null");

    document.getElementById("label_last_update").textContent = (new Date(json.lastUpdate)).toLocaleString();
})