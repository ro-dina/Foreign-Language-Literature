const initialData = [
  {
    id: "lupin-preface",
    title: "アルセーヌ・ルパン - Preface",
    sourceLanguage: "フランス語",
    sections: [
      {
        id: "s1",
        title: "冒頭",
        description: "序章。作者評価とルパン像の導入。",
        sentences: [
          {
            id: "s1-1",
            label: "Maurice Leblanc est un ecrivain trop meconnu.",
            source: "Maurice Leblanc est un ecrivain trop meconnu.",
            english: "Maurice Leblanc is a writer who is too unknown.",
            japanese: "モーリス・ルブランは、あまりに知られていない作家だ。",
            tokens: [
              { text: "Maurice", en: "first name", ja: "名", origin: "固有名詞", gender: "", grammarRefs: [] },
              { text: "Leblanc", en: "surname", ja: "姓", origin: "blanc=白", gender: "", grammarRefs: [] },
              { text: "est", en: "is", ja: "〜である", origin: "etre 活用", gender: "", grammarRefs: ["g-etre-present"] },
              { text: "un", en: "a", ja: "不定冠詞", origin: "冠詞", gender: "m", grammarRefs: ["g-article-gender"] },
              {
                text: "ecrivain",
                en: "writer",
                ja: "作家",
                origin: "ecrire 由来",
                gender: "m",
                grammarRefs: ["g-article-gender"]
              },
              { text: "trop", en: "too", ja: "あまりに", origin: "副詞", gender: "", grammarRefs: ["g-adverb"] },
              {
                text: "meconnu",
                en: "little-known",
                ja: "知られていない",
                origin: "me- + connu",
                gender: "m",
                grammarRefs: ["g-participle-adj"]
              }
            ],
            buildUp: [
              "Maurice Leblanc est un ecrivain.",
              "Maurice Leblanc est un ecrivain meconnu.",
              "Maurice Leblanc est un ecrivain trop meconnu."
            ],
            notes: ["SVC 型: est が繋辞で主語と補語を結ぶ。", "trop は否定的な強調になりやすい。"],
            grammar: [
              {
                id: "g-article-gender",
                title: "不定冠詞と名詞の性一致",
                body: "un は男性名詞に対応。女性なら une を使う。"
              },
              {
                id: "g-participle-adj",
                title: "過去分詞由来形容詞",
                body: "meconnu は過去分詞由来の形容詞として機能し、名詞に一致する。"
              },
              {
                id: "g-adverb",
                title: "副詞 trop",
                body: "trop は程度の過剰を示し、否定的評価になりやすい。"
              },
              {
                id: "g-etre-present",
                title: "etre の現在形",
                body: "est は etre の3人称単数現在。"
              }
            ]
          },
          {
            id: "s1-2",
            label: "Arsene Lupin est un personnage tres encombrant.",
            source: "Arsene Lupin est un personnage tres encombrant.",
            english: "Arsene Lupin is a very cumbersome character.",
            japanese: "アルセーヌ・ルパンはとても厄介な人物だ。",
            tokens: [
              { text: "Arsene", en: "first name", ja: "名", origin: "固有名詞", gender: "", grammarRefs: [] },
              { text: "Lupin", en: "surname", ja: "姓", origin: "固有名詞", gender: "", grammarRefs: [] },
              { text: "est", en: "is", ja: "〜である", origin: "etre 活用", gender: "", grammarRefs: ["g-etre-present"] },
              { text: "un", en: "a", ja: "不定冠詞", origin: "冠詞", gender: "m", grammarRefs: ["g-article-gender"] },
              { text: "personnage", en: "character", ja: "人物", origin: "名詞", gender: "m", grammarRefs: ["g-article-gender"] },
              { text: "tres", en: "very", ja: "とても", origin: "副詞", gender: "", grammarRefs: ["g-adverb"] },
              {
                text: "encombrant",
                en: "burdensome",
                ja: "厄介な",
                origin: "encombrer 由来",
                gender: "m",
                grammarRefs: ["g-participle-adj"]
              }
            ],
            buildUp: [
              "Arsene Lupin est un personnage.",
              "Arsene Lupin est un personnage encombrant.",
              "Arsene Lupin est un personnage tres encombrant."
            ],
            notes: ["語順は英語に近いが形容詞位置に注意。"],
            grammar: [
              {
                id: "g-adjective-position",
                title: "形容詞位置",
                body: "多くの形容詞は名詞の後に置かれる。"
              }
            ]
          },
          {
            id: "s1-3",
            label: "On reduit souvent l oeuvre de Leblanc a son heros.",
            source: "On reduit souvent l oeuvre de Leblanc a son heros.",
            english: "People often reduce Leblanc's work to his hero.",
            japanese: "人はしばしばルブランの作品を彼の主人公へ還元してしまう。",
            tokens: [
              { text: "On", en: "people/one", ja: "人は", origin: "不定主語", gender: "", grammarRefs: [] },
              { text: "reduit", en: "reduce", ja: "還元する", origin: "reduire 活用", gender: "", grammarRefs: [] },
              { text: "souvent", en: "often", ja: "しばしば", origin: "副詞", gender: "", grammarRefs: ["g-adverb"] },
              { text: "l", en: "the", ja: "その", origin: "定冠詞", gender: "", grammarRefs: [] },
              { text: "oeuvre", en: "work", ja: "作品", origin: "名詞", gender: "f", grammarRefs: [] },
              { text: "de", en: "of", ja: "〜の", origin: "前置詞", gender: "", grammarRefs: [] },
              { text: "Leblanc", en: "Leblanc", ja: "ルブラン", origin: "固有名詞", gender: "", grammarRefs: [] },
              { text: "a", en: "to", ja: "〜へ", origin: "前置詞", gender: "", grammarRefs: [] },
              { text: "son", en: "his", ja: "彼の", origin: "所有形容詞", gender: "m", grammarRefs: [] },
              { text: "heros", en: "hero", ja: "主人公", origin: "名詞", gender: "m", grammarRefs: [] }
            ],
            buildUp: [
              "On reduit l oeuvre.",
              "On reduit l oeuvre a son heros.",
              "On reduit souvent l oeuvre de Leblanc a son heros."
            ],
            notes: ["reduire A a B は A を B に還元する。"],
            grammar: [
              {
                id: "g-reduire-a-a",
                title: "reduire A a B",
                body: "AをBへ還元する、という構文。"
              }
            ]
          },
          {
            id: "s1-4",
            label: "Aujourd hui, on resume volontiers ses aventures.",
            source: "Aujourd hui, on resume volontiers ses aventures.",
            english: "Today, people willingly summarize his adventures.",
            japanese: "今日では、人は進んで彼の冒険を要約する。",
            tokens: [
              { text: "Aujourd", en: "today", ja: "今日", origin: "副詞句", gender: "", grammarRefs: [] },
              { text: "hui", en: "(today part)", ja: "", origin: "語形成", gender: "", grammarRefs: [] },
              { text: "on", en: "people/one", ja: "人は", origin: "不定主語", gender: "", grammarRefs: [] },
              { text: "resume", en: "summarizes", ja: "要約する", origin: "resumer 活用", gender: "", grammarRefs: [] },
              { text: "volontiers", en: "willingly", ja: "進んで", origin: "副詞", gender: "", grammarRefs: ["g-adverb"] },
              { text: "ses", en: "his/her", ja: "彼の", origin: "所有形容詞複数", gender: "", grammarRefs: [] },
              { text: "aventures", en: "adventures", ja: "冒険", origin: "名詞複数", gender: "f", grammarRefs: [] }
            ],
            buildUp: [
              "On resume ses aventures.",
              "On resume volontiers ses aventures.",
              "Aujourd hui, on resume volontiers ses aventures."
            ],
            notes: ["volontiers は『喜んで、進んで』。"],
            grammar: []
          }
        ]
      }
    ]
  }
];

const elements = {
  toggleEditMode: document.querySelector("#toggleEditMode"),
  paneSplitter: document.querySelector("#paneSplitter"),
  workSelect: document.querySelector("#workSelect"),
  sectionSelect: document.querySelector("#sectionSelect"),
  searchInput: document.querySelector("#searchInput"),
  runSearchBtn: document.querySelector("#runSearchBtn"),
  clearSearchBtn: document.querySelector("#clearSearchBtn"),
  searchStatus: document.querySelector("#searchStatus"),
  searchResults: document.querySelector("#searchResults"),
  workIdInput: document.querySelector("#workIdInput"),
  workTitleInput: document.querySelector("#workTitleInput"),
  workLanguageInput: document.querySelector("#workLanguageInput"),
  saveWorkBtn: document.querySelector("#saveWorkBtn"),
  deleteWorkBtn: document.querySelector("#deleteWorkBtn"),
  workStatus: document.querySelector("#workStatus"),
  sectionIdInput: document.querySelector("#sectionIdInput"),
  sectionTitleInput: document.querySelector("#sectionTitleInput"),
  sectionDescriptionInput: document.querySelector("#sectionDescriptionInput"),
  saveSectionBtn: document.querySelector("#saveSectionBtn"),
  deleteSectionBtn: document.querySelector("#deleteSectionBtn"),
  sectionStatus: document.querySelector("#sectionStatus"),
  sentenceList: document.querySelector("#sentenceList"),
  sentenceTitle: document.querySelector("#sentenceTitle"),
  toggleReadState: document.querySelector("#toggleReadState"),
  sectionInfoText: document.querySelector("#sectionInfoText"),
  progressInfoText: document.querySelector("#progressInfoText"),
  openSectionInfo: document.querySelector("#openSectionInfo"),
  sectionInfoDialog: document.querySelector("#sectionInfoDialog"),
  sectionInfoDialogTitle: document.querySelector("#sectionInfoDialogTitle"),
  sectionInfoDialogBody: document.querySelector("#sectionInfoDialogBody"),
  closeSectionInfo: document.querySelector("#closeSectionInfo"),
  sourceText: document.querySelector("#sourceText"),
  sourceLabel: document.querySelector("#sourceLabel"),
  englishText: document.querySelector("#englishText"),
  japaneseText: document.querySelector("#japaneseText"),
  sentenceLabelInput: document.querySelector("#sentenceLabelInput"),
  sentenceSourceInput: document.querySelector("#sentenceSourceInput"),
  sentenceEnglishInput: document.querySelector("#sentenceEnglishInput"),
  sentenceJapaneseInput: document.querySelector("#sentenceJapaneseInput"),
  sentenceTokensInput: document.querySelector("#sentenceTokensInput"),
  sentenceBuildStepsInput: document.querySelector("#sentenceBuildStepsInput"),
  sentenceNotesInput: document.querySelector("#sentenceNotesInput"),
  saveSentenceEdit: document.querySelector("#saveSentenceEdit"),
  sentenceEditStatus: document.querySelector("#sentenceEditStatus"),
  buildSteps: document.querySelector("#buildSteps"),
  notes: document.querySelector("#notes"),
  colSource: document.querySelector("#colSource"),
  vocabTitle: document.querySelector("#vocabTitle"),
  vocabWrap: document.querySelector("#vocabWrap"),
  vocabTableBody: document.querySelector("#vocabTableBody"),
  toggleVocab: document.querySelector("#toggleVocab"),
  tokenTemplate: document.querySelector("#tokenTemplate"),
  toggleHints: document.querySelector("#toggleHints"),
  prevSentence: document.querySelector("#prevSentence"),
  nextSentence: document.querySelector("#nextSentence"),
  openBookView: document.querySelector("#openBookView"),
  deleteSentence: document.querySelector("#deleteSentence"),
  toggleGenderColor: document.querySelector("#toggleGenderColor"),
  grammarList: document.querySelector("#grammarList"),
  grammarSection: document.querySelector("#grammarSection"),
  sentencesCsvInput: document.querySelector("#sentencesCsvInput"),
  dictionaryCsvInput: document.querySelector("#dictionaryCsvInput"),
  importCsvBtn: document.querySelector("#importCsvBtn"),
  importStatus: document.querySelector("#importStatus"),
  quickSource: document.querySelector("#quickSource"),
  quickEnglish: document.querySelector("#quickEnglish"),
  quickJapanese: document.querySelector("#quickJapanese"),
  quickBuildSteps: document.querySelector("#quickBuildSteps"),
  quickNotes: document.querySelector("#quickNotes"),
  quickTokens: document.querySelector("#quickTokens"),
  quickInsertMode: document.querySelector("#quickInsertMode"),
  addQuickSentence: document.querySelector("#addQuickSentence"),
  quickStatus: document.querySelector("#quickStatus"),
  dictToken: document.querySelector("#dictToken"),
  dictEn: document.querySelector("#dictEn"),
  dictJa: document.querySelector("#dictJa"),
  dictOrigin: document.querySelector("#dictOrigin"),
  dictGender: document.querySelector("#dictGender"),
  dictGrammarRefs: document.querySelector("#dictGrammarRefs"),
  saveDictEntry: document.querySelector("#saveDictEntry"),
  deleteDictEntry: document.querySelector("#deleteDictEntry"),
  dictStatus: document.querySelector("#dictStatus"),
  dictTableBody: document.querySelector("#dictTableBody"),
  grammarIdInput: document.querySelector("#grammarIdInput"),
  grammarTypeInput: document.querySelector("#grammarTypeInput"),
  grammarTagsInput: document.querySelector("#grammarTagsInput"),
  grammarTitleInput: document.querySelector("#grammarTitleInput"),
  grammarBodyInput: document.querySelector("#grammarBodyInput"),
  grammarTableInput: document.querySelector("#grammarTableInput"),
  saveGrammarItem: document.querySelector("#saveGrammarItem"),
  deleteGrammarItem: document.querySelector("#deleteGrammarItem"),
  grammarEditStatus: document.querySelector("#grammarEditStatus"),
  grammarEditorTableBody: document.querySelector("#grammarEditorTableBody")
};

const state = {
  data: structuredClone(initialData),
  dictionary: buildDictionaryFromData(initialData),
  workId: initialData[0].id,
  sectionId: initialData[0].sections[0].id,
  sentenceId: initialData[0].sections[0].sentences[0].id,
  hintsOn: true,
  vocabOn: true,
  editMode: false,
  genderColorOn: false,
  searchQuery: "",
  readSentenceKeys: new Set(),
  weakTokenKeys: new Set(),
  activeGrammarId: "",
  selectedDictToken: "",
  selectedGrammarItemId: ""
};

function dictKey(language, token) {
  return `${language}::${token}`;
}

function sentenceProgressKey(workId, sectionId, sentenceId) {
  return `${workId}::${sectionId}::${sentenceId}`;
}

function tokenProgressKey(language, token) {
  return `${language}::${token}`;
}

function saveProgressState() {
  const payload = {
    readSentenceKeys: Array.from(state.readSentenceKeys),
    weakTokenKeys: Array.from(state.weakTokenKeys)
  };
  localStorage.setItem("readingStudioProgress", JSON.stringify(payload));
}

function restoreProgressState() {
  const raw = localStorage.getItem("readingStudioProgress");
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    state.readSentenceKeys = new Set(Array.isArray(parsed.readSentenceKeys) ? parsed.readSentenceKeys : []);
    state.weakTokenKeys = new Set(Array.isArray(parsed.weakTokenKeys) ? parsed.weakTokenKeys : []);
  } catch {
    state.readSentenceKeys = new Set();
    state.weakTokenKeys = new Set();
  }
}

function setEditMode(on) {
  state.editMode = Boolean(on);
  document.body.classList.toggle("edit-mode", state.editMode);
  elements.toggleEditMode.textContent = `編集モード: ${state.editMode ? "ON" : "OFF"}`;
}

function setupPaneResize() {
  const splitter = elements.paneSplitter;
  if (!splitter) {
    return;
  }
  let dragging = false;
  const min = 220;
  const max = 560;

  splitter.addEventListener("mousedown", (event) => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      return;
    }
    dragging = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) {
      return;
    }
    const width = Math.max(min, Math.min(max, event.clientX - 16));
    document.documentElement.style.setProperty("--left-pane-width", `${width}px`);
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });
}

function normalizeGender(value) {
  const v = (value || "").trim().toLowerCase();
  if (v === "m" || v === "f" || v === "n") {
    return v;
  }
  return "";
}

function parseRefList(value) {
  if (!value) {
    return [];
  }
  return value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseLineList(value) {
  return (value || "")
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseTableRows(value) {
  return parseLineList(value).map((line) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0)
  );
}

function buildDictionaryFromData(data) {
  const map = new Map();
  data.forEach((work) => {
    work.sections.forEach((section) => {
      section.sentences.forEach((sentence) => {
        sentence.tokens.forEach((token) => {
          const key = dictKey(work.sourceLanguage, token.text);
          if (!map.has(key)) {
            map.set(key, {
              sourceLanguage: work.sourceLanguage,
              token: token.text,
              en: token.en || "",
              ja: token.ja || "",
              origin: token.origin || "",
              gender: normalizeGender(token.gender),
              grammarRefs: Array.isArray(token.grammarRefs) ? token.grammarRefs : []
            });
          }
        });
      });
    });
  });
  return map;
}

function buildDictionaryFromRows(rows) {
  const map = new Map();
  (rows || []).forEach((row) => {
    if (!row || !row.sourceLanguage || !row.token) {
      return;
    }
    map.set(dictKey(row.sourceLanguage, row.token), {
      sourceLanguage: row.sourceLanguage,
      token: row.token,
      en: row.en || "",
      ja: row.ja || "",
      origin: row.origin || "",
      gender: normalizeGender(row.gender),
      grammarRefs: Array.isArray(row.grammarRefs) ? row.grammarRefs : []
    });
  });
  return map;
}

function getCurrentWork() {
  return state.data.find((work) => work.id === state.workId);
}

function getCurrentSection() {
  return getCurrentWork().sections.find((section) => section.id === state.sectionId);
}

function getCurrentSentence() {
  return getCurrentSection().sentences.find((sentence) => sentence.id === state.sentenceId);
}

function ensureSectionFields(section) {
  if (!section.description) {
    section.description = "";
  }
}

function loadWorkEditorFromCurrent() {
  const work = getCurrentWork();
  if (!work) {
    return;
  }
  elements.workIdInput.value = work.id || "";
  elements.workTitleInput.value = work.title || "";
  elements.workLanguageInput.value = work.sourceLanguage || "";
}

function loadSectionEditorFromCurrent() {
  const section = getCurrentSection();
  if (!section) {
    return;
  }
  ensureSectionFields(section);
  elements.sectionIdInput.value = section.id || "";
  elements.sectionTitleInput.value = section.title || "";
  elements.sectionDescriptionInput.value = section.description || "";
}

function saveWork() {
  const id = elements.workIdInput.value.trim();
  const title = elements.workTitleInput.value.trim();
  const language = elements.workLanguageInput.value.trim();
  if (!id || !title) {
    elements.workStatus.textContent = "作品IDと作品名は必須です";
    return;
  }
  if (!window.confirm(`作品 ${id} を保存/更新しますか？`)) {
    return;
  }

  let work = state.data.find((w) => w.id === id);
  if (work) {
    work.title = title;
    work.sourceLanguage = language || work.sourceLanguage || "原文";
  } else {
    work = {
      id,
      title,
      sourceLanguage: language || "原文",
      sections: [
        {
          id: "s1",
          title: "第1章",
          description: "",
          sentences: [
            {
              id: "s1-first",
              label: "最初の文を追加してください",
              source: "最初の文を追加してください",
              english: "",
              japanese: "",
              tokens: [{ text: "最初の文を追加してください", en: "", ja: "", origin: "", gender: "", grammarRefs: [] }],
              buildUp: ["最初の文を追加してください"],
              notes: [],
              grammar: []
            }
          ]
        }
      ]
    };
    state.data.push(work);
  }
  state.workId = work.id;
  state.sectionId = work.sections[0].id;
  state.sentenceId = work.sections[0].sentences[0].id;
  elements.workStatus.textContent = `保存: ${id}`;
  fillWorkSelect();
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
}

function deleteWork() {
  const id = elements.workIdInput.value.trim() || state.workId;
  if (!id) {
    elements.workStatus.textContent = "削除対象の作品がありません";
    return;
  }
  if (state.data.length <= 1) {
    elements.workStatus.textContent = "最後の1作品は削除できません";
    return;
  }
  if (!window.confirm(`作品 ${id} を削除しますか？`)) {
    return;
  }

  const idx = state.data.findIndex((w) => w.id === id);
  if (idx < 0) {
    elements.workStatus.textContent = `見つかりません: ${id}`;
    return;
  }
  state.data.splice(idx, 1);
  const next = state.data[Math.max(0, idx - 1)];
  state.workId = next.id;
  state.sectionId = next.sections[0].id;
  state.sentenceId = next.sections[0].sentences[0].id;
  elements.workStatus.textContent = `削除: ${id}`;
  fillWorkSelect();
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
}

function saveSection() {
  const work = getCurrentWork();
  const id = elements.sectionIdInput.value.trim();
  const title = elements.sectionTitleInput.value.trim();
  const description = elements.sectionDescriptionInput.value.trim();
  if (!work) {
    elements.sectionStatus.textContent = "作品を選択してください";
    return;
  }
  if (!id || !title) {
    elements.sectionStatus.textContent = "章IDと章タイトルは必須です";
    return;
  }
  if (!window.confirm(`章 ${id} を保存/更新しますか？`)) {
    return;
  }

  let section = work.sections.find((s) => s.id === id);
  if (section) {
    section.title = title;
    section.description = description;
  } else {
    section = {
      id,
      title,
      description,
      sentences: [
        {
          id: `${id}-first`,
          label: "最初の文を追加してください",
          source: "最初の文を追加してください",
          english: "",
          japanese: "",
          tokens: [{ text: "最初の文を追加してください", en: "", ja: "", origin: "", gender: "", grammarRefs: [] }],
          buildUp: ["最初の文を追加してください"],
          notes: [],
          grammar: []
        }
      ]
    };
    work.sections.push(section);
  }
  state.sectionId = section.id;
  state.sentenceId = section.sentences[0].id;
  elements.sectionStatus.textContent = `保存: ${id}`;
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
}

function deleteSection() {
  const work = getCurrentWork();
  const id = elements.sectionIdInput.value.trim() || state.sectionId;
  if (!work || !id) {
    elements.sectionStatus.textContent = "削除対象の章がありません";
    return;
  }
  if (work.sections.length <= 1) {
    elements.sectionStatus.textContent = "最後の1章は削除できません";
    return;
  }
  if (!window.confirm(`章 ${id} を削除しますか？`)) {
    return;
  }

  const idx = work.sections.findIndex((s) => s.id === id);
  if (idx < 0) {
    elements.sectionStatus.textContent = `見つかりません: ${id}`;
    return;
  }
  work.sections.splice(idx, 1);
  const next = work.sections[Math.max(0, idx - 1)];
  state.sectionId = next.id;
  state.sentenceId = next.sentences[0].id;
  elements.sectionStatus.textContent = `削除: ${id}`;
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
}

function getSentencePointers() {
  const pointers = [];
  state.data.forEach((work) => {
    work.sections.forEach((section) => {
      section.sentences.forEach((sentence) => {
        pointers.push({
          workId: work.id,
          sectionId: section.id,
          sentenceId: sentence.id
        });
      });
    });
  });
  return pointers;
}

function moveSentence(offset) {
  const pointers = getSentencePointers();
  const currentIndex = pointers.findIndex(
    (p) => p.workId === state.workId && p.sectionId === state.sectionId && p.sentenceId === state.sentenceId
  );
  if (currentIndex < 0) {
    return;
  }
  const nextIndex = currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= pointers.length) {
    return;
  }
  const target = pointers[nextIndex];
  state.workId = target.workId;
  state.sectionId = target.sectionId;
  state.sentenceId = target.sentenceId;
  fillWorkSelect();
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
}

function fillWorkSelect() {
  elements.workSelect.innerHTML = "";
  state.data.forEach((work) => {
    const option = document.createElement("option");
    option.value = work.id;
    option.textContent = work.title;
    elements.workSelect.append(option);
  });
  elements.workSelect.value = state.workId;
}

function fillSectionSelect() {
  const sections = getCurrentWork().sections;
  elements.sectionSelect.innerHTML = "";
  sections.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.id;
    option.textContent = section.title;
    elements.sectionSelect.append(option);
  });
  if (!sections.some((section) => section.id === state.sectionId)) {
    state.sectionId = sections[0].id;
  }
  elements.sectionSelect.value = state.sectionId;
}

function fillSentenceList() {
  const sentences = getCurrentSection().sentences;
  if (!sentences.some((sentence) => sentence.id === state.sentenceId)) {
    state.sentenceId = sentences[0].id;
  }

  elements.sentenceList.innerHTML = "";
  const work = getCurrentWork();
  const section = getCurrentSection();
  sentences.forEach((sentence) => {
    const li = document.createElement("li");
    const readKey = sentenceProgressKey(work.id, section.id, sentence.id);
    const isRead = state.readSentenceKeys.has(readKey);
    li.textContent = `${isRead ? "✓ " : ""}${sentence.label}`;
    li.className = `${sentence.id === state.sentenceId ? "active " : ""}${isRead ? "read" : ""}`.trim();
    li.addEventListener("click", () => {
      state.sentenceId = sentence.id;
      renderSentence();
      fillSentenceList();
    });
    elements.sentenceList.append(li);
  });
}

function toggleCurrentSentenceRead() {
  const key = sentenceProgressKey(state.workId, state.sectionId, state.sentenceId);
  if (state.readSentenceKeys.has(key)) {
    state.readSentenceKeys.delete(key);
  } else {
    state.readSentenceKeys.add(key);
  }
  saveProgressState();
  fillSentenceList();
  renderSentence();
}

function setCurrentSentenceReadButton() {
  const key = sentenceProgressKey(state.workId, state.sectionId, state.sentenceId);
  const on = state.readSentenceKeys.has(key);
  elements.toggleReadState.textContent = `既読: ${on ? "ON" : "OFF"}`;
}

function toggleWeakToken(language, token) {
  const key = tokenProgressKey(language, token);
  if (state.weakTokenKeys.has(key)) {
    state.weakTokenKeys.delete(key);
  } else {
    state.weakTokenKeys.add(key);
  }
  saveProgressState();
  renderSentence();
}

function isWeakToken(language, token) {
  return state.weakTokenKeys.has(tokenProgressKey(language, token));
}

function normalizeSearchText(text) {
  return (text || "").toLowerCase();
}

function runSearch(query) {
  const q = normalizeSearchText(query).trim();
  state.searchQuery = q;
  elements.searchResults.innerHTML = "";
  if (!q) {
    elements.searchStatus.textContent = "検索語を入力してください";
    return;
  }

  const hits = [];
  state.data.forEach((work) => {
    work.sections.forEach((section) => {
      section.sentences.forEach((sentence) => {
        const hay = normalizeSearchText(
          [
            work.title,
            section.title,
            sentence.label,
            sentence.source,
            sentence.english,
            sentence.japanese,
            ...(sentence.notes || [])
          ].join(" ")
        );
        if (hay.includes(q)) {
          hits.push({ work, section, sentence });
        }
      });
    });
  });

  elements.searchStatus.textContent = `検索結果: ${hits.length}件`;
  hits.slice(0, 200).forEach((hit) => {
    const li = document.createElement("li");
    li.textContent = `[${hit.work.title} / ${hit.section.title}] ${hit.sentence.label}`;
    li.addEventListener("click", () => {
      state.workId = hit.work.id;
      state.sectionId = hit.section.id;
      state.sentenceId = hit.sentence.id;
      fillWorkSelect();
      fillSectionSelect();
      fillSentenceList();
      renderSentence();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    elements.searchResults.append(li);
  });
}

function tokenWithDictionary(sourceLanguage, token) {
  const fromSentence = {
    text: token.text,
    en: token.en || "",
    ja: token.ja || "",
    origin: token.origin || "",
    gender: normalizeGender(token.gender),
    grammarRefs: Array.isArray(token.grammarRefs) ? token.grammarRefs : []
  };
  const fromDictionary = state.dictionary.get(dictKey(sourceLanguage, token.text));
  if (!fromDictionary) {
    return fromSentence;
  }

  return {
    text: token.text,
    en: fromSentence.en || fromDictionary.en || "",
    ja: fromSentence.ja || fromDictionary.ja || "",
    origin: fromSentence.origin || fromDictionary.origin || "",
    gender: fromSentence.gender || fromDictionary.gender || "",
    grammarRefs: fromSentence.grammarRefs.length > 0 ? fromSentence.grammarRefs : fromDictionary.grammarRefs || []
  };
}

function genderClass(gender) {
  if (!state.genderColorOn) {
    return "";
  }
  if (gender === "m") {
    return "gender-m";
  }
  if (gender === "f") {
    return "gender-f";
  }
  if (gender === "n") {
    return "gender-n";
  }
  return "";
}

function createGrammarLinks(grammarRefs) {
  const fragment = document.createDocumentFragment();
  if (!grammarRefs || grammarRefs.length === 0) {
    return fragment;
  }
  grammarRefs.forEach((ref) => {
    const link = document.createElement("span");
    link.className = "grammar-link";
    link.textContent = ref;
    link.addEventListener("click", () => jumpToGrammar(ref));
    fragment.append(link);
  });
  return fragment;
}

function renderTokens(work, tokens) {
  elements.sourceText.innerHTML = "";
  tokens.forEach((token) => {
    const merged = tokenWithDictionary(work.sourceLanguage, token);
    const node = elements.tokenTemplate.content.cloneNode(true);
    const tokenEl = node.querySelector(".token");
    tokenEl.textContent = merged.text;
    const cls = genderClass(merged.gender);
    if (cls) {
      tokenEl.classList.add(cls);
    }
    node.querySelector(".tooltip").textContent = `EN: ${merged.en} / JA: ${merged.ja}`;
    elements.sourceText.append(node);
  });
}

function renderList(target, values) {
  target.innerHTML = "";
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    target.append(li);
  });
}

function normalizeDiffToken(token) {
  return token
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"']/g, "");
}

function buildTokenCountMap(text) {
  const map = new Map();
  (text || "")
    .split(/\s+/)
    .map((t) => normalizeDiffToken(t))
    .filter(Boolean)
    .forEach((t) => map.set(t, (map.get(t) || 0) + 1));
  return map;
}

function renderBuildSteps(steps) {
  elements.buildSteps.innerHTML = "";
  (steps || []).forEach((step, index) => {
    const li = document.createElement("li");
    if (index === 0) {
      li.textContent = step;
      elements.buildSteps.append(li);
      return;
    }

    const prevCounts = buildTokenCountMap(steps[index - 1]);
    const parts = step.split(/(\s+)/);
    parts.forEach((part) => {
      if (part.trim() === "") {
        li.append(document.createTextNode(part));
        return;
      }
      const normalized = normalizeDiffToken(part);
      if (normalized && (prevCounts.get(normalized) || 0) > 0) {
        prevCounts.set(normalized, prevCounts.get(normalized) - 1);
        li.append(document.createTextNode(part));
        return;
      }
      const span = document.createElement("span");
      span.className = "build-added";
      span.textContent = part;
      li.append(span);
    });
    elements.buildSteps.append(li);
  });
}

function renderVocabTable(work, tokens) {
  elements.vocabTableBody.innerHTML = "";
  const seen = new Set();
  tokens.forEach((token) => {
    if (seen.has(token.text)) {
      return;
    }
    seen.add(token.text);
    const merged = tokenWithDictionary(work.sourceLanguage, token);
    const row = document.createElement("tr");
    const c1 = document.createElement("td");
    const c2 = document.createElement("td");
    const c3 = document.createElement("td");
    const c4 = document.createElement("td");
    const c5 = document.createElement("td");
    const c6 = document.createElement("td");
    const c7 = document.createElement("td");
    c1.textContent = merged.text;
    c2.textContent = merged.en;
    c3.textContent = merged.ja;
    c4.textContent = merged.gender;
    c7.textContent = merged.origin;

    const cls = genderClass(merged.gender);
    if (cls) {
      c1.classList.add(cls);
      c4.classList.add(cls);
    }

    const weakBtn = document.createElement("button");
    const weakOn = isWeakToken(work.sourceLanguage, merged.text);
    weakBtn.className = `weak-token-btn ${weakOn ? "on" : ""}`.trim();
    weakBtn.textContent = weakOn ? "ON" : "OFF";
    weakBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleWeakToken(work.sourceLanguage, merged.text);
    });
    c5.append(weakBtn);

    c6.append(createGrammarLinks(merged.grammarRefs));
    row.append(c1, c2, c3, c4, c5, c6, c7);
    elements.vocabTableBody.append(row);
  });
}

function resolveGrammarItems(sentence, tokens) {
  const fromSentence = Array.isArray(sentence.grammar) ? sentence.grammar : [];
  const fromTokenIds = new Set();
  tokens.forEach((t) => {
    t.grammarRefs.forEach((id) => fromTokenIds.add(id));
  });

  const merged = [...fromSentence];
  fromTokenIds.forEach((id) => {
    if (!merged.some((g) => g.id === id)) {
      merged.push({ id, title: id, body: "（説明未設定）", type: "grammar", tags: [], tableRows: [] });
    }
  });
  return merged;
}

function renderGrammarList(sentence, tokens) {
  const grammars = resolveGrammarItems(sentence, tokens);
  elements.grammarList.innerHTML = "";
  grammars.forEach((grammar) => {
    const li = document.createElement("li");
    li.id = `grammar-${grammar.id}`;
    li.className = "grammar-item";

    const title = document.createElement("strong");
    title.textContent = `${grammar.id}: ${grammar.title}`;
    const meta = document.createElement("div");
    meta.className = "grammar-meta";
    const badge = document.createElement("span");
    badge.className = "grammar-badge";
    badge.textContent = grammar.type || "grammar";
    meta.append(badge);
    (grammar.tags || []).forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.className = "grammar-tag";
      tagEl.textContent = tag;
      meta.append(tagEl);
    });
    const body = document.createElement("div");
    body.textContent = grammar.body;
    const tableEl = renderGrammarMiniTable(grammar.tableRows || []);

    li.append(title, meta, body, tableEl);
    elements.grammarList.append(li);
  });

  if (state.activeGrammarId) {
    activateGrammarItem(state.activeGrammarId);
  }
}

function renderGrammarMiniTable(rows) {
  const wrapper = document.createElement("div");
  if (!rows || rows.length === 0) {
    return wrapper;
  }
  const table = document.createElement("table");
  table.className = "grammar-mini-table";
  rows.forEach((rowCells, idx) => {
    const tr = document.createElement("tr");
    rowCells.forEach((cell) => {
      const cellEl = document.createElement(idx === 0 ? "th" : "td");
      cellEl.textContent = cell;
      tr.append(cellEl);
    });
    table.append(tr);
  });
  wrapper.append(table);
  return wrapper;
}

function activateGrammarItem(grammarId) {
  state.activeGrammarId = grammarId;
  const items = elements.grammarList.querySelectorAll(".grammar-item");
  items.forEach((item) => item.classList.remove("active"));
  const target = document.querySelector(`#grammar-${CSS.escape(grammarId)}`);
  if (target) {
    target.classList.add("active");
  }
}

function jumpToGrammar(grammarId) {
  activateGrammarItem(grammarId);
  elements.grammarSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearGrammarEditor() {
  state.selectedGrammarItemId = "";
  elements.grammarIdInput.value = "";
  elements.grammarTypeInput.value = "grammar";
  elements.grammarTagsInput.value = "";
  elements.grammarTitleInput.value = "";
  elements.grammarBodyInput.value = "";
  elements.grammarTableInput.value = "";
}

function loadGrammarEditorItem(item) {
  state.selectedGrammarItemId = item.id;
  elements.grammarIdInput.value = item.id;
  elements.grammarTypeInput.value = item.type || "grammar";
  elements.grammarTagsInput.value = (item.tags || []).join("|");
  elements.grammarTitleInput.value = item.title || "";
  elements.grammarBodyInput.value = item.body || "";
  elements.grammarTableInput.value = (item.tableRows || []).map((row) => row.join(" | ")).join("\n");
}

function getCurrentSentenceGrammarItems() {
  const sentence = getCurrentSentence();
  if (!Array.isArray(sentence.grammar)) {
    sentence.grammar = [];
  }
  return sentence.grammar;
}

function renderGrammarEditorTable() {
  const items = getCurrentSentenceGrammarItems();
  elements.grammarEditorTableBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    if (item.id === state.selectedGrammarItemId) {
      row.classList.add("active");
    }
    row.addEventListener("click", () => {
      loadGrammarEditorItem(item);
      elements.grammarEditStatus.textContent = `編集対象: ${item.id}`;
      renderGrammarEditorTable();
    });

    const c1 = document.createElement("td");
    const c2 = document.createElement("td");
    c1.textContent = item.id;
    c2.textContent = `${item.title || ""}${item.type ? ` [${item.type}]` : ""}`;
    row.append(c1, c2);
    elements.grammarEditorTableBody.append(row);
  });
}

function saveGrammarItem() {
  const id = elements.grammarIdInput.value.trim();
  if (!id) {
    elements.grammarEditStatus.textContent = "文法IDを入力してください";
    return;
  }
  if (!window.confirm(`文法項目 ${id} を保存/更新しますか？`)) {
    return;
  }
  const title = elements.grammarTitleInput.value.trim() || id;
  const body = elements.grammarBodyInput.value.trim();
  const type = elements.grammarTypeInput.value || "grammar";
  const tags = parseRefList(elements.grammarTagsInput.value);
  const tableRows = parseTableRows(elements.grammarTableInput.value);
  const items = getCurrentSentenceGrammarItems();
  const existing = items.find((item) => item.id === id);
  if (existing) {
    existing.title = title;
    existing.body = body;
    existing.type = type;
    existing.tags = tags;
    existing.tableRows = tableRows;
  } else {
    items.push({ id, title, body, type, tags, tableRows });
  }
  state.selectedGrammarItemId = id;
  state.activeGrammarId = id;
  elements.grammarEditStatus.textContent = `保存: ${id}`;
  renderSentence();
  window.alert(`文法項目を保存しました: ${id}`);
}

function deleteGrammarItem() {
  const id = elements.grammarIdInput.value.trim();
  if (!id) {
    elements.grammarEditStatus.textContent = "削除対象の文法IDを入力してください";
    return;
  }
  if (!window.confirm(`文法項目 ${id} を削除しますか？`)) {
    return;
  }
  const sentence = getCurrentSentence();
  if (!Array.isArray(sentence.grammar)) {
    sentence.grammar = [];
  }
  const before = sentence.grammar.length;
  sentence.grammar = sentence.grammar.filter((item) => item.id !== id);
  if (sentence.grammar.length === before) {
    elements.grammarEditStatus.textContent = `見つかりません: ${id}`;
    return;
  }
  clearGrammarEditor();
  elements.grammarEditStatus.textContent = `削除: ${id}`;
  renderSentence();
  window.alert(`文法項目を削除しました: ${id}`);
}

function clearDictEditor() {
  state.selectedDictToken = "";
  elements.dictToken.value = "";
  elements.dictEn.value = "";
  elements.dictJa.value = "";
  elements.dictOrigin.value = "";
  elements.dictGender.value = "";
  elements.dictGrammarRefs.value = "";
}

function loadDictEditor(entry) {
  state.selectedDictToken = entry.token;
  elements.dictToken.value = entry.token;
  elements.dictEn.value = entry.en || "";
  elements.dictJa.value = entry.ja || "";
  elements.dictOrigin.value = entry.origin || "";
  elements.dictGender.value = entry.gender || "";
  elements.dictGrammarRefs.value = (entry.grammarRefs || []).join("|");
}

function getCurrentLanguage() {
  return getCurrentWork().sourceLanguage;
}

function getDictionaryEntriesForCurrentLanguage() {
  const language = getCurrentLanguage();
  const entries = [];
  state.dictionary.forEach((entry) => {
    if (entry.sourceLanguage === language) {
      entries.push(entry);
    }
  });
  entries.sort((a, b) => a.token.localeCompare(b.token));
  return entries;
}

function renderDictionaryEditorTable() {
  const entries = getDictionaryEntriesForCurrentLanguage();
  elements.dictTableBody.innerHTML = "";
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    if (state.selectedDictToken === entry.token) {
      row.classList.add("active");
    }
    row.addEventListener("click", () => {
      loadDictEditor(entry);
      renderDictionaryEditorTable();
      elements.dictStatus.textContent = `編集対象: ${entry.token}`;
    });

    const c1 = document.createElement("td");
    const c2 = document.createElement("td");
    const c3 = document.createElement("td");
    const c4 = document.createElement("td");
    const c5 = document.createElement("td");
    c1.textContent = entry.token;
    c2.textContent = entry.en || "";
    c3.textContent = entry.ja || "";
    c4.textContent = entry.gender || "";
    c5.textContent = (entry.grammarRefs || []).join("|");
    row.append(c1, c2, c3, c4, c5);
    elements.dictTableBody.append(row);
  });
}

function saveDictionaryEntry() {
  const language = getCurrentLanguage();
  const token = elements.dictToken.value.trim();
  if (!token) {
    elements.dictStatus.textContent = "単語を入力してください";
    return;
  }
  if (!window.confirm(`単語 ${token} を保存/更新しますか？`)) {
    return;
  }

  const entry = {
    sourceLanguage: language,
    token,
    en: elements.dictEn.value.trim(),
    ja: elements.dictJa.value.trim(),
    origin: elements.dictOrigin.value.trim(),
    gender: normalizeGender(elements.dictGender.value),
    grammarRefs: parseRefList(elements.dictGrammarRefs.value)
  };

  state.dictionary.set(dictKey(language, token), entry);
  loadDictEditor(entry);
  elements.dictStatus.textContent = `保存: ${token}`;
  renderSentence();
  renderDictionaryEditorTable();
  window.alert(`単語を保存しました: ${token}`);
}

function deleteDictionaryEntry() {
  const language = getCurrentLanguage();
  const token = elements.dictToken.value.trim();
  if (!token) {
    elements.dictStatus.textContent = "削除対象の単語を選択してください";
    return;
  }
  if (!window.confirm(`単語 ${token} を削除しますか？`)) {
    return;
  }
  state.dictionary.delete(dictKey(language, token));
  clearDictEditor();
  elements.dictStatus.textContent = `削除: ${token}`;
  renderSentence();
  renderDictionaryEditorTable();
  window.alert(`単語を削除しました: ${token}`);
}

function renderSentence() {
  const work = getCurrentWork();
  const section = getCurrentSection();
  const sentence = getCurrentSentence();
  ensureSectionFields(section);
  const resolvedTokens = sentence.tokens.map((t) => tokenWithDictionary(work.sourceLanguage, t));

  elements.sentenceTitle.textContent = sentence.label;
  elements.sourceLabel.textContent = `本文（${work.sourceLanguage} / ホバーで訳）`;
  elements.colSource.textContent = work.sourceLanguage;
  elements.vocabTitle.textContent = `単語表（${work.sourceLanguage}）`;

  renderTokens(work, sentence.tokens);
  renderVocabTable(work, sentence.tokens);
  renderGrammarList(sentence, resolvedTokens);
  elements.englishText.textContent = sentence.english;
  elements.japaneseText.textContent = sentence.japanese;
  renderBuildSteps(sentence.buildUp);
  renderList(elements.notes, sentence.notes);
  elements.sectionInfoText.textContent = section.description || "章解説は未入力です";
  const total = section.sentences.length;
  const readCount = section.sentences.filter((s) =>
    state.readSentenceKeys.has(sentenceProgressKey(work.id, section.id, s.id))
  ).length;
  const weakCount = state.weakTokenKeys.size;
  elements.progressInfoText.textContent = `進捗: ${readCount}/${total} 既読 / 苦手単語 ${weakCount}`;
  setCurrentSentenceReadButton();
  elements.sectionInfoDialogTitle.textContent = `${section.title} - 章解説`;
  elements.sectionInfoDialogBody.textContent = section.description || "章解説は未入力です";
  loadWorkEditorFromCurrent();
  loadSectionEditorFromCurrent();
  loadSentenceEditorFromCurrent();
  renderDictionaryEditorTable();
  renderGrammarEditorTable();
  persistBookViewState();
}

function persistBookViewState() {
  const payload = {
    data: state.data,
    dictionary: Array.from(state.dictionary.values()),
    view: {
      workId: state.workId,
      sectionId: state.sectionId,
      sentenceId: state.sentenceId
    },
    ui: {
      editMode: state.editMode
    }
  };
  localStorage.setItem("readingStudioState", JSON.stringify(payload));
}

function restoreFromBookViewState() {
  const raw = localStorage.getItem("readingStudioState");
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.data) || parsed.data.length === 0) {
      return;
    }
    state.data = parsed.data;
    const fromRows = buildDictionaryFromRows(parsed.dictionary);
    state.dictionary = fromRows.size > 0 ? fromRows : buildDictionaryFromData(parsed.data);

    const firstWork = state.data[0];
    state.workId = parsed.view?.workId || firstWork.id;
    if (!state.data.some((w) => w.id === state.workId)) {
      state.workId = firstWork.id;
    }

    const work = state.data.find((w) => w.id === state.workId) || firstWork;
    state.sectionId = parsed.view?.sectionId || work.sections[0]?.id || "";
    if (!work.sections.some((s) => s.id === state.sectionId)) {
      state.sectionId = work.sections[0]?.id || "";
    }

    const section = work.sections.find((s) => s.id === state.sectionId) || work.sections[0];
    state.sentenceId = parsed.view?.sentenceId || section.sentences[0]?.id || "";
    if (!section.sentences.some((s) => s.id === state.sentenceId)) {
      state.sentenceId = section.sentences[0]?.id || "";
    }
    state.editMode = Boolean(parsed.ui?.editMode);
  } catch {
    // Ignore malformed state payload.
  }
}

function parseCsv(text) {
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
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows) {
  if (rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((row) => {
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
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugifyForId(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function buildAutoSentenceId(section, sourceText) {
  const base = slugifyForId(sourceText) || "sentence";
  const prefix = `${section.id}-${base}`;
  let id = prefix;
  let n = 2;
  while (section.sentences.some((s) => s.id === id)) {
    id = `${prefix}-${n}`;
    n += 1;
  }
  return id;
}

function buildAutoLabel(sourceText) {
  const text = (sourceText || "").trim();
  if (text.length <= 70) {
    return text;
  }
  return `${text.slice(0, 70)}...`;
}

function buildTokensFromQuickInput(sourceText, tokensText) {
  const raw = (tokensText || "").trim();
  if (raw.length > 0) {
    return raw
      .split("|")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, en: "", ja: "", origin: "", gender: "", grammarRefs: [] }));
  }
  return parseTokens("", sourceText);
}

function clearQuickPostForm() {
  elements.quickSource.value = "";
  elements.quickEnglish.value = "";
  elements.quickJapanese.value = "";
  elements.quickBuildSteps.value = "";
  elements.quickNotes.value = "";
  elements.quickTokens.value = "";
}

function loadSentenceEditorFromCurrent() {
  const sentence = getCurrentSentence();
  elements.sentenceLabelInput.value = sentence.label || "";
  elements.sentenceSourceInput.value = sentence.source || "";
  elements.sentenceEnglishInput.value = sentence.english || "";
  elements.sentenceJapaneseInput.value = sentence.japanese || "";
  elements.sentenceTokensInput.value = (sentence.tokens || []).map((t) => t.text).join("|");
  elements.sentenceBuildStepsInput.value = (sentence.buildUp || []).join("\n");
  elements.sentenceNotesInput.value = (sentence.notes || []).join("\n");
}

function saveCurrentSentenceEdit() {
  const sentence = getCurrentSentence();
  if (!sentence) {
    elements.sentenceEditStatus.textContent = "編集中の文がありません";
    return;
  }
  if (!window.confirm(`文 ${sentence.id} の編集内容を保存しますか？`)) {
    return;
  }

  const source = elements.sentenceSourceInput.value.trim();
  if (!source) {
    elements.sentenceEditStatus.textContent = "本文は必須です";
    return;
  }

  sentence.label = elements.sentenceLabelInput.value.trim() || buildAutoLabel(source);
  sentence.source = source;
  sentence.english = elements.sentenceEnglishInput.value.trim();
  sentence.japanese = elements.sentenceJapaneseInput.value.trim();
  sentence.tokens = buildTokensFromQuickInput(source, elements.sentenceTokensInput.value);
  const buildSteps = parseLineList(elements.sentenceBuildStepsInput.value);
  sentence.buildUp = buildSteps.length > 0 ? buildSteps : [source];
  sentence.notes = parseLineList(elements.sentenceNotesInput.value);

  fillSentenceList();
  renderSentence();
  elements.sentenceEditStatus.textContent = `保存: ${sentence.id}`;
  window.alert(`文を保存しました: ${sentence.id}`);
}

function addQuickSentence() {
  const source = elements.quickSource.value.trim();
  if (!source) {
    elements.quickStatus.textContent = "本文を入力してください";
    return;
  }

  const work = getCurrentWork();
  const section = getCurrentSection();
  if (!work || !section) {
    elements.quickStatus.textContent = "追加先の作品/セクションを選んでください";
    return;
  }

  const buildSteps = parseLineList(elements.quickBuildSteps.value);
  const notes = parseLineList(elements.quickNotes.value);
  const sentence = {
    id: buildAutoSentenceId(section, source),
    label: buildAutoLabel(source),
    source,
    english: elements.quickEnglish.value.trim(),
    japanese: elements.quickJapanese.value.trim(),
    tokens: buildTokensFromQuickInput(source, elements.quickTokens.value),
    buildUp: buildSteps.length > 0 ? buildSteps : [source],
    notes,
    grammar: []
  };

  const mode = elements.quickInsertMode.value;
  if (mode === "after-current") {
    const currentIndex = section.sentences.findIndex((s) => s.id === state.sentenceId);
    if (currentIndex >= 0) {
      section.sentences.splice(currentIndex + 1, 0, sentence);
    } else {
      section.sentences.push(sentence);
    }
  } else {
    section.sentences.push(sentence);
  }
  state.sentenceId = sentence.id;
  clearGrammarEditor();
  fillSentenceList();
  renderSentence();
  elements.quickStatus.textContent = `追加完了: ${sentence.id}`;
  clearQuickPostForm();
}

function deleteCurrentSentence() {
  const section = getCurrentSection();
  if (!section || section.sentences.length === 0) {
    elements.quickStatus.textContent = "削除できる文がありません";
    return;
  }
  if (section.sentences.length === 1) {
    elements.quickStatus.textContent = "最後の1文は削除できません";
    return;
  }

  const idx = section.sentences.findIndex((s) => s.id === state.sentenceId);
  if (idx < 0) {
    elements.quickStatus.textContent = "対象文が見つかりません";
    return;
  }
  const target = section.sentences[idx];
  if (!window.confirm(`文を削除しますか？\n${target.label}`)) {
    return;
  }

  const removed = section.sentences[idx];
  section.sentences.splice(idx, 1);
  const next = section.sentences[Math.min(idx, section.sentences.length - 1)];
  state.sentenceId = next.id;
  clearGrammarEditor();
  fillSentenceList();
  renderSentence();
  elements.quickStatus.textContent = `削除: ${removed.id}`;
  window.alert(`文を削除しました: ${removed.id}`);
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
      return { id, title: title || id, body, type: "grammar", tags: [], tableRows: [] };
    })
    .filter((g) => g.id);
}

function convertSentencesCsvToData(sentenceRows) {
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
      section = {
        id: sectionId,
        title: row.section_title || sectionId,
        description: row.section_description || "",
        sentences: []
      };
      work.sections.push(section);
    } else if (!section.description && row.section_description) {
      section.description = row.section_description;
    }

    section.sentences.push({
      id: sentenceId,
      label: row.sentence_label || row.source,
      source: row.source,
      english: row.english,
      japanese: row.japanese,
      tokens: parseTokens(row.tokens || "", row.source || ""),
      buildUp: splitList(row.build_steps),
      notes: splitList(row.notes),
      grammar: parseGrammarItems(row.grammar_items)
    });
  });

  return Array.from(works.values());
}

function parseDictionaryCsv(rows) {
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
      gender: normalizeGender(row.gender),
      grammarRefs: parseRefList(row.grammar_refs)
    });
  });
  return map;
}

async function readTextFile(input) {
  const file = input.files?.[0];
  if (!file) {
    return "";
  }
  return file.text();
}

function updateStateWithData(newData, newDictionary) {
  state.data = newData;
  state.dictionary = newDictionary;
  state.workId = state.data[0]?.id || "";
  state.sectionId = state.data[0]?.sections[0]?.id || "";
  state.sentenceId = state.data[0]?.sections[0]?.sentences[0]?.id || "";
  state.activeGrammarId = "";
  clearDictEditor();
  clearGrammarEditor();

  fillWorkSelect();
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
}

async function importCsv() {
  const sentenceCsvText = await readTextFile(elements.sentencesCsvInput);
  if (!sentenceCsvText) {
    elements.importStatus.textContent = "sentences.csv を選択してください";
    return;
  }

  try {
    const sentenceRows = rowsToObjects(parseCsv(sentenceCsvText));
    const convertedData = convertSentencesCsvToData(sentenceRows);
    if (convertedData.length === 0) {
      elements.importStatus.textContent = "CSVに有効な行がありません";
      return;
    }

    const dictionaryCsvText = await readTextFile(elements.dictionaryCsvInput);
    let dictionary = buildDictionaryFromData(convertedData);
    if (dictionaryCsvText) {
      const dictionaryRows = rowsToObjects(parseCsv(dictionaryCsvText));
      const fromCsv = parseDictionaryCsv(dictionaryRows);
      fromCsv.forEach((value, key) => dictionary.set(key, value));
    }

    updateStateWithData(convertedData, dictionary);
    elements.importStatus.textContent = `取込完了: ${convertedData.length} 作品`;
  } catch (error) {
    elements.importStatus.textContent = `取込失敗: ${error.message}`;
  }
}

function bindEvents() {
  elements.toggleEditMode.addEventListener("click", () => {
    setEditMode(!state.editMode);
    persistBookViewState();
  });
  elements.runSearchBtn.addEventListener("click", () => runSearch(elements.searchInput.value));
  elements.clearSearchBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    state.searchQuery = "";
    elements.searchResults.innerHTML = "";
    elements.searchStatus.textContent = "未検索";
  });
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      runSearch(elements.searchInput.value);
    }
  });
  elements.toggleReadState.addEventListener("click", toggleCurrentSentenceRead);
  elements.saveWorkBtn.addEventListener("click", saveWork);
  elements.deleteWorkBtn.addEventListener("click", deleteWork);
  elements.saveSectionBtn.addEventListener("click", saveSection);
  elements.deleteSectionBtn.addEventListener("click", deleteSection);
  elements.openSectionInfo.addEventListener("click", () => {
    if (typeof elements.sectionInfoDialog.showModal === "function") {
      elements.sectionInfoDialog.showModal();
    }
  });
  elements.closeSectionInfo.addEventListener("click", () => {
    if (typeof elements.sectionInfoDialog.close === "function") {
      elements.sectionInfoDialog.close();
    }
  });

  elements.workSelect.addEventListener("change", (event) => {
    state.workId = event.target.value;
    state.sectionId = getCurrentWork().sections[0].id;
    state.sentenceId = getCurrentWork().sections[0].sentences[0].id;
    state.activeGrammarId = "";
    clearDictEditor();
    clearGrammarEditor();
    fillSectionSelect();
    fillSentenceList();
    renderSentence();
  });

  elements.sectionSelect.addEventListener("change", (event) => {
    state.sectionId = event.target.value;
    state.sentenceId = getCurrentSection().sentences[0].id;
    state.activeGrammarId = "";
    clearDictEditor();
    clearGrammarEditor();
    fillSentenceList();
    renderSentence();
  });

  elements.toggleHints.addEventListener("click", () => {
    state.hintsOn = !state.hintsOn;
    elements.toggleHints.textContent = `語彙ヒント: ${state.hintsOn ? "ON" : "OFF"}`;
    elements.sourceText.classList.toggle("hints-off", !state.hintsOn);
  });

  elements.toggleVocab.addEventListener("click", () => {
    state.vocabOn = !state.vocabOn;
    elements.toggleVocab.textContent = `単語表: ${state.vocabOn ? "ON" : "OFF"}`;
    elements.vocabWrap.classList.toggle("hidden", !state.vocabOn);
  });

  elements.toggleGenderColor.addEventListener("click", () => {
    state.genderColorOn = !state.genderColorOn;
    elements.toggleGenderColor.textContent = `性カラー: ${state.genderColorOn ? "ON" : "OFF"}`;
    renderSentence();
  });

  elements.importCsvBtn.addEventListener("click", importCsv);
  elements.addQuickSentence.addEventListener("click", addQuickSentence);
  elements.deleteSentence.addEventListener("click", deleteCurrentSentence);
  elements.saveSentenceEdit.addEventListener("click", saveCurrentSentenceEdit);
  elements.saveDictEntry.addEventListener("click", saveDictionaryEntry);
  elements.deleteDictEntry.addEventListener("click", deleteDictionaryEntry);
  elements.saveGrammarItem.addEventListener("click", saveGrammarItem);
  elements.deleteGrammarItem.addEventListener("click", deleteGrammarItem);
  elements.prevSentence.addEventListener("click", () => moveSentence(-1));
  elements.nextSentence.addEventListener("click", () => moveSentence(1));
  elements.openBookView.addEventListener("click", () => {
    persistBookViewState();
    window.open("./book.html", "_blank");
  });
}

function init() {
  restoreFromBookViewState();
  restoreProgressState();
  setEditMode(state.editMode);
  setupPaneResize();
  fillWorkSelect();
  fillSectionSelect();
  fillSentenceList();
  renderSentence();
  bindEvents();
}

init();
