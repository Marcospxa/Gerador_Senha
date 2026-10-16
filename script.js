const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const HISTORY_KEY = "gerador-senhas:historico";
const MAX_HISTORY = 5;

const els = {
  passwordField: document.getElementById("passwordField"),
  copyBtn: document.getElementById("copyBtn"),
  copyFeedback: document.getElementById("copyFeedback"),
  strengthBar: document.getElementById("strengthBar"),
  strengthLabel: document.getElementById("strengthLabel"),
  lengthRange: document.getElementById("lengthRange"),
  lengthValue: document.getElementById("lengthValue"),
  generateBtn: document.getElementById("generateBtn"),
  historyList: document.getElementById("historyList"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  toggles: {
    uppercase: document.getElementById("uppercase"),
    lowercase: document.getElementById("lowercase"),
    numbers: document.getElementById("numbers"),
    symbols: document.getElementById("symbols"),
  },
};

function getActiveCharsets() {
  return Object.keys(els.toggles).filter((key) => els.toggles[key].checked);
}

function generatePassword(length, activeKeys) {
  if (activeKeys.length === 0) return "";

  // Garante ao menos um caractere de cada tipo selecionado.
  const guaranteed = activeKeys.map((key) => randomChar(CHARSETS[key]));
  const pool = activeKeys.map((key) => CHARSETS[key]).join("");

  const rest = [];
  for (let i = guaranteed.length; i < length; i++) {
    rest.push(randomChar(pool));
  }

  return shuffle([...guaranteed, ...rest]).join("");
}

function randomChar(charset) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return charset[array[0] % charset.length];
}

function shuffle(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const j = rand[0] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function calcStrength(password, activeKeys) {
  if (!password) return { score: 0, label: "—", color: "var(--weak)" };

  const variety = activeKeys.length;
  const length = password.length;

  // pontuação simples: comprimento + diversidade de conjuntos de caracteres
  let score = 0;
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;
  if (variety >= 4) score += 1;

  if (score <= 2) return { score, label: "Fraca", color: "var(--weak)", pct: 33 };
  if (score <= 4) return { score, label: "Média", color: "var(--medium)", pct: 66 };
  return { score, label: "Forte", color: "var(--strong)", pct: 100 };
}

function updateStrength(password, activeKeys) {
  const result = calcStrength(password, activeKeys);
  els.strengthBar.style.width = `${result.pct || 0}%`;
  els.strengthBar.style.backgroundColor = result.color;
  els.strengthLabel.textContent = `Força: ${result.label}`;
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function addToHistory(password) {
  const list = loadHistory();
  list.unshift(password);
  saveHistory(list.slice(0, MAX_HISTORY));
  renderHistory();
}

function renderHistory() {
  const list = loadHistory();
  els.historyList.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nenhuma senha gerada ainda.";
    els.historyList.appendChild(li);
    return;
  }

  list.forEach((pwd) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = pwd;

    const btn = document.createElement("button");
    btn.textContent = "📋";
    btn.title = "Copiar";
    btn.addEventListener("click", () => copyText(pwd, btn));

    li.appendChild(span);
    li.appendChild(btn);
    els.historyList.appendChild(li);
  });
}

async function copyText(text, feedbackTarget) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    flashCopyFeedback(feedbackTarget);
  } catch {
    // fallback para navegadores sem permissão de clipboard
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    flashCopyFeedback(feedbackTarget);
  }
}

function flashCopyFeedback(target) {
  if (target === els.copyBtn) {
    els.copyFeedback.textContent = "Copiado!";
    els.copyBtn.classList.add("copied");
    setTimeout(() => {
      els.copyFeedback.textContent = "";
      els.copyBtn.classList.remove("copied");
    }, 1500);
  } else if (target) {
    const original = target.textContent;
    target.textContent = "✅";
    setTimeout(() => (target.textContent = original), 1200);
  }
}

function handleGenerate() {
  const activeKeys = getActiveCharsets();
  const length = Number(els.lengthRange.value);

  if (activeKeys.length === 0) {
    els.passwordField.value = "";
    els.strengthLabel.textContent = "Selecione ao menos um tipo de caractere";
    els.strengthBar.style.width = "0%";
    return;
  }

  const password = generatePassword(length, activeKeys);
  els.passwordField.value = password;
  updateStrength(password, activeKeys);
  addToHistory(password);
}

els.lengthRange.addEventListener("input", () => {
  els.lengthValue.textContent = els.lengthRange.value;
});

els.generateBtn.addEventListener("click", handleGenerate);
els.copyBtn.addEventListener("click", () => copyText(els.passwordField.value, els.copyBtn));
els.clearHistoryBtn.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

// Estado inicial
renderHistory();
handleGenerate();
