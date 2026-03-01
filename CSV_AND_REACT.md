# CSV format (fixed)

## 1) sentences.csv (required)
Columns:
- work_id
- work_title
- source_language
- section_id
- section_title
- section_description
- sentence_id
- sentence_label
- source
- english
- japanese
- build_steps  (`||` separated)
- notes (`||` separated)
- tokens (`|` separated)
- grammar_items (`||` separated, each item `grammar_id::title::body`)

## 2) dictionary.csv (optional but recommended)
Columns:
- source_language
- token
- en
- ja
- origin
- gender (`m` / `f` / `n`)
- grammar_refs (`|` separated grammar ids)

If the same token appears in many sentences, dictionary values are reused automatically.

# Upload flow
1. Select `sentences.csv`
2. Optionally select `dictionary.csv`
3. Click `CSVを取り込む`
4. Screen updates immediately

# React compatibility
Canonical data model is identical between current app and React:
- `Work[] -> sections[] -> sentences[] -> tokens[]`

A minimal React component is provided at:
- `react/ReadingStudio.jsx`
- `react/csvAdapter.js` (CSV -> canonical data converter)

This component consumes the same data shape and dictionary merge logic.
