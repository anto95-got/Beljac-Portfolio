#!/usr/bin/env python3
import argparse
import calendar
import html
import json
import os
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


APP_NAME = "AutoVeille"
MAX_NEWS_PER_WEEK = 4
MAX_HISTORY_WEEKS = 20
MAX_AI_CANDIDATES = 12
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

SEARCH_QUERIES = [
    "robot humanoide IA",
    "Boston Dynamics OR Tesla Optimus OR Figure AI",
    "robotique intelligence artificielle",
]

IMPORTANT_KEYWORDS = [
    ("robot humanoïde", 35),
    ("robot humanoide", 35),
    ("humanoïde", 30),
    ("humanoide", 30),
    ("robotique", 24),
    ("robot", 18),
    ("robots", 18),
    ("intelligence artificielle", 18),
    (" ia ", 12),
    ("autonome", 12),
    ("autonomie", 12),
    ("usine", 10),
    ("industrie", 10),
    ("batterie", 8),
    ("tesla optimus", 28),
    ("boston dynamics", 28),
    ("figure ai", 28),
    ("unitree", 24),
    ("atlas", 20),
    ("agility robotics", 18),
    ("ubtech", 18),
    ("1x", 14),
]

SOURCE_KEYWORDS = [
    ("l'usine digitale", 18),
    ("usine digitale", 18),
    ("techcrunch", 16),
    ("the robot report", 16),
    ("ieee", 16),
    ("mit", 14),
    ("le monde", 12),
    ("les echos", 12),
    ("la tribune", 10),
    ("frenchweb", 10),
    ("bfm", 8),
    ("clubic", 8),
]

NOISE_KEYWORDS = [
    ("bourse", 25),
    ("action en bourse", 25),
    ("crypto", 20),
    ("football", 20),
    ("vr", 18),
    ("black mirror", 18),
    ("kia", 18),
    ("voiture", 14),
    ("santé", 10),
]


def log(message, debug=False):
    if debug:
        print(f"[debug] {message}")


def info(message):
    print(f"[{APP_NAME}] {message}")


def get_base_path():
    env_path = os.environ.get("AUTOVEILLE_BASE_PATH")
    if env_path:
        return Path(env_path).expanduser().resolve()

    candidates = [Path.cwd()]
    if getattr(sys, "frozen", False):
        candidates.append(Path(sys.executable).resolve().parent)
        candidates.append(Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent)))
    else:
        candidates.append(Path(__file__).resolve().parent)

    for candidate in candidates:
        if (candidate / "public" / "veille").exists():
            return candidate.resolve()

    return candidates[0].resolve()


def load_env_file():
    env_path = get_base_path() / ".env"
    if not env_path.exists():
        return

    with env_path.open("r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def target_json_path():
    return get_base_path() / "public" / "veille" / "historique_ia_robotique.json"


def clean_text(value):
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_date(value):
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return datetime.now(timezone.utc)

    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    for fmt in formats:
        try:
            parsed = datetime.strptime(str(value), fmt)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    return datetime.now(timezone.utc)


def date_only(value):
    return parse_date(value).date().isoformat()


def iso_week_id(value):
    parsed = parse_date(value).date()
    year, week, _ = parsed.isocalendar()
    return f"{year}-W{week:02d}"


def week_label(value):
    parsed = parse_date(value).date()
    year, week, _ = parsed.isocalendar()
    return f"Semaine {week} - {year}"


def child_text(node, name):
    child = node.find(name)
    return clean_text(child.text if child is not None else "")


def split_google_title(title, source):
    if source:
        suffix = f" - {source}"
        if title.endswith(suffix):
            return title[: -len(suffix)].strip()

    parts = title.rsplit(" - ", 1)
    if len(parts) == 2 and len(parts[1]) <= 45:
        return parts[0].strip()
    return title


def why_important(article):
    signals = article.get("aiSignals") or []
    if signals:
        subject = ", ".join(signals[:3])
        return (
            "Cette actualité est importante pour la veille robots IA car elle est "
            f"directement liée à {subject}. Elle permet de suivre les avancées "
            "concrètes des robots autonomes ou humanoïdes et leurs usages dans le monde réel."
        )

    return (
        "Cette actualité est importante pour la veille robots IA car elle montre "
        "une évolution concrète de la robotique et de l'intelligence artificielle. "
        "Elle permet de suivre les acteurs, les usages et les impacts possibles "
        "des robots autonomes ou humanoïdes."
    )


def score_article(article, debug=False):
    text = f"{article.get('title', '')} {article.get('summary', '')} {article.get('content', '')}".lower()
    source = article.get("source", "").lower()
    signals = []
    score = 0

    for keyword, points in IMPORTANT_KEYWORDS:
        if keyword in text:
            score += points
            signals.append(keyword)

    for keyword, points in SOURCE_KEYWORDS:
        if keyword in source:
            score += points

    for keyword, penalty in NOISE_KEYWORDS:
        if keyword in text:
            score -= penalty

    article_date = parse_date(article.get("date"))
    age_days = max(0, (datetime.now(timezone.utc) - article_date).days)
    score += max(0, 14 - age_days)

    article["aiScore"] = score
    article["aiSignals"] = list(dict.fromkeys(signals))
    log(f"score={score} source={article.get('source')} title={article.get('title')}", debug)
    return score


def normalize_article(raw, debug=False):
    source = clean_text(raw.get("source") or "Source inconnue")
    title = split_google_title(clean_text(raw.get("title") or "Titre inconnu"), source)
    summary = clean_text(raw.get("summary") or title)
    content = clean_text(raw.get("content") or summary)
    link = clean_text(raw.get("link") or "#")

    article = {
        "title": title,
        "summary": summary,
        "content": content,
        "source": source,
        "link": link,
        "date": date_only(raw.get("date")),
    }
    score_article(article, debug=debug)
    article["whyImportant"] = clean_text(raw.get("whyImportant")) or why_important(article)
    return article


def public_article(article):
    cleaned = dict(article)
    cleaned.pop("aiScore", None)
    cleaned.pop("aiSignals", None)
    return cleaned


def build_feed_urls(start_date=None, end_date=None):
    urls = []
    for query in SEARCH_QUERIES:
        query_text = query
        if start_date and end_date:
            query_text = f"{query} after:{start_date.isoformat()} before:{end_date.isoformat()}"
        encoded = urllib.parse.quote_plus(query_text)
        urls.append(f"https://news.google.com/rss/search?q={encoded}&hl=fr&gl=FR&ceid=FR:fr")
    return urls


def fetch_feed(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 AutoVeille/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.read()
    except urllib.error.URLError as error:
        reason = getattr(error, "reason", None)
        if isinstance(reason, ssl.SSLCertVerificationError):
            context = ssl._create_unverified_context()
            with urllib.request.urlopen(request, timeout=15, context=context) as response:
                return response.read()
        raise


def fetch_articles(start_date=None, end_date=None, debug=False):
    articles = []
    seen = set()

    for feed_url in build_feed_urls(start_date, end_date):
        log(f"Flux RSS: {feed_url}", debug)
        try:
            xml_bytes = fetch_feed(feed_url)
            root = ET.fromstring(xml_bytes)
            for item in root.findall("./channel/item"):
                raw = {
                    "title": child_text(item, "title"),
                    "summary": child_text(item, "description"),
                    "content": child_text(item, "description"),
                    "source": child_text(item, "source"),
                    "link": child_text(item, "link"),
                    "date": child_text(item, "pubDate"),
                }
                article = normalize_article(raw, debug=debug)
                score = article.get("aiScore", score_article(article, debug=debug))
                if score <= 0:
                    continue
                key = f"{article['link']}|{article['title']}".lower()
                if key in seen:
                    continue
                seen.add(key)
                articles.append(article)
        except (urllib.error.URLError, ET.ParseError, TimeoutError) as error:
            log(f"Flux ignore: {feed_url} ({error})", True if debug else False)

    articles.sort(key=lambda item: (item.get("aiScore", 0), parse_date(item["date"])), reverse=True)
    selected = select_with_gemini(articles[:MAX_AI_CANDIDATES], debug=debug) or articles[:MAX_NEWS_PER_WEEK]

    for article in selected:
        article["whyImportant"] = article.get("whyImportant") or why_important(article)
        article = public_article(article)

    selected = [public_article(article) for article in selected]
    log(f"Articles retenus: {len(selected)}", debug)
    return selected


def extract_gemini_text(response_data):
    parts = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts).strip()


def parse_json_text(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


def call_gemini(prompt, debug=False):
    api_key = (os.environ.get("GEMINI_API_KEY", "") or os.environ.get("VITE_GEMINI_API_KEY", "")).strip()
    if not api_key:
        log("Gemini desactive: GEMINI_API_KEY absent.", debug)
        return None

    model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "selected": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "index": {"type": "INTEGER"},
                                "aiSummary": {"type": "STRING"},
                                "whyImportant": {"type": "STRING"},
                            },
                            "required": ["index", "aiSummary", "whyImportant"],
                        },
                    },
                },
                "required": ["selected"],
            },
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )

    try:
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as error:
            reason = getattr(error, "reason", None)
            if isinstance(reason, ssl.SSLCertVerificationError):
                context = ssl._create_unverified_context()
                with urllib.request.urlopen(request, timeout=30, context=context) as response:
                    return json.loads(response.read().decode("utf-8"))
            raise
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        log(f"Gemini HTTP {error.code}: {details}", debug)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        log(f"Gemini ignore: {error}", debug)
    return None


def select_with_gemini(candidates, debug=False):
    if len(candidates) <= MAX_NEWS_PER_WEEK:
        return None

    prompt_articles = [
        {
            "index": index,
            "title": article["title"],
            "summary": article["summary"][:280],
            "source": article["source"],
            "date": article["date"],
            "localScore": article.get("aiScore", 0),
        }
        for index, article in enumerate(candidates)
    ]
    prompt = (
        "Tu aides a alimenter une veille technologique sur les robots IA.\n"
        "Choisis exactement les 4 actualites les plus pertinentes pour un portfolio BTS SIO.\n"
        "Priorite: robots humanoides, robotique controlee par IA, autonomie, industrie, Figure AI, "
        "Boston Dynamics, Tesla Optimus, Unitree, BMW, Hyundai, recherche robotique.\n"
        "Ignore les sujets hors veille: bourse pure, VR, automobile sans robotique, divertissement.\n"
        "Retourne uniquement du JSON valide avec la forme:\n"
        "{\"selected\":[{\"index\":0,\"aiSummary\":\"2 phrases\",\"whyImportant\":\"2 a 4 phrases simples\"}]}\n\n"
        f"Articles candidats:\n{json.dumps(prompt_articles, ensure_ascii=False, indent=2)}"
    )

    response_data = call_gemini(prompt, debug=debug)
    if not response_data:
        return None

    try:
        parsed = parse_json_text(extract_gemini_text(response_data))
        selected = parsed.get("selected", [])
    except (json.JSONDecodeError, AttributeError, TypeError) as error:
        log(f"Gemini JSON ignore: {error}", debug)
        return None

    results = []
    used = set()
    for item in selected:
        try:
            index = int(item.get("index"))
        except (TypeError, ValueError):
            continue
        if index in used or index < 0 or index >= len(candidates):
            continue

        article = dict(candidates[index])
        article["summary"] = clean_text(item.get("aiSummary") or article["summary"])
        article["content"] = article["summary"]
        article["whyImportant"] = clean_text(item.get("whyImportant")) or why_important(article)
        results.append(public_article(article))
        used.add(index)
        if len(results) == MAX_NEWS_PER_WEEK:
            break

    if len(results) < MAX_NEWS_PER_WEEK:
        return None

    log("Selection Gemini appliquee.", True if debug else False)
    return results


def normalize_entry(entry):
    news = entry.get("news") if isinstance(entry, dict) else []
    if not isinstance(news, list):
        news = []
    normalized_news = [public_article(normalize_article(item)) for item in news if isinstance(item, dict)]
    first_date = normalized_news[0]["date"] if normalized_news else datetime.now(timezone.utc).date().isoformat()
    parsed_date = parse_date(first_date)
    return {
        "weekId": clean_text(entry.get("weekId") or entry.get("week") or iso_week_id(parsed_date)),
        "week": clean_text(entry.get("week") or week_label(parsed_date)),
        "news": normalized_news[:MAX_NEWS_PER_WEEK],
    }


def load_existing(path):
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, list):
        entries = [normalize_entry(entry) for entry in data if isinstance(entry, dict)]
        entries = [entry for entry in entries if entry["news"]]
        return {
            "latest": entries[-1] if entries else {"weekId": "", "week": "", "news": []},
            "history": list(reversed(entries[:-1]))[:MAX_HISTORY_WEEKS],
        }
    if not isinstance(data, dict):
        raise ValueError("Le JSON de veille doit etre un objet ou une liste.")

    latest = normalize_entry(data.get("latest") or {})
    history = [normalize_entry(entry) for entry in data.get("history", []) if isinstance(entry, dict)]
    return {"latest": latest, "history": [entry for entry in history if entry["news"]][:MAX_HISTORY_WEEKS]}


def write_data(path, data):
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")


def dedupe_history(history):
    seen_weeks = set()
    cleaned = []
    for entry in history:
        week_id = entry.get("weekId")
        if not week_id or week_id in seen_weeks or not entry.get("news"):
            continue
        seen_weeks.add(week_id)
        cleaned.append(entry)
    return cleaned[:MAX_HISTORY_WEEKS]


def ensure_json_file(path):
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable: {path}. AutoVeille modifie ce fichier existant.")


def update_current_week(force=False, debug=False):
    path = target_json_path()
    ensure_json_file(path)
    log(f"JSON: {path}", debug)

    current = load_existing(path)
    today = datetime.now(timezone.utc)
    current_week_id = iso_week_id(today)

    if current.get("latest", {}).get("news") and current["latest"].get("weekId") == current_week_id and not force:
        info("La semaine actuelle existe deja. Utilise --force pour la remplacer.")
        return False

    articles = fetch_articles(debug=debug)
    if not articles:
        raise RuntimeError("Aucune actualite recuperee. Le fichier n'a pas ete modifie.")

    history = list(current.get("history", []))
    old_latest = current.get("latest", {})
    if old_latest.get("news") and old_latest.get("weekId") != current_week_id:
        history.insert(0, old_latest)

    next_data = {
        "latest": {"weekId": current_week_id, "week": week_label(today), "news": articles},
        "history": dedupe_history(history),
    }
    write_data(path, next_data)
    info(f"Veille actuelle mise a jour: {current_week_id} ({len(articles)} articles)")
    return True


def month_bounds(month_value):
    year, month = map(int, month_value.split("-"))
    first = date(year, month, 1)
    last = date(year, month, calendar.monthrange(year, month)[1])
    return first, last


def week_ranges_between(from_month, to_month):
    start_month, _ = month_bounds(from_month)
    _, end_month = month_bounds(to_month)
    start = start_month - timedelta(days=start_month.weekday())
    end = end_month + timedelta(days=(6 - end_month.weekday()))

    current = start
    while current <= end:
        week_start = current
        week_end = current + timedelta(days=7)
        if week_end > start_month and week_start <= end_month:
            yield week_start, week_end
        current += timedelta(days=7)


def update_missing_weeks(from_month, to_month, force=False, debug=False):
    path = target_json_path()
    ensure_json_file(path)
    log(f"JSON: {path}", debug)

    current = load_existing(path)
    latest_week = current.get("latest", {}).get("weekId")
    history = list(current.get("history", []))
    existing = {entry.get("weekId") for entry in history}
    if latest_week:
        existing.add(latest_week)

    generated = 0
    for week_start, week_end in week_ranges_between(from_month, to_month):
        week_id = iso_week_id(week_start)
        if week_id in existing and not force:
            log(f"Semaine ignoree deja existante: {week_id}", debug)
            continue

        log(f"Generation semaine {week_id}: {week_start} -> {week_end}", debug)
        articles = fetch_articles(start_date=week_start, end_date=week_end, debug=debug)
        if not articles:
            log(f"Aucun article pour {week_id}", debug)
            continue

        entry = {"weekId": week_id, "week": week_label(week_start), "news": articles}
        history = [item for item in history if item.get("weekId") != week_id]
        if current.get("latest", {}).get("weekId") == week_id:
            current["latest"] = entry
        else:
            history.insert(0, entry)
        existing.add(week_id)
        generated += 1

    current["history"] = dedupe_history(sorted(history, key=lambda item: item.get("weekId", ""), reverse=True))
    write_data(path, current)
    info(f"Semaines generees ou remplacees: {generated}")
    return generated > 0


def run_command(command, debug=False):
    info(f"$ {' '.join(command)}")
    if debug:
        subprocess.run(command, cwd=get_base_path(), check=True)
    else:
        subprocess.run(command, cwd=get_base_path(), check=True)


def deploy_hosting(debug=False):
    run_command(["npm", "run", "build"], debug=debug)
    run_command(["firebase", "deploy", "--only", "hosting"], debug=debug)
    info("Deploiement Firebase Hosting termine.")


def build_cli():
    command = ["pyinstaller", "--onefile", "--name", "AutoVeille", "autoveille.py"]
    run_command(command, debug=True)
    info(f"Executable genere dans {get_base_path() / 'dist' / 'AutoVeille'}")


def ask_yes_no(question):
    while True:
        answer = input(f"{question} (oui/non) ").strip().lower()
        if answer in {"oui", "o", "yes", "y"}:
            return True
        if answer in {"non", "n", "no"}:
            return False
        print("Reponse attendue: oui ou non.")


def ask_interactive_questions():
    do_new = ask_yes_no("Faire une nouvelle veille ?")
    do_update = ask_yes_no("Mettre a jour des semaines passees ?")
    from_month = to_month = None
    if do_update:
        from_month = input("Date de debut (YYYY-MM) ").strip()
        to_month = input("Date de fin (YYYY-MM) ").strip()
    do_deploy = ask_yes_no("Deployer apres ?")
    return {"new": do_new, "update": do_update, "from": from_month, "to": to_month, "deploy": do_deploy}


def validate_month(value):
    if not re.fullmatch(r"\d{4}-\d{2}", value or ""):
        raise ValueError("Format attendu: YYYY-MM")
    month_bounds(value)


def handle_veille(args):
    if not args.new and not args.update:
        choices = ask_interactive_questions()
        changed = False
        if choices["new"]:
            changed = update_current_week(force=args.force, debug=args.debug) or changed
        if choices["update"]:
            validate_month(choices["from"])
            validate_month(choices["to"])
            changed = update_missing_weeks(choices["from"], choices["to"], force=args.force, debug=args.debug) or changed
        if choices["deploy"] and changed:
            deploy_hosting(debug=args.debug)
        return

    changed = False
    if args.new:
        changed = update_current_week(force=args.force, debug=args.debug) or changed
    if args.update:
        if not args.from_month or not args.to_month:
            raise ValueError("--update requiert --from YYYY-MM et --to YYYY-MM")
        validate_month(args.from_month)
        validate_month(args.to_month)
        changed = update_missing_weeks(args.from_month, args.to_month, force=args.force, debug=args.debug) or changed
    if args.deploy and changed:
        deploy_hosting(debug=args.debug)


def build_parser():
    parser = argparse.ArgumentParser(prog="AutoVeille", description="CLI de veille technologique robots IA.")
    subparsers = parser.add_subparsers(dest="command")

    veille = subparsers.add_parser("veille", help="Gerer et alimenter la veille technologique.")
    veille.add_argument("--new", action="store_true", help="Met a jour la semaine actuelle dans latest.")
    veille.add_argument("--update", action="store_true", help="Remplit les semaines passees manquantes.")
    veille.add_argument("--from", dest="from_month", help="Mois de debut YYYY-MM pour --update.")
    veille.add_argument("--to", dest="to_month", help="Mois de fin YYYY-MM pour --update.")
    veille.add_argument("--force", action="store_true", help="Remplace une semaine existante.")
    veille.add_argument("--deploy", action="store_true", help="Deploie Firebase Hosting apres modification.")
    veille.add_argument("--debug", action="store_true", help="Affiche les logs detailles.")

    deploy = subparsers.add_parser("deploy", help="Build et deploie Firebase Hosting.")
    deploy.add_argument("--debug", action="store_true", help="Affiche les commandes et erreurs.")

    subparsers.add_parser("build-cli", help="Compile AutoVeille avec PyInstaller.")
    return parser


def main(argv=None):
    load_env_file()
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "veille":
            handle_veille(args)
        elif args.command == "deploy":
            deploy_hosting(debug=args.debug)
        elif args.command == "build-cli":
            build_cli()
        else:
            parser.print_help()
    except Exception as error:
        if getattr(args, "debug", False):
            raise
        print(f"[{APP_NAME}] Erreur: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
