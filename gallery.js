(() => {
  const assets = window.YS_GALLERY || [];
  const $ = id => document.getElementById(id);
  const grid = $("asset-grid");
  let typeFilter = "all";
  let sourceFilter = "all";
  let query = "";
  let selected = null;

  const labels = { image:"Images", video:"Videos", audio:"Audio", document:"Documents" };
  const icons = { video:"▶", audio:"♪", document:"DOC" };
  const escape = value => String(value || "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  function mediaMarkup(asset, context = "card") {
    if (asset.type === "image") return `<img src="${escape(asset.src)}" alt="${escape(asset.title)}" loading="${context === "card" ? "lazy" : "eager"}">`;
    if (asset.type === "video" && context === "detail" && asset.embed) return `<iframe src="${escape(asset.embed)}" title="${escape(asset.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    if (asset.type === "video" && context === "detail") return `<video src="${escape(asset.src)}" controls preload="metadata"></video>`;
    if (asset.type === "audio" && context === "detail") return `<div class="audio-player"><span class="media-icon">♪</span><strong>${escape(asset.title)}</strong><audio src="${escape(asset.src)}" controls preload="metadata"></audio></div>`;
    if (asset.type === "document" && context === "detail" && asset.extension === "pdf") return `<iframe src="${escape(asset.src)}" title="${escape(asset.title)}"></iframe>`;
    return `<div class="file-tile ${asset.type}"><span>${icons[asset.type] || "FILE"}</span><small>${escape(asset.extension.toUpperCase())}</small></div>`;
  }

  function assetCard(asset) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "real-asset-card";
    button.dataset.assetId = asset.id;
    button.setAttribute("aria-label", `View ${asset.title}`);
    button.innerHTML = `<span class="real-card-media">${mediaMarkup(asset)}</span><span class="real-card-copy"><span><strong>${escape(asset.title)}</strong><small>${escape(asset.source)}</small></span><em>${escape(asset.extension.toUpperCase())}</em></span>`;
    button.addEventListener("click", () => selectAsset(asset, false));
    return button;
  }

  function visibleAssets() {
    return assets.filter(asset => {
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      const matchesSource = sourceFilter === "all" || asset.source === sourceFilter;
      const haystack = `${asset.title} ${asset.filename} ${asset.source}`.toLowerCase();
      return matchesType && matchesSource && haystack.includes(query);
    });
  }

  function render() {
    const visible = visibleAssets();
    grid.replaceChildren(...visible.map(assetCard));
    $("result-count").textContent = `${visible.length} ${visible.length === 1 ? "asset" : "assets"}`;
    $("empty-state").hidden = visible.length !== 0;
  }

  function selectAsset(asset, scroll) {
    selected = asset;
    document.querySelectorAll(".real-asset-card").forEach(card => card.classList.toggle("selected", card.dataset.assetId === asset.id));
    $("selected-media").innerHTML = mediaMarkup(asset, "detail");
    $("selected-type").textContent = asset.type;
    $("selected-source").textContent = asset.source;
    $("selected-title").textContent = asset.title;
    $("selected-filename").textContent = asset.filename;
    $("selected-size").textContent = asset.size;
    $("selected-detail").textContent = asset.detail || "Not available";
    $("selected-modified").textContent = asset.modified;
    $("selected-note").textContent = asset.note;
    $("selected-link").textContent = asset.src;
    $("download-button").href = asset.src;
    $("open-button").href = asset.src;
    $("download-button").classList.toggle("disabled", Boolean(asset.external));
    $("open-button").classList.remove("disabled");
    if (scroll) $("selected-asset").scrollIntoView({behavior:"smooth",block:"start"});
  }

  const counts = assets.reduce((out,a) => (out[a.type]=(out[a.type]||0)+1,out),{});
  $("collection-summary").innerHTML = Object.entries(labels).map(([type,label]) => `<span><strong>${counts[type] || 0}</strong>${label}</span>`).join("");
  $("footer-count").textContent = `${assets.length} local production assets`;

  const sources = [...new Set(assets.map(a => a.source))].sort();
  const sourceButtons = [{name:"all",label:"All folders"},...sources.map(name => ({name,label:name}))];
  sourceButtons.forEach(source => {
    const button=document.createElement("button"); button.type="button"; button.className="source-filter"+(source.name==="all"?" selected":""); button.textContent=source.label;
    button.addEventListener("click",()=>{sourceFilter=source.name;document.querySelectorAll(".source-filter").forEach(b=>b.classList.toggle("selected",b===button));render();});
    $("source-filters").append(button);
  });

  document.querySelectorAll(".filter-tab").forEach(button => button.addEventListener("click", () => {
    typeFilter=button.dataset.filter; document.querySelectorAll(".filter-tab").forEach(b=>b.classList.toggle("selected",b===button)); render();
  }));
  $("asset-search").addEventListener("input", event => { query=event.target.value.trim().toLowerCase(); render(); });
  $("copy-button").addEventListener("click", async () => {
    if (!selected) return;
    try { await navigator.clipboard.writeText(selected.src); $("copy-button").textContent="Copied"; setTimeout(()=>$("copy-button").textContent="Copy link",1200); }
    catch { $("copy-button").textContent="Copy unavailable"; }
  });

  render();
  if (assets.length) selectAsset(assets.find(a => a.type === "image") || assets[0], false);
})();
