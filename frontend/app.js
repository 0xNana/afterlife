(function () {
  const C = window.AfterlifeCore, cfg = window.AFTERLIFE_CONFIG, E = window.ethers;
  const $ = (id) => document.getElementById(id);
  let provider, signer, me, af, usdc, tick;
  const roProvider = new E.JsonRpcProvider(cfg.rpc, cfg.chainId, { staticNetwork: true });

  function toast(msg, kind) { const t = $("toast"); t.textContent = msg; t.className = kind || ""; t.style.display = "block"; clearTimeout(toast._t); toast._t = setTimeout(() => (t.style.display = "none"), kind === "err" ? 9000 : 4000); }
  const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nowSec = () => Math.floor(Date.now() / 1000);

  function reason(e) {
    const m = (e && (e.reason || (e.info && e.info.error && e.info.error.message) || e.shortMessage || e.message)) || String(e);
    if (e && e.code === "ACTION_REJECTED") return "Transaction rejected in wallet";
    return m.length > 220 ? m.slice(0, 220) + "…" : m;
  }
  function logTx(label, hash) {
    const l = $("log"); if (l.textContent === "No transactions yet.") l.innerHTML = "";
    const d = document.createElement("div");
    d.innerHTML = `${new Date().toLocaleTimeString()} · ${esc(label)} · <a target="_blank" rel="noopener" href="${C.explorerTx(cfg, hash)}">${hash.slice(0, 10)}…${hash.slice(-6)}</a>`;
    l.prepend(d);
  }
  async function send(label, fn) {
    try {
      const ov = await C.feeOverrides(provider, cfg.minFeeGwei);
      const tx = await fn(ov);
      logTx(label + " (sent)", tx.hash); toast(label + ": waiting for confirmation…");
      await tx.wait();
      toast(label + ": confirmed ✓", "ok");
      await refresh();
      return tx;
    } catch (e) { console.error(e); toast(label + " failed: " + reason(e), "err"); e.__shown = true; throw e; }
  }

  // ---------------- wallet
  async function ensureChain() {
    const hex = "0x" + cfg.chainId.toString(16);
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] }); }
    catch (e) {
      if (e.code === 4902 || (e.data && e.data.originalError && e.data.originalError.code === 4902) || /Unrecognized chain/i.test(e.message || "")) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: hex, chainName: cfg.name, rpcUrls: [cfg.rpc], nativeCurrency: cfg.currency, blockExplorerUrls: [cfg.explorer] }] });
      } else throw e;
    }
  }
  async function connect() {
    if (!window.ethereum) return toast("No wallet found. Install MetaMask / Rabby / Coinbase Wallet.", "err");
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await ensureChain();
      provider = new E.BrowserProvider(window.ethereum);
      signer = await provider.getSigner(); me = await signer.getAddress();
      af = new E.Contract(cfg.afterlife, C.AFTERLIFE_ABI, signer);
      usdc = new E.Contract(cfg.usdc, C.ERC20_ABI, signer);
      $("connect").textContent = short(me); $("net").textContent = cfg.name; $("net").className = "pill Active";
      window.ethereum.on && window.ethereum.on("accountsChanged", () => location.reload());
      window.ethereum.on && window.ethereum.on("chainChanged", () => location.reload());
      await refresh();
    } catch (e) { toast("Connect failed: " + reason(e), "err"); }
  }

  // ---------------- create form
  function addBen(addr, pct) {
    const d = document.createElement("div"); d.className = "ben";
    d.innerHTML = `<input class="ba" placeholder="0x… beneficiary" value="${esc(addr || "")}"/><input class="bp" type="number" step="0.01" min="0" placeholder="%" value="${pct || ""}"/><button type="button" class="ghost">×</button>`;
    d.querySelector("button").onclick = () => { d.remove(); updPct(); };
    d.querySelector(".bp").oninput = updPct;
    $("bens").appendChild(d); updPct();
  }
  function rows() { return [...document.querySelectorAll("#bens .ben")].map((d) => ({ address: d.querySelector(".ba").value, percent: d.querySelector(".bp").value })); }
  function updPct() { const t = rows().reduce((s, r) => s + (Number(r.percent) || 0), 0); $("pct").textContent = `total: ${t.toFixed(2)}%`; $("pct").style.color = Math.abs(t - 100) < 1e-9 ? "var(--ok)" : "var(--warn)"; }
  function updWin() { try { $("winfo").textContent = "= " + C.humanDuration(C.windowSeconds($("wamt").value, $("wunit").value)); } catch { $("winfo").textContent = ""; } }

  async function createVault() {
    try {
      if (!af) return toast("Connect your wallet first", "err");
      const name = $("vname").value.trim(); if (!name) throw new Error("Give the vault a name");
      const { addresses, shares } = C.buildBeneficiaries(rows(), E.isAddress, me);
      const win = C.windowSeconds($("wamt").value, $("wunit").value);
      const amount = C.parseUsdc($("vamt").value);
      const bal = await usdc.balanceOf(me); if (bal < amount) throw new Error(`Not enough USDC (have ${C.fmtUsdc(bal)})`);
      const spender = cfg.afterlife;
      if ((await usdc.allowance(me, spender)) < amount) await send("Approve USDC", (ov) => usdc.approve(spender, amount, ov));
      await send("Create vault", (ov) => af.createVault(name, addresses, shares, win, amount, ov));
      $("vname").value = "";
    } catch (e) { if (!e.__shown) toast(reason(e), "err"); }
  }

  // ---------------- rendering
  function benList(v, mineAddr) {
    return v.beneficiaries.map((b, i) => `<div class="mono">${i + 1}. ${b.toLowerCase() === (mineAddr || "").toLowerCase() ? "<b>you</b> " : ""}${short(b)} · ${(v.shares[i] / 100).toFixed(2)}%${v.claimedFlags[i] ? " · <span style='color:var(--ok)'>paid ✓</span>" : ""}</div>`).join("");
  }
  function timer(v) {
    if (v.status !== "Active") return "";
    const left = v.deadline - nowSec(); const pct = Math.max(0, Math.min(100, (left / v.window) * 100));
    const cls = left <= 0 ? "dead" : pct < 25 ? "low" : "";
    return `<div class="bar ${cls}"><i data-w="${pct}" style="width:${pct}%"></i></div><div class="mut timer" data-deadline="${v.deadline}" data-window="${v.window}">${left > 0 ? "Releases in " + C.humanDuration(left) + " unless you check in" : "<b style='color:var(--bad)'>Silent past the window — anyone can release it now</b>"}</div>`;
  }
  function vaultCard(v, role) {
    const isOwner = me && v.owner.toLowerCase() === me.toLowerCase();
    const myIdx = me ? v.beneficiaries.findIndex((b) => b.toLowerCase() === me.toLowerCase()) : -1;
    let actions = "";
    if (v.status === "Active" && isOwner && role !== "inherited") {
      actions += `<div class="row" style="margin-top:8px"><button class="ok" data-a="checkin" data-id="${v.id}">I'm alive — check in</button>
        <input data-f="amt" placeholder="USDC" style="max-width:110px"/><button class="ghost" data-a="deposit" data-id="${v.id}">Deposit</button><button class="ghost" data-a="withdraw" data-id="${v.id}">Withdraw</button><button class="ghost" data-a="close" data-id="${v.id}">Close</button></div>`;
    }
    if (v.status === "Active" && v.expired) actions += `<div class="row" style="margin-top:8px"><button class="warn" data-a="release" data-id="${v.id}">Release vault to beneficiaries</button></div>`;
    if (v.status === "Released") {
      const left = v.released - v.claimedAmount;
      actions += `<div class="mut" style="margin-top:6px">Released: ${C.fmtUsdc(v.released)} USDC · unclaimed ${C.fmtUsdc(left)} USDC</div><div class="row" style="margin-top:8px">`;
      if (myIdx >= 0 && !v.claimedFlags[myIdx]) actions += `<button class="ok" data-a="claim" data-id="${v.id}" data-i="${myIdx}">Claim my share</button>`;
      if (left > 0n) actions += `<button class="ghost" data-a="claimall" data-id="${v.id}">Pay everyone (claim all)</button>`;
      actions += `</div>`;
    }
    return `<div class="vault"><div class="top"><h3>#${v.id} · ${esc(v.name)}</h3><span class="pill ${v.status}">${v.status}</span></div>
      <div class="mut mono">owner ${short(v.owner)} · balance <b style="color:var(--txt)">${C.fmtUsdc(v.balance)} USDC</b> · window ${C.humanDuration(v.window)}</div>
      ${timer(v)}<div style="margin-top:6px">${benList(v, me)}</div>${actions}</div>`;
  }
  async function refresh() {
    if (!af) return;
    try {
      const now = nowSec();
      $("bal").textContent = C.fmtUsdc(await usdc.balanceOf(me)) + " USDC";
      const { owned, inherited } = await C.loadMine(af, me, now);
      $("owned").innerHTML = owned.length ? owned.map((v) => vaultCard(v, "owned")).join("") : "No vaults yet — create one above.";
      $("inherited").innerHTML = inherited.length ? inherited.map((v) => vaultCard(v, "inherited")).join("") : "Nobody has named you as a beneficiary (yet).";
      if ($("lookres").dataset.id) await openVault($("lookres").dataset.id);
    } catch (e) { console.error(e); toast("Refresh failed: " + reason(e), "err"); }
  }
  async function openVault(id) {
    try {
      const rd = new E.Contract(cfg.afterlife, C.AFTERLIFE_ABI, roProvider);
      const v = await C.loadVault(rd, id, nowSec());
      if (v.status === "None") { $("lookres").innerHTML = "<p class='mut'>No such vault.</p>"; delete $("lookres").dataset.id; return; }
      $("lookres").dataset.id = id; $("lookres").innerHTML = vaultCard(v, "lookup");
    } catch (e) { toast("Lookup failed: " + reason(e), "err"); }
  }

  async function onAction(ev) {
    const b = ev.target.closest("button[data-a]"); if (!b) return;
    const id = BigInt(b.dataset.id), a = b.dataset.a;
    const amtInput = b.parentElement.querySelector("input[data-f=amt]");
    try {
      if (!af) return toast("Connect your wallet first", "err");
      b.disabled = true;
      if (a === "checkin") await send("Check in", (ov) => af.checkIn(id, ov));
      else if (a === "release") await send("Release", (ov) => af.release(id, ov));
      else if (a === "claim") await send("Claim", (ov) => af.claim(id, BigInt(b.dataset.i), ov));
      else if (a === "claimall") await send("Claim all", (ov) => af.claimAll(id, ov));
      else if (a === "close") await send("Close vault", (ov) => af.close(id, ov));
      else if (a === "withdraw") { const amt = C.parseUsdc(amtInput.value); await send("Withdraw", (ov) => af.withdraw(id, amt, ov)); }
      else if (a === "deposit") {
        const amt = C.parseUsdc(amtInput.value);
        if ((await usdc.allowance(me, cfg.afterlife)) < amt) await send("Approve USDC", (ov) => usdc.approve(cfg.afterlife, amt, ov));
        await send("Deposit", (ov) => af.deposit(id, amt, ov));
      }
    } catch (e) { if (!e.__shown) toast(reason(e), "err"); }
    finally { b.disabled = false; }
  }

  // live countdown without re-fetching
  function startTick() {
    clearInterval(tick);
    tick = setInterval(() => {
      document.querySelectorAll(".timer").forEach((el) => {
        const left = Number(el.dataset.deadline) - nowSec(), w = Number(el.dataset.window);
        el.innerHTML = left > 0 ? "Releases in " + C.humanDuration(left) + " unless you check in" : "<b style='color:var(--bad)'>Silent past the window — anyone can release it now</b>";
        const bar = el.previousElementSibling; if (bar) { const p = Math.max(0, Math.min(100, (left / w) * 100)); bar.firstChild.style.width = p + "%"; bar.className = "bar " + (left <= 0 ? "dead" : p < 25 ? "low" : ""); }
        if (left === 0) setTimeout(refresh, 1500);
      });
    }, 1000);
  }

  // ---------------- init
  function init() {
    $("caddr").textContent = cfg.afterlife || "(not deployed yet)";
    if (!cfg.afterlife) { const w = $("cfgwarn"); w.style.display = "block"; w.textContent = "No contract address set in config.js yet — deploy Afterlife to " + cfg.name + " and paste the address."; }
    $("connect").onclick = connect; $("addben").onclick = () => addBen();
    $("mkvault").onclick = createVault;
    $("wamt").oninput = updWin; $("wunit").onchange = updWin; updWin();
    addBen(); addBen();
    document.body.addEventListener("click", onAction);
    $("look").onclick = () => { const id = $("lookid").value; if (id) openVault(id); };
    startTick();
    if (cfg.local) $("mkhint").textContent = "LOCAL TEST NETWORK";
  }
  init();
  window.__afterlife = { connect, refresh, openVault }; // handy for e2e tests
})();
