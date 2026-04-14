console.log("main.js loaded");

// =========================
// Helpers
// =========================
function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}
function parseCSV(path, callback) {
    Papa.parse(path, {
        download: true,
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        complete: res => callback(res.data)
    });
}
function createCheckbox(containerId, value, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const id = `${containerId}-${value}`;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = id;
    cb.value = value;
    cb.checked = true; // always checked by default

    const lbl = document.createElement("label");
    lbl.htmlFor = id;
    lbl.textContent = label;

    container.appendChild(cb);
    container.appendChild(lbl);
}

let countryMap = {};

function loadCountries(callback) {
    parseCSV("data/countries.csv", data => {
        data.forEach(c => {
            countryMap[c.code] = c.name;
        });
        callback();
    });
}
// Render country flag
function renderFlag(countryCode) {
    if (!countryCode) return "";
    return `<img src="photos/flags/${countryCode}.png" 
                 alt="${countryCode}" 
                 style="width:24px; height:16px; vertical-align:middle; margin-right:6px;"> 
            ${countryCode}`;
}

function renderClubFlag(clubName) {
    if (!clubName) return "";
    return `<img src="photos/clubs/${clubName}.png" 
                 alt="${clubName}" 
                 style="width:24px; height:16px; vertical-align:middle; margin-right:6px;"> 
            ${clubName}`;
}
const CATEGORY_NAMES = {
    A: "Absolute",
    O: "Open Class",
    M: "Men",
    W: "Women",
    J: "Juniors",
    C: "Cadets",
    S: "Seniors",
	S45: "Seniors O-45",
    SM: "Senior Men",
    SW: "Senior Women",
    AS: "Assisted Shooters",
    G: "Guests",
	GM: "Guests - Men",
	GW: "Guests - Women"
};
const levelNames = {
    LT: "Local Tournament",
    IC: "International Competition",
    NC: "National Championship",
    WC: "World Cup",
    CCH: "Continental Championships",
    WCH: "World Championships"
};

const CATEGORY_ORDER = ["A", "O", "M", "W", "J", "C","S45", "S", "SM", "SW", "AS", "G", "GM", "GW"];

// =========================
// Competition Level Rules
// =========================

// Levels that should display CLUB instead of COUNTRY
const CLUB_BASED_LEVELS = ["NC", "LT"];

// Format-specific columns
const FORMAT_COLUMNS = {
    IR300: ['rank','athlete_id','country','category','d1_total','rings','tens'],
    IR450: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','rings','tens'],
    IR600: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_total','rings','tens'],
    IR600F: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_total','rings','tens','final','final_total'],
    IR900: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','rings','tens'],
    IR900F: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','rings','tens','final','final_total'],
    IR900i: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','rings','tens'],
    IR900iF: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','rings','tens','final','final_total'],
    IR1200: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_total','d2_d1','d2_d2','d2_total','total','rings','tens'],
    IR1200F: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_total','d2_d1','d2_d2','d2_total','total','rings','tens','final','final_total'],
    IR1800: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','d2_d1','d2_d2','d2_d3','d2_total','total','rings','tens'],
    IR1800F: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','d2_d1','d2_d2','d2_d3','d2_total','total','rings','tens','final','final_total'],
    IR1800old: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','d2_d1','d2_d2','d2_d3','d2_total','total','rings','tens'],
    IR1800Fold: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total','d2_d1','d2_d2','d2_d3','d2_total','total','rings','tens','final','final_total'],
	Eliminations: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_d3','d1_total'],
	Master: ['rank','athlete_id','country','category','d1_d1','d1_d2','d1_total','d2_d1','d2_d2','d2_d3']
};

const FORMAT_LABELS = {
    IR300: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_total:"IR300", rings:"R10", tens:"10" },
    IR450: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR450", rings:"R10", tens:"10" },
    IR600: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"18m", d1_d2:"18m", d1_total:"IR600", rings:"R10", tens:"10" },
    IR600F: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"18m", d1_d2:"18m", d1_total:"IR600", rings:"R10", tens:"10", final:"F", final_total:"Total" },
    IR900: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR900", rings:"R10", tens:"10" },
    IR900F: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR900", rings:"R10", tens:"10", final:"F", final_total:"Total" },
    IR900i: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"18m", d1_d2:"18m", d1_d3:"18m", d1_total:"IR900", rings:"R10", tens:"10" },
    IR900iF: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"18m", d1_d2:"18m", d1_d3:"18m", d1_total:"IR900", rings:"R10", tens:"10", final:"F", final_total:"Total" },
    IR1200: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"18m", d1_d2:"18m", d1_total:"IR600", d2_d1:"18m", d2_d2:"18m", d2_total:"IR600", total:"IR1200", rings:"R10", tens:"10" },
    IR1200F: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"18m", d1_d2:"18m", d1_total:"IR600", d2_d1:"18m", d2_d2:"18m", d2_total:"IR600", total:"IR1200", rings:"R10", tens:"10", final:"F", final_total:"Total" },
    IR1800: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR900", d2_d1:"35m", d2_d2:"50m", d2_d3:"65m", d2_total:"IR900", total:"IR1800", rings:"R10", tens:"10" },
    IR1800F: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR900", d2_d1:"35m", d2_d2:"50m", d2_d3:"65m", d2_total:"IR900", total:"IR1800", rings:"R10", tens:"10", final:"F", final_total:"Total" },
    IR1800old: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR900", d2_d1:"65m", d2_d2:"50m", d2_d3:"35m", d2_total:"IR900", total:"IR1800", rings:"R10", tens:"10" },
    IR1800Fold: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"65m", d1_d2:"50m", d1_d3:"35m", d1_total:"IR900", d2_d1:"65m", d2_d2:"50m", d2_d3:"35m", d2_total:"IR900", total:"IR1800", rings:"R10", tens:"10", final:"F", final_total:"Total" },
	Eliminations: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"Q Round", d1_d2:"R32", d1_d3:"R16", d1_total:"Q Rank" },
	Master: { rank:"Rank", athlete_id:"Athlete", country:"Country", category:"Cat.", d1_d1:"50m", d1_d2:"50m", d1_total:"IR600", d2_d1:"QF", d2_d2:"SF", d2_d3:"Final" },
};

const FORMAT_DISPLAY_NAMES = {
    IR300: "Qualifications",
    IR450: "Short Classic",
    IR600: "Classic 18m",
    IR600F: "Classic 18m + Final",
    IR900: "Classic",
    IR900F: "Classic + Final",
    IR900i: "Three Distance 18m",
    IR900iF: "Three Distance 18m + Final",
    IR1200: " Double Classic 18m",
    IR1200F: "Double Classic 18m + Final",
    IR1800: "Double Classic",
    IR1800F: "Double Classic + Final",
    IR1800old: "Double Classic (Old)",
    IR1800Fold: "Double Classic (Old) + Final"
};

let aliasToMain = {};
let mainToAliases = {};


let aliasMap = {};

function loadAliases(callback) {
    parseCSV("data/athlete_aliases.csv", data => {

        aliasToMain = {};
        mainToAliases = {};

        data.forEach(row => {
            const main = row.main_id?.trim();
            const alias = row.alias_id?.trim();
            if (!main || !alias) return;

            aliasToMain[alias] = main;

            if (!mainToAliases[main]) {
                mainToAliases[main] = [];
            }
            mainToAliases[main].push(alias);
        });

        callback?.();
    });
}

function resolveAthleteId(id) {
    return aliasToMain[id] || id;
}

function getAllAthleteIds(id) {
    const main = resolveAthleteId(id);
    return new Set([main, ...(mainToAliases[main] || [])]);
}
// =========================
// Index Page: Competition List
// =========================


function loadCompetitionList() {
    const container = document.getElementById("competition-list");
    if (!container) return;

	parseCSV("data/match_play_results.csv", matchResults => {

        // Create set of competitions that contain match play
        const matchplayCompetitions = new Set(
            matchResults.map(m => m.comp_id).filter(Boolean)
        );
	
    parseCSV("data/competitions.csv", competitions => {

        // =========================
        // Filters Setup
        // =========================
        const filters = {
            level: new Set(),
            year: new Set(),
            country: new Set(),
            format: new Set()
        };

        const getYear = dateStr => dateStr ? dateStr.split(".").pop() : "";
        const unique = arr => [...new Set(arr.filter(Boolean))];

        const levels = unique(competitions.map(c => c.level)).sort();
        const years = unique(competitions.map(c => getYear(c.date))).sort((a, b) => b - a);
        const countries = unique(competitions.map(c => c.country)).sort();
        const formats = unique(competitions.map(c => c.format)).sort();

        function populateFilter(containerId, values, key) {
            const el = document.getElementById(containerId);
            if (!el) return;

            el.innerHTML = "";

            values.forEach(value => {
                const tag = document.createElement("div");
                tag.className = "filter-tag";
                tag.textContent = value;

                tag.addEventListener("click", () => {
                    if (filters[key].has(value)) {
                        filters[key].delete(value);
                        tag.classList.remove("active");
                    } else {
                        filters[key].add(value);
                        tag.classList.add("active");
                    }
                    render();
                });

                el.appendChild(tag);
            });
        }

        populateFilter("filter-level", levels, "level");
        populateFilter("filter-year", years, "year");
        populateFilter("filter-country", countries, "country");
        populateFilter("filter-format", formats, "format");

	/*	
		//Navbar novi kod
		
		const yearGroups = [
    { label: "1982–1989", years: ["1982","1984","1986","1988","1989"] },
    { label: "1990–1994", years: ["1990","1992","1993","1994"] },
    // auto-generate later years:
];

const allYears = unique(competitions.map(c => getYear(c.date)))
    .sort((a,b)=>a-b);

// add individual years from 1995+
allYears.forEach(y => {
    if (y >= 1995) {
        yearGroups.push({ label: y, years: [y] });
    }
});

// current year auto-detect
const currentYear = new Date().getFullYear().toString();

// add ALL option
yearGroups.push({ label: "All results", years: "ALL" });
		
		//Gotov navbar
		
		let activeYearIndex = yearGroups.findIndex(g =>
    g.years !== "ALL" && g.years.includes(currentYear)
);

// fallback if current year not found
if (activeYearIndex === -1) activeYearIndex = yearGroups.length - 2;
		
	//arrow navigation
document.getElementById("year-prev").onclick = () => {
    if (activeYearIndex > 0) {
        activeYearIndex--;
        triggerYearChange();
    }
};

document.getElementById("year-next").onclick = () => {
    if (activeYearIndex < yearGroups.length - 1) {
        activeYearIndex++;
        triggerYearChange();
    }
};

function triggerYearChange() {
    const group = yearGroups[activeYearIndex];

    filters.year.clear();

    if (group.years !== "ALL") {
        group.years.forEach(y => filters.year.add(y));
    }

    render();
    renderYearNav();
}*/
	
		
		
		
		
		
		
		
        function applyFilters(data) {
            return data.filter(c => {
                if (filters.level.size && !filters.level.has(c.level)) return false;
                if (filters.year.size && !filters.year.has(getYear(c.date))) return false;
                if (filters.country.size && !filters.country.has(c.country)) return false;
                if (filters.format.size && !filters.format.has(c.format)) return false;
                return true;
            });
        }

        // =========================
        // Render Table
        // =========================
        function render() {
            container.innerHTML = "";

            const filtered = applyFilters(competitions);
            filtered.sort((a, b) => Number(getYear(b.date)) - Number(getYear(a.date)));

            if (!filtered.length) {
                container.innerHTML = "<p>No competitions match selected filters.</p>";
                return;
            }

            const table = document.createElement("table");
            table.className = "results-table";
            container.appendChild(table);

            const thead = document.createElement("thead");
            table.appendChild(thead);

            const headRow = document.createElement("tr");
            thead.appendChild(headRow);

            ["Competition", "City", "Country", "Level", "Format", "Date"]
                .forEach(col => {
                    const th = document.createElement("th");
                    th.textContent = col;
                    headRow.appendChild(th);
                });

            const tbody = document.createElement("tbody");
            table.appendChild(tbody);

            filtered.forEach(comp => {
                const tr = document.createElement("tr");

                // Competition cell
                const tdComp = document.createElement("td");
                const compLink = document.createElement("a");
                compLink.href = `competition.html?id=${comp.comp_id}`;
                compLink.textContent = comp.comp_name;
                tdComp.appendChild(compLink);
                tr.appendChild(tdComp);

                // City cell
                const tdCity = document.createElement("td");
                tdCity.textContent = comp.city || "";
                tr.appendChild(tdCity);

                // Country cell (FIXED PROPERLY)
                const tdCountry = document.createElement("td");
                if (comp.country) {
                    const countryLink = document.createElement("a");
                    countryLink.href = `national_federation.html?country=${comp.country}`;
                    countryLink.innerHTML = renderFlag(comp.country);
                    tdCountry.appendChild(countryLink);
                }
                tr.appendChild(tdCountry);

                // Level cell
                const tdLevel = document.createElement("td");
                tdLevel.textContent = comp.level || "";
                tr.appendChild(tdLevel);

                // Format cell
                const tdFormat = document.createElement("td");

//let formatText = comp.format || "";
let formatText = getFormatName(comp.format);

if (matchplayCompetitions.has(comp.comp_id)) {
    formatText += " + Match Play";
}

tdFormat.textContent = formatText;
tr.appendChild(tdFormat);

                // Date cell
                const tdDate = document.createElement("td");
                tdDate.textContent = comp.date || "";
                tr.appendChild(tdDate);

                tbody.appendChild(tr);
            });
        }

        render();
    });
	});
	
//	renderYearNav();
//triggerYearChange(); // ensures latest year loads automatically
}

function setupIndexTabs() {
    const tabs = {
        competitions: document.getElementById("competitions-tab"),
        ranking: document.getElementById("ranking-tab"),
        federations: document.getElementById("federations-tab"),
        athletes: document.getElementById("athletes-tab")
    };

    const buttons = {
        competitions: document.getElementById("tab-competitions"),
        ranking: document.getElementById("tab-ranking"),
        federations: document.getElementById("tab-federations"),
        athletes: document.getElementById("tab-athletes")
    };

    Object.keys(buttons).forEach(key => {
        buttons[key].addEventListener("click", () => {

            // Hide all tabs
            Object.values(tabs).forEach(t => t.style.display = "none");
            Object.values(buttons).forEach(b => b.classList.remove("active"));

            // Show selected
            tabs[key].style.display = "block";
            buttons[key].classList.add("active");
        });
    });
}

function renderRankingTab() {
    parseCSV("data/world_ranking.csv", rankings => {
        parseCSV("data/competitions.csv", competitions => {

            const container = document.getElementById("ranking-container");
            container.innerHTML = "";

            // Get unique competition IDs from ranking data
            const rankingCompIds = [...new Set(
                rankings.map(r => r.comp_id).filter(Boolean)
            )];

            // Match with competitions
            const rankingCompetitions = competitions
                .filter(c => rankingCompIds.includes(c.comp_id))
                .sort((a, b) => {
                    const getYear = d => d ? d.split(".").pop() : "";
                    return Number(getYear(b.date)) - Number(getYear(a.date));
                });

            if (!rankingCompetitions.length) {
                container.innerHTML = "<p>No ranking competitions found.</p>";
                return;
            }

            // Create table (same style as competitions)
            const table = document.createElement("table");
            table.className = "results-table";
            container.appendChild(table);

            const thead = document.createElement("thead");
            table.appendChild(thead);

            const headRow = document.createElement("tr");
            thead.appendChild(headRow);

            ["Competition", "City", "Country"]
                .forEach(col => {
                    const th = document.createElement("th");
                    th.textContent = col;
                    headRow.appendChild(th);
                });

            const tbody = document.createElement("tbody");
            table.appendChild(tbody);

            rankingCompetitions.forEach(comp => {
                const tr = document.createElement("tr");

                // Competition link → world_ranking.html
                const tdComp = document.createElement("td");
                const link = document.createElement("a");
                link.href = `world_ranking.html?id=${comp.comp_id}`;
                link.textContent = "World Ranking List " + comp.date;
                tdComp.appendChild(link);
                tr.appendChild(tdComp);

                // City
                const tdCity = document.createElement("td");
                tdCity.textContent = comp.city || "";
                tr.appendChild(tdCity);

                // Country
                const tdCountry = document.createElement("td");
                if (comp.country) {
                    const countryLink = document.createElement("a");
                    countryLink.href = `national_federation.html?country=${comp.country}`;
                    countryLink.innerHTML = renderFlag(comp.country);
                    tdCountry.appendChild(countryLink);
                }
                tr.appendChild(tdCountry);

                

                tbody.appendChild(tr);
            });

        });
    });
}

function renderFederationsTab() {
    parseCSV("data/athletes.csv", athletes => {

        const container = document.getElementById("federations-container");
        container.innerHTML = "";

        if (!athletes.length) {
            container.innerHTML = "<p>No federations found.</p>";
            return;
        }

        // Count athletes per country
        const countries = {};

        athletes.forEach(a => {
            if (!a.country) return;
            if (!countries[a.country]) countries[a.country] = 0;
            countries[a.country]++;
        });

        // Sort by FULL country name
        const sorted = Object.entries(countries)
            .sort((a, b) => {
                const nameA = countryMap[a[0]] || a[0];
                const nameB = countryMap[b[0]] || b[0];
                return nameA.localeCompare(nameB);
            });

        // Table
        const table = document.createElement("table");
        table.className = "results-table";
        container.appendChild(table);

        const thead = document.createElement("thead");
        table.appendChild(thead);

        const headRow = document.createElement("tr");
        thead.appendChild(headRow);

        ["Country","Code", "Athletes"].forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headRow.appendChild(th);
        });

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        sorted.forEach(([country, count]) => {
            const tr = document.createElement("tr");

            const tdCountry = document.createElement("td");
            const link = document.createElement("a");

            const fullName = countryMap[country] || country;

           link.href = `national_federation.html?country=${country}`;
			link.textContent = fullName;

            tdCountry.appendChild(link);
            tr.appendChild(tdCountry);
			
			const tdCode = document.createElement("td");
			tdCode.innerHTML = renderFlag(country);
			tr.appendChild(tdCode);

            const tdCount = document.createElement("td");
            tdCount.textContent = count;
            tr.appendChild(tdCount);

            tbody.appendChild(tr);

			
        });
    });
}

function renderAthletesTab() {
    loadCountries(() => {

        parseCSV("data/athletes.csv", athletes => {

            const container = document.getElementById("athletes-container");
            container.innerHTML = "";

            if (!athletes.length) {
                container.innerHTML = "<p>No athletes found.</p>";
                return;
            }

            // 🚨 FILTER OUT INVALID ATHLETES
            const validAthletes = athletes.filter(a =>
                a.athlete_name && a.athlete_name !== "-"
            );

            // Sort by name
            validAthletes.sort((a, b) => {
                const nameA = (a.athlete_name || "").toLowerCase();
                const nameB = (b.athlete_name || "").toLowerCase();
                return nameA.localeCompare(nameB);
            });

            // Table
            const table = document.createElement("table");
            table.className = "results-table";
            container.appendChild(table);

            const thead = document.createElement("thead");
            table.appendChild(thead);

            const headRow = document.createElement("tr");
            thead.appendChild(headRow);

            ["Athlete", "Country", "Gender"].forEach(col => {
                const th = document.createElement("th");
                th.textContent = col;
                headRow.appendChild(th);
            });

            const tbody = document.createElement("tbody");
            table.appendChild(tbody);

            validAthletes.forEach(a => {
                const tr = document.createElement("tr");

                // Athlete name
                const tdName = document.createElement("td");
                const link = document.createElement("a");
                link.href = `athlete.html?id=${a.athlete_id}`;
                link.textContent = a.athlete_name;
                tdName.appendChild(link);
                tr.appendChild(tdName);

                // Country (flag + code)
                const tdCountry = document.createElement("td");

                if (a.country) {
                    const countryLink = document.createElement("a");

                    countryLink.href = `national_federation.html?country=${a.country}`;
                    countryLink.innerHTML = `${renderFlag(a.country)} `;

                    tdCountry.appendChild(countryLink);
                }

                tr.appendChild(tdCountry);

                // Gender
                const tdGender = document.createElement("td");
                tdGender.textContent = a.gender || "";
                tr.appendChild(tdGender);

                tbody.appendChild(tr);
            });

        });

    });
}

/*
function renderYearNav() {
    const container = document.getElementById("year-scroll");
    container.innerHTML = "";

    yearGroups.forEach((group, index) => {
        const el = document.createElement("div");
        el.className = "year-item" + (index === activeYearIndex ? " active" : "");
        el.textContent = group.label;

        el.onclick = () => {
            activeYearIndex = index;

            // update YEAR FILTER automatically
            filters.year.clear();

            if (group.years !== "ALL") {
                group.years.forEach(y => filters.year.add(y));
            }

            render();
            renderYearNav();
        };

        container.appendChild(el);
    });

    // auto-center active
    document.querySelector(".year-item.active")
        ?.scrollIntoView({ behavior: "smooth", inline: "center" });
}
*/

// =========================
// Render Affiliation (Country or Club)
// =========================
function renderAffiliation(athlete, competition) {

    // If National Championship or Local Tournament → show club
    if (CLUB_BASED_LEVELS.includes(competition.level)) {

        if (!athlete || !athlete.club) return "";

        return `
            <img src="photos/clubs/${athlete.club}.png"
                 alt="${athlete.club}"
                 style="width:24px; height:16px; vertical-align:middle; margin-right:6px;">
            ${athlete.club}
        `;
    }

    // Otherwise → show national flag
    return athlete ? renderFlag(athlete.country) : "";
}


function getFormatName(code){
    return FORMAT_DISPLAY_NAMES[code] || code;
}

// =========================
// Competition Page
// =========================

function loadCompetitionPage() {
    const compId = getQueryParam("id");
    if (!compId) return;

    parseCSV("data/athletes.csv", athletes => {
        parseCSV("data/results.csv", resultsRaw => {
            parseCSV("data/competitions.csv", competitions => {
                parseCSV("data/match_play_results.csv", matchResults => {

                    const competition = competitions.find(c => c.comp_id === compId);
                    if (!competition) return;

                    const isClubCompetition = CLUB_BASED_LEVELS.includes(competition.level);

                    // Competition Header
                    document.getElementById("competition-name").textContent = competition.comp_name;
                    document.getElementById("competition-location").textContent = `${competition.city}, ${competition.country}`;
                    document.getElementById("competition-level").textContent = `Level: ${competition.level}`;
                    document.getElementById("competition-date").textContent = `Date: ${competition.date}`;

                    // Classic results
                    renderClassicResults(compId, athletes, resultsRaw, competition, isClubCompetition);

                    // Match play
                    const compMatches = matchResults.filter(m => m.comp_id === compId);
                    if (compMatches.length) {
                        document.getElementById("tab-matchplay").style.display = "inline-block";
                        renderMatchplay(compMatches);
                    }

                    // Tabs
                    setupTabs();
                });
            });
        });
    });
}

function setupCompetitionTabs(compId) {
    const classicBtn = document.getElementById("tab-classic");
    const matchBtn = document.getElementById("tab-matchplay");
    const classicTab = document.getElementById("classic-tab");
    const matchTab = document.getElementById("matchplay-tab");

    // Default: show classic tab
    if (classicTab) classicTab.style.display = "block";
    if (matchTab) matchTab.style.display = "none";

    // Rename Classic tab for World Cup Finals
    if (compId.includes("WCF") && classicBtn) {
        classicBtn.textContent = "Qualifications";
    }

    // Hide Match Play tab initially
    if (matchBtn) matchBtn.style.display = "none";

    // Check if match play results exist
    parseCSV("data/match_play_results.csv", matchResults => {
        const hasMatchResults = matchResults.some(r => r.comp_id === compId);

        if (hasMatchResults) {
            // Show Match Play tab
            if (matchBtn) matchBtn.style.display = "inline-block";
        }

        // Add click handlers
        classicBtn?.addEventListener("click", () => {
            classicTab.style.display = "block";
            matchTab.style.display = "none";
            classicBtn.classList.add("active");
            matchBtn?.classList.remove("active");
        });

        matchBtn?.addEventListener("click", () => {
            classicTab.style.display = "none";
            matchTab.style.display = "block";
            matchBtn.classList.add("active");
            classicBtn.classList.remove("active");
        });
    });
}

// =========================
// Classic Results
// =========================
function renderClassicResults(compId, athletes, resultsRaw, competition, isClubCompetition) {
    const compResults = resultsRaw
        .filter(r => r.comp_id === compId)
        .map(r => {
            const cleanRow = {};
            Object.keys(r).forEach(k => {
                const key = k.trim().replace(/\r/g, "");
                if (!["res_id", "comp_id"].includes(key)) {
                    cleanRow[key] = r[k].trim();
                }
            });
            return cleanRow;
        });

    const container = document.getElementById("results-container");
    container.innerHTML = "";

    if (!compResults.length) {
        container.innerHTML = "<p>No results available.</p>";
        return;
    }

    // =========================
    // Highlight Bar
    // =========================
    const affiliationSet = new Set();
    compResults.forEach(r => {
        const athlete = athletes.find(a => a.athlete_id === resolveAthleteId(r.athlete_id));
        const value = isClubCompetition ? athlete?.club : athlete?.country;
        if (value) affiliationSet.add(value);
    });

    const sortedAffiliations = Array.from(affiliationSet).sort();
    let selectedAffiliations = JSON.parse(localStorage.getItem("selectedAffiliations") || "[]");

    if (sortedAffiliations.length) {
        const title = document.createElement("div");
        title.textContent = isClubCompetition ? "Highlight club:" : "Highlight country:";
        title.style.fontWeight = "bold";
        title.style.marginBottom = "6px";
        container.appendChild(title);

        const filterBar = document.createElement("div");
        filterBar.className = "filter-tags";
        filterBar.style.marginBottom = "20px";
        container.appendChild(filterBar);

        sortedAffiliations.forEach(value => {
            const tag = document.createElement("div");
            tag.className = "filter-tag";
            tag.textContent = value;
            if (selectedAffiliations.includes(value)) tag.classList.add("active");

            tag.addEventListener("click", () => {
                const isActive = tag.classList.contains("active");
                if (isActive) selectedAffiliations = selectedAffiliations.filter(v => v !== value);
                else selectedAffiliations.push(value);

                localStorage.setItem("selectedAffiliations", JSON.stringify(selectedAffiliations));
                applyHighlight(selectedAffiliations);
                tag.classList.toggle("active");
            });

            filterBar.appendChild(tag);
        });

        const clearTag = document.createElement("div");
        clearTag.className = "filter-tag clear-tag";
        clearTag.textContent = "Clear All";
        clearTag.addEventListener("click", () => {
            selectedAffiliations = [];
            localStorage.removeItem("selectedAffiliations");
            document.querySelectorAll(".filter-tag").forEach(t => t.classList.remove("active"));
            applyHighlight([]);
        });
        filterBar.appendChild(clearTag);
    }

    // =========================
    // Table Columns Setup
    // =========================
    const allColumns = FORMAT_COLUMNS[competition.format] || ["rank", "athlete_id", "country", "category", "total", "rings", "tens"];
    const labels = FORMAT_LABELS[competition.format] || {};
    const affiliationLabel = isClubCompetition ? "Club" : "Country";
    const fixedCols = ["rank", "athlete_id", "country", "category"];
    const dynamicCols = allColumns.filter(c => !fixedCols.includes(c));

    // =========================
    // Render by Category
    // =========================
    CATEGORY_ORDER.forEach(cat => {
        const catResults = compResults
            .filter(r => r.category === cat)
            .sort((a, b) => Number(a.rank) - Number(b.rank));

        if (!catResults.length) return;

        const h3 = document.createElement("h3");
        h3.textContent = CATEGORY_NAMES[cat] ? `${CATEGORY_NAMES[cat]} (${cat})` : cat;
        container.appendChild(h3);

        const table = document.createElement("table");
        table.className = "results-table";
        container.appendChild(table);

        const thead = document.createElement("thead");
        table.appendChild(thead);
        const trHead = document.createElement("tr");
        thead.appendChild(trHead);

        [...fixedCols, ...dynamicCols].forEach(col => {
            const th = document.createElement("th");
            th.textContent = col === "country" ? affiliationLabel : (labels[col] || col.replace(/_/g, " ").toUpperCase());
            trHead.appendChild(th);
        });

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        catResults.forEach(r => {
            const athlete = athletes.find(a => a.athlete_id === resolveAthleteId(r.athlete_id));
            const tr = document.createElement("tr");
            const affiliationValue = isClubCompetition ? athlete?.club : athlete?.country;
            if (affiliationValue) tr.dataset.affiliation = affiliationValue;

            // Medal colors
            if (r.rank == 1) tr.style.backgroundColor = "#ffe680";
            else if (r.rank == 2) tr.style.backgroundColor = "#e0e0e0";
            else if (r.rank == 3) tr.style.backgroundColor = "#e6c099";
            else tr.style.backgroundColor = "#b0e0ff";

            [...fixedCols, ...dynamicCols].forEach(col => {
                const td = document.createElement("td");
                if (col === "athlete_id") td.innerHTML = athlete ? `<a href="athlete.html?id=${athlete.athlete_id}">${athlete.athlete_name}</a>` : r.athlete_id || "";
                else if (col === "country") td.innerHTML = renderAffiliation(athlete, competition);
                else td.textContent = r[col] || "";
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    });

    applyHighlight(selectedAffiliations);

    function applyHighlight(values) {
        document.querySelectorAll("#results-container tr").forEach(row => {
            if (values.includes(row.dataset.affiliation)) row.classList.add("country-highlight");
            else row.classList.remove("country-highlight");
        });
    }
}

// ==========================
// Load CSVs and render bracket
// ==========================

document.addEventListener("DOMContentLoaded", () => {

    // Load athletes
    Papa.parse("data/athletes.csv", {
        download: true,
        header: true,
        delimiter: ";",
        complete: function(results) {
            const athletesData = results.data;
            const athletesMap = {};
            athletesData.forEach(a => {
                if (!a.athlete_id) return;
                athletesMap[a.athlete_id] = a.athlete_name;
            });

            // Load matches
            Papa.parse("data/match_play_results.csv", {
                download: true,
                header: true,
                delimiter: ";",
                complete: function(matchResults) {
                    const matches = matchResults.data.filter(m => m.round); // filter empty rows
                    
                }
            });
        }
    });
});

// ==========================
// Render Matchplay Bracket
// ==========================
/* ======================================================
   MATCH PLAY BRACKET SYSTEM
====================================================== */

const ROUND_ORDER = [
"Round of 128",
"Round of 64",
"Round of 32",
"Round of 16",
"Quarterfinals",
"Semifinals",
"Gold Final"
];

function renderMatchplay(matches){
    const container = document.getElementById("matchplay-container");
    container.innerHTML = "";

    const categories = [...new Set(matches.map(m => m.category))];
	
    categories.forEach(category=>{
        const categoryMatches = matches.filter(m=>m.category === category);

        const bracket = document.createElement("div");
        bracket.className = "category-bracket";
        bracket.dataset.category = category;
		const catFullName= CATEGORY_NAMES[category] ? `${CATEGORY_NAMES[category]} ` : cat;
        bracket.innerHTML = `
            <div class="category-header">
                <button class="nav-left">◀</button>
                <h2>Match Play - ${catFullName}</h2>
                <button class="nav-right">▶</button>
            </div>

            <div class="bracket-viewport">
                <div class="bracket-rounds"></div>
                <canvas class="bracket-lines"></canvas>
            </div>
        `;

        container.appendChild(bracket);

        buildRounds(bracket, categoryMatches);

       // initBracketNavigation(bracket);

        //setTimeout(()=>drawLines(bracket),50);
    });
}

// ================================
// BUILD ROUNDS
// ================================

function buildRounds(bracket, matches) {
    const roundsContainer = bracket.querySelector(".bracket-rounds");
    roundsContainer.innerHTML = "";

    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.comp_round]) rounds[m.comp_round] = [];
        rounds[m.comp_round].push(m);
    });

    const sortedRounds = ROUND_ORDER.filter(r => rounds[r]);

    const athletesPerRound = {};
    sortedRounds.forEach(roundName => {
        athletesPerRound[roundName] = [];
        rounds[roundName].forEach(m => {
            if (m.athlete1_id) athletesPerRound[roundName].push(m.athlete1_id);
            if (m.athlete2_id) athletesPerRound[roundName].push(m.athlete2_id);
        });
    });

    sortedRounds.forEach((roundName, roundIndex) => {
        if (roundName.toLowerCase().includes("bronze")) return;

        const roundDiv = document.createElement("div");
        roundDiv.className = "round";

        const title = document.createElement("div");
        title.className = "round-title";
        title.textContent = roundName;
        roundDiv.appendChild(title);

        let firstRoundMatches = rounds[roundName];

        if (roundIndex === 0 && sortedRounds.length > 1) {
            const nextRoundAthletes = athletesPerRound[sortedRounds[1]];
            const firstRoundAthleteIds = new Set();
            firstRoundMatches.forEach(m => {
                if (m.athlete1_id) firstRoundAthleteIds.add(m.athlete1_id);
                if (m.athlete2_id) firstRoundAthleteIds.add(m.athlete2_id);
            });

            const orderedMatches = [];
            nextRoundAthletes.forEach(aid => {
                const match = firstRoundMatches.find(
                    m => m.athlete1_id === aid || m.athlete2_id === aid
                );
                if (match) {
                    firstRoundMatches = firstRoundMatches.filter(m => m !== match);
                    orderedMatches.push(match);
                } else if (!firstRoundAthleteIds.has(aid)) {
                    const athleteMatch = matches.find(
                        m => m.athlete1_id === aid || m.athlete2_id === aid
                    );
                    const athleteName = athleteMatch
                        ? athleteMatch.athlete1_id === aid
                            ? athleteMatch.athlete_name1
                            : athleteMatch.athlete_name2
                        : "Unknown";

                    const byeMatch = {
                        athlete1_id: aid,
                        athlete_name1: athleteName,
                        athlete2_id: null,
                        athlete_name2: "(bye to next round)",
                        points1: "",
                        points2: "",
                        winner_id: aid,
                        a1s1: "", a1s2: "", a1s3: "", a1s4: "", a1s5: "",
                        a2s1: "", a2s2: "", a2s3: "", a2s4: "", a2s5: "",
                    };
                    orderedMatches.push(byeMatch);
                }
            });
            firstRoundMatches = orderedMatches;
        }

        firstRoundMatches.forEach(match => {
            const isBye = !match.athlete2_id;
            roundDiv.appendChild(createMatchCard(match, isBye));
        });

        roundsContainer.appendChild(roundDiv);
    });

    // -----------------------------
    // Bronze Match (centered under Gold)
    // -----------------------------
   
	
	if (rounds["Bronze Final"] && rounds["Bronze Final"].length > 0) {

    const goldFinalRound = roundsContainer.querySelector(".round:last-child");

    if (goldFinalRound) {

        const bronzeTitle = document.createElement("div");
        bronzeTitle.className = "round-title";
        bronzeTitle.textContent = "Bronze Final";

        goldFinalRound.appendChild(bronzeTitle);

        rounds["Bronze Final"].forEach(match => {
            goldFinalRound.appendChild(createMatchCard(match));
        });

    }
}
}

// Minimal match card
function createMatchCard(match) {
    const div = document.createElement("div");
    div.className = "match-card";

    const a1 = match.athlete_name1 || "Unknown";
    const a2 = match.athlete_name2 || "(bye)";

    div.innerHTML = `
        <div class="match-player">${a1}</div>
        <div class="match-player">${a2}</div>
    `;

    div.style.border = "1px solid #ccc";
    div.style.padding = "6px";
    div.style.marginBottom = "10px";
    div.style.borderRadius = "4px";
    div.style.backgroundColor = "#f9f9f9";

    return div;
}
// ================================
// MATCH CARD
// ================================

function createMatchCard(match, isBye=false) {
    const card = document.createElement("div");
    card.className = "match";

    const sets1 = [match.a1s1,match.a1s2,match.a1s3,match.a1s4,match.a1s5].filter(v=>v).join(" ");
    const sets2 = [match.a2s1,match.a2s2,match.a2s3,match.a2s4,match.a2s5].filter(v=>v).join(" ");

    const flag1 = match.athlete1_id ? match.athlete1_id.substring(0,3) : "";
    const flag2 = match.athlete2_id ? match.athlete2_id.substring(0,3) : "";

    const winner1 = match.winner_id === match.athlete1_id ? "winner" : "";
    const winner2 = match.winner_id === match.athlete2_id ? "winner" : "";

    card.innerHTML = `
<div class="match-summary">
    <div class="athlete-row ${winner1}">
        <span class="name">${match.athlete_name1}</span>
        <span class="right">
            ${flag1 ? `<img class="flag" src="photos/flags/${flag1}.png">` : ""}
            <span class="points">${match.points1}</span>
        </span>
    </div>

    ${!isBye ? '<button class="details-btn">Match Details</button>' : ""}

    <div class="athlete-row ${winner2}">
        <span class="name" style="${isBye ? 'font-style:italic; color:#555;' : ''}">${match.athlete_name2}</span>
        <span class="right">
            ${flag2 ? `<img class="flag" src="photos/flags/${flag2}.png">` : ""}
            <span class="points">${match.points2}</span>
        </span>
    </div>
</div>

${!isBye ? `
<div class="match-details">
    <div class="detail-athlete">
        <img class="detail-photo" src="photos/athletes/${match.athlete1_id}.png" onerror="this.src='photos/athletes/default.png'">
        <div class="detail-name">${match.athlete_name1} ${flag1 ? `<img class="flag" src="photos/flags/${flag1}.png">` : ""} ${match.points1}</div>
        <div class="sets">${sets1}</div>
    </div>
	
${!isBye ? '<button class="details-btn">Hide Details</button>' : ""}

    <div class="detail-athlete">
	<div class="sets">${sets2}</div>
        
        <div class="detail-name" style="${match.athlete2_id ? "" : "font-style:italic; color:#555;"}">
            ${match.athlete_name2} ${flag2 ? `<img class="flag" src="photos/flags/${flag2}.png">` : ""} ${match.points2}
        </div>
     <img class="detail-photo" src="photos/athletes/${match.athlete2_id || "default"}.png" onerror="this.src='photos/athletes/default.png'">   
    </div>
</div>` : ""}
`;
    return card;
}

// ================================
// MATCH DETAILS TOGGLE
// ================================
document.addEventListener("click", e=>{
    if(e.target.classList.contains("details-btn")){
        const match = e.target.closest(".match");
        match.classList.toggle("open");
        const bracket = e.target.closest(".category-bracket");
       // setTimeout(()=>drawLines(bracket),200);
    }
    if(e.target.classList.contains("hide-btn")){
        const match = e.target.closest(".match");
        match.classList.remove("open");
    }
});

// ================================
// BRACKET NAVIGATION
// ================================
/*function initBracketNavigation(bracket){
    let offset = 0;
    const rounds = bracket.querySelector(".bracket-rounds");
    const left = bracket.querySelector(".nav-left");
    const right = bracket.querySelector(".nav-right");
    const roundWidth = 320;
    const totalRounds = rounds.children.length;

    left.onclick = ()=>{
        offset = Math.max(0, offset-1);
        rounds.style.transform = `translateX(-${offset*roundWidth}px)`;
        drawLines(bracket);
    };
    right.onclick = ()=>{
        offset = Math.min(totalRounds-3, offset+1);
        rounds.style.transform = `translateX(-${offset*roundWidth}px)`;
        drawLines(bracket);
    };
} */

// ================================
// DRAW BRACKET LINES
// ================================
/*function drawLines(bracket){
    const canvas = bracket.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const rounds = bracket.querySelectorAll(".round");
    canvas.width = bracket.offsetWidth;
    canvas.height = bracket.offsetHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = "#b0b0b0";
    ctx.lineWidth = 2.5;

    for(let r=0;r<rounds.length-1;r++){
        const matches = rounds[r].querySelectorAll(".match");
        const nextMatches = rounds[r+1].querySelectorAll(".match");

        matches.forEach((m,i)=>{
            const next = nextMatches[Math.floor(i/2)];
            if(!next) return;
            const a = m.getBoundingClientRect();
            const b = next.getBoundingClientRect();
            const p = bracket.getBoundingClientRect();
            const x1 = a.right - p.left;
            const y1 = a.top + a.height/2 - p.top;
            const x2 = b.left - p.left;
            const y2 = b.top + b.height/2 - p.top;
            ctx.beginPath();
            ctx.moveTo(x1,y1);
            ctx.lineTo((x1+x2)/2,y1);
            ctx.lineTo((x1+x2)/2,y2);
            ctx.lineTo(x2,y2);
            ctx.stroke();
        });
    }
}*/

// ================================
// TABS
// ================================
function setupTabs() {
    const classicBtn = document.getElementById("tab-classic");
    const matchBtn = document.getElementById("tab-matchplay");
    const classicTab = document.getElementById("classic-tab");
    const matchTab = document.getElementById("matchplay-tab");

    classicBtn?.addEventListener("click", () => {
        classicTab.style.display = "block";
        matchTab.style.display = "none";
        classicBtn.classList.add("active");
        matchBtn.classList.remove("active");
    });

    matchBtn?.addEventListener("click", () => {
        classicTab.style.display = "none";
        matchTab.style.display = "block";
        matchBtn.classList.add("active");
        classicBtn.classList.remove("active");
    });
}

// =========================
// Helper to darken a hex color by percent
// =========================
function darkenColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;

    r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

    return `rgb(${r},${g},${b})`;
}


// =========================
// Athlete Page
// =========================

function loadAthletePage() {

    const requestedId = getQueryParam("id");
    if (!requestedId) return;

    Promise.all([
        new Promise(r => parseCSV("data/athletes.csv", r)),
        new Promise(r => parseCSV("data/results.csv", r)),
        new Promise(r => parseCSV("data/competitions.csv", r)),
        new Promise(r => parseCSV("data/athlete_aliases.csv", r))
    ]).then(([athletes, results, competitions, aliases]) => {

        // =========================
        // ALIAS MAPS
        // =========================
        const aliasToMain = {};
        const mainToAliases = {};

        aliases.forEach(row => {
            const main = row.main_id?.trim();
            const alias = row.alias_id?.trim();
            if (!main || !alias) return;

            aliasToMain[alias] = main;

            if (!mainToAliases[main]) mainToAliases[main] = [];
            mainToAliases[main].push(alias);
        });

        const resolveId = id => aliasToMain[id] || id;

        // =========================
        // MAIN + ALL IDS
        // =========================
        const mainId = resolveId(requestedId);

        const allIds = new Set([mainId]);
        (mainToAliases[mainId] || []).forEach(id => allIds.add(id));

        // =========================
        // ATHLETE (pick best match)
        // =========================
        const athlete =
            athletes.find(a => a.athlete_id === mainId) ||
            athletes.find(a => allIds.has(a.athlete_id));

        if (!athlete) return;

        // =========================
        // RESULTS (ALL IDS)
        // =========================
        const athleteResults = results
            .filter(r => allIds.has(r.athlete_id))
            .map(r => ({
                ...r,
                competition: competitions.find(c => c.comp_id === r.comp_id)
            }))
            .filter(r => r.competition);

        // =========================
        // COUNTRIES + CLUBS FROM ALL IDS
        // =========================
        const representedCountries = new Set();
        const representedClubs = new Set();

        athleteResults.forEach(r => {

            const athleteEntry = athletes.find(a => a.athlete_id === r.athlete_id);

            if (athleteEntry?.country) {
                representedCountries.add(athleteEntry.country);
            }

            if (athleteEntry?.club) {
                const club = athleteEntry.club.trim();
                if (club && club !== "-") {
                    representedClubs.add(club);
                }
            }
        });

        // =========================
        // PHOTO
        // =========================
        const photo = document.getElementById("athlete-photo");
        photo.src = `photos/athletes/${mainId}.png`;
        photo.onerror = () => photo.src = "photos/default.png";

        // =========================
        // NAME + ALIASES
        // =========================
        const nameElement = document.getElementById("athlete-name");

        const mainSurname = athlete.athlete_name.split(" ")[0];

        const formerSurnames = (mainToAliases[mainId] || [])
            .map(id => athletes.find(a => a.athlete_id === resolveId(id)))
            .filter(Boolean)
            .map(a => a.athlete_name.split(" ")[0])
            .filter(n => n !== mainSurname);

        nameElement.innerHTML = athlete.athlete_name;

        if (formerSurnames.length) {
            nameElement.innerHTML += `
                <div style="font-size:0.9em;font-style:italic;color:#666;">
                    (formerly: ${[...new Set(formerSurnames)].join(" / ")})
                </div>
            `;
        }

        // =========================
        // COUNTRIES
        // =========================
        const countryElement = document.getElementById("athlete-country");

        const countryList = [
            athlete.country,
            ...Array.from(representedCountries).filter(c => c !== athlete.country)
        ];

        let countryHTML = `
            <strong>Country:</strong>
            <a href="national_federation.html?country=${countryList[0]}">
                ${renderFlag(countryList[0])}
            </a>
        `;

        if (countryList.length > 1) {
            countryHTML += `
                <div style="font-size:0.9em;">
                    Also represented:
                    ${countryList.slice(1).map(c =>
                        `<a href="national_federation.html?country=${c}">
                            ${renderFlag(c)}
                        </a>`
                    ).join(" ")}
                </div>
            `;
        }

        countryElement.innerHTML = countryHTML;

        // =========================
        // CLUBS (FIXED & COMPLETE)
        // =========================
        const clubElement = document.getElementById("athlete-club");

        const clubList = Array.from(representedClubs);

        if (clubList.length) {

            const mainClub = athlete.club;
            const otherClubs = clubList.filter(c => c !== mainClub);

            let clubHTML = `
                <strong>Club:</strong>
                <a href="club.html?club=${encodeURIComponent(mainClub)}">
                    ${renderClubFlag(mainClub)}
                </a>
            `;

            if (otherClubs.length) {
                clubHTML += `
                    <div style="font-size:0.9em;margin-top:4px;">
                        <strong>Also represented:</strong><br>
                        ${otherClubs.map(c =>
                            `<a href="club.html?club=${encodeURIComponent(c)}">${c}</a>`
                        ).join("<br>")}
                    </div>
                `;
            }

            clubElement.innerHTML = clubHTML;
        }

        // =========================
        // FILTERS
        // =========================
        const container = document.getElementById("athlete-results-container");

        const years = [...new Set(athleteResults.map(r => r.competition.date.slice(-4)))].sort((a,b)=>b-a);
        const levels = [...new Set(athleteResults.map(r => r.competition.level))];
        const categories = [...new Set(athleteResults.map(r => r.category))];

        const selectedYears = new Set(years);
        const selectedLevels = new Set(levels);
        const selectedCategories = new Set(categories);

        function createTag(container, value, set) {
            const tag = document.createElement("div");
            tag.className = "filter-tag active";
            tag.textContent = value;
            container.appendChild(tag);

            tag.addEventListener("click", () => {
                set.has(value) ? set.delete(value) : set.add(value);
                tag.classList.toggle("active");
                render();
            });
        }

        years.forEach(y => createTag(document.getElementById("filter-year"), y, selectedYears));
        levels.forEach(l => createTag(document.getElementById("filter-level"), l, selectedLevels));
        categories.forEach(c => createTag(document.getElementById("filter-category"), c, selectedCategories));

        // =========================
        // RENDER RESULTS
        // =========================
        function render() {

            container.innerHTML = "";

            const filtered = athleteResults.filter(r =>
                selectedYears.has(r.competition.date.slice(-4)) &&
                selectedLevels.has(r.competition.level) &&
                selectedCategories.has(r.category)
            );

            if (!filtered.length) {
                container.innerHTML = "<p>No results for the selected filters.</p>";
                return;
            }

            const byYear = {};

            filtered.forEach(r => {
                const y = r.competition.date.slice(-4);
                if (!byYear[y]) byYear[y] = [];
                byYear[y].push(r);
            });

            Object.keys(byYear).sort((a,b)=>b-a).forEach(year => {

                const h3 = document.createElement("h3");
                h3.textContent = year;
                container.appendChild(h3);

                const rows = byYear[year];

                const colSet = new Set(["competition","category","rank"]);

                rows.forEach(r => {
                    (FORMAT_COLUMNS[r.competition.format] || []).forEach(c => {
                        if (!["athlete_id","country","comp_id","res_id"].includes(c)) {
                            colSet.add(c);
                        }
                    });
                });

                colSet.add("format");
                const columns = Array.from(colSet);

                const table = document.createElement("table");
                table.className = "results-table";
                container.appendChild(table);

                const thead = document.createElement("thead");
                const trh = document.createElement("tr");
                thead.appendChild(trh);
                table.appendChild(thead);

                columns.forEach(c => {
                    const th = document.createElement("th");
                    const labels = FORMAT_LABELS[rows[0].competition.format] || {};

                    th.textContent =
                        c === "competition" ? "Competition" :
                        c === "category" ? "Category" :
                        c === "format" ? "Format" :
                        labels[c] || c.toUpperCase();

                    trh.appendChild(th);
                });

                const tbody = document.createElement("tbody");
                table.appendChild(tbody);

                rows.sort((a,b)=>Number(a.rank)-Number(b.rank)).forEach(r => {

                    const tr = document.createElement("tr");

                    tr.style.backgroundColor =
                        r.rank === "1" ? "#ffe680" :
                        r.rank === "2" ? "#e0e0e0" :
                        r.rank === "3" ? "#e6c099" :
                        "#b0e0ff";

                    columns.forEach(c => {
                        const td = document.createElement("td");

                        if (c === "competition") {
                            td.innerHTML = `<a href="competition.html?id=${r.comp_id}">
                                ${r.competition.comp_name}
                            </a>`;
                        } else if (c === "category") {
                            td.textContent = r.category;
                        } else if (c === "format") {
                            td.textContent = r.competition.format;
                        } else {
                            td.textContent = r[c] || "";
                        }

                        tr.appendChild(td);
                    });

                    tbody.appendChild(tr);
                });
            });
        }

        render();
    });
}
// =========================
// National Federation Page
// =========================

function loadFederationPage() {
    const athleteContainer = document.getElementById("athlete-list");
    const clubContainer = document.getElementById("club-list");
    if (!athleteContainer || !clubContainer) return;

    const countryCode = getQueryParam("country");
    if (!countryCode) {
        athleteContainer.innerHTML = "<p>No country selected.</p>";
        clubContainer.innerHTML = "";
        return;
    }

    parseCSV("data/athletes.csv", athletes => {
        parseCSV("data/results.csv", results => {
            parseCSV("data/athlete_aliases.csv", aliases => {

                // =========================
                // Build Alias Maps
                // =========================
                

                aliases.forEach(row => {
                    const main = row.main_id?.trim();
                    const alias = row.alias_id?.trim();
                    if (!main || !alias) return;

                    aliasToMain[alias] = main;
                    if (!mainToAliases[main]) mainToAliases[main] = [];
                    mainToAliases[main].push(alias);
                });

                

                // =========================
                // Collect athletes representing this country
                // =========================
                const athleteSet = new Set();

results.forEach(r => {
    const id = resolveAthleteId(r.athlete_id?.trim());
    const country = id.substring(0,3);

    if (country === countryCode) {
        athleteSet.add(resolveAthleteId(id));
    }
});

                // Athletes to display
                const athletesToDisplay = athletes
    .filter(a => athleteSet.has(a.athlete_id))
    .filter(a => a.athlete_name && a.athlete_name !== "-")
    .sort((a,b) => a.athlete_name.localeCompare(b.athlete_name));

                // =========================
                // Clubs to display (unique clubs from this country)
                // =========================
                const clubsSet = new Set(
    athletesToDisplay
        .map(a => a.club)
        .filter(c => c && c.trim() !== "-" && c.trim() !== "")
);

                const clubsToDisplay = [...clubsSet].sort();

                // =========================
                // Header
                // =========================
                document.getElementById("federation-title").textContent =
                    `National Federation – ${countryCode}`;

                document.getElementById("federation-info").innerHTML =
                    `
					${renderFlag(countryCode)} </br>
					<strong>Total athletes:</strong> ${athletesToDisplay.length}</br>
					<strong>Total clubs:</strong> ${clubsToDisplay.length}
					`;

                athleteContainer.innerHTML = "";
                clubContainer.innerHTML = "";

                if (!athletesToDisplay.length) {
                    athleteContainer.innerHTML = "<p>No athletes found.</p>";
                }

                if (!clubsToDisplay.length) {
                    clubContainer.innerHTML = "<p>No clubs found.</p>";
                }

                // =========================
                // Athlete Table
                // =========================
                if (athletesToDisplay.length) {
                    const table = document.createElement("table");
                    table.className = "results-table";
                    athleteContainer.appendChild(table);

                    const thead = document.createElement("thead");
                    table.appendChild(thead);
                    const headRow = document.createElement("tr");
                    thead.appendChild(headRow);
                    ["Athlete", "Club", "Gender"].forEach(col => {
                        const th = document.createElement("th");
                        th.textContent = col;
                        headRow.appendChild(th);
                    });

                    const tbody = document.createElement("tbody");
                    table.appendChild(tbody);

                    let lastLetter = "";

                    athletesToDisplay.forEach(a => {
                        const currentLetter = a.athlete_name[0].toUpperCase();

                        // Athlete letter separator
                        if (currentLetter !== lastLetter) {
                            const sepTr = document.createElement("tr");
                            sepTr.className = "letter-separator";
                            const sepTh = document.createElement("th");
                            sepTh.colSpan = 3;
                            sepTh.textContent = currentLetter;
                            sepTr.appendChild(sepTh);
                            tbody.appendChild(sepTr);
                            lastLetter = currentLetter;
                        }

                        // Collect alias last names
                        const aliasIds = mainToAliases[a.athlete_id] || [];
                        let aliasLastNames = aliasIds
                            .map(id => athletes.find(x => x.athlete_id === resolveAthleteId(id)))
                            .filter(Boolean)
                            .map(x => x.athlete_name)
                            .filter(name => name !== a.athlete_name)
                            .map(name => name.split(" ")[0]);
                        aliasLastNames = [...new Set(aliasLastNames)];

                        const aliasHTML = aliasLastNames.length
                            ? ` <span class="alias">(née: ${aliasLastNames.join(" / ")})</span>`
                            : "";

                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>
                                <a href="athlete.html?id=${a.athlete_id}">
                                    ${a.athlete_name}
                                </a>${aliasHTML}
                            </td>
                            <td>
                                <a href="club.html?club=${encodeURIComponent(a.club)}">
                                    ${a.club}
                                </a>
                            </td>
                            <td>${a.gender || ""}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }

                // =========================
                // Club Table
                // =========================
                if (clubsToDisplay.length) {
                    const table = document.createElement("table");
                    table.className = "results-table";
                    clubContainer.appendChild(table);

                    const thead = document.createElement("thead");
                    table.appendChild(thead);
                    const headRow = document.createElement("tr");
                    thead.appendChild(headRow);
                    ["Club"].forEach(col => {
                        const th = document.createElement("th");
                        th.textContent = col;
                        headRow.appendChild(th);
                    });

                    const tbody = document.createElement("tbody");
                    table.appendChild(tbody);

                    clubsToDisplay.forEach(c => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>
                                <a href="club.html?club=${encodeURIComponent(c)}">
                                    ${c}
                                </a>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                }

            });
        });
    });
}



// =========================
// Club Page
// =========================


function loadClubPage() {

    const container = document.getElementById("athlete-list");
    if (!container) return;

    const clubName = getQueryParam("club");
    if (!clubName) {
        container.innerHTML = "<p>No club selected.</p>";
        return;
    }

    // =========================
    // Helper: load club logo with fallback
    // =========================
    function loadClubLogo(athlete) {
        const logo = document.getElementById("club-logo");
        if (!logo) return;

        const clubLogoPath = `photos/clubs/${encodeURIComponent(athlete.club)}.png`;
        const countryLogoPath = `photos/clubs/${athlete.country.toUpperCase()}.png`; 

        logo.onerror = () => {
            logo.onerror = null; // prevent infinite loop
            logo.src = countryLogoPath;
        };
        logo.src = clubLogoPath;
    }

    parseCSV("data/athletes.csv", athletes => {
        parseCSV("data/results.csv", results => {
            parseCSV("data/athlete_aliases.csv", aliases => {

                

               

                // Filter athletes by club name
                const athletesToDisplay = athletes
    .filter(a => a.club === clubName)
    .filter(a => a.athlete_name && a.athlete_name !== "-")
    .sort((a,b) => a.athlete_name.localeCompare(b.athlete_name));

                document.getElementById("club-title").textContent =
                    `${clubName}`;
				
                document.getElementById("club-info").innerHTML =
                    `<strong>Total athletes:</strong> ${athletesToDisplay.length}`;

                container.innerHTML = "";

                if (!athletesToDisplay.length) {
                    container.innerHTML = "<p>No athletes found.</p>";
                    return;
                }

                // Table
                const table = document.createElement("table");
                table.className = "results-table";
                container.appendChild(table);

                const thead = document.createElement("thead");
                table.appendChild(thead);

                const headRow = document.createElement("tr");
                thead.appendChild(headRow);

                ["Athlete", "Country", "Gender"].forEach(col => {
                    const th = document.createElement("th");
                    th.textContent = col;
                    headRow.appendChild(th);
                });

                const tbody = document.createElement("tbody");
                table.appendChild(tbody);

                // =========================
                // Add athletes with letter separators
                // =========================
                let lastLetter = "";

                athletesToDisplay.forEach(a => {
                    const currentLetter = a.athlete_name[0].toUpperCase();

                    if (currentLetter !== lastLetter) {
                        const sepTr = document.createElement("tr");
                        sepTr.className = "letter-separator";
                        const sepTh = document.createElement("th");
                        sepTh.colSpan = 3;
                        sepTh.textContent = currentLetter;
                        sepTr.appendChild(sepTh);
                        tbody.appendChild(sepTr);
                        lastLetter = currentLetter;
                    }

                    // Collect alias last names
                    const aliasIds = mainToAliases[a.athlete_id] || [];
                    let aliasLastNames = aliasIds
                        .map(id => athletes.find(x => x.athlete_id === resolveAthleteId(id)))
                        .filter(Boolean)
                        .map(x => x.athlete_name)
                        .filter(name => name !== a.athlete_name)
                        .map(name => name.split(" ")[0]);

                    aliasLastNames = [...new Set(aliasLastNames)];

                    const aliasHTML = aliasLastNames.length
                        ? ` <span class="alias">(née: ${aliasLastNames.join(" / ")})</span>`
                        : "";

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>
                            <a href="athlete.html?id=${a.athlete_id}">
                                ${a.athlete_name}
                            </a>${aliasHTML}
                        </td>
                        <td>${a.country || ""}</td>
                        <td>${a.gender || ""}</td>
                    `;
                    tbody.appendChild(tr);
                });

                // =========================
                // Load club logo after DOM is ready
                // =========================
                loadClubLogo(athletesToDisplay[0]);
            });
        });
    });
}

function loadWorldRankingPage() {
    const params = new URLSearchParams(window.location.search);
    const compId = params.get("id");

    if (!compId) return;

    parseCSV("data/world_ranking.csv", rankings => {
        parseCSV("data/athletes.csv", athletes => {
            parseCSV("data/competitions.csv", competitions => {

                const container = document.getElementById("ranking-table-container");
                const title = document.getElementById("ranking-title");
                const info = document.getElementById("ranking-info");

                const tabs = document.querySelectorAll(".tab-button");

                // Build athlete map
                const athleteMap = {};
                athletes.forEach(a => {
                    athleteMap[a.athlete_id] = a;
                });

                // Filter ranking by competition
                const fullRanking = rankings
                    .filter(r => r.comp_id === compId);

                if (!fullRanking.length) {
                    container.innerHTML = "<p>No ranking data found.</p>";
                    return;
                }

                const comp = competitions.find(c => c.comp_id === compId);
                title.textContent = "IAU World Ranking List";
                info.textContent = comp ? comp.date : "";

                // ===== RENDER FUNCTION =====
                function renderTable(category) {
                    container.innerHTML = "";

                    let filtered = [...fullRanking];

                   
                    filtered = filtered.filter(r => r.cat === category);
                    

                    filtered.sort((a, b) => Number(a.rank) - Number(b.rank));

                    if (!filtered.length) {
                        container.innerHTML = "<p>No data for this category.</p>";
                        return;
                    }

                    const table = document.createElement("table");
                    table.className = "results-table";
                    container.appendChild(table);

                    const thead = document.createElement("thead");
                    table.appendChild(thead);

                    const headRow = document.createElement("tr");
                    thead.appendChild(headRow);

                    ["Rank", "Athlete", "Country", "Points"].forEach(col => {
                        const th = document.createElement("th");
                        th.textContent = col;
                        headRow.appendChild(th);
                    });

                    const tbody = document.createElement("tbody");
                    table.appendChild(tbody);

                    filtered.forEach(r => {
                        const tr = document.createElement("tr");
                        const athlete = athleteMap[r.athlete_id];

                        // Rank
                        const tdRank = document.createElement("td");
                        tdRank.textContent = r.rank;
                        tr.appendChild(tdRank);

                        // Athlete
                        const tdName = document.createElement("td");
                        if (athlete) {
                            const link = document.createElement("a");
                            link.href = `athlete.html?id=${athlete.athlete_id}`;
                            link.textContent = athlete.athlete_name;
                            tdName.appendChild(link);
                        } else {
                            tdName.textContent = r.athlete_id;
                        }
                        tr.appendChild(tdName);

                        // Country
                        const tdCountry = document.createElement("td");
                        if (athlete && athlete.country) {
                            const link = document.createElement("a");
                            link.href = `national_federation.html?country=${athlete.country}`;
                            link.innerHTML = renderFlag(athlete.country);
                            tdCountry.appendChild(link);
                        }
                        tr.appendChild(tdCountry);

                        // Points
                        const tdPoints = document.createElement("td");
                        tdPoints.textContent = r.points;
                        tr.appendChild(tdPoints);

                        tbody.appendChild(tr);
                    });
                }

                // ===== TAB HANDLING =====
                tabs.forEach(tab => {
                    tab.addEventListener("click", () => {

                        tabs.forEach(t => t.classList.remove("active"));
                        tab.classList.add("active");

                        const category = tab.dataset.cat;
                        renderTable(category);
                    });
                });

                // Initial render
                renderTable("M");

            });
        });
    });
}

// =========================
// Global Random Buttons
// =========================
function initRandomButtons() {

    const randomCompetitionBtn = document.getElementById("random-competition");
    const randomAthleteBtn = document.getElementById("random-athlete");

    if (randomAthleteBtn) {
    parseCSV("data/athletes.csv", athletes => {
        parseCSV("data/results.csv", results => {

            const athletesWithResults = new Set(
                results.map(r => r.athlete_id)
            );

            const validAthletes = athletes.filter(a =>
    a.athlete_name &&
    a.athlete_name !== "-" &&
    resolveAthleteId(a.athlete_id) === a.athlete_id
);

            randomAthleteBtn.addEventListener("click", () => {
                if (!validAthletes.length) return;

                const random =
                    validAthletes[Math.floor(Math.random() * validAthletes.length)];

                window.location.href = `athlete.html?id=${random.athlete_id}`;
            });
        });
    });
}

    if (randomCompetitionBtn) {
        parseCSV("data/competitions.csv", competitions => {

            if (!competitions || !competitions.length) return;

            randomCompetitionBtn.addEventListener("click", () => {

                const validCompetitions = competitions.filter(c =>
                    c.comp_id && c.comp_name && c.comp_name.trim() !== ""
                );

                if (!validCompetitions.length) return;

                const random =
                    validCompetitions[
                        Math.floor(Math.random() * validCompetitions.length)
                    ];

                window.location.href = `competition.html?id=${random.comp_id}`;
            });
        });
    }
}



// =========================
// DOM Ready
// =========================
document.addEventListener("DOMContentLoaded", ()=>{
    loadCompetitionList();
    loadCompetitionPage();
    loadAthletePage();
	loadFederationPage(); 
	initRandomButtons();
	loadWorldRankingPage();
	/* -----------------------
       PDF DOWNLOAD BUTTON
    ----------------------- */

    const pdfBtn = document.getElementById("download-pdf"); // get the button
if (pdfBtn) {
    pdfBtn.addEventListener("click", generateSimplePDF); // attach your function
}
});


const matchTabBtn = document.getElementById("tab-matchplay");

if (matchTabBtn) {
    matchTabBtn.addEventListener("click", () => {

        const matchTab = document.getElementById("matchplay-tab");
        const resultsTab = document.getElementById("results-tab");

        if (matchTab) matchTab.style.display = "block";
        if (resultsTab) resultsTab.style.display = "none";

    });
}


// =========================
// Sidebar Filter Toggle (global)
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("filter-toggle");
    const sidebar = document.getElementById("filter-sidebar");
    const overlay = document.getElementById("filter-overlay");
    const closeBtn = document.getElementById("close-filters");

    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.add("open");
            overlay.classList.remove("hidden");
        });
    }

    if (closeBtn && sidebar && overlay) {
        closeBtn.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.add("hidden");
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.add("hidden");
        });
    }
});

// =========================
// PDF Export for Classic Results
// =========================
// =========================
// PDF Export for Classic Results with flags
// =========================
// Simple PDF export for Classic tab
function generateSimplePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const compName = document.getElementById("competition-name").textContent || "Competition";
    const compLocation = document.getElementById("competition-location").textContent || "";
    const compLevel = document.getElementById("competition-level").textContent || "";
    const compDate = document.getElementById("competition-date").textContent || "";

    // Title page
    doc.setFontSize(18);
    doc.text(compName, 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text(`${compLocation} ${compLevel} ${compDate}`, 105, 40, { align: "center" });

    const tables = document.querySelectorAll("#results-container table");

    tables.forEach((table, index) => {
        if (index > 0) doc.addPage(); // New page for each table

        const categoryTitle = table.querySelector("thead th")?.textContent || "Results";
        doc.setFontSize(14);
        doc.text(categoryTitle, 105, 20, { align: "center" });

        doc.setFontSize(10);

        // Collect rows
        const data = [];
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent);
        data.push(headers);

        table.querySelectorAll("tbody tr").forEach(tr => {
            const row = Array.from(tr.querySelectorAll("td")).map(td => td.textContent);
            data.push(row);
        });

        doc.autoTable({
            head: [data[0]],
            body: data.slice(1),
            startY: 30,
            theme: "grid",
            styles: { fontSize: 9 },
            headStyles: { fillColor: [200, 200, 200], textColor: 0 },
        });
    });

    doc.save(`${compName}-results.pdf`);
}

if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
    loadCountries();
	loadCompetitionList();   // existing
    renderRankingTab();      // new
    renderFederationsTab();  // new
    renderAthletesTab();     // new
    setupIndexTabs();        // tabs
}