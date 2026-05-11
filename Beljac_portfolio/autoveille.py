#!/usr/bin/env python3
"""
AutoVeille - CLI locale pour alimenter et publier la veille technologique.

Cette application met a jour le fichier JSON utilise par la page React
"Veille Tech" du portfolio. Elle fonctionne sans Firebase Functions: tout est
fait en local, puis le site statique est publie sur Firebase Hosting.

Commandes principales:

    python3 autoveille.py veille
        Lance le mode interactif.

    python3 autoveille.py veille --new
        Tente de generer la veille de la semaine actuelle.
        Si la semaine existe deja, la commande refuse de remplacer les donnees.

    python3 autoveille.py veille --new --force
        Remplace la veille de la semaine actuelle.

    python3 autoveille.py veille --update --from 2026-04 --to 2026-05
        Genere les semaines manquantes entre avril 2026 et mai 2026.

    python3 autoveille.py veille --new --force --deploy
        Met a jour la veille, build le site, puis deploie Firebase Hosting.

    python3 autoveille.py deploy
        Execute npm run build puis firebase deploy --only hosting.

    python3 autoveille.py build-cli
        Compile cette CLI avec PyInstaller:
        pyinstaller --onefile --name AutoVeille autoveille.py

Configuration:

    La cle Gemini est lue depuis le fichier .env a la racine du projet:

        GEMINI_API_KEY=...
        GEMINI_MODEL=gemini-2.5-flash

    Si GEMINI_API_KEY est absente, AutoVeille continue de fonctionner avec
    un scoring local base sur des mots-cles.

Compatibilite PyInstaller:

    Le code gere les chemins avec pathlib et detecte les executions compilees.
    En version compilee, lancer l'executable depuis la racine du projet ou
    definir AUTOVEILLE_BASE_PATH pour indiquer le dossier du portfolio.
"""

import argparse
import calendar
import html
import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


# Nom affiche dans les messages console.
APP_NAME = "AutoVeille"

# Nombre maximum d'actualites affichees par semaine sur le site.
MAX_NEWS_PER_WEEK = 4

# Nombre maximum de semaines conservees dans l'historique JSON.
MAX_HISTORY_WEEKS = 20

# Nombre de candidats envoyes a Gemini apres le premier filtrage local.
MAX_AI_CANDIDATES = 12

# Modele Gemini utilise si GEMINI_MODEL n'est pas defini dans .env.
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

# Requetes Google News RSS. Elles restent volontairement larges, puis le tri
# local et Gemini filtrent les resultats hors sujet.
SEARCH_QUERIES = [
    "robot humanoide IA",
    "Boston Dynamics OR Tesla Optimus OR Figure AI",
    "robotique intelligence artificielle",
]

# Mots-cles qui augmentent la pertinence d'un article.
# Le score sert de premier filtre avant l'appel Gemini.
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

# Sources considerees comme plus fiables ou plus pertinentes pour la veille.
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

# Mots-cles qui reduisent la pertinence d'un article trop eloigne du sujet.
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

# Couleurs ANSI utilisees pour l'habillage shell.
CYAN = "\033[96m"
JAUNE = "\033[93m"
GRIS = "\033[90m"
RESET = "\033[0m"
BOLD = "\033[1m"

# --- BLOC 1 : GROS (AutoVeille) ---
AUTOVEILLE_ART = r"""
    ___         __       _    __     _  ____     
   /   | __  __/ /_____ | |  / /__  (_) / / /__  
  / /| |/ / / / __/ __ \| | / / _ \/ / / / / _ \ 
 / ___ / /_/ / /_/ /_/ /| |/ /  __/ / / / /  __/ 
/_/  |_\__,_/\__/\____/ |___/\___/_/_/_/_/\___/  
"""

# --- BLOC 2 : MOYEN (By) ---
BY_ART = r"""
      __   _  
     / /_ | | 
    / __ \| | 
   / /_/ /|_| 
  /_.___/ (_) 
"""

# --- BLOC 3 : PETIT (Antony Beljac) ---
ANTONY_ART = r"""
  > Antony Beljac <
  _________________
"""


def animation_apparition(texte, delai=0.2):
    """
    Affiche un bloc ASCII ligne par ligne.

    Parametres:
    - texte: bloc ASCII a afficher.
    - delai: pause finale apres le bloc.
    """
    for ligne in texte.splitlines():
        print(ligne)
        time.sleep(0.05)
    time.sleep(delai)


def clear_terminal():
    """Nettoie le terminal avec une sequence ANSI portable."""
    print("\033[H\033[J", end="")


def show_banner():
    """Affiche l'identite visuelle shell de l'application."""
    clear_terminal()
    print(CYAN)
    animation_apparition(AUTOVEILLE_ART, 0.4)
    print(JAUNE)
    animation_apparition(BY_ART, 0.3)
    print(GRIS)
    animation_apparition(ANTONY_ART, 0.5)
    print(RESET)


def read_key():
    """
    Lit une touche clavier pour les menus interactifs.

    Touches gerees:
    - fleche haut / bas;
    - entree;
    - q pour quitter.

    Retour:
    - "up", "down", "enter", "quit" ou une chaine brute.
    """
    if os.name == "nt":
        import msvcrt

        char = msvcrt.getch()
        if char in {b"\x00", b"\xe0"}:
            code = msvcrt.getch()
            if code == b"H":
                return "up"
            if code == b"P":
                return "down"
        if char in {b"\r", b"\n"}:
            return "enter"
        if char == b"\x03":
            raise KeyboardInterrupt
        if char.lower() == b"q":
            return "quit"
        return char.decode(errors="ignore")

    import termios
    import tty

    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        char = sys.stdin.read(1)
        if char == "\x1b":
            sequence = sys.stdin.read(2)
            if sequence == "[A":
                return "up"
            if sequence == "[B":
                return "down"
        if char in {"\r", "\n"}:
            return "enter"
        if char == "\x03":
            raise KeyboardInterrupt
        if char.lower() == "q":
            return "quit"
        return char
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)


def select_option(title, options):
    """
    Affiche un menu de selection au clavier.

    Parametres:
    - title: question affichee au-dessus du menu.
    - options: liste de tuples (label, value).

    Utilisation:
    - fleches haut/bas pour naviguer;
    - entree pour valider;
    - q pour quitter.

    Retour:
    - value associe au choix selectionne.
    """
    if not sys.stdin.isatty():
        label, value = options[0]
        print(f"{title} {label}")
        return value

    index = 0
    print(f"{GRIS}Utilise les fleches haut/bas, Entree pour valider, q pour quitter.{RESET}\n")
    while True:
        print(f"{JAUNE}{title}{RESET}\n")

        for position, (label, _) in enumerate(options):
            marker = ">" if position == index else " "
            color = CYAN if position == index else RESET
            print(f"{color} {marker} {label}{RESET}")

        key = read_key()
        if key == "up":
            index = (index - 1) % len(options)
        elif key == "down":
            index = (index + 1) % len(options)
        elif key == "enter":
            return options[index][1]
        elif key == "quit":
            raise KeyboardInterrupt("Selection annulee.")

        # On ne nettoie que le bloc de menu, pas la banniere affichee au-dessus.
        lines_to_clear = len(options) + 2
        for _ in range(lines_to_clear):
            print("\033[F\033[2K", end="")


def log(message, debug=False):
    """Affiche un message de debug uniquement si l'option --debug est active."""
    if debug:
        print(f"[debug] {message}")


def info(message):
    """Affiche un message utilisateur prefixe par le nom de l'application."""
    print(f"[{APP_NAME}] {message}")


def get_base_path():
    """
    Retourne la racine du projet portfolio.

    Ordre de resolution:
    1. AUTOVEILLE_BASE_PATH si la variable est definie.
    2. Le dossier courant si public/veille existe.
    3. Le dossier de l'executable en version PyInstaller.
    4. Le dossier du fichier autoveille.py en mode Python classique.

    Cette fonction evite les chemins casses entre:
    - python3 autoveille.py
    - ./dist/AutoVeille
    """
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
    """
    Charge les variables du fichier .env local.

    Variables reconnues:
    - GEMINI_API_KEY: cle API Gemini.
    - VITE_GEMINI_API_KEY: ancien nom accepte pour compatibilite.
    - GEMINI_MODEL: modele Gemini optionnel.

    Les variables deja presentes dans l'environnement ne sont pas remplacees.
    """
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
    """Retourne le chemin du fichier JSON utilise par la page Veille Tech."""
    return get_base_path() / "public" / "veille" / "historique_ia_robotique.json"


def clean_text(value):
    """
    Nettoie un texte provenant du RSS ou du JSON.

    Parametre:
    - value: texte brut, potentiellement HTML ou vide.

    Retour:
    - chaine lisible sans balises HTML, espaces multiples ni entites HTML.
    """
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_date(value):
    """
    Convertit plusieurs formats de date en datetime timezone UTC.

    Parametre:
    - value: date ISO, date RSS, datetime, date, ou valeur vide.

    Retour:
    - datetime utilisable pour les tris et calculs de semaine.
    """
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
    """Retourne une date au format YYYY-MM-DD."""
    return parse_date(value).date().isoformat()


def iso_week_id(value):
    """Retourne l'identifiant ISO d'une semaine, par exemple 2026-W19."""
    parsed = parse_date(value).date()
    year, week, _ = parsed.isocalendar()
    return f"{year}-W{week:02d}"


def week_label(value):
    """Retourne le libelle humain d'une semaine, par exemple Semaine 19 - 2026."""
    parsed = parse_date(value).date()
    year, week, _ = parsed.isocalendar()
    return f"Semaine {week} - {year}"


def child_text(node, name):
    """Extrait et nettoie le texte d'un enfant XML dans un item RSS."""
    child = node.find(name)
    return clean_text(child.text if child is not None else "")


def split_google_title(title, source):
    """
    Supprime le suffixe source ajoute par Google News dans certains titres.

    Exemple:
    "Titre de l'article - Le Monde" devient "Titre de l'article".
    """
    if source:
        suffix = f" - {source}"
        if title.endswith(suffix):
            return title[: -len(suffix)].strip()

    parts = title.rsplit(" - ", 1)
    if len(parts) == 2 and len(parts[1]) <= 45:
        return parts[0].strip()
    return title


def why_important(article):
    """
    Genere une explication courte pour la modale du site.

    Parametre:
    - article: dictionnaire d'article. Peut contenir aiSignals si le scoring
      local a detecte des mots-cles pertinents.

    Retour:
    - texte de 2 phrases environ, oriente veille robots IA.
    """
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
    """
    Attribue un score local de pertinence a un article.

    Parametres:
    - article: dictionnaire contenant title, summary, content, source, date.
    - debug: affiche le score calcule si True.

    Effets:
    - ajoute temporairement aiScore et aiSignals dans l'article.

    Retour:
    - score numerique. Un score <= 0 est considere comme non pertinent.
    """
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
    """
    Transforme un item RSS ou JSON brut en article standard pour le site.

    Parametres:
    - raw: dictionnaire brut avec title, summary, content, source, link, date.
    - debug: active les logs de scoring.

    Retour:
    - article normalise au format attendu dans latest.news/history.news.
    """
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
    """
    Retire les champs internes avant ecriture dans le JSON public.

    Les champs aiScore et aiSignals servent uniquement pendant le filtrage.
    Ils ne doivent pas apparaitre dans public/veille/historique_ia_robotique.json.
    """
    cleaned = dict(article)
    cleaned.pop("aiScore", None)
    cleaned.pop("aiSignals", None)
    return cleaned


def build_feed_urls(start_date=None, end_date=None):
    """
    Construit les URLs RSS Google News.

    Parametres:
    - start_date: date de debut optionnelle pour une semaine passee.
    - end_date: date de fin exclusive optionnelle.

    Si les dates sont fournies, la requete utilise after:YYYY-MM-DD et
    before:YYYY-MM-DD pour cibler une semaine precise.
    """
    urls = []
    for query in SEARCH_QUERIES:
        query_text = query
        if start_date and end_date:
            query_text = f"{query} after:{start_date.isoformat()} before:{end_date.isoformat()}"
        encoded = urllib.parse.quote_plus(query_text)
        urls.append(f"https://news.google.com/rss/search?q={encoded}&hl=fr&gl=FR&ceid=FR:fr")
    return urls


def fetch_feed(url):
    """
    Telecharge un flux RSS.

    Parametre:
    - url: URL RSS Google News.

    Retour:
    - contenu XML en bytes.

    Note:
    Certains environnements macOS/Python ont un probleme de certificats.
    Un fallback SSL est prevu pour les flux publics Google News.
    """
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
    """
    Recupere, nettoie, dedoublonne et selectionne les articles.

    Parametres:
    - start_date/end_date: bornes optionnelles pour generer une semaine passee.
    - debug: affiche les flux RSS, scores, erreurs et selection Gemini.

    Processus:
    1. lire les flux RSS;
    2. normaliser les items;
    3. supprimer les doublons;
    4. filtrer par score local;
    5. demander a Gemini de choisir les 4 meilleurs si une cle existe;
    6. fallback sur les 4 meilleurs scores locaux.
    """
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
    """
    Extrait le texte utile d'une reponse Gemini generateContent.

    Parametre:
    - response_data: dictionnaire JSON retourne par l'API Gemini.

    Retour:
    - texte contenu dans candidates[0].content.parts.
    """
    parts = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts).strip()


def parse_json_text(text):
    """
    Parse une reponse JSON potentiellement entouree de markdown.

    Gemini est configure pour retourner du JSON, mais cette fonction reste
    defensive et retire les blocs ```json si necessaire.
    """
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
    """
    Appelle Gemini pour aider a selectionner les articles pertinents.

    Parametres:
    - prompt: consigne envoyee au modele.
    - debug: affiche les erreurs API et details utiles.

    Configuration:
    - GEMINI_API_KEY est lu depuis .env ou l'environnement.
    - GEMINI_MODEL est optionnel, par defaut gemini-2.5-flash.

    Retour:
    - dictionnaire JSON de la reponse Gemini, ou None si l'appel echoue.
    """
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
    """
    Utilise Gemini pour choisir exactement 4 articles parmi les candidats.

    Parametres:
    - candidates: liste d'articles deja scores localement.
    - debug: affiche si Gemini a ete applique ou ignore.

    Retour:
    - liste de 4 articles enrichis par Gemini;
    - None si Gemini est indisponible ou retourne une reponse inexploitable.

    Cette fonction ne remplace pas le scoring local: elle intervient apres un
    premier tri afin de limiter le nombre d'articles envoyes au modele.
    """
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
    """
    Normalise une entree de semaine du fichier JSON.

    Parametre:
    - entry: objet contenant weekId, week et news.

    Retour:
    - entree propre avec maximum MAX_NEWS_PER_WEEK articles.
    """
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
    """
    Charge le fichier JSON de veille existant.

    Parametre:
    - path: chemin vers public/veille/historique_ia_robotique.json.

    Formats acceptes:
    - format actuel: {"latest": {...}, "history": [...]}
    - ancien format legacy: [{week, news}, ...]

    Retour:
    - dictionnaire normalise avec latest et history.
    """
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
    """
    Ecrit les donnees de veille dans le fichier JSON public.

    Parametres:
    - path: fichier JSON cible.
    - data: dictionnaire contenant latest et history.
    """
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")


def dedupe_history(history):
    """
    Supprime les doublons de semaines dans history.

    Parametre:
    - history: liste d'entrees de semaines.

    Retour:
    - liste nettoyee limitee a MAX_HISTORY_WEEKS.
    """
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
    """
    Verifie que le fichier JSON existe.

    AutoVeille modifie le fichier existant de la page React. Il ne cree pas un
    autre fichier a cote, afin d'eviter de publier une mauvaise source.
    """
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable: {path}. AutoVeille modifie ce fichier existant.")


def update_current_week(force=False, debug=False):
    """
    Genere ou remplace la veille de la semaine actuelle.

    Parametres:
    - force: si False, refuse de remplacer latest quand weekId est deja
      celui de la semaine actuelle.
    - debug: active les logs detailles.

    Comportement:
    - recupere les articles recents;
    - met a jour latest;
    - deplace l'ancien latest vers history si la semaine change.

    Retour:
    - True si le fichier a ete modifie, False sinon.
    """
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
    """
    Retourne le premier et le dernier jour d'un mois.

    Parametre:
    - month_value: chaine au format YYYY-MM.
    """
    year, month = map(int, month_value.split("-"))
    first = date(year, month, 1)
    last = date(year, month, calendar.monthrange(year, month)[1])
    return first, last


def week_ranges_between(from_month, to_month):
    """
    Genere les semaines ISO couvrant une plage de mois.

    Parametres:
    - from_month: mois de debut au format YYYY-MM.
    - to_month: mois de fin au format YYYY-MM.

    Retour:
    - generateur de tuples (week_start, week_end), ou week_end est exclusif.
    """
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
    """
    Genere les semaines passees manquantes entre deux mois.

    Parametres:
    - from_month: mois de debut YYYY-MM.
    - to_month: mois de fin YYYY-MM.
    - force: remplace les semaines existantes si True.
    - debug: affiche flux, scores et semaines generees.

    Retour:
    - True si au moins une semaine a ete ajoutee/remplacee.
    """
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
    """
    Execute une commande shell de maniere controlee.

    Parametres:
    - command: liste d'arguments, par exemple ["npm", "run", "build"].
    - debug: conserve pour l'interface; subprocess affiche deja les erreurs.
    """
    info(f"$ {' '.join(command)}")
    if debug:
        subprocess.run(command, cwd=get_base_path(), check=True)
    else:
        subprocess.run(command, cwd=get_base_path(), check=True)


def deploy_hosting(debug=False):
    """
    Build puis deploie le site sur Firebase Hosting.

    Execute:
    - npm run build
    - firebase deploy --only hosting

    Parametre:
    - debug: option transmise aux commandes.
    """
    run_command(["npm", "run", "build"], debug=debug)
    run_command(["firebase", "deploy", "--only", "hosting"], debug=debug)
    info("Deploiement Firebase Hosting termine.")


def build_cli():
    """
    Compile AutoVeille en executable avec PyInstaller.

    Commande executee:
    pyinstaller --onefile --name AutoVeille autoveille.py

    Resultat attendu:
    dist/AutoVeille
    """
    command = ["pyinstaller", "--onefile", "--name", "AutoVeille", "autoveille.py"]
    run_command(command, debug=True)
    info(f"Executable genere dans {get_base_path() / 'dist' / 'AutoVeille'}")


def ask_yes_no(question):
    """
    Pose une question binaire via un menu de selection.

    Retour:
    - True pour le choix positif, False pour le choix negatif.
    """
    return select_option(
        question,
        [
            ("Continuer", True),
            ("Passer", False),
        ],
    )


def ask_interactive_questions():
    """
    Lance le mode interactif de la commande veille.

    Questions posees:
    - nouvelle veille;
    - mise a jour de semaines passees;
    - dates from/to si necessaire;
    - deploiement apres modification.
    """
    show_banner()

    do_new = select_option(
        "Action 1 - Veille actuelle",
        [
            ("Generer la veille de la semaine actuelle", True),
            ("Ne pas modifier la semaine actuelle", False),
        ],
    )
    do_update = select_option(
        "Action 2 - Historique",
        [
            ("Mettre a jour des semaines passees", True),
            ("Ne pas modifier l'historique", False),
        ],
    )
    from_month = to_month = None
    if do_update:
        clear_terminal()
        print(f"{CYAN}{BOLD}{APP_NAME}{RESET}\n")
        from_month = input("Date de debut (YYYY-MM) ").strip()
        to_month = input("Date de fin (YYYY-MM) ").strip()
    do_deploy = select_option(
        "Action 3 - Publication",
        [
            ("Build et deploy Firebase Hosting", True),
            ("Ne pas deployer maintenant", False),
        ],
    )
    return {"new": do_new, "update": do_update, "from": from_month, "to": to_month, "deploy": do_deploy}


def validate_month(value):
    """
    Valide une chaine YYYY-MM.

    Le parsing via month_bounds permet aussi de rejeter les mois impossibles,
    par exemple 2026-13.
    """
    if not re.fullmatch(r"\d{4}-\d{2}", value or ""):
        raise ValueError("Format attendu: YYYY-MM")
    month_bounds(value)


def handle_veille(args):
    """
    Execute la sous-commande 'veille'.

    Parametre:
    - args: namespace argparse contenant --new, --update, --from, --to,
      --force, --deploy et --debug.

    Si --new et --update sont absents, le mode interactif est lance.
    """
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
    """
    Construit le parser argparse principal.

    Sous-commandes exposees:
    - veille: gestion des actualites;
    - deploy: build + Firebase Hosting;
    - build-cli: compilation PyInstaller.
    """
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
    """
    Point d'entree de l'application.

    Parametre:
    - argv: liste d'arguments optionnelle, utile pour tests ou wrapper.

    Exemples:
    - main(["veille", "--new", "--force"])
    - main(["deploy"])
    """
    load_env_file()
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "veille":
            if args.new or args.update:
                show_banner()
            handle_veille(args)
        elif args.command == "deploy":
            show_banner()
            deploy_hosting(debug=args.debug)
        elif args.command == "build-cli":
            show_banner()
            build_cli()
        else:
            show_banner()
            parser.print_help()
    except KeyboardInterrupt:
        print(f"\n[{APP_NAME}] Operation annulee par l'utilisateur.")
        sys.exit(130)
    except Exception as error:
        if getattr(args, "debug", False):
            raise
        print(f"[{APP_NAME}] Erreur: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
