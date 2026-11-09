
import csv
import os
from urllib.parse import urlencode
from xml.etree.ElementTree import (
    Element, SubElement, ElementTree
)

# =====================================
# CONFIGURATION
# =====================================

BASE_URL = "https://iau-crossbow-mo.github.io/IAU-Database/"

DATA_DIR = "data"
OUTPUT_FILE = "sitemap.xml"

# Static pages to include
STATIC_PAGES = [
    "index.html",
    "athlete.html",
    "competition.html",
    "world_ranking.html",
    "national_federation.html",
    "club.html",
]

# =====================================
# CSV READER
# =====================================


def read_csv(filename):
    path = os.path.join(DATA_DIR, filename)

    # First try UTF-8
    try:
        with open(path, "r", encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f, delimiter=";"))

    # If UTF-8 fails, try Windows-1252
    except UnicodeDecodeError:
        print(f"UTF-8 decoding failed for {filename}. Trying Windows-1252.")

        with open(path, "r", encoding="cp1252", newline="") as f:
            return list(csv.DictReader(f, delimiter=";"))



# =====================================
# URL BUILDER
# =====================================

urls = set()

def add_url(path):
    urls.add(BASE_URL + path)


def add_query_url(page, parameter, value):
    query = urlencode({parameter: value})
    add_url(f"{page}?{query}")


# =====================================
# STATIC PAGES
# =====================================

for page in STATIC_PAGES:
    add_url(page)


# =====================================
# ATHLETES AND ALIASES
# =====================================

athletes = read_csv("athletes.csv")
aliases = read_csv("athlete_aliases.csv")

alias_ids = {
    row["alias_id"].strip()
    for row in aliases
    if row.get("alias_id", "").strip()
}

athlete_ids = set()

for athlete in athletes:
    athlete_id = athlete.get("athlete_id", "").strip()

    if athlete_id and athlete_id not in alias_ids:
        athlete_ids.add(athlete_id)

for athlete_id in athlete_ids:
    add_query_url("athlete.html", "id", athlete_id)


# =====================================
# COMPETITIONS
# =====================================

competitions = read_csv("competitions.csv")

competition_ids = {
    row["comp_id"].strip()
    for row in competitions
    if row.get("comp_id", "").strip()
}

for comp_id in competition_ids:
    add_query_url("competition.html", "id", comp_id)


# =====================================
# WORLD RANKINGS
# =====================================

rankings = read_csv("world_ranking.csv")

ranking_ids = {
    row["comp_id"].strip()
    for row in rankings
    if row.get("comp_id", "").strip()
}

for comp_id in ranking_ids:
    add_query_url("world_ranking.html", "id", comp_id)


# =====================================
# NATIONAL FEDERATIONS
# =====================================

countries = {
    row["country"].strip()
    for row in athletes
    if row.get("country", "").strip()
}

for country in countries:
    add_query_url(
        "national_federation.html",
        "country",
        country
    )


# =====================================
# CLUBS
# =====================================

clubs = {
    row["club"].strip()
    for row in athletes
    if row.get("club", "").strip()
    and row["club"].strip() != "-"
}

for club in clubs:
    add_query_url("club.html", "club", club)


# =====================================
# GENERATE XML
# =====================================

namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"

Element(
    "urlset",
    xmlns=namespace
)

root = Element(
    f"{{{namespace}}}urlset"
)

for url in sorted(urls):
    entry = SubElement(
        root,
        f"{{{namespace}}}url"
    )

    loc = SubElement(
        entry,
        f"{{{namespace}}}loc"
    )

    loc.text = url


# =====================================
# SAVE
# =====================================

tree = ElementTree(root)

ElementTree.indent(tree, space="  ")

tree.write(
    OUTPUT_FILE,
    encoding="utf-8",
    xml_declaration=True
)

print("Sitemap successfully generated!")
print(f"Total URLs: {len(urls)}")
print(f"Output: {OUTPUT_FILE}")
