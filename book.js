const els = {
  workSelect: document.querySelector("#workSelect"),
  sectionSelect: document.querySelector("#sectionSelect"),
  backToStudio: document.querySelector("#backToStudio"),
  togglePageMode: document.querySelector("#togglePageMode"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  openSectionInfo: document.querySelector("#openSectionInfo"),
  toggleDetails: document.querySelector("#toggleDetails"),
  statusText: document.querySelector("#statusText"),
  sectionInfoText: document.querySelector("#sectionInfoText"),
  bookList: document.querySelector("#bookList"),
  sectionInfoDialog: document.querySelector("#sectionInfoDialog"),
  sectionInfoDialogTitle: document.querySelector("#sectionInfoDialogTitle"),
  sectionInfoDialogBody: document.querySelector("#sectionInfoDialogBody"),
  closeSectionInfo: document.querySelector("#closeSectionInfo")
};

const state = {
  data: [],
  dictionary: [],
  workId: "",
  sectionId: "",
  detailsOn: true,
  pageMode: false,
  pageIndex: 0
};

function loadState() {
  const raw = localStorage.getItem("readingStudioState");
  if (!raw) {
    return;
  }
  const parsed = JSON.parse(raw);
  state.data = parsed.data || [];
  state.dictionary = parsed.dictionary || [];
  state.workId = parsed.view?.workId || state.data[0]?.id || "";
  const work = state.data.find((w) => w.id === state.workId) || state.data[0];
  state.sectionId = parsed.view?.sectionId || work?.sections?.[0]?.id || "";
}

function openSentenceInStudio(sentenceId) {
  const payload = {
    data: state.data,
    dictionary: state.dictionary,
    view: {
      workId: state.workId,
      sectionId: state.sectionId,
      sentenceId
    }
  };
  localStorage.setItem("readingStudioState", JSON.stringify(payload));
  window.location.href = "./index.html";
}

function currentWork() {
  return state.data.find((w) => w.id === state.workId);
}

function currentSection() {
  return currentWork().sections.find((s) => s.id === state.sectionId);
}

function normalizeSection(section) {
  if (!section.description) {
    section.description = "";
  }
}

function renderWorkSelect() {
  els.workSelect.innerHTML = "";
  state.data.forEach((work) => {
    const option = document.createElement("option");
    option.value = work.id;
    option.textContent = work.title;
    els.workSelect.append(option);
  });
  els.workSelect.value = state.workId;
}

function renderSectionSelect() {
  const work = currentWork();
  els.sectionSelect.innerHTML = "";
  work.sections.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.id;
    option.textContent = section.title;
    els.sectionSelect.append(option);
  });
  if (!work.sections.some((s) => s.id === state.sectionId)) {
    state.sectionId = work.sections[0].id;
  }
  els.sectionSelect.value = state.sectionId;
}

function renderBookList() {
  const work = currentWork();
  const section = currentSection();
  normalizeSection(section);
  els.bookList.innerHTML = "";

  const list = state.pageMode
    ? section.sentences.filter((_, idx) => idx === state.pageIndex)
    : section.sentences;

  list.forEach((sentence) => {
    const li = document.createElement("li");
    li.className = "book-item";
    li.title = "クリックでスタジオで開く";
    li.addEventListener("click", () => openSentenceInStudio(sentence.id));

    const src = document.createElement("p");
    src.className = "source";
    src.textContent = sentence.source;

    const detail = document.createElement("div");
    detail.className = `detail ${state.detailsOn ? "" : "hidden"}`;
    detail.innerHTML = `
      <div><strong>English:</strong> ${sentence.english || ""}</div>
      <div><strong>日本語:</strong> ${sentence.japanese || ""}</div>
      <div><strong>最小構成:</strong> ${(sentence.buildUp || []).join(" / ")}</div>
      <div><strong>備考:</strong> ${(sentence.notes || []).join(" / ")}</div>
    `;

    li.append(src, detail);
    els.bookList.append(li);
  });

  const pageText = state.pageMode ? ` / ${state.pageIndex + 1} / ${section.sentences.length} ページ` : "";
  els.statusText.textContent = `${work.title} / ${section.title} / ${section.sentences.length} 文${pageText}`;
  els.sectionInfoText.textContent = section.description || "章解説は未入力です";
  els.sectionInfoDialogTitle.textContent = `${section.title} - 章解説`;
  els.sectionInfoDialogBody.textContent = section.description || "章解説は未入力です";
}

function clampPageIndex() {
  const total = currentSection().sentences.length;
  if (state.pageIndex < 0) {
    state.pageIndex = 0;
  }
  if (state.pageIndex > total - 1) {
    state.pageIndex = Math.max(0, total - 1);
  }
}

function bindEvents() {
  els.workSelect.addEventListener("change", (e) => {
    state.workId = e.target.value;
    state.sectionId = currentWork().sections[0].id;
    state.pageIndex = 0;
    renderSectionSelect();
    renderBookList();
  });

  els.sectionSelect.addEventListener("change", (e) => {
    state.sectionId = e.target.value;
    state.pageIndex = 0;
    renderBookList();
  });

  els.toggleDetails.addEventListener("click", () => {
    state.detailsOn = !state.detailsOn;
    els.toggleDetails.textContent = `詳細: ${state.detailsOn ? "ON" : "OFF"}`;
    renderBookList();
  });

  els.togglePageMode.addEventListener("click", () => {
    state.pageMode = !state.pageMode;
    state.pageIndex = 0;
    els.togglePageMode.textContent = `表示: ${state.pageMode ? "ページ" : "一括"}`;
    renderBookList();
  });

  els.prevPage.addEventListener("click", () => {
    if (!state.pageMode) {
      return;
    }
    state.pageIndex -= 1;
    clampPageIndex();
    renderBookList();
  });

  els.nextPage.addEventListener("click", () => {
    if (!state.pageMode) {
      return;
    }
    state.pageIndex += 1;
    clampPageIndex();
    renderBookList();
  });

  els.backToStudio.addEventListener("click", () => {
    window.location.href = "./index.html";
  });

  els.openSectionInfo.addEventListener("click", () => {
    if (typeof els.sectionInfoDialog.showModal === "function") {
      els.sectionInfoDialog.showModal();
    }
  });

  els.closeSectionInfo.addEventListener("click", () => {
    if (typeof els.sectionInfoDialog.close === "function") {
      els.sectionInfoDialog.close();
    }
  });
}

function init() {
  loadState();
  if (!state.data.length) {
    els.statusText.textContent = "元ページでデータを読み込んでから開いてください";
    return;
  }
  renderWorkSelect();
  renderSectionSelect();
  renderBookList();
  bindEvents();
}

init();
