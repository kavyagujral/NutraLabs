// ─────────────────────────────────────────────
//  NutraLab App  |  app.js  v8
// ─────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8000";

let token = localStorage.getItem("jwt_token");

// ── DOM refs ──────────────────────────────────
const topNavbar       = document.getElementById("top-navbar");
const guestHeader     = document.getElementById("guest-header");
const logoutBtn       = document.getElementById("logout-btn");
const tabLogin        = document.getElementById("tab-login");
const tabSignup       = document.getElementById("tab-signup");
const loginForm       = document.getElementById("login-form");
const signupForm      = document.getElementById("signup-form");
const planResultsArea = document.getElementById("plan-results-area");
const recipeResultsArea = document.getElementById("recipe-results-area");
const userNameDisplay = document.getElementById("user-profile-name");

// ── Navigation ────────────────────────────────
const navLinks  = document.querySelectorAll(".nav-link");
const pageViews = document.querySelectorAll(".page-view");

function showPage(targetId) {
  pageViews.forEach(p => { p.classList.add("hidden"); p.classList.remove("active-view"); });
  navLinks.forEach(n => n.classList.remove("active"));

  const view = document.getElementById(targetId);
  if (view) { view.classList.remove("hidden"); view.classList.add("active-view"); }

  const btn = document.querySelector(`[data-target="${targetId}"]`);
  if (btn) btn.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(link => {
  link.addEventListener("click", e => showPage(e.currentTarget.dataset.target));
});

// ── Auth flow ─────────────────────────────────
function showAuth() {
  topNavbar.classList.add("hidden");
  guestHeader.classList.add("hidden");
  showPage("home-page");
}

function enterApp() {
  topNavbar.classList.remove("hidden");
  guestHeader.classList.add("hidden");
  showPage("plan-page");
  preloadUserProfile();
}

function init() {
  token ? enterApp() : showAuth();
}

// Home CTA
document.getElementById("btn-start-auth")?.addEventListener("click", () => showPage("auth-section"));

// Auth tabs
tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active"); tabSignup.classList.remove("active");
  loginForm.classList.remove("hidden"); signupForm.classList.add("hidden");
});
tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active"); tabLogin.classList.remove("active");
  signupForm.classList.remove("hidden"); loginForm.classList.add("hidden");
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("jwt_token");
  token = null;
  planResultsArea.innerHTML = "";
  recipeResultsArea.innerHTML = "";
  userNameDisplay.innerText = "Guest";
  showAuth();
});

// ── Loading helpers ───────────────────────────
function setLoading(btn, isLoading, originalText) {
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span>`;
  } else {
    btn.disabled = false;
    btn.textContent = originalText || btn.dataset.original;
  }
}

function shimmerBlock(lines = 3) {
  return Array.from({ length: lines }, (_, i) =>
    `<div class="shimmer" style="height:${i === 0 ? 24 : 16}px; width:${i === 0 ? 60 : 80 + Math.random() * 20 | 0}%; margin-bottom:10px;"></div>`
  ).join("");
}

// ── Signup ────────────────────────────────────
function formToJSON(elements) {
  const data = {};
  for (let el of elements) {
    if (el.id && el.value) {
      const key = el.id.split("-")[1];
      if (key === "height")  data["height_cm"] = Number(el.value);
      else if (key === "weight") data["weight_kg"] = Number(el.value);
      else if (["age"].includes(key)) data[key] = Number(el.value);
      else data[key] = el.value;
    }
  }
  return data;
}

signupForm.addEventListener("submit", async e => {
  e.preventDefault();
  const errEl  = document.getElementById("signup-error");
  const submitBtn = document.getElementById("btn-signup-submit");
  errEl.textContent = "";
  setLoading(submitBtn, true);

  try {
    const payload = formToJSON(signupForm.elements);
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) { let m = data.detail; if (typeof m === "object") m = JSON.stringify(m); throw new Error(m || "Signup failed"); }
    await loginUser(payload.email, payload.password);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    setLoading(submitBtn, false, "Sign Up & Analyze 🚀");
  }
});

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("btn-login-submit");
  errEl.textContent = "";
  setLoading(submitBtn, true);

  try {
    await loginUser(
      document.getElementById("login-email").value,
      document.getElementById("login-password").value
    );
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    setLoading(submitBtn, false, "Log In");
  }
});

async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) { let m = data.detail; if (typeof m === "object") m = JSON.stringify(m); throw new Error(m || "Login failed"); }

  token = data.access_token;
  localStorage.setItem("jwt_token", token);
  enterApp();
}

// ── Diet Plan Post-Processor ──────────────────
const MEAL_ICONS = { breakfast:'☀️', lunch:'🌤️', snack:'🍎', dinner:'🌙' };

function getMealIcon(heading) {
  const key = heading.toLowerCase();
  for (const [k, v] of Object.entries(MEAL_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '🍽️';
}

function enrichFoodItem(li) {
  // "Whole wheat toast (30g) - Calories: 120 kcal | Protein: 3g | Carbs: 24g | Fat: 2g"
  const text = li.innerHTML;
  const enhanced = text
    .replace(/Calories:\s*([\d.]+\s*kcal)/gi, '<span class="mp mp-cal">Cal $1</span>')
    .replace(/Protein:\s*([\d.]+\s*g)/gi,   '<span class="mp mp-pro">Protein $1</span>')
    .replace(/Carbs:\s*([\d.]+\s*g)/gi,     '<span class="mp mp-carb">Carbs $1</span>')
    .replace(/Fat:\s*([\d.]+\s*g)/gi,       '<span class="mp mp-fat">Fat $1</span>')
    .replace(/Fiber:\s*([\d.]+\s*g)/gi,     '<span class="mp mp-fib">Fiber $1</span>');
  li.innerHTML = enhanced;
}

function renderDietPlan(rawHtml) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(rawHtml, 'text/html');
  const nodes  = Array.from(doc.body.childNodes);

  let out = '';
  let inMeal = false;
  let inSummary = false;
  let i = 0;

  // Macro pipe pattern: "Calories: X kcal | Protein: Xg" — indicates a food item line
  const FOOD_ITEM_RE = /calories:\s*[\d.]+\s*kcal/i;
  // Meal total patterns: "Meal Total:", "Total Breakfast:", "Breakfast Total:", "Total Snack:" etc.
  const MEAL_TOTAL_RE = /^(meal total|total (breakfast|lunch|snack|dinner|day)|(\w+ )?(breakfast|lunch|snack|dinner) total)/i;

  function applyMacroPills(text) {
    return text
      .replace(/Calories:\s*([\d.]+\s*kcal)/gi, '<span class="mp mp-cal">Cal $1</span>')
      .replace(/Protein:\s*([\d.]+\s*g)/gi,      '<span class="mp mp-pro">Protein $1</span>')
      .replace(/Carbs:\s*([\d.]+\s*g)/gi,         '<span class="mp mp-carb">Carbs $1</span>')
      .replace(/Fat:\s*([\d.]+\s*g)/gi,            '<span class="mp mp-fat">Fat $1</span>')
      .replace(/Fiber:\s*([\d.]+\s*g)/gi,          '<span class="mp mp-fib">Fiber $1</span>');
  }

  // Split a paragraph that contains multiple food items separated by food name patterns
  function splitFoodParagraph(text) {
    // Split on pattern: something that looks like a new food item start after a macro value
    // e.g. "...Fat: 0.1g Fresh Fruits..." → split before "Fresh Fruits"
    // We detect a new item as: ends with a macro value, then a capital letter word (food name)
    const parts = text.split(/(?<=\d\s*g)\s+(?=[A-Z])/);
    return parts.filter(p => p.trim().length > 3);
  }

  while (i < nodes.length) {
    const node = nodes[i];
    const tag  = node.tagName?.toLowerCase() || '';
    const text = node.textContent?.trim() || '';

    const isHeadingTag   = /^h[1-3]$/.test(tag);
    const isBoldOnlyPara = tag === 'p' && node.children.length === 1
                           && node.children[0].tagName === 'STRONG'
                           && node.textContent.trim() === node.children[0].textContent.trim();

    const isMealHeading    = (isHeadingTag || isBoldOnlyPara) && /breakfast|lunch|snack|dinner/i.test(text);
    const isSummaryHeading = (isHeadingTag || isBoldOnlyPara) && /daily macro summary/i.test(text);
    const isMealTotal      = tag === 'p' && MEAL_TOTAL_RE.test(text);

    if (isMealHeading) {
      if (inMeal)    out += `</div></div>`;
      if (inSummary) out += `</div></div>`;
      inMeal    = true;
      inSummary = false;
      const icon = getMealIcon(text);
      out += `
        <div class="ai-meal-card">
          <div class="ai-meal-header">
            <span class="ai-meal-icon">${icon}</span>
            <span class="ai-meal-title">${text}</span>
          </div>
          <div class="ai-meal-body">`;

    } else if (isSummaryHeading) {
      if (inMeal) { out += `</div></div>`; inMeal = false; }
      inSummary = true;
      out += `<div class="ai-day-summary"><div class="ai-summary-header">📊 Daily Macro Summary</div><div class="ai-summary-body">`;

    } else if (isMealTotal) {
      // Remove the label prefix, keep only the macro numbers
      const barText = applyMacroPills(
        text.replace(MEAL_TOTAL_RE, '').replace(/^[\s:\-|]+/, '')
      );
      out += `<div class="ai-meal-total"><strong>Meal Total</strong> ${barText}</div>`;

    } else if (tag === 'ul' && inMeal) {
      // Standard list — enrich each item
      const liItems = Array.from(node.querySelectorAll('li'));
      liItems.forEach(enrichFoodItem);
      out += node.outerHTML;

    } else if (tag === 'p' && inMeal && FOOD_ITEM_RE.test(text)) {
      // Paragraph containing one or more food items (LLM didn't use a list)
      const parts = splitFoodParagraph(text);
      out += `<ul>`;
      parts.forEach(part => {
        out += `<li>${applyMacroPills(part.trim())}</li>`;
      });
      out += `</ul>`;

    } else if (tag === 'ul' && inSummary) {
      const liItems = Array.from(node.querySelectorAll('li'));
      out += `<div class="ai-summary-tiles">`;
      liItems.forEach(li => {
        const t = li.textContent;
        if (/calorie/i.test(t))      out += `<div class="ai-tile ai-tile-cal"><strong>${t.replace(/Calories?:?\s*/i,'')}</strong><small>Calories</small></div>`;
        else if (/protein/i.test(t)) out += `<div class="ai-tile ai-tile-pro"><strong>${t.replace(/Protein:?\s*/i,'')}</strong><small>Protein</small></div>`;
        else if (/carb/i.test(t))    out += `<div class="ai-tile ai-tile-carb"><strong>${t.replace(/Carbo?h?y?d?r?a?t?e?s?:?\s*/i,'')}</strong><small>Carbs</small></div>`;
        else if (/fat/i.test(t))     out += `<div class="ai-tile ai-tile-fat"><strong>${t.replace(/Fat:?\s*/i,'')}</strong><small>Fat</small></div>`;
        else if (/fiber/i.test(t))   out += `<div class="ai-tile ai-tile-fib"><strong>${t.replace(/Fiber(\s*Target)?:?\s*/i,'')}</strong><small>Fiber</small></div>`;
        else out += `<div class="ai-tile"><strong>${t}</strong></div>`;
      });
      out += `</div>`;

    } else if (node.outerHTML) {
      out += node.outerHTML;
    }

    i++;
  }

  if (inMeal)    out += `</div></div>`;
  if (inSummary) out += `</div></div>`;
  return out;
}

// ── Daily Plan ────────────────────────────────
document.getElementById("btn-generate-day").addEventListener("click", async () => {
  const goal         = document.getElementById("daily-goal").value;
  const dietPref     = document.getElementById("daily-diet").value;
  const includeFoods = document.getElementById("include-foods").value.trim();
  const excludeFoods = document.getElementById("exclude-foods").value.trim();
  const btn          = document.getElementById("btn-generate-day");

  setLoading(btn, true);
  planResultsArea.innerHTML = `
    <div class="chat-output">
      <div class="typing-dots"><span></span><span></span><span></span></div>
      <p style="color:var(--muted); font-size:0.85rem; margin-top:0.5rem;">AI is generating your personalised diet plan…</p>
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/calculate-diet`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ goal, diet_preference: dietPref, include_foods: includeFoods, exclude_foods: excludeFoods })
    });
    if (res.status === 401) return logoutBtn.click();
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to generate plan");

    const rawHtml = marked.parse(data.response || "");
    planResultsArea.innerHTML = `
      <div class="diet-plan-output">${renderDietPlan(rawHtml)}</div>
      <div style="margin-top: 1.5rem; text-align: center;">
        <button id="btn-refresh-plan" class="btn-primary" style="background: linear-gradient(135deg, var(--neon), #10b981); color: #000; box-shadow: 0 4px 15px rgba(0, 255, 163, 0.2);">
          🔄 Generate Another Similar Plan
        </button>
      </div>
    `;
    document.getElementById("btn-refresh-plan").addEventListener("click", () => {
      document.getElementById("btn-generate-day").click();
    });
  } catch (err) {
    planResultsArea.innerHTML = `<p class="error-msg">${err.message}</p>`;
  } finally {
    setLoading(btn, false, "Generate Custom AI Meal Sequence ⚡");
  }
});

// ── AI Assistant ──────────────────────────────
document.getElementById("btn-search-food")?.addEventListener("click", async () => {
  const scanArea = document.getElementById("scanner-results-area");
  const query    = document.getElementById("scanner-query").value;
  const btn      = document.getElementById("btn-search-food");

  if (!query.trim() || query.length < 2) return alert("Please enter at least 2 characters.");

  setLoading(btn, true);
  scanArea.innerHTML = `
    <div class="chat-output">
      <div class="typing-dots"><span></span><span></span><span></span></div>
      <p style="color:var(--muted); font-size:0.85rem; margin-top:0.5rem;">AI is thinking…</p>
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/ask-llm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ query })
    });
    if (res.status === 401) return logoutBtn.click();
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error generating response");

    const htmlResponse = marked.parse(data.response);
    scanArea.innerHTML = `
      <div class="chat-output markdown-content" style="border-left-color:var(--violet);">
        ${htmlResponse}
      </div>`;
  } catch (err) {
    scanArea.innerHTML = `<p class="error-msg">${err.message}</p>`;
  } finally {
    setLoading(btn, false, "Ask AI 🤖");
  }
});

// ── Recipe Finder ─────────────────────────────
document.getElementById("btn-find-recipe").addEventListener("click", async () => {
  const ingredient = document.getElementById("recipe-ingredient").value;
  const goal       = document.getElementById("recipe-goal").value;
  const btn        = document.getElementById("btn-find-recipe");

  if (!ingredient.trim()) return alert("Please enter an ingredient.");

  setLoading(btn, true);
  recipeResultsArea.innerHTML = `
    <div class="chat-output">
      <div class="typing-dots"><span></span><span></span><span></span></div>
      <p style="color:var(--muted); font-size:0.85rem; margin-top:0.5rem;">AI is crafting your personalised recipe…</p>
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/best-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ ingredient, goal })
    });
    if (res.status === 401) return logoutBtn.click();
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to generate recipe");

    const htmlResponse = marked.parse(data.response || "");
    recipeResultsArea.innerHTML = `
      <div class="chat-output markdown-content" style="border-left-color:var(--violet);">
        ${htmlResponse}
      </div>`;
  } catch (err) {
    recipeResultsArea.innerHTML = `<p class="error-msg">${err.message}</p>`;
  } finally {
    setLoading(btn, false, "Find Best Recipe 🔍");
  }
});

// ── Food Scanner ──────────────────────────────
const foodImageInput = document.getElementById("food-image-input");
const foodImagePreview = document.getElementById("food-image-preview");
const imagePreviewContainer = document.getElementById("image-preview-container");
const btnAnalyzeFood = document.getElementById("btn-analyze-food");
const scannerUploadArea = document.getElementById("scanner-upload-area");

foodImageInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      foodImagePreview.src = e.target.result;
      imagePreviewContainer.classList.remove("hidden");
      btnAnalyzeFood.disabled = false;
      scannerUploadArea.style.padding = "1.5rem 2rem";
    };
    reader.readAsDataURL(file);
  }
});

btnAnalyzeFood?.addEventListener("click", async () => {
  const file = foodImageInput.files[0];
  if (!file) return;

  const resultArea = document.getElementById("food-scanner-results-area");
  setLoading(btnAnalyzeFood, true);
  resultArea.innerHTML = `
    <div class="chat-output">
      <div class="typing-dots"><span></span><span></span><span></span></div>
      <p style="color:var(--muted); font-size:0.85rem; margin-top:0.5rem;">AI Vision Model is analyzing the image…</p>
    </div>`;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/detect-food`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });
    
    if (res.status === 401) return logoutBtn.click();
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to detect food");

    const items = data.detected_items || [];
    
    // Render Confirmation Form
    let formHtml = `
      <div class="ai-meal-card" style="margin-top:1.5rem; border: 1px solid var(--primary);">
        <div class="ai-meal-header" style="justify-content: center; text-align: center;">
          <h2 style="color:var(--text-light); margin:0;">Confirm Detected Foods</h2>
        </div>
        <div class="ai-meal-body">
          <p style="color:var(--muted2); font-size:0.9rem; margin-bottom:1rem; text-align:center;">
            Please review the detected items and provide the portion size you ate.
          </p>
          <div id="confirmation-items-container">
    `;
    
    items.forEach((item, idx) => {
        formHtml += `
            <div class="food-confirm-row" style="display:flex; gap:10px; margin-bottom:10px; align-items:center; flex-wrap: wrap;">
                <input type="text" class="input-field food-name-input" value="${item}" style="flex:2; min-width: 150px;" placeholder="Food Name">
                <div style="flex:2; display:flex; gap:5px; min-width: 200px;">
                    <input type="text" class="input-field portion-input" value="" placeholder="e.g. 1 bowl, 200g (leave empty for standard)" style="flex:1;">
                    <button class="btn-std-size" type="button" style="padding: 0 0.5rem; background: rgba(0, 255, 163, 0.1); border: 1px solid var(--neon); color: var(--neon); border-radius: 6px; font-size: 0.75rem; cursor: pointer; white-space: nowrap; transition: all 0.2s;" onclick="this.previousElementSibling.value='1 standard serving'">Standard</button>
                </div>
            </div>
        `;
    });
    
    formHtml += `
          </div>
          <button id="btn-fetch-nutrition" class="btn-primary" style="width:100%; margin-top:1rem;">
            Get Precise Nutrition 🎯
          </button>
        </div>
      </div>
    `;
    
    resultArea.innerHTML = formHtml;
    
    // Add listener for the new button
    document.getElementById("btn-fetch-nutrition").addEventListener("click", async (e) => {
        const btnFetch = e.target;
        const rows = document.querySelectorAll(".food-confirm-row");
        const confirmedItems = [];
        let valid = true;
        
        rows.forEach(row => {
            const name = row.querySelector(".food-name-input").value.trim();
            let portion = row.querySelector(".portion-input").value.trim();
            if (name && !portion) portion = "1 standard serving";
            if (name && portion) confirmedItems.push({name, portion});
        });
        
        if(!valid || confirmedItems.length === 0) {
            alert("Please enter a portion size for all items.");
            return;
        }
        
        setLoading(btnFetch, true);
        resultArea.insertAdjacentHTML('beforeend', `
          <div class="chat-output fetch-loading" style="margin-top: 1rem;">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <p style="color:var(--muted); font-size:0.85rem; margin-top:0.5rem;">Layering Databases for exact macros…</p>
          </div>
        `);
        
        try {
            const nutRes = await fetch(`${API_BASE}/fetch-nutrition`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ items: confirmedItems })
            });
            
            if (nutRes.status === 401) return logoutBtn.click();
            const nutData = await nutRes.json();
            if (!nutRes.ok) throw new Error(nutData.detail || "Failed to fetch nutrition");
            
            // Render nutrition results (reusing the original display logic)
            const n = nutData;
            const finalItems = n.items || [];
            const mealName = n.meal_name || "Unknown Meal";
            const totalMacros = n.total_macros || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
            const tags = n.health_tags || [];
            const warnings = n.warnings || [];

            let html = `
              <div class="ai-meal-card" style="margin-top:1.5rem; border: 1px solid var(--primary);">
                <div class="ai-meal-header" style="justify-content: center; text-align: center;">
                  <h2 style="color:var(--text-light); margin:0;">${mealName}</h2>
                </div>
                <div class="ai-meal-body">
                  <p style="color:var(--muted2); font-size:0.9rem; margin-bottom:1rem; text-align:center;">Total Estimated Macros</p>
                  <div class="ai-summary-tiles">
                    <div class="ai-tile ai-tile-cal"><strong>${totalMacros.calories}</strong><small>Calories</small></div>
                    <div class="ai-tile ai-tile-pro"><strong>${totalMacros.protein_g}g</strong><small>Protein</small></div>
                    <div class="ai-tile ai-tile-carb"><strong>${totalMacros.carbs_g}g</strong><small>Carbs</small></div>
                    <div class="ai-tile ai-tile-fat"><strong>${totalMacros.fat_g}g</strong><small>Fat</small></div>
                    <div class="ai-tile" style="background: rgba(156,39,176,0.1); color: #ce93d8;"><strong>${totalMacros.fiber_g}g</strong><small>Fiber</small></div>
                  </div>
                  <div style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">
                    ${tags.map(t => `<span class="badge-health">${t}</span>`).join('')}
                    ${warnings.map(w => `<span class="badge-warning">⚠️ ${w}</span>`).join('')}
                  </div>
                </div>
              </div>
            `;

            if (finalItems.length > 0) {
              html += `<h3 style="margin:2rem 0 1rem; color:var(--text-light); text-align:center;">Itemized Breakdown (${finalItems.length} items)</h3>`;
              finalItems.forEach((item) => {
                let confColor = item.confidence === "High" ? "var(--primary)" : item.confidence === "Medium" ? "#ffb74d" : "var(--error)";
                html += `
                  <div class="ai-meal-card" style="margin-bottom:1.5rem;">
                    <div class="ai-meal-header" style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <span class="ai-meal-icon">🍽️</span>
                        <span class="ai-meal-title">${item.name || 'Unknown'}</span>
                      </div>
                      <span style="font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 12px; border: 1px solid ${confColor}; color: ${confColor};">${item.confidence} Confidence</span>
                    </div>
                    <div class="ai-meal-body">
                      <p style="color:var(--text-light); font-size:0.95rem; margin-bottom:0.5rem;"><strong>Estimated Portion:</strong> ${item.quantity || "Unknown"}</p>
                      ${item.notes ? `<p style="color:var(--muted); font-size:0.85rem; margin-bottom:1rem; font-style:italic;">"${item.notes}"</p>` : ''}
                      <div class="ai-summary-tiles" style="grid-template-columns: repeat(3, 1fr);">
                        <div class="ai-tile ai-tile-cal"><strong>${item.calories}</strong><small>Calories</small></div>
                        <div class="ai-tile ai-tile-pro"><strong>${item.protein_g}g</strong><small>Protein</small></div>
                        <div class="ai-tile ai-tile-carb"><strong>${item.carbs_g}g</strong><small>Carbs</small></div>
                        <div class="ai-tile ai-tile-fat"><strong>${item.fat_g}g</strong><small>Fat</small></div>
                        <div class="ai-tile" style="background: rgba(156,39,176,0.1); color: #ce93d8;"><strong>${item.fiber_g}g</strong><small>Fiber</small></div>
                      </div>
                    </div>
                  </div>
                `;
              });
            }

            resultArea.innerHTML = html;
        } catch (err) {
            const loadingEl = resultArea.querySelector('.fetch-loading');
            if(loadingEl) loadingEl.remove();
            alert("Error fetching nutrition: " + err.message);
        } finally {
            setLoading(btnFetch, false, "Get Precise Nutrition 🎯");
        }
    });

  } catch (err) {
    resultArea.innerHTML = `<p class="error-msg">${err.message}</p>`;
  } finally {
    setLoading(btnAnalyzeFood, false, "Analyze Food 🔍");
  }
});

// ── Profile / Stats ───────────────────────────
function renderStats(profile, macros) {
  const container = document.getElementById("stats-container");
  container.innerHTML = `
    <div class="stat-box"><span>BMR</span><strong>${profile.bmr}</strong></div>
    <div class="stat-box"><span>TDEE</span><strong>${profile.tdee}</strong></div>
    <div class="stat-box"><span>Daily Target</span><strong>${macros.calories} kcal</strong></div>
    <div class="stat-box"><span>Protein</span><strong>${macros.protein_g}g</strong></div>`;
  userNameDisplay.innerText = profile.name;
}

function renderProfileArea(myData) {
  const bmi = parseFloat(myData.bmi);
  let bmiLabel = "Normal", bmiColor = "var(--neon)";
  if (bmi < 18.5)      { bmiLabel = "Underweight"; bmiColor = "#60a5fa"; }
  else if (bmi >= 25)  { bmiLabel = "Overweight";  bmiColor = "#fbbf24"; }
  else if (bmi >= 30)  { bmiLabel = "Obese";        bmiColor = "#f87171"; }

  // SVG arc gauge for BMI  (range 10–40 mapped to 0–180 degrees)
  const pct    = Math.min(Math.max((bmi - 10) / 30, 0), 1);
  const angle  = pct * 180;
  const rad    = (angle - 90) * Math.PI / 180;
  const r      = 60;
  const cx     = 80; const cy = 80;
  const ex     = cx + r * Math.cos(rad);
  const ey     = cy + r * Math.sin(rad);
  const large  = angle > 180 ? 1 : 0;

  const gaugeHTML = `
    <svg width="160" height="100" viewBox="0 0 160 100">
      <path d="M20,80 A60,60 0 0,1 140,80" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" stroke-linecap="round"/>
      <path d="M20,80 A60,60 0 ${large},1 ${ex.toFixed(1)},${ey.toFixed(1)}" fill="none" stroke="${bmiColor}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="6" fill="${bmiColor}"/>
    </svg>`;

  document.getElementById("full-profile-area").innerHTML = `
    <div class="bmi-gauge" style="border-color:${bmiColor}40;">
      ${gaugeHTML}
      <div class="bmi-value" style="color:${bmiColor};">${myData.bmi}</div>
      <div class="bmi-label">${bmiLabel} BMI</div>
    </div>
    <div class="profile-stat"><span class="ps-label">Name</span><span class="ps-value" style="font-size:1.05rem;">${myData.name}</span></div>
    <div class="profile-stat"><span class="ps-label">Age</span><span class="ps-value">${myData.age} yrs</span></div>
    <div class="profile-stat"><span class="ps-label">Gender</span><span class="ps-value">${myData.gender}</span></div>
    <div class="profile-stat"><span class="ps-label">Height</span><span class="ps-value">${myData.height_cm} cm</span></div>
    <div class="profile-stat"><span class="ps-label">Weight</span><span class="ps-value">${myData.weight_kg} kg</span></div>
    <div class="profile-stat" style="grid-column:span 2;"><span class="ps-label">Activity</span><span class="ps-value" style="text-transform:capitalize;">${myData.activity_level}</span></div>
    <div class="profile-stat" style="grid-column:span 2; border-color:var(--border-neon);"><span class="ps-label">Email</span><span class="ps-value" style="font-size:0.95rem; color:var(--muted2);">${myData.email}</span></div>`;
}

async function preloadUserProfile() {
  try {
    const macroRes = await fetch(`${API_BASE}/my-macros?goal=Maintenance`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (macroRes.ok) {
      const d = await macroRes.json();
      renderStats(d.user_profile, d.target_macros);
    } else if (macroRes.status === 401) { logoutBtn.click(); return; }

    const meRes = await fetch(`${API_BASE}/me`, { headers: { "Authorization": `Bearer ${token}` } });
    if (meRes.ok) renderProfileArea(await meRes.json());
  } catch { /* silent */ }
}

init();
