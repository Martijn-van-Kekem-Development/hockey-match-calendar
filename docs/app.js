// Store fetcher data
const fetchers = {};
const origins = {};
let officialsMode = false;

// Load fetchers data
async function loadFetchers() {
    const response = await fetch('ics/fetchers.json');
    if (!response.ok) return;
    const data = await response.json();
    
    for (const [id, fetcher] of Object.entries(data)) {
        fetchers[id] = fetcher.name;
    }
}

/**
 * Create a table row for a path.
 * @param row The row data.
 */
function createTableRow(row) {
    const tr = document.createElement("tr");
    
    const nameCell = document.createElement("td");
    nameCell.textContent = row.name;
    tr.append(nameCell);

    const countCell = document.createElement("td");
    countCell.textContent = row.count;
    tr.append(countCell);

    const linkCell = document.createElement("td");
    const link = document.createElement("a");
    link.href = row.path;
    link.textContent = "Download";
    linkCell.append(link);
    tr.append(linkCell);

    return tr;
}

/**
 * Add origin buttons.
 */
async function addOriginButtons() {
    await loadFetchers();
    const container = document.getElementById("container_originButtons");
    container.innerHTML = "";

    // Create ul element for origin buttons
    const ul = document.createElement("ul");
    ul.classList.add("origin-buttons");
    container.append(ul);

    // Load origins
    for (const origin of Object.keys(fetchers)) {
        const response = await fetch(`ics/${origin}/paths.json`);
        if (!response.ok) continue;
        origins[origin] = await response.json();

        const li = document.createElement("li");
        const button = document.createElement("a");
        button.setAttribute("data-id", origin);
        button.textContent = fetchers[origin];
        button.href = "#" + origin;
        button.addEventListener("click", (e) => {
            e.preventDefault();
            selectOrigin(origin);
            window.location.hash = origin;
        });
        li.append(button);
        ul.append(li);
    }

    // Select origin from URL or first available
    const urlOrigin = window.location.hash.substring(1);
    if (urlOrigin && origins[urlOrigin]) {
        await selectOrigin(urlOrigin);
    } else {
        const firstOrigin = Object.keys(origins)[0];
        if (firstOrigin) {
            await selectOrigin(firstOrigin);
            window.location.hash = firstOrigin;
        }
    }

    document.getElementById("container_origin").classList.remove("loading");
}

/**
 * Select a new origin.
 * @param origin The origin to select.
 */
async function selectOrigin(origin) {
    // Update selected origin
    const items = document.querySelectorAll(".origin-buttons li");
    items.forEach(e => e.classList.remove("selected"));
    
    const selectedItem = document.querySelector(`.origin-buttons li a[data-id="${origin}"]`)?.parentElement;
    if (selectedItem) {
        selectedItem.classList.add("selected");
    }

    // Hide any active warnings
    document.getElementById("warning_official").classList.add("hidden");
    document.getElementById("warning_team").classList.add("hidden");

    // Show paths for this origin
    showMainPaths(origin);

    // Prepare the officials picker
    prepareOfficials(origin);

    // Prepare the team picker
    prepareClubs(origin);

    // Update last update time if available
    if (origins[origin].lastUpdate) {
        const lastUpdate = new Date(origins[origin].lastUpdate);
        document.getElementById("label_last_update").textContent = 
            lastUpdate.toLocaleString();
    }

    // Add this line to reset officials mode
    toggleOfficialsMode(false);
}

/**
 * Show the main paths for an origin.
 * @param origin The origin.
 */
function showMainPaths(origin) {
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    if (!origins[origin] || !origins[origin].competitions) {
        console.error("No competitions found for origin:", origin);
        return;
    }

    // Sort and display competition paths
    const paths = origins[origin].competitions
        .sort((a, b) => ((a.index ?? 0) - (b.index ?? 0)) || 
            a.name.toString().localeCompare(b.name));
    
    for (let row of paths) {
        container.append(createTableRow(row));
    }
}

/**
 * Prepare the clubs picker.
 */
function prepareClubs(origin) {
    const selectContainer = document.getElementById("team");
    selectContainer.querySelectorAll(`option:not([value="null"])`).forEach(e => e.remove());
    selectContainer.setAttribute("data-origin", origin);

    // Get clubs
    const clubs = Object.values(origins[origin].clubs)
        .sort((a, b) => a.name.localeCompare(b.name));

    // Only show team selector if we have teams
    const teamContainer = document.getElementById("container_team");
    if (!clubs || clubs.length === 0) {
        teamContainer.classList.add("hidden");
        return;
    }

    teamContainer.classList.remove("hidden");

    // Add clubs to dropdown
    for (let club of clubs) {
        const optionEl = document.createElement("option");
        optionEl.textContent = club.name;
        optionEl.value = club.id;
        selectContainer.append(optionEl);
    }
}

/**
 * Prepare the officials picker.
 */
function prepareOfficials(origin) {
    const selectContainer = document.getElementById("official");
    const officialsToggle = document.getElementById("container_officials_toggle");
    
    selectContainer.querySelectorAll(`option:not([value="null"])`).forEach(e => e.remove());
    selectContainer.setAttribute("data-origin", origin);

    // Hide toggle by default
    officialsToggle.classList.add("hidden");

    // Check if officials exist and have content
    if (!origins[origin]?.officials?.length) {
        return;
    }

    // Show toggle since we have officials
    officialsToggle.classList.remove("hidden");

    // Add officials to dropdown
    const officials = origins[origin].officials
        .map(path => ({
            name: path.name,
            country: path.country,
            pathKey: path.path.split('/officials/')[1].split('/')[0]
        }))
        .sort((a,b) => a.name.localeCompare(b.name));

    for (let official of officials) {
        const optionEl = document.createElement("option");
        optionEl.textContent = official.name;
        optionEl.value = official.pathKey;
        selectContainer.append(optionEl);
    }
}

/**
 * Select a new club.
 * @param origin The origin.
 * @param newClub The new club
 */
function clubChanged(origin, newClub) {
    document.getElementById("official").value = "null";
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    // Get paths based on club selection
    let paths = newClub === "null" 
        ? origins[origin].competitions 
        : origins[origin].clubs[newClub].paths;
        
    paths = paths.sort((a, b) => 
        ((a.index ?? 0) - (b.index ?? 0)) || a.name.toString().localeCompare(b.name));

    // Load content into table
    for (let row of paths) {
        container.append(createTableRow(row));
    }

    const warningNotification = document.getElementById("warning_team");
    warningNotification.classList.toggle("hidden", newClub === "null");
    if (newClub !== "null") {
        document.getElementById("team_selected").textContent = 
            origins[origin].clubs[newClub].name;
    }
}

/**
 * Select a new official.
 * @param origin The origin.
 * @param newOfficial The new official
 */
function officialChanged(origin, newOfficial) {
    document.getElementById("team").value = "null";
    const container = document.getElementById("specific_body");
    container.innerHTML = "";

    if (newOfficial === "null") {
        showMainPaths(origin);
        document.getElementById("warning_official").classList.add("hidden");
        return;
    }

    // Find official data from the officials array
    const officialPath = origins[origin].officials
        .find(path => path.path.includes(`/officials/${newOfficial}/`));

    if (!officialPath) return;

    container.append(createTableRow({
        name: "All matches",
        path: officialPath.path,
        count: officialPath.count
    }));

    const warningNotification = document.getElementById("warning_official");
    warningNotification.classList.remove("hidden");
    document.getElementById("official_selected").textContent = officialPath.name;
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
 * Prepare the official selector.
 */
function prepareOfficialSelector() {
    const selectContainer = document.getElementById("official");
    selectContainer.addEventListener("change", () => {
        officialChanged(selectContainer.getAttribute("data-origin"), selectContainer.value)
    });
}

/**
 * Toggle officials mode.
 * @param enabled Whether to enable or disable officials mode.
 */
function toggleOfficialsMode(enabled) {
    officialsMode = enabled;
    const toggle = document.getElementById("officials-mode");
    toggle.setAttribute("aria-checked", enabled);
    
    const officialSelector = document.getElementById("container_official");
    const origin = document.querySelector("#team").getAttribute("data-origin");
    
    // Only show selector if officials exist for this origin
    if (enabled && origins[origin] && origins[origin].officials && origins[origin].officials.length > 0) {
        officialSelector.classList.remove("hidden");
    } else {
        officialSelector.classList.add("hidden");
        document.getElementById("official").value = "null";
        document.getElementById("warning_official").classList.add("hidden");
        showMainPaths(origin);
    }
}

/**
 * Prepare the officials toggle.
 */
function prepareOfficialsToggle() {
    const toggle = document.getElementById("officials-mode");
    toggle.addEventListener("click", () => {
        toggleOfficialsMode(!officialsMode);
    });
}

/**
 * When the window has loaded.
 */
window.addEventListener("DOMContentLoaded", async () => {
    await addOriginButtons();
    prepareClubSelector();
    prepareOfficialSelector();
    prepareOfficialsToggle();
});