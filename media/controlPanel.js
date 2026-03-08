const vscode = acquireVsCodeApi();

document.addEventListener("DOMContentLoaded", () => {
  let currentCell = 1;
  let totalCells = 1;
  let notebook = "";

  const dot = document.getElementById("statusDot");
  const statusLabel = document.getElementById("statusText");
  const cellLabel = document.getElementById("cellLabel");

  function updateCellLabel() {
    if (cellLabel) {
      cellLabel.textContent =
        notebook + "  Cell " + currentCell + " / " + totalCells;
    }
  }

  function setRunning() {
    if (dot) {
      dot.classList.add("running");
    }

    if (statusLabel) {
      statusLabel.textContent = "Running";
    }
  }

  function setReady() {
    if (dot) {
      dot.classList.remove("running");
    }

    if (statusLabel) {
      statusLabel.textContent = "Ready";
    }
  }

  const runCellBtn = document.getElementById("runCell");
  const runAllBtn = document.getElementById("runAll");
  const clearOutputBtn = document.getElementById("clearOutput");
  const showLedgerBtn = document.getElementById("showLedger");
  const prevCellBtn = document.getElementById("prevCell");
  const nextCellBtn = document.getElementById("nextCell");

  if (runCellBtn) {
    runCellBtn.addEventListener("click", () => {
      setRunning();

      vscode.postMessage({
        command: "runCell",
      });
    });
  }

  if (runAllBtn) {
    runAllBtn.addEventListener("click", () => {
      setRunning();

      vscode.postMessage({
        command: "runAll",
      });
    });
  }

  if (clearOutputBtn) {
    clearOutputBtn.addEventListener("click", () => {
      vscode.postMessage({
        command: "clearOutput",
      });
    });
  }

  if (showLedgerBtn) {
    showLedgerBtn.addEventListener("click", () => {
      vscode.postMessage({
        command: "showLedger",
      });
    });
  }

  if (prevCellBtn) {
    prevCellBtn.addEventListener("click", () => {
      vscode.postMessage({
        command: "navigateCell",
        direction: -1,
      });
    });
  }

  if (nextCellBtn) {
    nextCellBtn.addEventListener("click", () => {
      vscode.postMessage({
        command: "navigateCell",
        direction: 1,
      });
    });
  }

  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.command) {
      case "state":
        notebook = message.data.notebook;
        currentCell = message.data.cell;
        totalCells = message.data.totalCells;

        updateCellLabel();

        break;

      case "setReady":
        setReady();

        break;
    }
  });
});
