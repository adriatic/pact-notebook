const vscode = acquireVsCodeApi();

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const runBtn = document.getElementById("run");
const createBtn = document.getElementById("create");

const notebookLabel = document.getElementById("notebook");
const cellLabel = document.getElementById("cell");

const led = document.getElementById("led");
const status = document.getElementById("status");

let runningInterval = null;

prevBtn.onclick = () => {
  vscode.postMessage({
    command: "navigateCell",
    direction: -1,
  });
};

nextBtn.onclick = () => {
  vscode.postMessage({
    command: "navigateCell",
    direction: 1,
  });
};

runBtn.onclick = () => {
  setRunning(true);

  vscode.postMessage({
    command: "runCell",
  });
};

createBtn.onclick = () => {
  vscode.postMessage({
    command: "createPrompt",
  });
};

window.addEventListener("message", (event) => {
  const msg = event.data;

  if (msg.command === "state") {
    const state = msg.data;

    notebookLabel.textContent = state.notebook ?? "-";
    cellLabel.textContent = `${state.cell} / ${state.totalCells}`;

    prevBtn.disabled = state.cell <= 1;
    nextBtn.disabled = state.cell >= state.totalCells;
  }

  if (msg.command === "executionFinished") {
    setRunning(false);
  }
});

function setRunning(active) {
  if (active) {
    led.classList.remove("green");
    led.classList.add("red");

    let dots = 0;

    runningInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      statusLabel.textContent = "Running" + ".".repeat(dots);
    }, 400);
  } else {
    led.classList.remove("red");
    led.classList.add("green");

    if (runningInterval) {
      clearInterval(runningInterval);
      runningInterval = null;
    }

    statusLabel.textContent = "Idle";
  }
}