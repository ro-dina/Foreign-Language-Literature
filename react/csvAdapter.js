export function dictKey(language, token) {
  return `${language}::${token}`;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch !== '\r') {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function rowsToObjects(rows) {
  if (rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== "")).map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] || "").trim();
    });
    return obj;
  });
}

function splitList(value, separator = "||") {
  if (!value) {
    return [];
  }
  return value.split(separator).map((item) => item.trim()).filter(Boolean);
}

function parseTokens(rawTokenString, source) {
  const raw = (rawTokenString || "").trim();
  if (raw.length === 0) {
    return (source || "")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, en: "", ja: "", origin: "", gender: "", grammarRefs: [] }));
  }
  return raw
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ text, en: "", ja: "", origin: "", gender: "", grammarRefs: [] }));
}

function parseGrammarItems(raw) {
  if (!raw) {
    return [];
  }
  return raw
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [id = "", title = "", body = ""] = item.split("::").map((v) => v.trim());
      return { id, title: title || id, body };
    })
    .filter((g) => g.id);
}

function parseRefList(value) {
  if (!value) {
    return [];
  }
  return value.split("|").map((v) => v.trim()).filter(Boolean);
}

export function convertSentencesCsvToData(sentenceRows) {
  const works = new Map();

  sentenceRows.forEach((row) => {
    const workId = row.work_id;
    const sectionId = row.section_id;
    const sentenceId = row.sentence_id;
    if (!workId || !sectionId || !sentenceId) {
      return;
    }

    if (!works.has(workId)) {
      works.set(workId, {
        id: workId,
        title: row.work_title || workId,
        sourceLanguage: row.source_language || "原文",
        sections: []
      });
    }
    const work = works.get(workId);

    let section = work.sections.find((s) => s.id === sectionId);
    if (!section) {
      section = { id: sectionId, title: row.section_title || sectionId, sentences: [] };
      work.sections.push(section);
    }

    section.sentences.push({
      id: sentenceId,
      label: row.sentence_label || row.source,
      source: row.source,
      english: row.english,
      japanese: row.japanese,
      tokens: parseTokens(row.tokens, row.source),
      buildUp: splitList(row.build_steps),
      notes: splitList(row.notes),
      grammar: parseGrammarItems(row.grammar_items)
    });
  });

  return Array.from(works.values());
}

export function parseDictionaryCsv(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row.source_language || !row.token) {
      return;
    }
    map.set(dictKey(row.source_language, row.token), {
      sourceLanguage: row.source_language,
      token: row.token,
      en: row.en || "",
      ja: row.ja || "",
      origin: row.origin || "",
      gender: row.gender || "",
      grammarRefs: parseRefList(row.grammar_refs)
    });
  });
  return map;
}
