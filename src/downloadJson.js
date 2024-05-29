import downloadFile from "downloadfile-js";

function mapRow(row, headings, mappings) {
  return Object.entries(mappings).reduce((acc, [k, kc]) => {
    if (!kc) return acc;
    const keychain = kc.split(".");

    let pointer = acc;
    for (let keychainKey of keychain.slice(0, -1)) {
      if (!(keychainKey in pointer)) {
        pointer = pointer[keychainKey] = {};
      } else {
        pointer = pointer[keychainKey]
      }
    }

    pointer[keychain.slice(-1)] = row[headings.indexOf(k)];

    return acc;
  }, {})
}

export default function downloadJson(rows, headings, mappings) {
  const data = rows.map((row) => mapRow(row, headings, mappings));
  downloadFile(JSON.stringify(data, null, 2), "output.json");
}
