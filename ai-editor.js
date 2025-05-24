import React, { useState, useRef, useEffect } from "react";

/**
 * AIWebBuilder v7 – **Persistence**
 *
 * Features recap
 * --------------
 * ✔ Shadow‑scoped elements (no style bleed)
 * ✔ Drag‑and‑drop image upload
 * ✔ Inline content‑editable + Markdown source toggle
 * ✔ AI chat for adding/changing/deleting elements
 * ➕ **NEW:** Autosave + Download / Upload
 *
 * Persistence options
 * -------------------
 * 1. **LocalStorage autosave** – every change serialises the `generatedHTML`
 *    array as JSON and writes to `localStorage['ai-web-builder']`.
 * 2. **Download** – click the 💾 icon to get a full standalone `.html` file.
 * 3. **Load** – click the 📂 icon and select a previously exported HTML or a
 *    JSON file; the builder parses it and restores the canvas.
 *
 * NOTE: for JSON import/export we keep just the array of HTML strings. For the
 *       standalone HTML download we embed each shadow element inside a custom
 *       `<shadow-element>` web component so it renders identically offline.
 */

function AIEditor() {
  const [state, setState] = React.useState(null);
  /* ────────────────────────── State */
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [generatedHTML, setGeneratedHTML] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("ai-web-builder") || "null",
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [selectedIndex, setSelectedIndex] = useState(null);

  /* ────────────────────────── Autosave */
  useEffect(() => {
    localStorage.setItem("ai-web-builder", JSON.stringify(generatedHTML));
  }, [generatedHTML]);

  /* ────────────────────────── Markdown helpers */
  const markdownToHtml = (md) =>
    md
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

  const htmlToMarkdown = (html) =>
    html
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(
        /<strong>(.*?)<\/strong>|<b>(.*?)<\/b>/gi,
        (_, a, b) => `**${a || b}**`,
      )
      .replace(/<em>(.*?)<\/em>|<i>(.*?)<\/i>/gi, (_, a, b) => `*${a || b}*`)
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<[^>]+>/g, "");

  /* ────────────────────────── ShadowElement component */
  function ShadowElement({ html, selected, onClick, onChange }) {
    const hostRef = useRef(null);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });

      // add Tailwind once
      if (
        !shadow.querySelector("style[data-tailwind]") &&
        !shadow.querySelector("link[data-tailwind]")
      ) {
        const s = document.createElement("style");
        s.setAttribute("data-tailwind", "");
        s.textContent = `@import url('https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/dist/tailwind.min.css');`;
        shadow.appendChild(s);
      }

      // content wrapper
      const content =
        shadow.querySelector("#content") ||
        (() => {
          const div = document.createElement("div");
          div.id = "content";
          shadow.appendChild(div);
          return div;
        })();

      content.innerHTML = html;

      setupDropzones(content);
      setupMarkdownEditing(content, onChange);
      setupInlineEditing(content, onChange);
    }, [html, onChange]);

    return (
      <div
        ref={hostRef}
        onClick={onClick}
        className={`cursor-pointer transition ring-4 ring-offset-2 ${selected ? "ring-blue-400" : "ring-transparent"}`}
        title="Double-click to edit"
      />
    );
  }

  /* ────────────────────────── Dropzone helper */
  function setupDropzones(root) {
    root.querySelectorAll("[data-dropzone]").forEach((zone) => {
      if (zone.__dzBound) return;
      zone.__dzBound = true;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.hidden = true;
      zone.appendChild(input);
      const show = (file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        zone.innerHTML = `<img src="${url}" class="max-w-full h-auto rounded-lg shadow"/>`;
      };
      zone.addEventListener("click", () => input.click());
      input.addEventListener("change", (e) => show(e.target.files[0]));
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("ring-2", "ring-blue-400");
      });
      zone.addEventListener("dragleave", () =>
        zone.classList.remove("ring-2", "ring-blue-400"),
      );
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("ring-2", "ring-blue-400");
        show(e.dataTransfer.files[0]);
      });
    });
  }

  /* ────────────────────────── Markdown editing helper */
  function setupMarkdownEditing(root, onChange) {
    if (root.__mdBound) return;
    root.__mdBound = true;
    root.addEventListener("dblclick", (e) => {
      const el = e.target.closest("[data-md]");
      if (!el) return;
      const current = decodeURIComponent(el.getAttribute("data-md"));
      const updated = prompt("Edit Markdown", current);
      if (updated === null) return;
      el.setAttribute("data-md", encodeURIComponent(updated));
      el.innerHTML = markdownToHtml(updated);
      onChange(root.innerHTML);
      e.stopPropagation();
    });
  }

  /* ────────────────────────── Inline editing helper */
  function setupInlineEditing(root, onChange) {
    if (root.__inlineBound) return;
    root.__inlineBound = true;
    root.addEventListener("dblclick", (e) => {
      if (e.target.closest("[data-md]")) return; // handled above
      const el = e.target.closest("*:not([data-dropzone])");
      if (!el) return;
      el.setAttribute("contenteditable", "true");
      el.focus();
      document.execCommand("selectAll", false, null);
      const blur = () => {
        el.removeEventListener("blur", blur);
        el.removeAttribute("contenteditable");
        el.setAttribute(
          "data-md",
          encodeURIComponent(htmlToMarkdown(el.innerHTML)),
        );
        onChange(root.innerHTML);
      };
      el.addEventListener("blur", blur);
      e.stopPropagation();
    });
  }

  /* ────────────────────────── Mock LLM call */
  async function generateHTMLElement({ prompt, elementHtml }) {
    if (/delete|remove/i.test(prompt)) return "";
    const colour = prompt.match(
      /color to (red|green|blue|yellow|purple)/i,
    )?.[1];
    if (colour && elementHtml)
      return elementHtml.replace(/bg-[^\s"']+/g, `bg-${colour}-600`);

    if (/image/i.test(prompt)) {
      return `<div data-dropzone class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-400 p-6 rounded-xl text-center text-gray-500 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition"><span class="text-sm">Drop or click to upload image</span></div>`;
    }
    if (/button/i.test(prompt)) {
      const label = prompt.match(/"([^"]+)"/)?.[1] || "Click";
      return `<button data-md="${encodeURIComponent(label)}" class="px-4 py-2 bg-purple-600 text-white rounded-full shadow">${label}</button>`;
    }

    const md = prompt;
    const html = markdownToHtml(md);
    return `<p data-md="${encodeURIComponent(md)}" class="leading-relaxed">${html}</p>`;
  }

  /* ────────────────────────── Download / Upload handlers */
  function downloadHtml() {
    // Wrap each element in custom web component so Shadow DOM works offline
    const doc = `<!DOCTYPE html><html><head><meta charset=utf-8><title>Export</title><script>
      class ShadowElement extends HTMLElement { connectedCallback(){ const shadow=this.attachShadow({mode:'open'}); const content=document.createElement('div'); content.innerHTML=this.getAttribute('markup'); shadow.appendChild(content); }}
      customElements.define('shadow-element', ShadowElement);
    </script></head><body style="font-family:sans-serif">${generatedHTML.map((m) => `<shadow-element markup="${m.replace(/"/g, "&quot;")}"></shadow-element>`).join("")}</body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ai-web-builder-export.html";
    link.click();
  }

  function loadFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (file.name.endsWith(".json")) {
          const arr = JSON.parse(reader.result);
          if (Array.isArray(arr)) setGeneratedHTML(arr);
        } else {
          // naive parse html export
          const div = document.createElement("div");
          div.innerHTML = reader.result;
          const nodes = [...div.querySelectorAll("shadow-element")];
          setGeneratedHTML(nodes.map((n) => n.getAttribute("markup")));
        }
      } catch {
        alert("Could not load this file");
      }
    };
    reader.readAsText(file);
  }

  /* ────────────────────────── React helpers */
  function handleElementEdit(i, newHtml) {
    setGeneratedHTML((prev) => {
      const next = [...prev];
      next[i] = newHtml;
      return next;
    });
  }
  async function handleGenerate(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", text: input }]);
    const context =
      selectedIndex !== null ? generatedHTML[selectedIndex] : null;
    const html = await generateHTMLElement({
      prompt: input,
      elementHtml: context,
    });
    setGeneratedHTML((prev) => {
      const next = [...prev];
      if (selectedIndex !== null) {
        if (html) next[selectedIndex] = html;
        else {
          next.splice(selectedIndex, 1);
          setSelectedIndex(null);
        }
      } else if (html) next.push(html);
      return next;
    });
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: html ? "Updated element." : "Deleted element.",
      },
    ]);
    setInput("");
  }
  function handleSelect(i) {
    setSelectedIndex(i === selectedIndex ? null : i);
  }

  /* ────────────────────────── UI */
  return (
    <div className="relative min-h-screen bg-gray-50 font-sans">
      {/* Toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-3 z-40">
        <button
          onClick={downloadHtml}
          className="p-2 bg-green-600 text-white rounded-full shadow hover:bg-green-700"
          title="Download"
        >
          <span className="text-lg">💾</span>
        </button>
        <label
          className="p-2 bg-yellow-500 text-white rounded-full shadow cursor-pointer hover:bg-yellow-600"
          title="Load"
        >
          <span className="text-lg">📂</span>
          <input
            type="file"
            accept=".json,.html"
            onChange={loadFromFile}
            hidden
          />
        </label>
      </div>

      <main id="canvas" className="p-6 pt-20 grid gap-4">
        {generatedHTML.map((html, i) => (
          <ShadowElement
            key={i}
            html={html}
            selected={selectedIndex === i}
            onClick={() => handleSelect(i)}
            onChange={(newHtml) => handleElementEdit(i, newHtml)}
          />
        ))}
        {!generatedHTML.length && (
          <p className="text-center text-gray-400">
            💬 Click the chat button and describe what you’d like to add.
          </p>
        )}
      </main>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        title="AI Chat"
        className="fixed bottom-6 right-6 z-20 rounded-full bg-blue-600 text-white w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        💬
      </button>

      {chatOpen && (
        <div className="fixed bottom-0 right-0 w-full sm:w-96 h-2/3 sm:h-4/5 bg-white shadow-2xl rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden animate-slide-up z-30">
          <header className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold">AI Assistant</h2>
            <button onClick={() => setChatOpen(false)} className="text-2xl">
              ×
            </button>
          </header>
          {selectedIndex !== null && (
            <div className="bg-blue-50 text-blue-900 text-xs px-4 py-2 border-b">
              Editing element #{selectedIndex + 1}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleGenerate} className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedIndex !== null
                  ? "Describe the change…"
                  : "Describe the element…"
              }
              className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-blue-600 text-white px-4 rounded-xl disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("ai-editor-root")).render(
  <AIEditor />,
);
