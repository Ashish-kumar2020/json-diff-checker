import { useState } from "react";
import "./App.css";

type DiffType = "added" | "removed" | "unchanged";

type DiffLine = {
  type: DiffType;
  content: string;
  lineNumber: number;
};

type DiffResult = {
  original: DiffLine[];
  modified: DiffLine[];
};

function comparisonAlgorithm(original: string[], modified: string[]): DiffResult {
  const m = original.length;
  const n = modified.length;

  const dp: number[][] = Array.from(
    { length: m + 1 },
    () => Array(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        original[i] === modified[j]
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const originalResult: DiffLine[] = [];
  const modifiedResult: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (original[i] === modified[j]) {
      originalResult.push({
        type: "unchanged",
        content: original[i],
        lineNumber: i + 1,
      });

      modifiedResult.push({
        type: "unchanged",
        content: modified[j],
        lineNumber: j + 1,
      });

      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      originalResult.push({
        type: "removed",
        content: original[i],
        lineNumber: i + 1,
      });

      i++;
    } else {
      modifiedResult.push({
        type: "added",
        content: modified[j],
        lineNumber: j + 1,
      });

      j++;
    }
  }

  while (i < m) {
    originalResult.push({
      type: "removed",
      content: original[i],
      lineNumber: i + 1,
    });
    i++;
  }

  while (j < n) {
    modifiedResult.push({
      type: "added",
      content: modified[j],
      lineNumber: j + 1,
    });
    j++;
  }

  return {
    original: originalResult,
    modified: modifiedResult,
  };
}

function App() {
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [message, setMessage] = useState("");

  const compareText = () => {
    setMessage("");

    if (!originalText.trim() && !modifiedText.trim()) {
      setResult(null);
      setMessage("Please enter text in at least one input panel.");
      return;
    }

    setResult(
      comparisonAlgorithm(originalText.split("\n"), modifiedText.split("\n"))
    );
  };

  const copyResult = async () => {
    if (!result) return;

    const originalOutput = result.original.map(
      (line) =>
        `${line.type === "removed" ? "-" : " "}${line.content}`
    );

    const modifiedOutput = result.modified.map(
      (line) =>
        `${line.type === "added" ? "+" : " "}${line.content}`
    );

    const output = [
      "ORIGINAL",
      ...originalOutput,
      "",
      "MODIFIED",
      ...modifiedOutput,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(output);
      setMessage("Comparison result copied successfully.");
    } catch {
      setMessage("Unable to copy. Check clipboard permissions.");
    }
  };

  const clearAll = () => {
    setOriginalText("");
    setModifiedText("");
    setResult(null);
    setMessage("");
  };

  const addedCount =
    result?.modified.filter((line) => line.type === "added").length ?? 0;

  const removedCount =
    result?.original.filter((line) => line.type === "removed").length ?? 0;

  const unchangedCount =
    result?.original.filter((line) => line.type === "unchanged").length ?? 0;

  const renderLines = (lines: DiffLine[]) => {
    if (lines.length === 0) {
      return <p className="empty-result">No lines to display.</p>;
    }

    return lines.map((line, index) => (
      <div
        className={`diff-line ${line.type}`}
        key={`${line.lineNumber}-${index}-${line.type}`}
      >
        <span className="line-number">{line.lineNumber}</span>

        <span className="line-marker">
          {line.type === "added"
            ? "+"
            : line.type === "removed"
              ? "-"
              : " "}
        </span>

        <pre>{line.content || " "}</pre>
      </div>
    ));
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <div>
          <h1>Diff Checker</h1>
          <p>Compare two texts and identify what changed.</p>
        </div>

        <button className="clear-button" onClick={clearAll}>
          Clear All
        </button>
      </header>

      <section className="input-section">
        <div className="input-panel">
          <div className="panel-header">
            <h2>Original Text</h2>
            <span>{originalText.split("\n").length} lines</span>
          </div>

          <textarea
            value={originalText}
            onChange={(event) => setOriginalText(event.target.value)}
            placeholder="Paste your original text here..."
            spellCheck={false}
            aria-label="Original text"
          />
        </div>

        <div className="input-panel">
          <div className="panel-header">
            <h2>Modified Text</h2>
            <span>{modifiedText.split("\n").length} lines</span>
          </div>

          <textarea
            value={modifiedText}
            onChange={(event) => setModifiedText(event.target.value)}
            placeholder="Paste your modified text here..."
            spellCheck={false}
            aria-label="Modified text"
          />
        </div>
      </section>

      <div className="action-section">
        <button className="compare-button" onClick={compareText}>
          Compare Text
        </button>

        <button
          className="copy-button"
          onClick={copyResult}
          disabled={!result}
        >
          Copy Result
        </button>
      </div>

      {message && (
        <p className="status-message" role="status">
          {message}
        </p>
      )}

      {result && (
        <section className="result-section">
          <div className="result-header">
            <div>
              <h2>Comparison Result</h2>
              <p>Review the differences between both versions.</p>
            </div>
          </div>

          <div className="statistics">
            <div className="stat-card added-stat">
              <span>Added</span>
              <strong>{addedCount}</strong>
            </div>

            <div className="stat-card removed-stat">
              <span>Removed</span>
              <strong>{removedCount}</strong>
            </div>

            <div className="stat-card unchanged-stat">
              <span>Unchanged</span>
              <strong>{unchangedCount}</strong>
            </div>
          </div>

          <div className="legend">
            <span className="legend-added">+ Added</span>
            <span className="legend-removed">− Removed</span>
            <span className="legend-unchanged">Unchanged</span>
          </div>

          <div className="diff-panels">
            <div className="diff-panel">
              <h3>Original</h3>
              <div className="diff-content">
                {renderLines(result.original)}
              </div>
            </div>

            <div className="diff-panel">
              <h3>Modified</h3>
              <div className="diff-content">
                {renderLines(result.modified)}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;