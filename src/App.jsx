import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import "./style.scss";
import downloadJson from "./downloadJson";

const key = "AIzaSyBMf_tc6vGaaLVgbgBpSKgpWEaSLjGInh0";

const changer = (setter) => (e) => setter(e.target.value);
const fetchData = (...p) => fetch(...p).then((r) => r.json());

function App() {
  const [bookUrl, setBookUrl] = useState("");
  const [bookData, setBookData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headerRow, setHeaderRow] = useState(null);
  const [valueRows, setValuesRow] = useState(null);
  const [mappings, setMappings] = useState({});

  const updateMapping = useCallback((k, v) => {
    setMappings((p) => ({ ...p, [k]: v }));
  }, []);

  const bookId = useMemo(
    () =>
      /https:\/\/docs.google.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(
        bookUrl
      )?.[1],
    [bookUrl]
  );

  const loadBook = useCallback(async () => {
    if (!bookId) return;

    const data = await fetchData(
      `https://content-sheets.googleapis.com/v4/spreadsheets/${bookId}/?key=${key}`
    );
    setBookData(
      data.sheets.map(({ properties: sheet }) => ({
        title: sheet.title,
        rows: sheet.gridProperties.rowCount,
        columns: sheet.gridProperties.columnCount,
      }))
    );
    setSelectedSheet("");
    setValuesRow(null);
    setHeaderRow(null);
  }, [bookId]);

  const loadSheet = useCallback(async () => {
    if (!bookId) return;

    const range = `A1:Z1000`;
    const data = await fetchData(
      `https://content-sheets.googleapis.com/v4/spreadsheets/${bookId}/values:batchGet?ranges=${selectedSheet}!${range}&key=${key}`
    );
    const values = data.valueRanges[0].values;
    const headerRow = values.shift();
    setValuesRow(values);
    setHeaderRow(headerRow);
  }, [bookId, selectedSheet]);

  const handleDownload = useCallback(() => {
    downloadJson(valueRows, headerRow, mappings);
  }, [valueRows, headerRow, mappings]);

  return (
    <div id="pico-root">
      <header>
        <h1>Tim's GSheets to JSON</h1>
      </header>
      <main className="container">
        <label>
          1) Enter the URL of the spreadsheet you would like to review
          <fieldset role="group">
            <input value={bookUrl} onChange={changer(setBookUrl)} />
            <button disabled={!bookId} onClick={loadBook}>
              Load
            </button>
          </fieldset>
        </label>
        {!!bookData && (
          <label>
            2) Select the sheet you would like to convert
            <fieldset role="group">
              <select
                value={selectedSheet}
                onChange={changer(setSelectedSheet)}
              >
                <option value="">Select a sheet...</option>
                {bookData.map(({ title }) => (
                  <option key={title}>{title}</option>
                ))}
              </select>
              <button disabled={!selectedSheet} onClick={loadSheet}>
                Load
              </button>
            </fieldset>
          </label>
        )}
        {headerRow && (
          <>
            <label>3) Map out your columns</label>
            <table>
              <thead>
                <tr>
                  <th>Input</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                {headerRow.map((header) => (
                  <tr key={header}>
                    <td>{header}</td>
                    <td>
                      <input
                        value={mappings[header] || ""}
                        onChange={(e) => updateMapping(header, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleDownload}>Download</button>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
