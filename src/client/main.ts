document.addEventListener("DOMContentLoaded", () => {
  console.log("Hello, TypeScript!");

  const codeTextarea = document.getElementById("code") as HTMLTextAreaElement;
  const startShellButton = document.getElementById("start-shell");
  const runButton = document.getElementById("run");
  const outputDiv = document.getElementById("output");
  const containerNameInput = document.getElementById(
    "container-name",
  ) as HTMLInputElement;

  if (!codeTextarea) {
    throw new Error("Cannot find #code element");
  }
  if (!startShellButton) {
    throw new Error("Cannot find #start-shell element");
  }
  if (!runButton) {
    throw new Error("Cannot find #run element");
  }
  if (!outputDiv) {
    throw new Error("Cannot find #output element");
  }
  if (!containerNameInput) {
    throw new Error("Cannot find #container-name element");
  }

  const editor = CodeMirror.fromTextArea(codeTextarea, {
    lineNumbers: true,
    mode: "python",
  });

  startShellButton.addEventListener("click", () => {
    startShell(containerNameInput.value);
  });

  runButton.addEventListener("click", () => {
    const codeMirrorValue = editor.getValue();
    console.log("Running code:", codeMirrorValue);
    sendCodeToServer(codeMirrorValue);
  });

  setupWebSocket();
});

function startShell(containerName: string) {
  fetch("/start-shell", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ containerName }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Server response:", data);
      displayMessage(data.message, false);
      if (data.error) displayMessage(data.error, true);
    })
    .catch((error) => {
      console.error("Error:", error);
      displayMessage("Failed to start shell", true);
    });
}

function sendCodeToServer(code: string) {
  fetch("/run-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Server response:", data);
      displayMessage(data.message, false);
      if (data.error) displayMessage(data.error, true);
    })
    .catch((error) => {
      console.error("Error:", error);
      displayMessage("Failed to run code", true);
    });
}

function setupWebSocket() {
  const socket = new WebSocket("ws://localhost:3000");
  const outputDiv = document.getElementById("output") as HTMLDivElement;

  socket.onopen = function () {
    console.log("WebSocket connection established");
  };

  socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    if (message.type === "stdout" || message.type === "stderr") {
      displayMessage(message.data, false);
    } else if (message.type === "exit") {
      displayMessage(`Process exited with code ${message.code}`, false);
    }
  };

  socket.onclose = function () {
    console.log("WebSocket connection closed");
  };
}

function displayMessage(message: string, isError: boolean) {
  const outputDiv = document.getElementById("output") as HTMLDivElement;
  const messageElement = document.createElement("div");
  messageElement.textContent = message;
  if (isError) {
    messageElement.classList.add("error");
  }
  outputDiv.appendChild(messageElement);
  outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to the bottom
}
