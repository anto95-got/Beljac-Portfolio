const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Parser = require("rss-parser");

if (!admin.apps.length) {
  admin.initializeApp();
}

const parser = new Parser({ timeout: 10000 });

const REGION = "europe-west1";
const STORAGE_PATH = "veille/historique_ia_robotique.json";
const MAX_NEWS_PER_WEEK = 4;
const MAX_HISTORY_WEEKS = 20;
const MAX_ARTICLES_PER_FEED = 12;
const WEEKLY_SCHEDULE = "0 8 * * 1"; // Lundi 08:00 Europe/Paris

const REFRESH_TOKEN = defineSecret("VEILLE_REFRESH_TOKEN");
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const RSS_FEEDS = [
  "https://news.google.com/rss/search?q=robot+humanoide+IA&hl=fr&gl=FR&ceid=FR:fr",
  "https://news.google.com/rss/search?q=Boston+Dynamics+OR+Tesla+Optimus+OR+Figure+AI&hl=fr&gl=FR&ceid=FR:fr",
  "https://news.google.com/rss/search?q=robotique+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr",
];

const decodeHtmlEntities = (rawText = "") => (
  String(rawText)
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : "";
    })
);

const stripSourceSuffix = (text, source) => {
  if (!text || !source) return text;
  const normalizedText = text.trim();
  const normalizedSource = source.trim().toLowerCase();
  if (!normalizedSource) return normalizedText;

  if (normalizedText.toLowerCase().endsWith(normalizedSource)) {
    return normalizedText
      .slice(0, normalizedText.length - normalizedSource.length)
      .replace(/[\s\-–—|:·]+$/u, "")
      .trim();
  }

  return normalizedText;
};

const cleanText = (rawText, source = "") => {
  const withoutTags = String(rawText || "").replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  const compact = decoded.replace(/\s+/g, " ").trim();
  return stripSourceSuffix(compact, source);
};

const toIsoDate = (rawDate) => {
  const parsed = new Date(rawDate || Date.now());
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
};

const toDateOnly = (rawDate) => toIsoDate(rawDate).slice(0, 10);

const toTimestamp = (rawDate) => {
  const parsed = new Date(rawDate);
  const ts = parsed.getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const getIsoWeekInfo = (inputDate = new Date()) => {
  const date = new Date(Date.UTC(
    inputDate.getFullYear(),
    inputDate.getMonth(),
    inputDate.getDate(),
  ));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { week, year: date.getUTCFullYear() };
};

const getWeekId = (date = new Date()) => {
  const { week, year } = getIsoWeekInfo(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

const buildWhyImportant = (article = {}) => {
  const title = cleanText(article.title || "");
  const source = cleanText(article.source || "cette source");

  return [
    "Cette actualité est importante pour la veille robots IA car elle montre une avancée concrète dans l'intelligence artificielle appliquée à la robotique.",
    `Elle permet de suivre l'évolution du secteur à travers ${source}, avec un sujet directement lié aux robots autonomes ou humanoïdes.`,
    title
      ? `Le sujet "${title}" aide à comprendre les impacts technologiques, industriels ou sociaux de ces machines.`
      : "Elle aide à comprendre les impacts technologiques, industriels ou sociaux de ces machines.",
  ].join(" ");
};

const buildFallbackAiSummary = (article = {}) => cleanText(
  article.summary || article.content || article.title || "Pas de résumé disponible.",
  article.source || "",
);

const normalizeNewsItem = (item = {}) => {
  const link = cleanText(item.link || item.url || "#");
  const normalized = {
    title: cleanText(item.title || "Titre inconnu", item.source || ""),
    summary: cleanText(item.summary || "Pas de résumé disponible.", item.source || ""),
    content: cleanText(item.content || item.summary || "Voir l’article source.", item.source || ""),
    source: cleanText(item.source || "Source inconnue"),
    link,
    url: cleanText(item.url || link),
    date: toDateOnly(item.date || new Date().toISOString()),
    aiSummary: cleanText(item.aiSummary || ""),
    whyImportant: cleanText(item.whyImportant || ""),
  };

  return {
    ...normalized,
    aiSummary: normalized.aiSummary || buildFallbackAiSummary(normalized),
    whyImportant: normalized.whyImportant || buildWhyImportant(normalized),
  };
};

const toNewsKey = (item) => `${item.url || item.link || ""}|${item.title || ""}`.trim().toLowerCase();

const normalizeEntryNews = (entry = {}) => {
  if (Array.isArray(entry.news)) return entry.news.map((item) => normalizeNewsItem(item));
  if (entry.article) return [normalizeNewsItem(entry.article)];
  return [];
};

const normalizeVeilleData = (rawData) => {
  const safeData = rawData && typeof rawData === "object" ? rawData : {};
  const latestNews = normalizeEntryNews(safeData.latest || {});

  const history = Array.isArray(safeData.history)
    ? safeData.history
      .map((entry) => ({
        weekId: cleanText(entry?.weekId || entry?.week || ""),
        week: cleanText(entry?.week || entry?.weekId || ""),
        news: normalizeEntryNews(entry),
      }))
      .filter((entry) => entry.news.length > 0)
    : [];

  return {
    latest: {
      weekId: cleanText(safeData?.latest?.weekId || safeData?.latest?.week || ""),
      week: cleanText(safeData?.latest?.week || safeData?.latest?.weekId || ""),
      news: latestNews,
    },
    history,
    updatedAt: toIsoDate(safeData?.updatedAt || new Date().toISOString()),
  };
};

const defaultVeilleData = () => ({
  latest: { weekId: "", week: "", news: [] },
  history: [],
  updatedAt: new Date().toISOString(),
});

const getStorageFile = () => admin.storage().bucket().file(STORAGE_PATH);

const readVeilleData = async () => {
  try {
    const file = getStorageFile();
    const [exists] = await file.exists();
    if (!exists) return defaultVeilleData();

    const [buffer] = await file.download();
    const parsed = JSON.parse(buffer.toString("utf-8"));
    return normalizeVeilleData(parsed);
  } catch (error) {
    logger.error("readVeilleData failed", error);
    return defaultVeilleData();
  }
};

const writeVeilleData = async (data) => {
  const file = getStorageFile();
  await file.save(JSON.stringify(data, null, 2), {
    contentType: "application/json; charset=utf-8",
    resumable: false,
    metadata: {
      cacheControl: "no-cache, no-store, must-revalidate",
    },
  });
};

const fetchWeeklyArticles = async () => {
  const allArticles = [];
  const seen = new Set();

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = (feed.items || []).slice(0, MAX_ARTICLES_PER_FEED);

      for (const item of items) {
        const source = cleanText(item?.creator || item?.source || feed?.title || "Source inconnue");
        const normalized = normalizeNewsItem({
          title: item?.title || "Titre inconnu",
          summary: item?.contentSnippet || item?.summary || "Pas de résumé disponible.",
          content: item?.contentSnippet || item?.summary || "Voir l’article source.",
          source,
          link: item?.link || "#",
          date: item?.isoDate || item?.pubDate || item?.published || item?.updated || new Date().toISOString(),
        });

        const key = toNewsKey(normalized);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        allArticles.push(normalized);
      }
    } catch (error) {
      logger.error("RSS fetch failed", { feedUrl, error: String(error) });
    }
  }

  allArticles.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
  return allArticles.slice(0, MAX_NEWS_PER_WEEK);
};

const dedupeHistoryByWeekId = (history) => {
  const seenWeek = new Set();
  const result = [];

  for (const entry of history) {
    const weekId = cleanText(entry?.weekId || entry?.week || "");
    if (!weekId || seenWeek.has(weekId)) continue;
    seenWeek.add(weekId);
    result.push({
      weekId,
      week: cleanText(entry?.week || weekId),
      news: normalizeEntryNews(entry),
    });
  }

  return result.filter((entry) => entry.news.length > 0);
};

const parseOpenAiJson = (payload) => {
  const outputText = payload?.output_text || payload?.output
    ?.flatMap((item) => item?.content || [])
    ?.map((content) => content?.text || "")
    ?.join("")
    ?.trim();

  if (!outputText) return null;
  return JSON.parse(outputText);
};

async function enrichWithAI(article) {
  const fallback = {
    aiSummary: buildFallbackAiSummary(article),
    whyImportant: buildWhyImportant(article),
  };

  let apiKey = "";
  try {
    apiKey = OPENAI_API_KEY.value();
  } catch {
    return fallback;
  }

  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: [
          "Tu enrichis des articles pour une veille technologique BTS SIO.",
          "Réponds uniquement en JSON valide.",
          "Le sujet de la veille est: robots IA, robots humanoïdes et robotique contrôlée par intelligence artificielle.",
          "Utilise un français simple, clair et factuel.",
        ].join(" "),
        input: [
          `Titre: ${article.title}`,
          `Source: ${article.source}`,
          `Date: ${article.date}`,
          `Résumé RSS: ${article.summary}`,
          `Contenu RSS: ${article.content}`,
          "Génère aiSummary en 2 à 3 phrases.",
          "Génère whyImportant en 2 à 4 phrases simples.",
        ].join("\n"),
        text: {
          format: {
            type: "json_schema",
            name: "veille_article_enrichment",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                aiSummary: { type: "string" },
                whyImportant: { type: "string" },
              },
              required: ["aiSummary", "whyImportant"],
            },
          },
        },
        max_output_tokens: 350,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}`);
    }

    const parsed = parseOpenAiJson(await response.json());
    return {
      aiSummary: cleanText(parsed?.aiSummary || fallback.aiSummary),
      whyImportant: cleanText(parsed?.whyImportant || fallback.whyImportant),
    };
  } catch (error) {
    logger.error("AI enrichment failed", {
      article: article.title,
      error: String(error),
    });
    return fallback;
  }
}

const enrichArticlesWithAI = async (articles) => Promise.all(
  articles.map(async (article) => ({
    ...article,
    ...(await enrichWithAI(article)),
  })),
);

const getWeekLabel = (date = new Date()) => {
  const { week, year } = getIsoWeekInfo(date);
  return `Semaine ${week} - ${year}`;
};

const refreshVeilleData = async ({ force = false, reason = "manual" } = {}) => {
  const current = await readVeilleData();
  const now = new Date();
  const currentWeekId = getWeekId(now);
  const currentWeekLabel = getWeekLabel(now);

  if (!force && current.latest.weekId === currentWeekId && current.latest.news.length > 0) {
    return {
      updated: false,
      reason: "already_up_to_date",
      data: current,
    };
  }

  const news = await enrichArticlesWithAI(await fetchWeeklyArticles());
  if (news.length === 0 && current.latest.news.length > 0) {
    return {
      updated: false,
      reason: "no_news_fetched",
      data: current,
    };
  }

  const history = [...current.history];

  if (current.latest.news.length > 0 && current.latest.weekId !== currentWeekId) {
    history.unshift({
      weekId: current.latest.weekId,
      week: current.latest.week,
      news: current.latest.news,
    });
  }

  const nextData = {
    latest: {
      weekId: currentWeekId,
      week: currentWeekLabel,
      news,
    },
    history: dedupeHistoryByWeekId(history).slice(0, MAX_HISTORY_WEEKS),
    updatedAt: new Date().toISOString(),
  };

  await writeVeilleData(nextData);
  logger.info("Veille refreshed", {
    reason,
    force,
    weekId: currentWeekId,
    latestCount: nextData.latest.news.length,
    historyCount: nextData.history.length,
  });

  return {
    updated: true,
    reason: "refreshed",
    data: nextData,
  };
};

const ensureVeilleData = async () => {
  const current = await readVeilleData();
  const nowWeekId = getWeekId(new Date());

  if (!current.latest.news.length) {
    const result = await refreshVeilleData({ force: true, reason: "bootstrap" });
    return result.data;
  }

  if (current.latest.weekId !== nowWeekId) {
    const result = await refreshVeilleData({ force: false, reason: "stale_on_read" });
    return result.data;
  }

  return current;
};

exports.getVeille = onRequest(
  {
    region: REGION,
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    try {
      const data = await ensureVeilleData();
      res.status(200).json(data);
    } catch (error) {
      logger.error("getVeille failed", error);
      res.status(500).json({
        error: "VEILLE_READ_FAILED",
        message: "Impossible de récupérer la veille.",
      });
    }
  },
);

exports.refreshVeilleNow = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [REFRESH_TOKEN, OPENAI_API_KEY],
  },
  async (req, res) => {
    if (!["GET", "POST"].includes(req.method)) {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const providedToken = req.get("x-refresh-token") || req.query.token || "";
    if (!providedToken || providedToken !== REFRESH_TOKEN.value()) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token invalide pour le rafraîchissement.",
      });
      return;
    }

    try {
      const force = req.query.force === "1" || req.query.force === "true";
      const result = await refreshVeilleData({ force, reason: "manual_endpoint" });
      res.status(200).json({
        ok: true,
        updated: result.updated,
        reason: result.reason,
        data: result.data,
      });
    } catch (error) {
      logger.error("refreshVeilleNow failed", error);
      res.status(500).json({
        error: "VEILLE_REFRESH_FAILED",
        message: "Impossible de rafraîchir la veille.",
      });
    }
  },
);

exports.refreshVeilleWeekly = onSchedule(
  {
    region: REGION,
    schedule: WEEKLY_SCHEDULE,
    timeZone: "Europe/Paris",
    retryCount: 1,
    maxRetrySeconds: 300,
    secrets: [OPENAI_API_KEY],
  },
  async () => {
    await refreshVeilleData({ force: false, reason: "weekly_schedule" });
  },
);
