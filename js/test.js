// ======================================================
// GLOBAL STORAGE
// ======================================================
let athletes = {};
let yearly = {};


// ======================================================
// CSV PARSER
// ======================================================
function parseCSV(csv) {
    const rows = csv.trim().split("\n");
    const headers = rows[0].split(";").map(h => h.trim());

    return rows.slice(1).map(row => {
        const cols = row.split(";");
        const obj = {};

        headers.forEach((h, i) => {
            obj[h] = (cols[i] ?? "").trim();
        });

        return obj;
    });
}


// ======================================================
// ATHLETES
// ======================================================
function parseAthletes(csv) {
    const rows = csv.trim().split("\n").slice(1);
    const map = {};

    rows.forEach(r => {
        const c = r.split(";");

        map[c[0]] = {
            name: c[1],
            country: c[2]
        };
    });

    return map;
}


// ======================================================
// COMPETITIONS
// ======================================================
function parseCompetitions(csv) {
    const rows = csv.trim().split("\n").slice(1);
    const map = {};

    rows.forEach(r => {
        const c = r.split(";");
        const comp_id = c[0];

        const year = comp_id.slice(-7, -3);
        const country = comp_id.slice(-3);

        map[comp_id] = {
            comp_id,
            level: c[4],
            year,
            country,
            format: c[6]
        };
    });

    return map;
}


// ======================================================
// POINTS TABLE
// ======================================================
function parsePointsCSV(csv) {
    const rows = csv.trim().split("\n").slice(1);
    const map = {};

    rows.forEach(r => {
        const c = r.split(";");

        const key = `${c[0]}_${c[1]}`;

        map[key] = {
            "1": Number(c[2]),
            "2": Number(c[3]),
            "3": Number(c[4]),
            "4": Number(c[5]),
            "QFhi": Number(c[6]),
            "QFlo": Number(c[7]),
            "R16hi": Number(c[8]),
            "R16lo": Number(c[9])
        };
    });

    return map;
}


// ======================================================
// LEVEL NORMALIZATION
// ======================================================
function normalizeLevel(level) {
    const map = {
        WCH: "WCH",
        ECH: "ECH",
        CCH: "ECH",
        IC: "IC",
        NC: "NC",
        LT: "IC"
    };

    return map[level] || level;
}


// ======================================================
// MATCH HELPERS
// ======================================================
function getLoser(match) {
    return match.winner_id === match.athlete1_id
        ? match.athlete2_id
        : match.athlete1_id;
}


// ======================================================
// BUILD PLACEMENTS
// ======================================================
function buildPlacements(matches) {

    const placements = {};
    const lostTo = {};

    matches.forEach(m => {
        const loser = getLoser(m);
        lostTo[loser] = m.winner_id;
    });

    // FINAL PLACEMENTS
    matches.forEach(m => {

        const winner = m.winner_id;
        const loser = getLoser(m);

        if (m.comp_round === "Gold Final") {
            placements[winner] = 1;
            placements[loser] = 2;
        }

        if (m.comp_round === "Bronze Final") {
            placements[winner] = 3;
            placements[loser] = 4;
        }
    });

    // QF + R16
    Object.keys(lostTo).forEach(id => {

        if (placements[id]) return;

        const opp = lostTo[id];
        const oppPlace = placements[opp];

        const isFinalist =
            oppPlace === 1 || oppPlace === 2 ||
            oppPlace === 3 || oppPlace === 4;

        if (oppPlace) {
            placements[id] = isFinalist ? "QFlo" : "QFhi";
        }
    });

    Object.keys(lostTo).forEach(id => {

        if (placements[id]) return;

        const opp = lostTo[id];
        const oppPlace = placements[opp];

        const isFinalist =
            oppPlace === 1 || oppPlace === 2 ||
            oppPlace === 3 || oppPlace === 4;

        if (oppPlace) {
            placements[id] = isFinalist ? "R16hi" : "R16lo";
        }
    });

    return placements;
}


// ======================================================
// POINT LOOKUP
// ======================================================
function getPoints(table, category, level, placement) {

    const key = `${category}_${normalizeLevel(level)}`;
    const t = table[key];

    if (!t) return 0;

    return Number(t[placement] || 0);
}


// ======================================================
// PROCESS COMPETITION
// ======================================================
function processCompetition(matches, meta, pointsTable) {

    const placements = buildPlacements(matches);
    const scores = {};

Object.entries(placements).forEach(([ath, place]) => {

    const match = matches.find(m =>
        m.athlete1_id === ath || m.athlete2_id === ath
    );

    if (!match) return;

    const pts = getPoints(
        pointsTable,
        match.category,
        meta.level,
        place
    );

    scores[ath] = (scores[ath] || 0) + pts;
});

    return { scores, year: meta.year };
}


// ======================================================
// GROUP BY COMP
// ======================================================
function groupByCompetition(matches) {

    const map = {};

    matches.forEach(m => {
        if (!map[m.comp_id]) map[m.comp_id] = [];
        map[m.comp_id].push(m);
    });

    return map;
}


// ======================================================
// LOAD CSV
// ======================================================
async function loadCSV(path) {
    const res = await fetch(path);
    return await res.text();
}


// ======================================================
// MAIN
// ======================================================
async function runTest() {

    const [matchesCSV, pointsCSV, compsCSV, athCSV] = await Promise.all([
        loadCSV("data/match_play_results.csv"),
        loadCSV("data/mp_ranking.csv"),
        loadCSV("data/competitions.csv"),
        loadCSV("data/athletes.csv")
    ]);

    const matches = parseCSV(matchesCSV);
    const pointsTable = parsePointsCSV(pointsCSV);
    const competitions = parseCompetitions(compsCSV);
    const athletes = parseAthletes(athCSV);

    const grouped = groupByCompetition(matches);

    const yearlyRaw = {}; // athlete → [results]

    // ======================================================
    // 1. PROCESS ALL COMPETITIONS
    // ======================================================
    Object.keys(grouped).forEach(compId => {

        const compMatches = grouped[compId];
        let meta = competitions[compId];

        if (!meta) {

            const year = compId.slice(-7, -3);
            const country = compId.slice(-3);
            const prefix = compId.match(/^[A-Z]+/)?.[0] || "";

            let level = "IC";

            if (prefix.startsWith("WCH")) level = "WCH";
            else if (prefix.startsWith("ECH")) level = "ECH";
            else if (
                prefix.startsWith("NC") ||
                prefix.startsWith("NCI") ||
                prefix.startsWith("NJC")
            ) level = "NC";

            meta = { comp_id: compId, level, year, country };
        }

        const { scores, year } =
            processCompetition(compMatches, meta, pointsTable);

        if (!yearlyRaw[year]) yearlyRaw[year] = {};

        Object.entries(scores).forEach(([ath, pts]) => {

            if (!yearlyRaw[year][ath]) {
                yearlyRaw[year][ath] = [];
            }

            yearlyRaw[year][ath].push({
                pts,
                level: meta.level
            });
        });
    });

    // ======================================================
    // 2. APPLY FILTER:
    //    - top 3 results only
    //    - max 1 Nationals (NC)
    // ======================================================
    const yearly = {};

    Object.keys(yearlyRaw).forEach(year => {

        yearly[year] = {};

        Object.entries(yearlyRaw[year]).forEach(([ath, results]) => {

            // sort best first
            results.sort((a, b) => b.pts - a.pts);

            const selected = [];
            let ncUsed = false;

            for (const r of results) {

                if (selected.length === 3) break;

                if (r.level === "NC") {
                    if (ncUsed) continue;
                    ncUsed = true;
                }

                selected.push(r);
            }

            const total = selected.reduce((sum, r) => sum + r.pts, 0);

            if (total > 0) {
                yearly[year][ath] = {
    total,
    results: selected
};
            }
        });
    });

    // ======================================================
    // 3. RENDER
    // ======================================================
    renderTabs(yearly, athletes);
}

// ======================================================
// UI
// ======================================================
function renderTabs(yearly, athletes) {

	
	
    const tabs = document.getElementById("tabs");
    const contents = document.getElementById("contents");

    tabs.innerHTML = "";
    contents.innerHTML = "";

    const years = Object.keys(yearly).sort();

    years.forEach((year, idx) => {

        const btn = document.createElement("button");
        btn.className = "tab-btn" + (idx === 0 ? " active" : "");
        btn.textContent = year;
        btn.onclick = () => switchTab(year);
        tabs.appendChild(btn);

        const div = document.createElement("div");
        div.className = "tab-content" + (idx === 0 ? " active" : "");
        div.id = "tab-" + year;

        Object.entries(yearly[year])
            .sort((a, b) => b[1] - a[1])
            .forEach(([ath, data]) => {

                const meta = athletes[ath];

                const name = meta?.name || ath;
                const country = meta?.country || "";
const total = data.total;
                const row = document.createElement("div");
                row.className = "ranking-row";

                row.innerHTML = `
    <span class="rank-name">${name}</span>
    <span class="rank-country">${country}</span>
    <span class="rank-points">${total} pts</span>
`;

                row.onclick = () => openAthleteCard(ath, year, data);

                div.appendChild(row);
            });

        contents.appendChild(div);
    });
}


// ======================================================
// TAB SWITCH
// ======================================================
function switchTab(year) {

    document.querySelectorAll(".tab-btn")
        .forEach(b => b.classList.remove("active"));

    document.querySelectorAll(".tab-content")
        .forEach(c => c.classList.remove("active"));

    document.querySelectorAll(".tab-btn")
        .forEach(b => {
            if (b.textContent === year) b.classList.add("active");
        });

    document.getElementById("tab-" + year)
        .classList.add("active");
}


function computeFinalScore(results) {

    // 1. split nationals and others
    const nationals = results.filter(r => r.level === "NC");
    const others = results.filter(r => r.level !== "NC");

    // 2. pick ONLY best national result (if exists)
    let filtered = [];

    if (nationals.length > 0) {
        const bestNC = nationals.reduce((best, cur) =>
            cur.pts > best.pts ? cur : best
        );
        filtered.push(bestNC);
    }

    // 3. add all non-national results
    filtered = filtered.concat(others);

    // 4. sort by points descending
    filtered.sort((a, b) => b.pts - a.pts);

    // 5. take top 3
    return filtered
        .slice(0, 3)
        .reduce((sum, r) => sum + r.pts, 0);
}

function openAthleteCard(ath, year, data) {

    const meta = athletes[ath];
    const name = meta?.name || ath;

    const existing = document.getElementById("athlete-card");
    if (existing) existing.remove();

    const card = document.createElement("div");
    card.id = "athlete-card";
    card.style.position = "fixed";
    card.style.top = "50%";
    card.style.left = "50%";
    card.style.transform = "translate(-50%, -50%)";
    card.style.background = "white";
    card.style.border = "1px solid #ccc";
    card.style.padding = "20px";
    card.style.zIndex = "1000";
    card.style.minWidth = "300px";

    const resultsHTML = data.results.map(r => `
        <div style="display:flex; justify-content:space-between;">
            <span>${r.level}</span>
            <span>${r.pts} pts</span>
        </div>
    `).join("");

    card.innerHTML = `
        <h3>${name} (${year})</h3>
        <div>${resultsHTML}</div>
        <hr>
        <strong>Total: ${data.total} pts</strong>
        <br><br>
        <button onclick="this.parentElement.remove()">Close</button>
    `;

    document.body.appendChild(card);
}