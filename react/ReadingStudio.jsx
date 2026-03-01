import { useMemo, useState } from "react";

function dictKey(language, token) {
  return `${language}::${token}`;
}

function toDictionaryMap(dictionaryRows) {
  const map = new Map();
  dictionaryRows.forEach((row) => {
    map.set(dictKey(row.sourceLanguage, row.token), row);
  });
  return map;
}

export default function ReadingStudio({ data, dictionaryRows = [] }) {
  const [workId, setWorkId] = useState(data[0]?.id || "");
  const [sectionId, setSectionId] = useState(data[0]?.sections[0]?.id || "");
  const [sentenceId, setSentenceId] = useState(data[0]?.sections[0]?.sentences[0]?.id || "");

  const dictionary = useMemo(() => toDictionaryMap(dictionaryRows), [dictionaryRows]);
  const work = data.find((w) => w.id === workId) || data[0];
  const section = work.sections.find((s) => s.id === sectionId) || work.sections[0];
  const sentence = section.sentences.find((s) => s.id === sentenceId) || section.sentences[0];

  const tokens = sentence.tokens.map((token) => {
    const fromDict = dictionary.get(dictKey(work.sourceLanguage, token.text));
    return {
      text: token.text,
      en: token.en || fromDict?.en || "",
      ja: token.ja || fromDict?.ja || "",
      origin: token.origin || fromDict?.origin || "",
      gender: token.gender || fromDict?.gender || "",
      grammarRefs: token.grammarRefs?.length ? token.grammarRefs : fromDict?.grammarRefs || []
    };
  });

  return (
    <div>
      <select
        value={work.id}
        onChange={(e) => {
          const nextWork = data.find((w) => w.id === e.target.value);
          setWorkId(nextWork.id);
          setSectionId(nextWork.sections[0].id);
          setSentenceId(nextWork.sections[0].sentences[0].id);
        }}
      >
        {data.map((w) => (
          <option key={w.id} value={w.id}>
            {w.title}
          </option>
        ))}
      </select>

      <p>{sentence.source}</p>
      <table>
        <thead>
          <tr>
            <th>{work.sourceLanguage}</th>
            <th>English</th>
            <th>日本語</th>
            <th>性</th>
            <th>文法</th>
            <th>語源/メモ</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.text}>
              <td>{t.text}</td>
              <td>{t.en}</td>
              <td>{t.ja}</td>
              <td>{t.gender}</td>
              <td>{t.grammarRefs.join("|")}</td>
              <td>{t.origin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
