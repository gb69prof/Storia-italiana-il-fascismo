const DEFAULT_VIDEO_URL = "https://www.youtube.com/embed/5R5oArl0ZL4?rel=0"; // sostituisci con il tuo video
const STORAGE_KEY = "fascismo_toc_v1";

const defaultToc = [
  { label: "La presa del potere", href: "lezioni/potere.html" },
  { label: "Il primo governo Mussolini", href: "lezioni/primo.html" },
  { label: "Le elezioni del 1924", href: "lezioni/elezioni.html" },
  { label: "La dittatura", href: "lezioni/dittatura.html" },
  { label: "La costituzione del consenso", href: "lezioni/consenso.html" },
  { label: "La politica estera: ‘22-‘34", href: "lezioni/estera1.html" },
  { label: "La nuova politica economica", href: "lezioni/economica.html" },
  { label: "La nuova politica estera: ‘35-39", href: "lezioni/estera2.html" },
  { label: "Approfondimenti", href: "lezioni/approfondimenti.html" }
];

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

function setMediaToVideo(container, videoUrl=DEFAULT_VIDEO_URL){
  container.innerHTML = `<iframe title="Video" src="${videoUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  container.dataset.mode = "video";
}
function setMediaToImage(container, imgSrc){
  container.innerHTML = `<img src="${imgSrc}" alt="Copertina – clicca per aprire il video" />`;
  container.dataset.mode = "image";
}

async function loadTxtInto(targetSel, txtPath){
  const box = qs(targetSel);
  if(!box) return;
  try{
    const res = await fetch(txtPath, { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP "+res.status);
    const txt = await res.text();
    box.innerHTML = `<pre>${escapeHtml(txt)}</pre>`;
  }catch(e){
    box.innerHTML = `<pre>⚠️ Non riesco a caricare: ${txtPath}
(${e.message})

Suggerimento: verifica che il file esista e che il nome corrisponda.</pre>`;
  }
}

function escapeHtml(str){
  return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function loadToc(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultToc;
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed) || parsed.length===0) return defaultToc;
    return parsed;
  }catch{
    return defaultToc;
  }
}
function saveToc(toc){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toc, null, 2));
}

function renderToc(listEl, currentHref=""){
  const toc = loadToc();
  listEl.innerHTML = "";
  toc.forEach((item, idx) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    if (currentHref && normalizeHref(item.href) === normalizeHref(currentHref)) {
      a.style.textDecoration = "underline";
      a.style.textUnderlineOffset = "4px";
    }

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "lezione";

    li.appendChild(a);
    li.appendChild(tag);
    listEl.appendChild(li);
  });
}

function normalizeHref(h){
  try{
    // normalizza rimuovendo eventuale ./ e base
    return h.replace(/^\.\//,"").toLowerCase();
  }catch{
    return (h||"").toLowerCase();
  }
}

function enableEditableToc(listEl){
  // rende il testo delle voci editabile con doppio click
  qsa("li", listEl).forEach((li, idx) => {
    const a = qs("a", li);
    a.addEventListener("dblclick", (ev) => {
      ev.preventDefault();
      a.contentEditable = "true";
      a.classList.add("editable");
      a.focus();

      // seleziona tutto
      const r = document.createRange();
      r.selectNodeContents(a);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    });

    a.addEventListener("blur", () => {
      if(a.isContentEditable){
        a.contentEditable = "false";
        a.classList.remove("editable");
        const toc = loadToc();
        toc[idx].label = a.textContent.trim() || toc[idx].label;
        saveToc(toc);
      }
    });

    a.addEventListener("keydown", (e) => {
      if(!a.isContentEditable) return;
      if(e.key === "Enter"){
        e.preventDefault();
        a.blur();
      }
      if(e.key === "Escape"){
        e.preventDefault();
        const toc = loadToc();
        a.textContent = toc[idx].label;
        a.blur();
      }
    });
  });
}

function attachTocControls(resetBtnSel, helpBtnSel, listElSel, currentHref=""){
  const listEl = qs(listElSel);
  if(!listEl) return;

  renderToc(listEl, currentHref);
  enableEditableToc(listEl);

  const resetBtn = qs(resetBtnSel);
  if(resetBtn){
    resetBtn.addEventListener("click", () => {
      saveToc(defaultToc);
      renderToc(listEl, currentHref);
      enableEditableToc(listEl);
    });
  }

  const helpBtn = qs(helpBtnSel);
  if(helpBtn){
    helpBtn.addEventListener("click", () => {
      alert("Indice editabile:\n• Doppio click sul titolo di una voce per modificarlo\n• INVIO = salva, ESC = annulla\n• Il pulsante 'Reset' ripristina l'indice originale\n\nNota: i link delle lezioni restano invariati; modifichi solo il testo visibile.");
    });
  }
}

function setupMediaToggle(mediaSel, imgSrc, videoUrl=DEFAULT_VIDEO_URL){
  const media = qs(mediaSel);
  if(!media) return;
  setMediaToImage(media, imgSrc);
  media.addEventListener("click", (e) => {
    const mode = media.dataset.mode;
    if(mode === "image") setMediaToVideo(media, videoUrl);
  });
}
