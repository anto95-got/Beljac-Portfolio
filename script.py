#!/usr/bin/env python3
import html
import json
import os
import re
import time
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus

import feedparser
import requests

# ==========================================
# CONFIGURATION RSS / FEEDPARSER
# ==========================================
QUERY_TERMS = [
    "Boston Dynamics",
    "Tesla Optimus",
    "Figure AI",
    "Nvidia Robotics",
    "robot humanoide",
    "IA robotique",
]

# Dates de debut et de fin
START_DATE = datetime(2026, 1, 1)
END_DATE = datetime.now()

MAX_NEWS_PER_WEEK = 4
MAX_ITEMS_PER_FEED = 20
REQUEST_TIMEOUT_SECONDS = 20

# Optionnel pour debug rapide (0 = toutes les semaines)
MAX_WEEKS = int(os.getenv("MAX_WEEKS", "0"))

TAG_REGEX = re.compile(r"<[^>]+>")
MULTISPACE_REGEX = re.compile(r"\s+")


def strip_source_suffix(text, source):
    """Retire le nom de source en fin de texte si present."""
    if not text or not source:
        return text

    normalized_source = source.strip().lower()
    normalized_text = text.strip()

    if not normalized_source:
        return normalized_text

    lower_text = normalized_text.lower()
    if lower_text.endswith(normalized_source):
        stripped = normalized_text[: len(normalized_text) - len(normalized_source)].rstrip()
        # Nettoie les separateurs residuels avant la source
        stripped = re.sub(r"[\s\-–—|:·]+$", "", stripped).strip()
        if stripped:
            return stripped

    return normalized_text


def clean_text(raw_text, source=""):
    """Nettoie HTML + entites + espaces + suffixe source."""
    if not raw_text:
        return ""

    text = str(raw_text)
    text = TAG_REGEX.sub(" ", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = MULTISPACE_REGEX.sub(" ", text).strip()
    text = strip_source_suffix(text, source)
    return text


def build_google_news_feed_url(term, start_of_week, end_of_week):
    # Google News: before est exclusif, donc +1 jour
    start_str = start_of_week.strftime("%Y-%m-%d")
    end_str = (end_of_week + timedelta(days=1)).strftime("%Y-%m-%d")
    query = f'"{term}" after:{start_str} before:{end_str}'

    return (
        "https://news.google.com/rss/search?"
        f"q={quote_plus(query)}&hl=fr&gl=FR&ceid=FR:fr"
    )


def parse_entry_datetime(entry):
    if entry.get("published_parsed"):
        t = entry.published_parsed
        return datetime(t.tm_year, t.tm_mon, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec)

    if entry.get("updated_parsed"):
        t = entry.updated_parsed
        return datetime(t.tm_year, t.tm_mon, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec)

    raw = entry.get("published") or entry.get("updated")
    if raw:
        try:
            dt = parsedate_to_datetime(raw)
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt
        except Exception:
            return None

    return None


def fetch_feed_entries(feed_url, term):
    try:
        response = requests.get(
            feed_url,
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"User-Agent": "Mozilla/5.0 (compatible; veille-bot/1.0)"},
        )
        response.raise_for_status()
        parsed = feedparser.parse(response.content)

        if parsed.bozo and not parsed.entries:
            print(f"⚠️ Flux invalide pour '{term}'")
            return []

        return parsed.entries[:MAX_ITEMS_PER_FEED]
    except Exception as e:
        print(f"⚠️ Erreur RSS pour '{term}': {e}")
        return []


def get_news_for_week(start_of_week, end_of_week):
    from_date = start_of_week.strftime("%Y-%m-%d")
    to_date = end_of_week.strftime("%Y-%m-%d")
    print(f"Recherche des actualites du {from_date} au {to_date}...")

    week_start = start_of_week.date()
    week_end = end_of_week.date()

    seen = set()
    collected = []

    for term in QUERY_TERMS:
        feed_url = build_google_news_feed_url(term, start_of_week, end_of_week)
        entries = fetch_feed_entries(feed_url, term)

        for entry in entries:
            source_name = term
            entry_source = entry.get("source")
            if isinstance(entry_source, dict):
                source_name = clean_text(entry_source.get("title", term))
            elif isinstance(entry_source, str):
                source_name = clean_text(entry_source)

            title = clean_text(entry.get("title") or "Titre inconnu", source_name)
            link = (entry.get("link") or "").strip()
            summary = clean_text(entry.get("summary") or "Pas de resume disponible.", source_name)

            content_value = ""
            if entry.get("content") and len(entry.content) > 0:
                content_value = clean_text(entry.content[0].get("value", ""), source_name)
            if not content_value:
                content_value = summary or "Voir l'article source."

            pub_dt = parse_entry_datetime(entry)
            if pub_dt and not (week_start <= pub_dt.date() <= week_end):
                continue

            dedup_key = (link or title).lower()
            if not dedup_key or dedup_key in seen:
                continue
            seen.add(dedup_key)

            collected.append(
                {
                    "title": title,
                    "summary": summary,
                    "content": content_value,
                    "source": source_name,
                    "link": link,
                    "date": pub_dt.strftime("%Y-%m-%d") if pub_dt else "",
                    "_sort_dt": pub_dt or datetime.min,
                }
            )

        time.sleep(0.3)

    collected.sort(key=lambda item: item["_sort_dt"], reverse=True)
    final_news = collected[:MAX_NEWS_PER_WEEK]

    for item in final_news:
        item.pop("_sort_dt", None)

    return final_news


def main():
    historique_json = []
    current_date = START_DATE
    week_number = 1

    while current_date < END_DATE:
        if MAX_WEEKS and week_number > MAX_WEEKS:
            break

        end_of_week = current_date + timedelta(days=6)
        if end_of_week > END_DATE:
            end_of_week = END_DATE

        month_year = current_date.strftime("%B %Y")
        week_label = f"Semaine {week_number} - {month_year}"

        news_items = get_news_for_week(current_date, end_of_week)

        week_data = {"week": week_label, "news": news_items}
        if len(news_items) == 0:
            week_data["status"] = "pas assez de donnees"

        historique_json.append(week_data)
        current_date += timedelta(days=7)
        week_number += 1

        # Evite de spammer les sources RSS
        time.sleep(0.5)

    with open("historique_ia_robotique.json", "w", encoding="utf-8") as f:
        json.dump(historique_json, f, ensure_ascii=False, indent=2)

    print("\n✅ Fichier 'historique_ia_robotique.json' genere avec succes !")


if __name__ == "__main__":
    main()
