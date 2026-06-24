const titleTypewriter = document.querySelector("[data-typewriter-title]");
const definitionTypewriter = document.querySelector("[data-typewriter]");
const commandTypewriters = document.querySelectorAll("[data-command-typewriter]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cursor = document.createElement("span");
cursor.className = "typing-cursor";
cursor.setAttribute("aria-hidden", "true");

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const collectTextNodes = (root, includeWhitespace = false) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue;

    if (text.trim() || (includeWhitespace && text)) {
      textNodes.push({ node, text });
      node.nodeValue = "";
    }
  }

  return textNodes;
};

const moveCursorTo = (node) => {
  node.parentNode.insertBefore(cursor, node.nextSibling);
};

const typeTextNodes = async (root, textNodes, options = {}) => {
  root.classList.add("is-typing");

  for (const item of textNodes) {
    moveCursorTo(item.node);

    for (const char of item.text) {
      item.node.nodeValue += char;
      await sleep(char === " " ? 12 : options.speed || 20);
    }

    await sleep(options.pause || 90);
  }

  root.classList.remove("is-typing");
};

const keepCursorAtEnd = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let lastTextNode = null;

  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim()) {
      lastTextNode = walker.currentNode;
    }
  }

  if (lastTextNode) {
    moveCursorTo(lastTextNode);
  }
};

if (titleTypewriter && definitionTypewriter) {
  if (reduceMotion) {
    keepCursorAtEnd(definitionTypewriter);
  } else {
    const titleTextNodes = collectTextNodes(titleTypewriter, true);
    const definitionTextNodes = collectTextNodes(definitionTypewriter);

    (async () => {
      await typeTextNodes(titleTypewriter, titleTextNodes, {
        speed: 34,
        pause: 40,
      });
      await sleep(360);
      await typeTextNodes(definitionTypewriter, definitionTextNodes, {
        speed: 18,
        pause: 80,
      });
      keepCursorAtEnd(definitionTypewriter);
    })();
  }
}

const revealCommandPage = (page) => {
  page?.classList.remove("is-command-pending");
  page?.classList.add("is-command-ready");
  cursor.remove();
};

commandTypewriters.forEach((commandLine) => {
  const commandPage = commandLine.closest("[data-command-page]");

  if (reduceMotion) {
    revealCommandPage(commandPage);
    return;
  }

  const commandTextNodes = collectTextNodes(commandLine, true);

  (async () => {
    await typeTextNodes(commandLine, commandTextNodes, {
      speed: 28,
      pause: 0,
    });
    cursor.remove();
    await sleep(140);
    revealCommandPage(commandPage);
  })();
});

const previewCards = document.querySelectorAll("[data-preview-card]");

const closePreviewDialog = (dialog) => {
  if (dialog?.open) {
    dialog.close();
  }
};

const openPreviewDialog = (card) => {
  const dialogId = card.getAttribute("aria-controls");
  const dialog = dialogId ? document.getElementById(dialogId) : null;
  const dialogContent = dialog?.querySelector("[data-preview-content]");
  const dialogClose = dialog?.querySelector("[data-preview-close]");

  if (!dialog || !dialogContent) {
    return;
  }

  const cardPreview = card.cloneNode(true);
  cardPreview.removeAttribute("tabindex");
  cardPreview.removeAttribute("role");
  cardPreview.removeAttribute("aria-haspopup");
  cardPreview.removeAttribute("aria-controls");
  cardPreview.removeAttribute("data-preview-card");

  dialogContent.replaceChildren(cardPreview);
  dialog.showModal();
  dialogClose?.focus();
};

previewCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) {
      return;
    }

    openPreviewDialog(card);
  });

  card.addEventListener("keydown", (event) => {
    if (event.target.closest("a, button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreviewDialog(card);
    }
  });
});

document.querySelectorAll("[data-preview-close]").forEach((button) => {
  button.addEventListener("click", () => closePreviewDialog(button.closest("dialog")));
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closePreviewDialog(dialog);
    }
  });
});
