const vscode = acquireVsCodeApi();

const notebookName = document.getElementById("notebookName");
const cellLabel = document.getElementById("cellLabel");

const prevCell = document.getElementById("prevCell");
const nextCell = document.getElementById("nextCell");

const runCell = document.getElementById("runCell");
const runAll = document.getElementById("runAll");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

/* ---------- NAVIGATION ---------- */

prevCell.onclick = () => {
  vscode.postMessage({
    command: "navigateCell",
    direction: -1,
  });
};

nextCell.onclick = () => {
  vscode.postMessage({
    command: "navigateCell",
    direction: 1,
  });
};

/* ---------- RUN ---------- */

runCell.onclick = () => {
  setRunning();

  vscode.postMessage({
    command: "runCell",
  });
};

runAll.onclick = () => {
  setRunning();

  vscode.postMessage({
    command: "runAll",
  });
};

/* ---------- STATUS ---------- */

function setRunning() {
  statusDot.classList.add("running");
  statusText.textContent = "Running";
}

function setReady() {
  statusDot.classList.remove("running");
  statusText.textContent = "Ready";
}

/* ---------- STATE UPDATE ---------- */

window.addEventListener("message", (event) => {
  const message = event.data;

  if (message.command === "state") {
    const state = message.data;
    prevCell.disabled = state.cell <= 1;
    nextCell.disabled = state.cell >= state.totalCells;
    
    /* NOTEBOOK NAME */
    notebookName.textContent = state.notebook || "";

    /* CELL COUNTER */
    cellLabel.textContent = `Cell ${state.cell} / ${state.totalCells}`;

    setReady();
  }
});
