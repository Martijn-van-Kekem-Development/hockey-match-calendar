window.addEventListener("DOMContentLoaded", async () => {
    const files = await fetch("files.json");
    const data = await files.text();
    let json = JSON.parse(data);

    const allContainer = document.getElementById("all_matches_body");
    const compContainer = document.getElementById("competition_body");
    allContainer.innerHTML = "";
    compContainer.innerHTML = "";

    const paths = json.paths.sort((a, b) => a.name.toString().localeCompare(b.name));
    for (let row of paths) {
        let tableRow = document.createElement("tr");

        let nameCol = document.createElement("td");
        nameCol.textContent = row.name ?? "";
        tableRow.append(nameCol);

        let matchesCol = document.createElement("td");
        matchesCol.innerHTML = `${row.count}`;
        tableRow.append(matchesCol);

        let urlCol = document.createElement("td");
        urlCol.innerHTML = `<a href="${row.path}">Download</a>`;
        tableRow.append(urlCol);

        (row.type === "total" ? allContainer : compContainer).append(tableRow);
    }

    document.getElementById("label_last_update").textContent = (new Date(json.lastUpdate)).toLocaleString();
})