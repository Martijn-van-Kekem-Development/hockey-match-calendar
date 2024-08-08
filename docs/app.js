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

window.addEventListener("DOMContentLoaded", async () => {
    const files = await fetch("files.json");
    const data = await files.text();
    let json = JSON.parse(data);

    // Clear current table
    const allContainer = document.getElementById("all_matches_body");
    const compContainer = document.getElementById("competition_body");
    allContainer.innerHTML = "";
    compContainer.innerHTML = "";

    // Sort items
    const paths = json.paths.sort((a, b) =>
        ((a.index ?? 0) - (b.index ?? 0)) ||
        a.name.toString().localeCompare(b.name)
    );

    for (let row of paths) {
        let tableRow = document.createElement("tr");

        let nameCol = document.createElement("td");
        nameCol.textContent = row.name ?? "";
        tableRow.append(nameCol);

        let matchesCol = document.createElement("td");
        matchesCol.innerHTML = `${row.count}`;
        tableRow.append(matchesCol);

        let urlCol = document.createElement("td");
        let copyEl = document.createElement("a");
        copyEl.href = row.path;
        copyEl.addEventListener("click", e => copyURL(e));
        copyEl.textContent = "Copy URL";
        urlCol.append(copyEl);
        tableRow.append(urlCol);

        (row.type === "total" ? allContainer : compContainer).append(tableRow);
    }

    document.getElementById("label_last_update").textContent = (new Date(json.lastUpdate)).toLocaleString();
})