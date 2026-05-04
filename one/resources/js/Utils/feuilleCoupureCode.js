const idValue = (value) => (value === null || value === undefined ? "" : String(value));

const compactCode = (value) =>
  idValue(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const stripPrefix = (value, prefix) =>
  prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;

const stripCodePrefix = (value, prefixes) => {
  const match = prefixes.find((prefix) => value.startsWith(prefix));

  return match ? value.slice(match.length) : value;
};

const numericCode = (value) => (/^0*\d+$/.test(value) ? Number(value) : null);

export function parseFeuilleCoupureCode(query) {
  const compactQuery = compactCode(query);
  const match = compactQuery.match(/^f(.+?)c(.+)$/);

  if (!match || !match[1] || !match[2]) {
    return null;
  }

  return {
    feuille: match[1],
    coupure: match[2],
  };
}

export function codePartMatches(value, expected, prefix = "") {
  const actualCode = stripPrefix(compactCode(value), prefix);
  const expectedCode = stripPrefix(compactCode(expected), prefix);

  if (!actualCode || !expectedCode) {
    return false;
  }

  if (actualCode === expectedCode) {
    return true;
  }

  const actualNumber = numericCode(actualCode);
  const expectedNumber = numericCode(expectedCode);

  return actualNumber !== null && expectedNumber !== null && actualNumber === expectedNumber;
}

export function formatFeuilleCoupureCode(feuille, coupure) {
  const feuilleCode = stripCodePrefix(compactCode(feuille), ["feuille", "f"]).toUpperCase();
  const coupureCode = stripCodePrefix(compactCode(coupure), ["coupure", "c"]).toUpperCase();

  return `F${feuilleCode}C${coupureCode}`;
}

export function rowMatchesFeuilleCoupureCode(row, codeOrQuery, keys = {}) {
  const code =
    typeof codeOrQuery === "string" ? parseFeuilleCoupureCode(codeOrQuery) : codeOrQuery;

  if (!code) {
    return false;
  }

  const {
    feuilleIdKey = "feuille_id",
    feuilleLabelKey = "feuille_nom",
    coupureIdKey = "coupure_id",
    coupureLabelKey = "coupure_nom",
    coupureSecondaryLabelKey = "coupure_label",
  } = keys;

  const feuilleMatches = [row[feuilleLabelKey], row[feuilleIdKey]].some((value) =>
    codePartMatches(value, code.feuille, "f")
  );
  const coupureMatches = [
    row[coupureLabelKey],
    row[coupureSecondaryLabelKey],
    row[coupureIdKey],
  ].some((value) => codePartMatches(value, code.coupure, "c"));

  return feuilleMatches && coupureMatches;
}

export function resolveFeuilleCoupureCode(rows = [], query, keys = {}) {
  const row = rows.find((item) => rowMatchesFeuilleCoupureCode(item, query, keys));

  if (!row) {
    return null;
  }

  const {
    feuilleIdKey = "feuille_id",
    coupureIdKey = "coupure_id",
    metadataIdKey = "id",
  } = keys;

  return {
    row,
    feuilleId: idValue(row[feuilleIdKey]),
    coupureId: idValue(row[coupureIdKey]),
    metadataId: idValue(row[metadataIdKey]),
  };
}
