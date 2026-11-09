
import csv
import os
from datetime import datetime, timezone
from urllib.parse import urlencode, quote
from xml.etree.ElementTree import (
    Element,
    SubElement,
    ElementTree,
    register_namespace,
    parse,
)

# ==================================================
# CONFIGURATION
# ==================================================

BASE_URL = "https://iau-crossbow-mo.github.io/IAU-Database/"

DATA_DIR = "data"
OUTPUT_FILE = "sitemap.xml"

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

register_namespace("", SITEMAP_NS)

# Static pages
STATIC_PAGES = [
    "index.html",
    "athlete.html",
    "competition.html",
    "world_ranking.html",
    "national_federation.html",
    "club.html",
]

# ==================================================
# CSV READER
# ==================================================

def read_csv(filename):
    path = os.path.join(DATA_DIR, filename)

    if not os.path.isfile(path):
        print(f"WARNING: {filename} not found. Skipping.")
        return []

    for encoding in ("utf-8-sig", "cp1252"):
        try:
            with open(
                path,
                "r",
                encoding=encoding,
                newline=""
            ) as file:
                return list(
                    csv.DictReader(file, delimiter=";")
                )

        except UnicodeDecodeError:
            continue

    raise ValueError(
        f"Unable to decode CSV file: {filename}"
    )


# ==================================================
# HELPER FUNCTIONS
# ==================================================

urls = {}

def clean(value):
    """Normalize CSV values."""
    if value is None:
        return ""
    return str(value).strip()


def add_url(path, source_files=None):
    """Add a URL without duplicates."""

    url = BASE_URL + path

    if url not in urls:
        urls[url] = set()

    if source_files:
        urls[url].update(source_files)


def add_query_url(page, parameter, value, source_file=None):
    """Create an encoded parameter-based URL."""

    value = clean(value)

    if not value:
        return

    query = urlencode(
        {parameter: value},
        quote_via=quote
    )

    add_url(
        f"{page}?{query}",
        [source_file] if source_file else None
    )


def latest_modification(source_files):
    """Return the latest modification date of source CSVs."""

    timestamps = []

    for filename in source_files:
        path = os.path.join(DATA_DIR, filename)

        if os.path.isfile(path):
            timestamps.append(os.path.getmtime(path))

    if not timestamps:
        return None

    latest = max(timestamps)

    return datetime.fromtimestamp(
        latest,
        tz=timezone.utc
    ).date().isoformat()


# ==================================================
# LOAD DATABASE
# ==================================================

athletes = read_csv("athletes.csv")
aliases = read_csv("athlete_aliases.csv")
competitions = read_csv("competitions.csv")
rankings = read_csv("world_ranking.csv")


# ==================================================
# STATIC PAGES
# ==================================================

for page in STATIC_PAGES:
    add_url(page)


# ==================================================
# ATHLETES
# ==================================================

alias_ids = {
    clean(row.get("alias_id"))
    for row in aliases
    if clean(row.get("alias_id"))
}

athlete_ids = {
    clean(row.get("athlete_id"))
    for row in athletes
    if clean(row.get("athlete_id"))
    and clean(row.get("athlete_id")) not in alias_ids
}

for athlete_id in sorted(athlete_ids):
    add_query_url(
        "athlete.html",
        "id",
        athlete_id,
        "athletes.csv"
    )


# ==================================================
# COMPETITIONS
# ==================================================

competition_ids = {
    clean(row.get("comp_id"))
    for row in competitions
    if clean(row.get("comp_id"))
}

for comp_id in sorted(competition_ids):
    add_query_url(
        "competition.html",
        "id",
        comp_id,
        "competitions.csv"
    )


# ==================================================
# WORLD RANKINGS
# ==================================================

ranking_ids = {
    clean(row.get("comp_id"))
    for row in rankings
    if clean(row.get("comp_id"))
}

for comp_id in sorted(ranking_ids):
    add_query_url(
        "world_ranking.html",
        "id",
        comp_id,
        "world_ranking.csv"
    )


# ==================================================
# NATIONAL FEDERATIONS
# ==================================================

countries = {
    clean(row.get("country"))
    for row in athletes
    if clean(row.get("country"))
}

for country in sorted(countries):
    add_query_url(
        "national_federation.html",
        "country",
        country,
        "athletes.csv"
    )


# ==================================================
# CLUBS
# ==================================================

clubs = {
    clean(row.get("club"))
    for row in athletes
    if clean(row.get("club"))
    and clean(row.get("club")) not in ("-", "N/A", "NULL")
}

for club in sorted(clubs):
    add_query_url(
        "club.html",
        "club",
        club,
        "athletes.csv"
    )


# ==================================================
# GENERATE XML
# ==================================================

root = Element(
    f"{{{SITEMAP_NS}}}urlset"
)

for url in sorted(urls):

    entry = SubElement(
        root,
        f"{{{SITEMAP_NS}}}url"
    )

    loc = SubElement(
        entry,
        f"{{{SITEMAP_NS}}}loc"
    )

    loc.text = url

    # Add lastmod only when source data is known.
    lastmod = latest_modification(urls[url])

    if lastmod:
        lastmod_element = SubElement(
            entry,
            f"{{{SITEMAP_NS}}}lastmod"
        )
        lastmod_element.text = lastmod


# ==================================================
# SAVE XML
# ==================================================

tree = ElementTree(root)

try:
    ElementTree.indent(tree, space="  ")
except AttributeError:
    pass

tree.write(
    OUTPUT_FILE,
    encoding="UTF-8",
    xml_declaration=True
)


# ==================================================
# VALIDATE OUTPUT
# ==================================================

parse(OUTPUT_FILE)

print()
print("======================================")
print("SITEMAP SUCCESSFULLY GENERATED")
print("======================================")
print(f"Total URLs: {len(urls)}")
print(f"Output file: {OUTPUT_FILE}")
print(f"Base URL: {BASE_URL}")
print("XML validation: PASSED")
print("======================================")
