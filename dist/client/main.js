"use strict";
document.addEventListener("DOMContentLoaded", () => {
    console.log("Hello, TypeScript!");
    const codeTextarea = document.getElementById("code");
    const startShellButton = document.getElementById("start-shell");
    const runButton = document.getElementById("run");
    const outputDiv = document.getElementById("output");
    const containerNameInput = document.getElementById("container-name");
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
function startShell(containerName) {
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
        if (data.error)
            displayMessage(data.error, true);
    })
        .catch((error) => {
        console.error("Error:", error);
        displayMessage("Failed to start shell", true);
    });
}
function sendCodeToServer(code) {
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
        if (data.error)
            displayMessage(data.error, true);
    })
        .catch((error) => {
        console.error("Error:", error);
        displayMessage("Failed to run code", true);
    });
}
function setupWebSocket() {
    const socket = new WebSocket("ws://localhost:3000");
    const outputDiv = document.getElementById("output");
    socket.onopen = function () {
        console.log("WebSocket connection established");
    };
    socket.onmessage = function (event) {
        const message = JSON.parse(event.data);
        if (message.type === "stdout" || message.type === "stderr") {
            displayMessage(message.data, false);
        }
        else if (message.type === "exit") {
            displayMessage(`Process exited with code ${message.code}`, false);
        }
    };
    socket.onclose = function () {
        console.log("WebSocket connection closed");
    };
}
function displayMessage(message, isError) {
    const outputDiv = document.getElementById("output");
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    if (isError) {
        messageElement.classList.add("error");
    }
    outputDiv.appendChild(messageElement);
    outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to the bottom
}
const snippetsContainer = document.getElementById("snippets-container");
if (snippetsContainer) {
    fetch("snippets.json")
        .then(response => response.json())
        .then((data) => {
        data.forEach(snippet => {
            addSnippetToDOM(snippet);
        });
    })
        .catch(error => console.error("Error fetching snippets:", error));
}
const form = document.getElementById("add-snippet-form");
form.addEventListener("submit", function (event) {
    event.preventDefault();
    const titleInput = document.getElementById("title");
    const codeInput = document.getElementById("snippet");
    const title = titleInput.value;
    const code = codeInput.value;
    const newSnippet = { title, code };
    // Add the new snippet to the DOM
    addSnippetToDOM(newSnippet);
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
        return response.text();
    }).then(data => {
        console.log('Snippet added:', data);
    }).catch(error => {
        console.error('Error adding snippet:', error);
    });
    // Clear the form
    form.reset();
});
function addSnippetToDOM(snippet) {
    const snippetDiv = document.createElement("div");
    snippetDiv.classList.add("code-snippet");
    const title = document.createElement("h3");
    title.textContent = snippet.title;
    const pre = document.createElement("pre");
    const code = document.createElement("snippet");
    code.textContent = snippet.code;
    pre.appendChild(code);
    snippetDiv.appendChild(title);
    snippetDiv.appendChild(pre);
    if (snippetsContainer) {
        snippetsContainer.appendChild(snippetDiv);
    }
}
