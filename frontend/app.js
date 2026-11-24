// 백엔드(backend/main.py, FastAPI) 연동 계산기
// API 주소는 ?api=http://host:port 로 바꿀 수 있습니다. 기본값: http://127.0.0.1:8000
const API_BASE = (new URLSearchParams(location.search).get("api") || "http://127.0.0.1:8000").replace(/\/+$/, "");

const OP_LABEL = { "+": "+", "-": "−", "*": "×", "/": "÷", "%": "mod", "^": "^" };
const MAX_DIGITS = 16;

const el = {
  display: document.getElementById("display"),
  expr: document.getElementById("expr"),
  value: document.getElementById("value"),
  error: document.getElementById("error"),
  keys: document.getElementById("keys"),
  clearKey: document.getElementById("clear-key"),
  status: document.getElementById("status"),
  statusText: document.getElementById("status-text"),
  historyList: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),
  clearHistory: document.getElementById("clear-history"),
};

const state = {
  current: "0",      // 화면에 입력 중인 숫자 (문자열)
  stored: null,      // num1
  op: null,          // operator
  overwrite: false,  // 다음 숫자 입력 시 current를 새로 시작할지
  busy: false,
};

// ---------- 숫자 표시 ----------
function clean(n) {
  // 부동소수점 오차 정리 (0.1 + 0.2 → 0.3)
  return Number.isFinite(n) ? parseFloat(n.toPrecision(12)) : n;
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return "∞";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e16 || abs < 1e-9)) {
    return n.toExponential(8).replace(/\.?0+e/, "e");
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 10 });
}

function formatInput(str) {
  // 입력 중인 문자열은 소수점/뒤쪽 0을 그대로 보존하면서 천 단위 구분만 추가
  const neg = str.startsWith("-");
  const body = neg ? str.slice(1) : str;
  const [int, frac] = body.split(".");
  const intFmt = Number(int).toLocaleString("en-US");
  return (neg ? "-" : "") + intFmt + (frac !== undefined ? "." + frac : "");
}

// ---------- 렌더링 ----------
function render() {
  const text = state.current.includes("e") ? formatNumber(Number(state.current)) : formatInput(state.current);
  el.value.textContent = text;
  el.value.classList.toggle("long", text.length > 11 && text.length <= 15);
  el.value.classList.toggle("xlong", text.length > 15);

  if (state.stored !== null && state.op) {
    el.expr.textContent = `${formatNumber(state.stored)} ${OP_LABEL[state.op]}`;
  } else if (!el.expr.dataset.keep) {
    el.expr.innerHTML = "&nbsp;";
  }

  document.querySelectorAll(".key.op").forEach((b) => {
    b.classList.toggle("active", state.overwrite && b.dataset.op === state.op);
  });

  el.clearKey.textContent = state.current !== "0" && !state.overwrite ? "C" : "AC";
  el.display.classList.toggle("busy", state.busy);
}

function showError(msg) {
  el.error.textContent = msg;
  el.display.classList.remove("shake");
  void el.display.offsetWidth;
  el.display.classList.add("shake");
}

function clearError() {
  el.error.textContent = "";
}

// ---------- API ----------
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch {
    setStatus(false);
    throw new Error("서버에 연결할 수 없습니다.");
  }
  setStatus(true);

  let data = null;
  try { data = await res.json(); } catch { /* JSON이 아닌 응답 (예: 500) */ }

  if (!res.ok) {
    const detail = data && data.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail)) throw new Error("입력값이 올바르지 않습니다.");
    throw new Error("계산할 수 없는 값입니다.");
  }
  return data;
}

async function calculate(num1, operator, num2) {
  const data = await request("/calculate", {
    method: "POST",
    body: JSON.stringify({ num1, num2, operator }),
  });
  if (data == null || typeof data.result !== "number") {
    throw new Error("계산 결과가 너무 큽니다.");
  }
  return data;
}

function setStatus(online) {
  el.status.dataset.state = online ? "online" : "offline";
  el.statusText.textContent = online ? "서버 연결됨" : "서버 연결 안 됨";
}

async function checkServer() {
  try {
    const res = await fetch(API_BASE + "/");
    setStatus(res.ok);
  } catch {
    setStatus(false);
  }
}

// ---------- 기록 ----------
async function loadHistory() {
  try {
    const items = await request("/history?limit=50");
    renderHistory(items);
  } catch {
    /* 상태 표시로 충분 */
  }
}

function renderHistory(items) {
  el.historyList.innerHTML = "";
  el.historyEmpty.hidden = items.length > 0;
  el.clearHistory.hidden = items.length === 0;

  [...items].reverse().forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "이 결과 사용하기";

    const expr = document.createElement("span");
    expr.className = "h-expr";
    expr.textContent = `${formatNumber(clean(item.num1))} ${OP_LABEL[item.operator] || item.operator} ${formatNumber(clean(item.num2))} =`;

    const result = document.createElement("span");
    result.className = "h-result";
    result.textContent = formatNumber(clean(item.result));

    btn.append(expr, result);
    btn.addEventListener("click", () => {
      if (state.busy) return;
      clearError();
      state.current = String(clean(item.result));
      state.overwrite = true;
      if (state.op === null) state.stored = null;
      delete el.expr.dataset.keep;
      render();
    });

    li.append(btn);
    el.historyList.append(li);
  });
}

async function clearHistory() {
  try {
    await request("/history", { method: "DELETE" });
    renderHistory([]);
  } catch (e) {
    showError(e.message);
  }
}

// ---------- 입력 처리 ----------
function inputDigit(d) {
  clearError();
  delete el.expr.dataset.keep;
  if (state.overwrite || state.current === "0") {
    state.current = d;
    state.overwrite = false;
  } else if (state.current.replace(/[-.]/g, "").length < MAX_DIGITS) {
    state.current += d;
  }
  if (state.current === "-0") state.current = "-" + d;
  render();
}

function inputDot() {
  clearError();
  delete el.expr.dataset.keep;
  if (state.overwrite) {
    state.current = "0.";
    state.overwrite = false;
  } else if (!state.current.includes(".")) {
    state.current += ".";
  }
  render();
}

function backspace() {
  if (state.overwrite) return;
  clearError();
  state.current = state.current.slice(0, -1);
  if (state.current === "" || state.current === "-") state.current = "0";
  render();
}

function negate() {
  clearError();
  if (state.current === "0") return;
  state.current = state.current.startsWith("-") ? state.current.slice(1) : "-" + state.current;
  render();
}

function clearAll() {
  clearError();
  delete el.expr.dataset.keep;
  if (state.current !== "0" && !state.overwrite) {
    state.current = "0"; // C: 현재 입력만 지움
  } else {
    Object.assign(state, { current: "0", stored: null, op: null, overwrite: false });
  }
  render();
}

async function runCalculation() {
  const num1 = state.stored;
  const num2 = Number(state.current);
  const op = state.op;

  state.busy = true;
  setKeysDisabled(true);
  render();
  try {
    const data = await calculate(num1, op, num2);
    loadHistory();
    return { ok: true, data };
  } catch (e) {
    showError(e.message);
    return { ok: false };
  } finally {
    state.busy = false;
    setKeysDisabled(false);
  }
}

async function chooseOperator(op) {
  if (state.busy) return;
  clearError();
  delete el.expr.dataset.keep;

  // 연산자를 연달아 누르면 연산자만 교체
  if (state.stored !== null && state.op && state.overwrite) {
    state.op = op;
    render();
    return;
  }

  // 이어서 계산: 3 + 4 × → 7 ×
  if (state.stored !== null && state.op) {
    const r = await runCalculation();
    if (!r.ok) { render(); return; }
    state.current = String(clean(r.data.result));
  }

  state.stored = Number(state.current);
  state.op = op;
  state.overwrite = true;
  render();
}

async function equals() {
  if (state.busy || state.stored === null || !state.op) return;
  clearError();

  const exprText = `${formatNumber(state.stored)} ${OP_LABEL[state.op]} ${formatNumber(Number(state.current))} =`;
  const r = await runCalculation();
  if (!r.ok) { render(); return; }

  state.current = String(clean(r.data.result));
  state.stored = null;
  state.op = null;
  state.overwrite = true;
  el.expr.textContent = exprText;
  el.expr.dataset.keep = "1";
  render();
}

function setKeysDisabled(disabled) {
  el.keys.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
}

// ---------- 이벤트 ----------
el.keys.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.digit !== undefined) return inputDigit(btn.dataset.digit);
  if (btn.dataset.op) return chooseOperator(btn.dataset.op);
  switch (btn.dataset.action) {
    case "dot": return inputDot();
    case "back": return backspace();
    case "negate": return negate();
    case "clear": return clearAll();
    case "equals": return equals();
  }
});

const KEY_MAP = {
  "+": '[data-op="+"]', "-": '[data-op="-"]', "*": '[data-op="*"]', "/": '[data-op="/"]',
  "%": '[data-op="%"]', "^": '[data-op="^"]',
  ".": '[data-action="dot"]', ",": '[data-action="dot"]',
  Enter: '[data-action="equals"]', "=": '[data-action="equals"]',
  Backspace: '[data-action="back"]', Escape: '[data-action="clear"]', Delete: '[data-action="clear"]',
};

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const selector = /^[0-9]$/.test(e.key) ? `[data-digit="${e.key}"]` : KEY_MAP[e.key];
  if (!selector) return;
  const btn = el.keys.querySelector(selector);
  if (!btn) return;
  e.preventDefault();
  btn.classList.add("pressed");
  setTimeout(() => btn.classList.remove("pressed"), 100);
  btn.click();
});

el.clearHistory.addEventListener("click", clearHistory);

// ---------- 시작 ----------
render();
checkServer().then(loadHistory);
setInterval(checkServer, 15000);
