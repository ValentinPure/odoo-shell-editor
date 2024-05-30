document.addEventListener("DOMContentLoaded", () => {
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


  const snippetsContainer = document.getElementById("snippets-container");
interface Snippet {
  title: string;
  code: string;
}

if (snippetsContainer) {
  fetch("snippets.json")
    .then(response => response.json())
    .then((data: Snippet []) => {
      data.forEach(snippet => {
        addSnippetToDOM(snippet);
      });
    })
    .catch(error => console.error("Error fetching snippets:", error));
}

const form = document.getElementById("add-snippet-form") as HTMLFormElement;
form.addEventListener("submit", function(event: Event) {
  event.preventDefault();

  const titleInput = document.getElementById("title") as HTMLInputElement;
  const codeInput = document.getElementById("snippet") as HTMLTextAreaElement;

  const title = titleInput.value;
  const code = codeInput.value;

  const newSnippet: Snippet = { title, code };


  fetch('/snippets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newSnippet)
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    console.log(data)
    if(data.status)
      displayMessage(data.message)
  }).catch(error => {
    console.log(error)
    displayMessage(error.message);
  });
  
  // Add the new snippet to the DOM
  addSnippetToDOM(newSnippet);
  
 

  // Clear the form
  form.reset();
});

function addSnippetToDOM(snippet: Snippet): void {
  const snippetDiv = document.createElement("div");
  snippetDiv.classList.add("code-snippet");

  const title = document.createElement("h3");
  title.textContent = snippet.title;

  const pre = document.createElement("pre");
  const code = document.createElement("snippet");
  code.textContent = snippet.code;
  pre.appendChild(code);

  const addButton = document.createElement("button");
  addButton.textContent = "Add to Code";
  addButton.classList.add("add-to-code-button");
  addButton.addEventListener("click", () => {
    editor.setValue (editor.getValue() + "\n"+snippet.code + "\n");

  });

  snippetDiv.appendChild(title);
  snippetDiv.appendChild(pre);
  snippetDiv.appendChild(addButton);

  if (snippetsContainer) {
    snippetsContainer.appendChild(snippetDiv);
  }
}

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

function displayMessage(message: string, isError: boolean = false) {
  const outputDiv = document.getElementById("output") as HTMLDivElement;
  const messageElement = document.createElement("div");
  messageElement.textContent = message;
  if (isError) {
    messageElement.classList.add("error");
  }
  outputDiv.appendChild(messageElement);
  outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to the bottom
}

