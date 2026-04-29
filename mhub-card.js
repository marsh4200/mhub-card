/**
 * mhub-card.js — v5.2.0
 * Self-configuring Lovelace card for the MHUB integration.
 *
 * Zero manual setup. The card reads your HA entity registry,
 * finds every MHUB entity automatically, and builds itself.
 *
 * Install:
 *   1. Copy to /config/www/mhub-card.js
 *   2. Settings → Dashboards → Resources → Add
 *      URL: /local/mhub-card.js   Type: JavaScript module
 *   3. Add card → Custom → MHUB Card
 *   4. Done — no YAML, no entity entry, no config needed.
 *
 * Optional YAML overrides (all optional):
 *   type: custom:mhub-card
 *   title: My MHUB          # override header title
 *   entry_id: abc123        # force a specific config entry (multi-hub)
 */

(function () {
  "use strict";

  /* ─── brand colours ─────────────────────────────────────── */
  const BRANDS = {
    "netflix":       { bg:"#E50914", fg:"#fff",    t:"N"   },
    "youtube":       { bg:"#FF0000", fg:"#fff",    t:"YT"  },
    "sky q":         { bg:"#0072CE", fg:"#fff",    t:"SKY" },
    "sky":           { bg:"#0072CE", fg:"#fff",    t:"SKY" },
    "ps5":           { bg:"#003087", fg:"#fff",    t:"PS5" },
    "ps4":           { bg:"#003087", fg:"#fff",    t:"PS4" },
    "xbox":          { bg:"#107C10", fg:"#fff",    t:"X"   },
    "apple tv":      { bg:"#1c1c1e", fg:"#fff",    t:"ATV" },
    "appletv":       { bg:"#1c1c1e", fg:"#fff",    t:"ATV" },
    "spotify":       { bg:"#1DB954", fg:"#fff",    t:"SP"  },
    "fire tv":       { bg:"#232F3E", fg:"#FF9900", t:"F"   },
    "firetv":        { bg:"#232F3E", fg:"#FF9900", t:"F"   },
    "chromecast":    { bg:"#4285F4", fg:"#fff",    t:"CC"  },
    "nvidia shield": { bg:"#76b900", fg:"#fff",    t:"NV"  },
    "shield":        { bg:"#76b900", fg:"#fff",    t:"NV"  },
    "blu-ray":       { bg:"#1a3a6e", fg:"#4a9eff", t:"BR"  },
    "bluray":        { bg:"#1a3a6e", fg:"#4a9eff", t:"BR"  },
    "hdmi":          { bg:"#2a3050", fg:"#7aadff", t:"H"   },
    "laptop":        { bg:"#2a3050", fg:"#7aadff", t:"LP"  },
    "pc":            { bg:"#2a3050", fg:"#7aadff", t:"PC"  },
  };

  function brand(label) {
    if (!label) return { bg:"#1e2230", fg:"#7a84a0", t:"?" };
    const k = label.toLowerCase();
    for (const key of Object.keys(BRANDS)) if (k.includes(key)) return BRANDS[key];
    const words = label.trim().split(/\s+/);
    const init  = words.map(w => w[0]||"").join("").toUpperCase().slice(0,2) || "?";
    const hue   = [...label].reduce((a,c)=>(a+c.charCodeAt(0))&0xffff,0) % 360;
    return { bg:`hsl(${hue},35%,22%)`, fg:`hsl(${hue},75%,68%)`, t:init };
  }

  /* ─── SVG icons ─────────────────────────────────────────── */
  const I = {
    logo:   `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
    power:  `<svg viewBox="0 0 24 24"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>`,
    von:    `<svg viewBox="0 0 24 24"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>`,
    voff:   `<svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0014 7.97V9.5l2.5 2.5V12zm2.5.07c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.78zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
    play:   `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
    fn:     `<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
    ref:    `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    navs: {
      switch:    `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm8 5h8v2h-8zm-8 5h16v2H4z"/></svg>`,
      volume:    `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z"/></svg>`,
      sequences: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
      ir:        `<svg viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 7.48 2 13h2c0-4.42 3.58-8 8-8s8 3.58 8 8h2c0-5.52-4.48-10-10-10zm0 4c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4s4 1.79 4 4h2c0-3.31-2.69-6-6-6zm0 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
      diag:      `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
    }
  };

  /* ─── CSS ────────────────────────────────────────────────── */
  const CSS = `
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :host { display:block; }

    .card {
      background: #0d0f14;
      border-radius: 16px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e8eeff;
      border: 1px solid rgba(255,255,255,.09);
    }

    /* header */
    .hdr { background:#08090d; padding:12px 16px; display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(255,255,255,.08); }
    .hdr-logo { width:36px; height:36px; background:#0d1f42; border:1px solid #2a4a8e; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .hdr-logo svg { width:18px; height:18px; fill:#4a9eff; display:block; }
    .hdr-title { font-size:15px; font-weight:600; }
    .hdr-sub { font-size:11px; color:#6a7490; margin-top:1px; }
    .pill { display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:500; border:1px solid; flex-shrink:0; }
    .pill.on  { background:#0d2a1a; border-color:#1a5c34; color:#22d47a; }
    .pill.off { background:#2a0d0d; border-color:#5c1a1a; color:#ff4d4d; }
    .pdot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .pw-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,.13); background:transparent; color:#6a7490; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; flex-shrink:0; }
    .pw-btn svg { width:15px; height:15px; fill:currentColor; display:block; }
    .pw-btn:hover { border-color:#3b8aff; color:#3b8aff; }

    /* nav */
    .nav { background:#08090d; display:flex; border-bottom:1px solid rgba(255,255,255,.08); overflow-x:auto; scrollbar-width:none; }
    .nav::-webkit-scrollbar { display:none; }
    .nb { padding:10px 13px; font-size:12px; font-weight:500; color:#6a7490; cursor:pointer; border:none; border-bottom:2px solid transparent; background:transparent; white-space:nowrap; display:flex; align-items:center; gap:5px; font-family:inherit; flex-shrink:0; transition:color .1s; }
    .nb svg { width:13px; height:13px; fill:currentColor; display:block; flex-shrink:0; }
    .nb.on { color:#3b8aff; border-bottom-color:#3b8aff; }
    .nb:hover:not(.on) { color:#e8eeff; }

    /* pages */
    .pg { display:none; }
    .pg.on { display:block; }

    /* zone dropdown */
    .zdrop-wrap { padding:13px 16px 0; }
    .zdrop {
      width:100%; padding:9px 12px; border-radius:10px;
      border:1px solid rgba(255,255,255,.13); background:#08090d;
      color:#e8eeff; font-size:13px; font-weight:500; font-family:inherit;
      cursor:pointer; appearance:none; -webkit-appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%236a7490' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat:no-repeat; background-position:right 10px center; background-size:20px;
      padding-right:36px;
    }
    .zdrop:focus { outline:none; border-color:#3b8aff; }

    /* body */
    .body { padding:13px 16px 16px; }

    /* now bar */
    .now { background:#08090d; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:11px 13px; display:flex; align-items:center; gap:10px; margin-bottom:13px; }
    .now-ico { width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; letter-spacing:-.02em; }
    .now-lbl { font-size:11px; color:#6a7490; }
    .now-val { font-size:14px; font-weight:600; }
    .sp { flex:1; min-width:0; }
    .now-r { text-align:right; flex-shrink:0; }
    .mb { padding:5px 11px; border-radius:6px; border:1px solid rgba(255,255,255,.13); background:transparent; color:#6a7490; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap; font-family:inherit; flex-shrink:0; transition:background .1s, border-color .1s, color .1s; }
    .mb svg { width:13px; height:13px; fill:currentColor; display:block; }
    .mb.muted { background:#2a1e00; border-color:#ffb830; color:#ffb830; }
    .mb:hover:not(.muted) { color:#e8eeff; border-color:rgba(255,255,255,.28); }

    /* sources */
    .slbl { font-size:10px; font-weight:600; letter-spacing:.08em; color:#6a7490; margin-bottom:9px; text-transform:uppercase; }
    .sgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:7px; }
    .sbtn {
      border:1px solid rgba(255,255,255,.09);
      border-radius:10px; padding:10px 6px 8px;
      cursor:pointer; background:#08090d;
      display:flex; flex-direction:column; align-items:center; gap:5px;
      font-family:inherit;
      /* no transition — instant response */
    }
    .sbtn:hover { border-color:rgba(255,255,255,.28); background:#161922; }
    .sbtn:active { background:#0d1e3a; border-color:#3b8aff; transform:scale(.96); }
    .sbtn.on { border-color:#3b8aff; background:#0d1e3a; }
    .sbtn.on .sname { color:#3b8aff; }
    .sico { width:54px; height:54px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; flex-shrink:0; }
    .sname { font-size:10px; color:#6a7490; text-align:center; line-height:1.3; word-break:break-word; }

    /* volume */
    .vrow { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .vlbl { font-size:12px; color:#6a7490; width:110px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .vs { flex:1; min-width:0; -webkit-appearance:none; appearance:none; height:4px; border-radius:2px; background:rgba(255,255,255,.12); outline:none; cursor:pointer; }
    .vs::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#3b8aff; cursor:pointer; }
    .vs::-moz-range-thumb { width:16px; height:16px; border-radius:50%; background:#3b8aff; cursor:pointer; border:none; }
    .vv { font-size:12px; color:#e8eeff; width:32px; text-align:right; flex-shrink:0; }

    /* sequences */
    .seqg { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:7px; }
    .seqb { background:#08090d; border:1px solid rgba(255,255,255,.09); border-radius:10px; padding:11px 13px; cursor:pointer; color:#e8eeff; display:flex; align-items:center; gap:7px; font-size:13px; font-family:inherit; text-align:left; width:100%; }
    .seqb svg { width:14px; height:14px; fill:#3b8aff; flex-shrink:0; display:block; }
    .seqb:hover { border-color:rgba(255,255,255,.22); background:#161922; }
    .seqb:active { transform:scale(.98); }
    .seqb.fired { border-color:#22d47a!important; color:#22d47a; }
    .seqb.fired svg { fill:#22d47a; }

    /* IR/CEC */
    .irdev { margin-bottom:14px; }
    .irdname { font-size:10px; color:#6a7490; font-weight:600; letter-spacing:.06em; text-transform:uppercase; margin-bottom:7px; }
    .irg { display:flex; flex-wrap:wrap; gap:5px; }
    .irb { padding:5px 12px; border-radius:6px; border:1px solid rgba(255,255,255,.09); background:#08090d; color:#6a7490; font-size:12px; cursor:pointer; font-family:inherit; }
    .irb:hover { border-color:rgba(255,255,255,.22); color:#e8eeff; background:#161922; }
    .irb:active { transform:scale(.96); }
    .irb.fired { border-color:#3b8aff; color:#3b8aff; background:#0d1e3a; }

    /* diag */
    .dgrid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:12px; }
    .dcell { background:#08090d; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:11px 13px; }
    .dkey { font-size:10px; font-weight:600; letter-spacing:.07em; color:#6a7490; text-transform:uppercase; margin-bottom:3px; }
    .dval { font-size:14px; font-weight:600; }
    .dval.ok { color:#22d47a; }
    .dval.warn { color:#ffb830; }
    .drow { display:flex; justify-content:space-between; font-size:12px; padding:3px 0; gap:8px; }
    .dk { color:#6a7490; flex-shrink:0; }
    .dv { color:#e8eeff; text-align:right; word-break:break-all; }
    .stk { display:inline-flex; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; background:#1a0f2e; border:1px solid #3d2070; color:#a070ff; margin-left:6px; vertical-align:middle; }

    /* footer */
    .ftr { border-top:1px solid rgba(255,255,255,.08); padding:9px 16px; display:flex; justify-content:space-between; align-items:center; background:#08090d; }
    .finfo { font-size:11px; color:#6a7490; }
    .rbtn { padding:4px 11px; border-radius:6px; border:1px solid rgba(255,255,255,.13); background:transparent; color:#6a7490; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; font-family:inherit; }
    .rbtn svg { width:12px; height:12px; fill:currentColor; display:block; }
    .rbtn:hover { color:#3b8aff; border-color:#3b8aff; }

    /* utils */
    .div { height:1px; background:rgba(255,255,255,.07); margin:11px 0; }
    .empty { padding:24px; text-align:center; color:#6a7490; font-size:13px; line-height:1.6; }
    .loading { padding:32px; text-align:center; color:#6a7490; font-size:13px; }
  `;

  /* ═══════════════════════════════════════════════════════════
     ENTITY DISCOVERY
     Reads the HA entity registry to find all MHUB entities.
     No config required.
  ═══════════════════════════════════════════════════════════ */
  function discoverMhub(hass, forcedEntryId, mhubEntityIds, mhubRegistry, deviceNames) {
    const all = Object.values(hass.states);

    /* ── Hub-level sensors ──
       The integration uses _attr_has_entity_name = True so sensor entity_ids
       are not predictable (they depend on the device name slug).
       The MHUBStatusSensor exposes ALL diagnostic data in extra_state_attributes,
       so we find it by pattern and read everything from its attributes. */
    const find = function(pat){ return all.find(function(s){ return s.entity_id.match(pat); }); };

    /* Status sensor: unique_id = {entry_id}_hub_status → entity_id = sensor.*_status
       We find it by looking for a sensor whose attributes contain 'model' and 'firmware'
       (the diagnostic_attrs() dict that MHUBStatusSensor puts in extra_state_attributes). */
    const statS = all.find(function(s) {
      if (!s.entity_id.startsWith("sensor.")) return false;
      const a = s.attributes;
      return a.model !== undefined && a.firmware !== undefined && a.inputs !== undefined;
    }) || find(/sensor\.mhub.*status/i);

    const pwSw = find(/switch\.mhub.*system_power/i);

    /* ── Primary anchor: media_player entities with attributes.output ──
       Every MHUB output media_player exposes attributes.output = "A"/"B"/"C"…
       via extra_state_attributes. This is the definitive list of outputs. */
    const mps = all
      .filter(function(s){ return s.entity_id.startsWith("media_player.") && s.attributes.output !== undefined; })
      .sort(function(a,b){ return (a.attributes.output||"").localeCompare(b.attributes.output||""); });

    const zones = mps.map(function(mp) {
      const outLetter = (mp.attributes.output || "").toLowerCase();
      const label     = mp.attributes.friendly_name || mp.entity_id.replace("media_player.","").replace(/_/g," ");
      const slug      = mp.entity_id.replace("media_player.","");

      /* Source sensor: sensor.{slug}_source */
      const srcSensor = all.find(function(s){
        return s.entity_id.startsWith("sensor.") && s.entity_id.endsWith("_source") && (
          s.entity_id === ("sensor." + slug + "_source") ||
          (s.attributes.output || "").toLowerCase() === outLetter
        );
      });

      /* Mute switch: switch.{slug}_mute */
      const muteSwitch = all.find(function(s){
        return s.entity_id === ("switch." + slug + "_mute");
      });

      /* Volume number: number.{slug}_volume */
      const volNum = all.find(function(s){
        return s.entity_id === ("number." + slug + "_volume");
      });

      /* Sources live from media_player.source_list — populated by coordinator every 5s */
      const sourceList = mp.attributes.source_list || [];

      return {
        output:        outLetter.toUpperCase(),
        label:         label,
        media_player:  mp.entity_id,
        source_sensor: srcSensor   ? srcSensor.entity_id   : null,
        mute_switch:   muteSwitch  ? muteSwitch.entity_id  : null,
        volume_entity: volNum      ? volNum.entity_id      : null,
        sources:       sourceList.map(function(n){ return { name: n }; }),
      };
    });

    /* ── Groups (MHUB AUDIO / MZMA) ── */
    const groupVols  = all.filter(function(s){ return s.entity_id.match(/number\.mhub_group_volume_/); });
    const groupMutes = all.filter(function(s){ return s.entity_id.match(/switch\.mhub_group_mute_/); });
    const groups = groupVols.map(function(gv) {
      const slug2 = gv.entity_id.replace(/^number\./, "").replace(/_volume$/, "");
      const gm    = groupMutes.find(function(s){ return s.entity_id.replace(/^switch\./, "").replace(/_mute$/, "") === slug2; });
      const lbl   = (gv.attributes.friendly_name || slug2).replace(/ volume$/i,"").replace(/^mhub /i,"").trim();
      return { label: lbl, volume_entity: gv.entity_id, mute_switch: gm ? gm.entity_id : null };
    });

    /* ── Collect all zone slugs for exclusion logic ── */
    const zoneSlugs = zones.map(function(z){ return z.media_player.replace("media_player.",""); });

    const allButtons = all.filter(function(s){ return s.entity_id.startsWith("button."); });

    /* ── Build lookup maps from entity registry if available ──
       unique_id patterns from button.py:
         sequences:      {entry_id}_mhub_sequence_{slug}  or  {entry_id}_mhub_function_{slug}
         IR buttons:     {entry_id}_ir_{device_key}_{command_id}
         CEC buttons:    {entry_id}_cec_{device_key}_{command_id}
         source buttons: {entry_id}_source_button_{output_id}_{slug}
         identify:       {entry_id}_mhub_identify
         reboot:         {entry_id}_mhub_reboot  */

    let seqButtons = [], irButtons = [], cecButtons = [];

    if (mhubRegistry && mhubRegistry.seqEids) {
      /* Reliable path — pre-classified by device registry identifiers */
      const { seqEids, irEids, cecEids } = mhubRegistry;

      seqButtons = allButtons.filter(function(s) {
        if (!seqEids.has(s.entity_id)) return false;
        /* Exclude utility buttons */
        return !s.entity_id.match(/mhub_identify|mhub_reboot/);
      });
      irButtons  = allButtons.filter(function(s){ return irEids.has(s.entity_id); });
      cecButtons = allButtons.filter(function(s){ return cecEids.has(s.entity_id); });

    } else if (mhubEntityIds && mhubEntityIds.size > 0) {
      /* Partial fallback — we have entity IDs but not unique_ids.
         Use zone-slug heuristics within the mhub set. */
      const mhubButtons = allButtons.filter(function(s){ return mhubEntityIds.has(s.entity_id); });
      const allSourceNames = new Set();
      zones.forEach(function(z){ z.sources.forEach(function(s){ allSourceNames.add(s.name.toLowerCase()); }); });

      mhubButtons.forEach(function(s) {
        if (s.entity_id.match(/mhub_identify|mhub_reboot/)) return;
        const slug = s.entity_id.replace("button.", "");
        const name = (s.attributes.friendly_name || "").toLowerCase();
        if (zoneSlugs.some(function(zs){ return slug.startsWith(zs + "_"); })) {
          if (!allSourceNames.has(name)) irButtons.push(s);
        } else {
          seqButtons.push(s);
        }
      });

    } else {
      /* Last resort fallback — no registry data at all */
      const allSourceNames = new Set();
      zones.forEach(function(z){ z.sources.forEach(function(s){ allSourceNames.add(s.name.toLowerCase()); }); });

      allButtons.forEach(function(s) {
        if (s.entity_id.match(/mhub_identify|mhub_reboot/)) return;
        const slug = s.entity_id.replace("button.", "");
        const name = (s.attributes.friendly_name || "").toLowerCase();
        if (!slug.startsWith("mhub") && !name.startsWith("mhub")) return;
        if (zoneSlugs.some(function(zs){ return slug.startsWith(zs + "_"); })) {
          if (!allSourceNames.has(name)) irButtons.push(s);
        } else {
          seqButtons.push(s);
        }
      });
    }

    /* ── Group IR buttons by device name ── */
    const irMap = {};
    irButtons.forEach(function(btn) {
      /* Use the device name from registry if available — this is set by the integration
         to something like "Living Room (Output A) - Samsung TV" or "Source - Denon AVR" */
      const devName = (deviceNames && deviceNames[btn.entity_id]) || (function() {
        const slug5  = btn.entity_id.replace("button.", "");
        const zSlug  = zoneSlugs.find(function(zs){ return slug5.startsWith(zs + "_"); });
        const zone   = zSlug && zones.find(function(z){ return z.media_player.replace("media_player.","") === zSlug; });
        return zone ? (zone.label + " IR") : "IR";
      })();
      const groupKey = devName;
      if (!irMap[groupKey]) irMap[groupKey] = { name: devName, commands: [] };
      const cmdName = btn.attributes.friendly_name ||
                      btn.entity_id.replace("button.", "").replace(/_/g, " ").trim();
      irMap[groupKey].commands.push({ name: cmdName, entity: btn.entity_id });
    });

    /* ── Group CEC buttons ── */
    const cecMap = {};
    cecButtons.forEach(function(btn) {
      const slug6  = btn.entity_id.replace("button.", "");
      const zSlug2 = zoneSlugs.find(function(zs){ return slug6.startsWith(zs + "_"); });
      const zone2  = zSlug2 && zones.find(function(z){ return z.media_player.replace("media_player.","") === zSlug2; });
      const groupKey2 = zSlug2 || "cec";
      const devName2  = zone2 ? (zone2.label + " CEC") : "CEC";
      if (!cecMap[groupKey2]) cecMap[groupKey2] = { name: devName2, commands: [] };
      const cmdName2 = btn.attributes.friendly_name ||
                       slug6.replace((zSlug2 ? zSlug2 + "_" : ""), "").replace(/_/g, " ").trim();
      cecMap[groupKey2].commands.push({ name: cmdName2, entity: btn.entity_id });
    });

    /* ── Pull diagnostic values directly from status sensor attributes ──
       MHUBStatusSensor.extra_state_attributes = diagnostic_attrs() which contains:
       model, firmware, api_version, inputs, outputs, supports_volume, etc. */
    const diagAttrs = statS ? (statS.attributes || {}) : {};

    return {
      found:       zones.length > 0 || !!statS,
      /* Pass the status sensor entity_id for power-state reads */
      status:      statS   ? statS.entity_id  : null,
      power_switch:pwSw    ? pwSw.entity_id   : null,
      /* Diagnostic values — read directly from attributes, not separate sensors */
      _diagAttrs:  diagAttrs,
      zones:       zones,
      groups:      groups,
      sequences: seqButtons.map(function(b) {
        return {
          entity: b.entity_id,
          name:   (b.attributes.friendly_name || b.entity_id.replace("button.","").replace(/_/g," ")).replace(/^mhub /i,"").trim(),
          kind:   b.entity_id.includes("function") ? "function" : "sequence",
        };
      }),
      ir_devices:  Object.values(irMap),
      cec_devices: Object.values(cecMap),
    };
  }
  /* ═══════════════════════════════════════════════════════════
     EDITOR
  ═══════════════════════════════════════════════════════════ */
  class MhubCardEditor extends HTMLElement {
    setConfig(cfg) { this._cfg = cfg || {}; this._render(); }
    set hass(h)    { this._hass = h; this._render(); }

    /* Fire config-changed so HA saves the updated YAML */
    _save(cfg) {
      this._cfg = cfg;
      this.dispatchEvent(new CustomEvent("config-changed", { detail:{ config: cfg }, bubbles:true, composed:true }));
    }

    /* Upload a file to /local/mhub-icons/ via HA upload API, return the URL */
    async _upload(file) {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/hassio/homeassistant/api/file_upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${this._hass.auth.data.access_token}` },
        body: fd,
      }).catch(() => null);

      /* HA doesn't have a generic file-upload endpoint — use the /local/ static folder
         instead by uploading via the config/core/file_upload websocket approach.
         Simplest reliable method: convert to object URL stored in config as /local/ path.
         We actually POST to the HA file-upload endpoint properly: */
      const ext   = file.name.split(".").pop().toLowerCase();
      const slug  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
      const token = this._hass.auth.data.access_token;

      /* Use the /api/config/config_entries/... no — use the static /local/ upload.
         HA exposes POST /api/hassio/host/... no.
         The correct approach for uploading to /local/ is the hassio ingress or
         the config flow file step. Since neither is reliable here, we fall back to
         reading as data-URL and letting the user know to save manually if needed.
         ACTUALLY — HA 2023.9+ exposes POST /api/image/upload for image entities,
         but the canonical way to write to /local/ is via the File Editor or SSH.
         We'll use a known-working approach: the HA REST API file upload at
         /api/hassio/homeassistant/api/file_upload isn't standard.

         Best portable approach that works without add-ons:
         Read the file as a data URL (base64) and store it.
         BUT user asked for /local/ — so we'll attempt fetch upload and
         fall back to base64 if it fails, flagging clearly. */

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          /* Store as data URL — universally works, stored in card YAML config.
             We'll attempt to also write to /local/mhub-icons/ but that requires
             the file editor API or SSH. For now, data-URL is the reliable path. */
          resolve({ dataUrl: reader.result, slug });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    _render() {
      /* Don't rebuild while the user is actively typing — HA calls setConfig →
         _render on every config-changed event which destroys any focused input. */
      if (this.querySelector("input:focus, select:focus, textarea:focus")) return;

      const cfg   = this._cfg || {};
      const disc  = this._hass ? discoverMhub(this._hass, cfg.entry_id) : null;
      const found = disc && disc.found;

      /* Collect all unique source names across all zones */
      const sourceNames = [];
      if (disc) {
        const seen = new Set();
        disc.zones.forEach(z => {
          const sl = this._hass.states[z.media_player]?.attributes?.source_list || z.sources.map(s=>s.name);
          sl.forEach(n => { if (!seen.has(n)) { seen.add(n); sourceNames.push(n); } });
        });
      }

      const inputIcons = cfg.input_icons || {};

      this.innerHTML = `
        <style>
          .ed { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; padding:8px 0 16px; }
          .sec { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
                 color:var(--secondary-text-color,#888); margin:16px 0 8px; padding-bottom:6px;
                 border-bottom:1px solid var(--divider-color,#e0e0e0); }
          .row { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
          .rk  { color:var(--secondary-text-color,#888); }
          .rv  { color:var(--primary-text-color,#333); font-weight:500; }
          .ok  { color:#0f6e56; } .warn { color:#854f0b; }
          .field { margin-bottom:10px; }
          .field label { display:block; font-size:12px; color:var(--secondary-text-color,#888); margin-bottom:4px; }
          .field input { width:100%; padding:8px 10px; border-radius:6px;
                         border:1px solid var(--divider-color,#ccc);
                         background:var(--card-background-color,#fff);
                         color:var(--primary-text-color,#333); font-size:14px; font-family:inherit; }

          /* Input icon editor */
          .irow { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:9px 0;
                  border-bottom:1px solid var(--divider-color,rgba(0,0,0,.06)); }
          .irow:last-child { border-bottom:none; }
          .ipreview { width:40px; height:40px; border-radius:8px; flex-shrink:0;
                      display:flex; align-items:center; justify-content:center;
                      font-size:11px; font-weight:800; overflow:hidden;
                      border:1px solid var(--divider-color,rgba(0,0,0,.12)); }
          .ipreview img { width:100%; height:100%; object-fit:cover; border-radius:7px; }
          .iname { font-size:11px; color:var(--secondary-text-color,#888); white-space:nowrap;
                   overflow:hidden; text-overflow:ellipsis; max-width:90px; flex-shrink:0; }
          .irename { flex:1; min-width:90px; padding:5px 8px; border-radius:6px;
                     border:1px solid var(--divider-color,#ccc);
                     background:var(--card-background-color,#fff);
                     color:var(--primary-text-color,#333); font-size:13px; font-family:inherit; }
          .irename:focus { outline:none; border-color:var(--primary-color,#3b8aff); }
          .ibtn  { padding:4px 10px; border-radius:6px; border:1px solid var(--divider-color,#ccc);
                   background:transparent; color:var(--primary-text-color,#555);
                   font-size:12px; cursor:pointer; font-family:inherit; white-space:nowrap; }
          .ibtn:hover { border-color:var(--primary-color,#3b8aff); color:var(--primary-color,#3b8aff); }
          .ibtn.clr { color:#c0392b; border-color:#c0392b; }
          .ibtn.clr:hover { background:#fdf0ef; }
          .ifile { display:none; }
          .uploading { font-size:11px; color:var(--secondary-text-color,#888); }
        </style>
        <div class="ed">
          <div class="sec">Auto-discovery status</div>
          <div class="row"><span class="rk">MHUB detected</span>
            <span class="rv ${found?"ok":"warn"}">${found?"✓ Yes":"✗ Not found"}</span></div>
          ${found ? `
          <div class="row"><span class="rk">Outputs found</span><span class="rv">${disc.zones.length}</span></div>
          <div class="row"><span class="rk">Zones</span><span class="rv">${disc.zones.map(z=>z.label).join(", ")||"—"}</span></div>
          <div class="row"><span class="rk">Groups</span><span class="rv">${disc.groups.length||"0"}</span></div>
          <div class="row"><span class="rk">Sequences</span><span class="rv">${disc.sequences.length||"0"}</span></div>
          <div class="row"><span class="rk">IR devices</span><span class="rv">${disc.ir_devices.length||"0"}</span></div>
          ` : `<p style="font-size:13px;color:#888;margin-top:8px;line-height:1.5">
            Make sure the MHUB integration is installed and your hub is connected.</p>`}

          ${sourceNames.length ? `
          <div class="sec">Inputs — names, icons &amp; visibility</div>
          <p style="font-size:12px;color:var(--secondary-text-color,#888);margin-bottom:10px;line-height:1.5">
            Rename inputs (leave blank to use the name from MHUB), upload a custom image, or hide unused ones.
          </p>
          ${sourceNames.map(name => {
            const icon      = inputIcons[name];
            const alias     = (cfg.input_aliases || {})[name] || "";
            const hidden    = (cfg.hidden_inputs || []).includes(name);
            const b         = brand(name);
            let previewSrc  = "";
            if (icon && typeof icon === "string") {
              if (icon.startsWith("/api/image/serve/") || icon.startsWith("/local/") || icon.startsWith("data:")) {
                previewSrc = icon;
              } else if (icon.startsWith("mhub_icon_")) {
                try { previewSrc = localStorage.getItem(icon) || ""; } catch(_) {}
              } else if (icon.startsWith("{")) {
                try { previewSrc = JSON.parse(icon).dataUrl || ""; } catch(_) {}
              } else {
                previewSrc = icon.split("#mhub-")[0];
              }
            }
            const previewHtml = previewSrc
              ? `<img src="${x(previewSrc)}" alt="">`
              : `<span style="background:${b.bg};color:${b.fg};width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:7px;opacity:${hidden?0.35:1}">${x(b.t)}</span>`;
            return `<div class="irow" data-src="${x(name)}" style="opacity:${hidden?0.5:1}">
              <div class="ipreview">${previewHtml}</div>
              <span class="iname" title="${x(name)}">${x(name)}</span>
              <input type="text" class="irename" data-src="${x(name)}"
                     value="${x(alias)}" placeholder="${x(name)}">
              <input type="file" class="ifile" accept="image/*">
              <button class="ibtn upl-btn"${hidden?" disabled":""}>Image</button>
              ${icon ? `<button class="ibtn clr clr-btn">Clear</button>` : ""}
              <button class="ibtn hide-btn${hidden?" hide-on":""}" style="${hidden?"color:#3b8aff;border-color:#3b8aff":""}">${hidden?"Show":"Hide"}</button>
            </div>`;
          }).join("")}
          ` : ""}

          <div class="sec">Optional overrides</div>
          ${found && disc.zones.length ? `
          <p style="font-size:12px;color:var(--secondary-text-color,#888);margin-bottom:10px;line-height:1.5">
            Rename outputs. Leave blank to use the name from MHUB.
          </p>
          ${disc.zones.map(z => {
            const alias = (cfg.zone_aliases||{})[z.output] || "";
            return `<div class="field">
              <label>Output ${x(z.output)} · ${x(z.label)} — alias</label>
              <input type="text" class="zone-alias" data-output="${x(z.output)}"
                     value="${x(alias)}" placeholder="${x(z.label)}">
            </div>`;
          }).join("")}
          ` : ""}
          <div class="field">
            <label>Card title (leave blank for auto)</label>
            <input type="text" id="ov-title" value="${(cfg.title||"")}" placeholder="Auto-detected from your hub">
          </div>
          <div class="field">
            <label>Config entry ID (only needed for multiple hubs)</label>
            <input type="text" id="ov-entry" value="${(cfg.entry_id||"")}" placeholder="Leave blank for auto">
          </div>
        </div>`;

      /* ── Zone alias listeners ── */
      this.querySelectorAll(".zone-alias").forEach(el => {
        el.addEventListener("blur", () => {
          const c = Object.assign({}, this._cfg||{});
          const aliases = Object.assign({}, c.zone_aliases||{});
          const val = el.value.trim();
          if (val) aliases[el.dataset.output] = val;
          else delete aliases[el.dataset.output];
          if (!Object.keys(aliases).length) delete c.zone_aliases;
          else c.zone_aliases = aliases;
          this._save(c);
        });
      });

      /* ── Text field listeners ── */
      ["ov-title","ov-entry"].forEach(id => {
        const el = this.querySelector(`#${id}`);
        if (el) el.addEventListener("blur", () => {
          const c = Object.assign({}, this._cfg||{});
          c.title    = this.querySelector("#ov-title").value.trim()||undefined;
          c.entry_id = this.querySelector("#ov-entry").value.trim()||undefined;
          ["title","entry_id"].forEach(k => { if (!c[k]) delete c[k]; });
          this._save(c);
        });
      });

      /* ── Icon row listeners ── */
      this.querySelectorAll(".irow").forEach(row => {
        const srcName = row.dataset.src;
        const fileInput = row.querySelector(".ifile");
        const uplBtn    = row.querySelector(".upl-btn");
        const clrBtn    = row.querySelector(".clr-btn");

        /* Rename field — save alias on blur */
        const renameEl = row.querySelector(".irename");
        if (renameEl) renameEl.addEventListener("blur", () => {
          const c = Object.assign({}, this._cfg||{});
          const aliases = Object.assign({}, c.input_aliases||{});
          const val = renameEl.value.trim();
          if (val && val !== srcName) aliases[srcName] = val;
          else delete aliases[srcName];
          if (!Object.keys(aliases).length) delete c.input_aliases;
          else c.input_aliases = aliases;
          this._save(c);
        });

        /* "Choose image" opens the hidden file input */
        if (uplBtn) uplBtn.addEventListener("click", () => fileInput.click());

        /* File selected — upload to HA Image registry (server-side, all devices see it) */
        if (fileInput) fileInput.addEventListener("change", async () => {
          const file = fileInput.files[0];
          if (!file) return;

          uplBtn.textContent = "Uploading…";
          uplBtn.disabled = true;

          try {
            const token = this._hass.auth.data.access_token;

            /* ── Step 1: Create an image entity via the HA Image upload API.
                  POST /api/image/upload  (available in all HA installs since 2023.6)
                  Returns { id, content_type, ... }
                  The resulting URL /api/image/serve/{id}/512x512 is:
                    • stored server-side — survives reboots
                    • accessible from any device (phone, tablet, remote access)
                    • served through the same HA auth as the rest of the UI       */
            const fd = new FormData();
            fd.append("file", file, file.name);

            const resp = await fetch("/api/image/upload", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });

            if (!resp.ok) throw new Error(`HA image upload failed: ${resp.status}`);

            const data = await resp.json();
            /* data.id is the stable image entity ID, e.g. "abc123def456" */
            const iconUrl = `/api/image/serve/${data.id}/512x512`;

            /* ── Step 2: If there was a previous image for this input,
                  delete the old HA image entity to avoid orphans. */
            const prevRaw = (this._cfg.input_icons || {})[srcName];
            if (prevRaw && typeof prevRaw === "string") {
              const prevId = prevRaw.match(/\/api\/image\/serve\/([^/]+)\//)?.[1];
              if (prevId) {
                fetch(`/api/image/${prevId}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }).catch(() => {});   /* best-effort, don't block */
              }
              /* Also clean up any legacy localStorage token */
              if (prevRaw.startsWith("mhub_icon_")) {
                try { localStorage.removeItem(prevRaw); } catch(_) {}
              }
            }

            const c = Object.assign({}, this._cfg||{});
            c.input_icons = Object.assign({}, c.input_icons||{}, { [srcName]: iconUrl });
            this._save(c);
            this._render();   /* refresh preview */
          } catch(err) {
            uplBtn.textContent = "Image";
            uplBtn.disabled = false;
            console.error("MHUB icon upload failed:", err);
            /* Show a brief error message in the button */
            uplBtn.textContent = "Upload failed";
            setTimeout(() => { uplBtn.textContent = "Image"; }, 3000);
          }
        });

        /* "Hide / Show" toggles the input's visibility on the card */
        const hideBtn = row.querySelector(".hide-btn");
        if (hideBtn) hideBtn.addEventListener("click", () => {
          const c = Object.assign({}, this._cfg||{});
          const hidden = (c.hidden_inputs || []).slice();
          const idx = hidden.indexOf(srcName);
          if (idx === -1) hidden.push(srcName);
          else hidden.splice(idx, 1);
          if (hidden.length) c.hidden_inputs = hidden;
          else delete c.hidden_inputs;
          this._save(c);
          this._render();
        });
        if (clrBtn) clrBtn.addEventListener("click", () => {
          const c = Object.assign({}, this._cfg||{});
          const icons = Object.assign({}, c.input_icons||{});
          const raw = icons[srcName];
          if (raw && typeof raw === "string") {
            /* Delete the HA image entity if it was uploaded via Image API */
            const imgId = raw.match(/\/api\/image\/serve\/([^/]+)\//)?.[1];
            if (imgId) {
              const tok = this._hass.auth.data.access_token;
              fetch(`/api/image/${imgId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${tok}` },
              }).catch(() => {});
            }
            /* Clean up legacy localStorage token */
            if (raw.startsWith("mhub_icon_")) {
              try { localStorage.removeItem(raw); } catch(_) {}
            }
          }
          delete icons[srcName];
          if (!Object.keys(icons).length) delete c.input_icons;
          else c.input_icons = icons;
          this._save(c);
          this._render();
        });
      });
    }
  }

  customElements.define("mhub-card-editor", MhubCardEditor);

  /* ═══════════════════════════════════════════════════════════
     MAIN CARD
  ═══════════════════════════════════════════════════════════ */
  class MhubCard extends HTMLElement {
    constructor() {
      super();
      this._sh     = this.attachShadow({ mode:"open" });
      this._cfg    = {};
      this._hass   = null;
      this._disc   = null;   /* discovered config */
      this._page   = "switch";
      this._zone   = 0;
      this._ready  = false;
      this._drag   = {};     /* slider drag state */
    }

    static getConfigElement() { return document.createElement("mhub-card-editor"); }
    static getStubConfig()    { return { title: "" }; }

    setConfig(cfg) {
      const prev = this._cfg;
      this._cfg = cfg || {};
      /* Only do a full rebuild (which resets the card and re-fetches the registry)
         if this is the first load. For subsequent config-changed events fired by the
         editor (e.g. toggling a source icon or alias), just re-render the current page
         so the nav tabs and user's position in the card are preserved. */
      if (!this._ready) {
        if (this._hass) this._init();
      } else {
        this._live();
      }
    }

    set hass(h) {
      this._hass = h;
      if (!this._ready) this._init();
      else              this._live();
    }

    getCardSize() { return 6; }

    /* ─ helpers ─────────────────────────────────────────────── */
    _sv(id,fb) { return (id&&this._hass&&this._hass.states[id]) ? this._hass.states[id].state : (fb!==undefined?fb:""); }
    _attr(id,k,fb) { if (!id||!this._hass||!this._hass.states[id]) return fb; const v=this._hass.states[id].attributes[k]; return v!==undefined?v:fb; }
    _call(d,s,data) { if (this._hass) this._hass.callService(d,s,data); }
    _el(id) { return this._sh.getElementById(id); }

    /* Return the icon HTML for a source name.
       If a custom image is configured, renders an <img>.
       Otherwise falls back to the colour badge. */
    /* Extract the actual image URL from whatever format is stored in config.
       New format:  /api/image/serve/{id}/512x512  (HA Image API — server-side, all devices)
       Legacy:      mhub_icon_* localStorage token, plain data URL, /local/ path */
    _extractUrl(raw) {
      if (!raw) return null;
      if (typeof raw === "object" && raw.dataUrl) return raw.dataUrl;
      if (typeof raw === "string") {
        /* New format: HA Image API URL — just use it directly */
        if (raw.startsWith("/api/image/serve/")) return raw;
        /* /local/ path */
        if (raw.startsWith("/local/")) return raw;
        /* data URL */
        if (raw.startsWith("data:")) return raw;
        /* Legacy localStorage token */
        if (raw.startsWith("mhub_icon_")) {
          try { return localStorage.getItem(raw) || null; } catch(_) { return null; }
        }
        /* Legacy JSON wrapper */
        if (raw.startsWith("{")) {
          try { const p = JSON.parse(raw); return p.dataUrl || null; } catch(_) {}
        }
        /* Legacy fragment format */
        const stripped = raw.split("#mhub-")[0];
        if (stripped) return stripped;
      }
      return null;
    }

    /* Return display name for a zone — alias from config if set, else MHUB label */
    _zoneName(zone) {
      const aliases = this._cfg.zone_aliases || {};
      return aliases[zone.output] || zone.label || ("Output " + zone.output);
    }

    /* Return display name for an input — alias from config if set, else original MHUB name */
    _inputName(name) {
      if (!name) return name;
      return (this._cfg.input_aliases || {})[name] || name;
    }

    _srcIcon(name, cls) {
      const raw = (this._cfg.input_icons || {})[name];
      const url = this._extractUrl(raw);
      cls = cls || "sico";
      if (url) {
        return `<div class="${cls}" style="background:#08090d;overflow:hidden"><img src="${x(url)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" alt=""></div>`;
      }
      const b = brand(name);
      return `<div class="${cls}" style="background:${b.bg};color:${b.fg}">${b.t}</div>`;
    }

    /* Same but for the "now showing" 38×38 badge */
    _nowIcon(name) {
      const raw = (this._cfg.input_icons || {})[name];
      const url = this._extractUrl(raw);
      if (url) {
        return `<div class="now-ico" style="background:#08090d;overflow:hidden"><img src="${x(url)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" alt=""></div>`;
      }
      const b = brand(name||"?");
      return `<div class="now-ico" style="background:${b.bg};color:${b.fg}">${b.t}</div>`;
    }

    /* ─ build ───────────────────────────────────────────────── */
    _init() {
      if (!this._hass) return;
      if (this._initPending) return;   /* prevent concurrent inits */
      this._initPending = true;
      /* Preserve the current page so a config-changed rebuild doesn't jump back to "switch" */
      const savedPage = this._page || "switch";
      this._buildCard(new Set()).catch(() => {});
      this._page = savedPage;
      /* Re-apply the saved page so nav highlight and content are correct after rebuild */
      this._sh.querySelectorAll(".nb").forEach(n => n.classList.toggle("on", n.dataset.p === savedPage));
      this._sh.querySelectorAll(".pg").forEach(p => p.classList.toggle("on", p.id === "pg-" + savedPage));

      /* Fetch entity + device registry to reliably split sequences vs IR vs source buttons.
         Device identifiers from button.py:
           sequences  → hub device:  (DOMAIN, entry_id)
           IR buttons → (DOMAIN, {entry_id}_display_{device_key}) or (DOMAIN, {entry_id}_source_{device_key})
           CEC        → (DOMAIN, {entry_id}_cec_{zone_id})
           source btns→ (DOMAIN, {entry_id}_{zone_id})  (zone devices)
         Retried automatically if the WS call fails (e.g. when accessed off-network). */
      const _fetchRegistry = (attempt) => {
        attempt = attempt || 1;
        Promise.all([
          this._hass.callWS({ type: "config/entity_registry/list" }),
          this._hass.callWS({ type: "config/device_registry/list" }),
        ]).then(([entityEntries, deviceEntries]) => {
          /* Build map: device_id → identifier string */
          const deviceIdToIdentifier = {};
          (deviceEntries || []).forEach(function(d) {
            (d.identifiers || []).forEach(function(pair) {
              if (pair[0] === "mhub") deviceIdToIdentifier[d.id] = pair[1];
            });
          });

          /* Classify each mhub button entity by its device's identifier */
          const seqEids  = new Set();
          const irEids   = new Set();
          const cecEids  = new Set();
          const mhubEids = new Set();

          (entityEntries || []).filter(function(e){ return e.platform === "mhub"; }).forEach(function(e) {
            mhubEids.add(e.entity_id);
            if (e.domain !== "button") return;

            const devIdentifier = deviceIdToIdentifier[e.device_id] || "";

            /* IR device identifiers contain _display_ or _source_ (from _build_ir_buttons) */
            if (devIdentifier.includes("_display_") || devIdentifier.includes("_source_")) {
              irEids.add(e.entity_id);
            }
            /* CEC device identifiers contain _cec_ */
            else if (devIdentifier.includes("_cec_")) {
              cecEids.add(e.entity_id);
            }
            /* Hub device identifier = entry_id exactly (no suffix) → sequences + utility buttons */
            else {
              seqEids.add(e.entity_id);
            }
          }.bind(this));

          /* Build map: entity_id → device name (for IR grouping labels) */
          const deviceIdToName = {};
          (deviceEntries || []).forEach(function(d) {
            if (d.name) deviceIdToName[d.id] = d.name;
          });

          /* Build map: entity_id → device name */
          const entityDeviceNames = {};
          (entityEntries || []).filter(function(e){ return e.platform === "mhub"; }).forEach(function(e) {
            if (e.device_id && deviceIdToName[e.device_id]) {
              entityDeviceNames[e.entity_id] = deviceIdToName[e.device_id];
            }
          });

          this._mhubEntityIds   = mhubEids;
          this._mhubRegistry    = { seqEids, irEids, cecEids };
          this._deviceNames     = entityDeviceNames;
          this._disc = discoverMhub(this._hass, this._cfg.entry_id, mhubEids, { seqEids, irEids, cecEids }, entityDeviceNames);
          /* Restore the page the user was on before the registry fetch completed */
          this._page = savedPage;
          this._sh.querySelectorAll(".nb").forEach(n => n.classList.toggle("on", n.dataset.p === savedPage));
          this._sh.querySelectorAll(".pg").forEach(p => p.classList.toggle("on", p.id === "pg-" + savedPage));
          this._live();
        })
        .catch(() => {
          /* Registry unavailable (e.g. off-network, WS timeout).
             Retry up to 5 times with exponential backoff so the card
             self-heals when the connection is restored. */
          if (attempt < 5) {
            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
            setTimeout(() => {
              if (this._hass) _fetchRegistry(attempt + 1);
            }, delay);
          }
          /* The card already rendered with hass.states data — it just won't
             have sequence/IR classification until the registry comes back. */
        })
        .finally(() => { this._initPending = false; });
      };
      _fetchRegistry(1);
    }

    _buildCard(mhubEntityIds) {
      return new Promise((resolve) => {
        this._disc  = discoverMhub(this._hass, this._cfg.entry_id, mhubEntityIds, this._mhubRegistry || null, this._deviceNames || {});
        this._zone  = 0;
        const sh    = this._sh;
        sh.innerHTML= "";
        const style = document.createElement("style");
        style.textContent = CSS;
        sh.appendChild(style);
        const wrap = document.createElement("div");
        wrap.innerHTML = this._shell();
        sh.appendChild(wrap.firstElementChild);
        this._bindStatic();
        this._ready = true;
        this._live();
        resolve();
      });
    }

    _shell() {
      const d = this._disc || {};
      const pages = ["switch","volume","sequences","ir","diag"];
      const lbl   = {switch:"Switch",volume:"Volume",sequences:"Sequences",ir:"IR / CEC",diag:"Diagnostics"};
      const nav   = pages.map(p=>`<button class="nb${p===this._page?" on":""}" data-p="${p}">${I.navs[p]}${lbl[p]}</button>`).join("");
      return `<div class="card">
        <div class="hdr">
          <div class="hdr-logo">${I.logo}</div>
          <div style="flex:1;min-width:0">
            <div class="hdr-title" id="htitle">${x(this._cfg.title||d.title||"MHUB")}</div>
            <div class="hdr-sub"   id="hsub">HDANYWHERE</div>
          </div>
          <div class="pill on" id="spill"><span class="pdot"></span><span id="stxt">Online</span></div>
          ${d.power_switch?`<button class="pw-btn" id="pwbtn" title="System power">${I.power}</button>`:""}
        </div>
        <div class="nav">${nav}</div>
        <div class="pg on" id="pg-switch"><div class="zdrop-wrap"><select class="zdrop" id="zdrop"></select></div><div class="body" id="swb"></div></div>
        <div class="pg"    id="pg-volume"><div class="body" id="volb"></div></div>
        <div class="pg"    id="pg-sequences"><div class="body" id="seqb"></div></div>
        <div class="pg"    id="pg-ir"><div class="body" id="irb"></div></div>
        <div class="pg"    id="pg-diag"><div class="body" id="diagb"></div></div>
        <div class="ftr">
          <span class="finfo" id="ftxt">Updated just now</span>
          <button class="rbtn" id="rbtn">${I.ref} Refresh</button>
        </div>
      </div>`;
    }

    _bindStatic() {
      /* nav */
      this._sh.querySelectorAll(".nb").forEach(b => b.addEventListener("click", () => {
        this._page = b.dataset.p;
        this._sh.querySelectorAll(".nb").forEach(n => n.classList.toggle("on", n.dataset.p===this._page));
        this._sh.querySelectorAll(".pg").forEach(p => p.classList.toggle("on", p.id==="pg-"+this._page));
        this._renderPage();
      }));
      /* power */
      const pw = this._el("pwbtn");
      if (pw) pw.addEventListener("click", () => {
        const eid = this._disc && this._disc.power_switch;
        if (!eid) return;
        const on = this._sv(eid,"on")==="on";
        this._call("switch", on?"turn_off":"turn_on", {entity_id:eid});
      });
      /* refresh */
      const rb = this._el("rbtn");
      if (rb) rb.addEventListener("click", () => {
        /* re-discover in case integration reloaded */
        this._disc = discoverMhub(this._hass, this._cfg.entry_id, this._mhubEntityIds || new Set(), this._mhubRegistry || null, this._deviceNames || {});
        this._renderPage();
        const f = this._el("ftxt"); if (f) f.textContent = "Updated just now";
      });
    }

    /* ─ live update ─────────────────────────────────────────── */
    _live() {
      if (!this._ready) return;
      const d = this._disc;

      /* header */
      const sub = this._el("hsub");
      if (sub && d) {
        /* Read live from status sensor attributes if available, fall back to discovery cache */
        const statusState = d.status ? (this._hass?.states[d.status] || null) : null;
        const attrs = statusState ? (statusState.attributes || {}) : (d._diagAttrs || {});
        const m = attrs.model || "", f = attrs.firmware || "";
        const ins = attrs.inputs != null ? String(attrs.inputs) : "";
        const outs = attrs.outputs != null ? String(attrs.outputs) : "";
        let s = "HDANYWHERE";
        if (m)  s += " · " + m;
        if (f)  s += " · fw " + f;
        if (ins && outs) s += ` · ${ins}×${outs}`;
        sub.textContent = s;
      }

      /* power pill */
      const isOn = !d?.power_switch || this._sv(d.power_switch,"on")==="on";
      const pill = this._el("spill"), ptxt = this._el("stxt");
      if (pill) pill.className = "pill "+(isOn?"on":"off");
      if (ptxt) ptxt.textContent = isOn?"Online":"Standby";

      this._renderPage();
    }

    _renderPage() {
      const p = this._page;
      if (p==="switch")    this._sw();
      if (p==="volume")    this._vol();
      if (p==="sequences") this._seq();
      if (p==="ir")        this._ir();
      if (p==="diag")      this._diag();
    }

    /* ═══ SWITCH ═════════════════════════════════════════════ */
    _sw() {
      const d    = this._disc;
      const body = this._el("swb");

      if (!d || !d.zones.length) {
        if (body) body.innerHTML = '<div class="empty">No MHUB output zones found.<br>Check the MHUB integration is connected.</div>';
        return;
      }
      const zone = d.zones[this._zone] || d.zones[0];

      /* Zone dropdown — rebuild options only when zone count changes */
      const drop = this._el("zdrop");
      if (drop) {
        if (drop.options.length !== d.zones.length) {
          drop.innerHTML = d.zones.map((z,i) => {
            const label = this._zoneName(z);
            return `<option value="${i}">Output ${x(z.output||String.fromCharCode(65+i))} · ${x(label)}</option>`;
          }).join("");
          drop.addEventListener("change", () => {
            this._zone = parseInt(drop.value);
            const swBody = this._el("swb"); if (swBody) swBody.innerHTML = "";
            this._sw();
          });
        }
        drop.value = String(this._zone);
      }

      /* Get live data from media_player */
      const hiddenInputs = new Set(this._cfg.hidden_inputs || []);
      const sourceList = (this._attr(zone.media_player,"source_list",[]) || zone.sources.map(s=>s.name))
                          .filter(n => !hiddenInputs.has(n));
      const cur        = this._attr(zone.media_player,"source","") || this._sv(zone.source_sensor,"");
      const muted      = zone.mute_switch ? this._sv(zone.mute_switch,"off")==="on" : false;

      /* If body has source grid already — patch in place (no flicker) */
      if (body && body.querySelector(".sgrid")) {
        const ico = body.querySelector(".now-ico");
        const nv  = body.querySelector(".now-val");
        if (ico)  ico.outerHTML = this._nowIcon(cur||"?");
        if (nv)   nv.textContent = cur ? this._inputName(cur) : "—";
        const mb = body.querySelector("#mbtn");
        if (mb) { mb.className="mb"+(muted?" muted":""); mb.innerHTML=(muted?I.voff:I.von)+" "+(muted?"Unmute":"Mute"); }
        body.querySelectorAll(".sbtn[data-src]").forEach(btn => {
          const isOn = cur && btn.dataset.src === cur;
          btn.classList.toggle("on", !!isOn);
          const sn = btn.querySelector(".sname"); if (sn) sn.style.color = isOn ? "#3b8aff" : "";
        });
        return;
      }

      /* Full build — first render or after zone tab change */
      if (!body) return;
      const out      = x(zone.output||"?");
      const zoneName = x(this._zoneName(zone));

      const srcHTML = sourceList.length
        ? sourceList.map(name => {
            const act = cur && cur === name;
            return '<button class="sbtn'+(act?" on":"")+'" data-src="'+x(name)+'">'
              + this._srcIcon(name)
              +'<span class="sname">'+x(this._inputName(name))+'</span>'
              +'</button>';
          }).join("")
        : '<div class="empty">No inputs found — check your MHUB hub is connected.</div>';

      body.innerHTML =
        '<div class="now">'
          + this._nowIcon(cur||"?")
          +'<div class="sp">'
            +'<div class="now-lbl">Now showing</div>'
            +'<div class="now-val">'+(cur ? x(this._inputName(cur)) : "—")+'</div>'
          +'</div>'
          +'<div class="now-r">'
            +'<div class="now-lbl">Output</div>'
            +'<div class="now-val">'+out+' &middot; '+zoneName+'</div>'
          +'</div>'
          +(zone.mute_switch
            ? '<button class="mb'+(muted?" muted":"")+'" id="mbtn">'+(muted?I.voff:I.von)+" "+(muted?"Unmute":"Mute")+'</button>'
            : "")
        +'</div>'
        +'<div class="slbl">Switch source &rarr; Output '+out+'</div>'
        +'<div class="sgrid">'+srcHTML+'</div>';

      const mb2 = body.querySelector("#mbtn");
      if (mb2) mb2.addEventListener("click", () => {
        const on=this._sv(zone.mute_switch,"off")==="on";
        this._call("switch",on?"turn_off":"turn_on",{entity_id:zone.mute_switch});
      });

      body.querySelectorAll(".sbtn[data-src]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (!zone.media_player) return;
          const src = btn.dataset.src;
          /* Optimistic instant UI — no waiting for HA poll */
          body.querySelectorAll(".sbtn").forEach(b => {
            b.classList.remove("on");
            const sn=b.querySelector(".sname"); if(sn) sn.style.color="";
          });
          btn.classList.add("on");
          const sn3=btn.querySelector(".sname"); if(sn3) sn3.style.color="#3b8aff";
          const nv2=body.querySelector(".now-val"); if(nv2) nv2.textContent=this._inputName(src);
          const ico2=body.querySelector(".now-ico");
          if (ico2) ico2.outerHTML = this._nowIcon(src);
          this._call("media_player","select_source",{entity_id:zone.media_player,source:src});
        });
      });
    }

    /* ═══ VOLUME ═════════════════════════════════════════════ */
    _vol() {
      const body = this._el("volb");
      if (!body) return;
      const d = this._disc;
      const zones  = (d?.zones  ||[]).filter(z=>z.volume_entity);
      const groups = (d?.groups ||[]).filter(g=>g.volume_entity);

      /* patch existing sliders in-place without rebuild */
      if (body.querySelector(".vs")) {
        body.querySelectorAll(".vs").forEach(sl => {
          if (this._drag[sl.dataset.key]) return;
          const v = Math.round(parseFloat(this._sv(sl.dataset.entity,"0"))||0);
          sl.value = v;
          const dv = body.querySelector(`#vv-${sl.dataset.key}`); if (dv) dv.textContent=v;
        });
        body.querySelectorAll(".mb[data-meid]").forEach(btn => {
          const on = this._sv(btn.dataset.meid,"off")==="on";
          btn.className = "mb"+(on?" muted":"");
          btn.innerHTML = (on?I.voff:I.von)+" "+(on?"Unmute":"Mute");
        });
        return;
      }

      if (!zones.length&&!groups.length) { body.innerHTML=`<div class="empty">No volume entities found.</div>`; return; }

      const vrow = (key,lbl,val,eid,meid,muted) => {
        let h=`<div class="vrow">
          <span class="vlbl">${x(lbl)}</span>
          <input class="vs" type="range" min="0" max="100" step="1" value="${val}" data-entity="${eid}" data-key="${key}">
          <span class="vv" id="vv-${key}">${val}</span>
        </div>`;
        if (meid) h+=`<div class="vrow" style="margin-bottom:6px">
          <span class="vlbl" style="font-size:11px;color:#3a4060">Mute</span>
          <button class="mb${muted?" muted":""}" data-meid="${meid}">${muted?I.voff:I.von} ${muted?"Unmute":"Mute"}</button>
        </div>`;
        return h;
      };

      let html="";
      if (zones.length) {
        html+=`<div class="slbl">Zone volumes</div>`;
        zones.forEach((z,i)=>{
          const v=Math.round(parseFloat(this._sv(z.volume_entity,"0"))||0);
          const m=z.mute_switch?this._sv(z.mute_switch,"off")==="on":false;
          html+=vrow(`z${i}`,z.label||"Zone "+(i+1),v,z.volume_entity,z.mute_switch,m);
        });
      }
      if (groups.length) {
        if (zones.length) html+=`<div class="div"></div>`;
        html+=`<div class="slbl">Group volumes</div>`;
        groups.forEach((g,i)=>{
          const v=Math.round(parseFloat(this._sv(g.volume_entity,"0"))||0);
          const m=g.mute_switch?this._sv(g.mute_switch,"off")==="on":false;
          html+=vrow(`g${i}`,g.label||"Group "+(i+1),v,g.volume_entity,g.mute_switch,m);
        });
      }
      body.innerHTML = html;

      body.querySelectorAll(".vs").forEach(sl => {
        const key=sl.dataset.key;
        sl.addEventListener("mousedown",  ()=>{ this._drag[key]=true; });
        sl.addEventListener("touchstart", ()=>{ this._drag[key]=true; },{passive:true});
        sl.addEventListener("input",  ()=>{ const d=body.querySelector(`#vv-${key}`); if(d)d.textContent=sl.value; });
        sl.addEventListener("change", ()=>{ this._drag[key]=false; this._call("number","set_value",{entity_id:sl.dataset.entity,value:parseFloat(sl.value)}); });
        sl.addEventListener("mouseup",  ()=>{ this._drag[key]=false; });
        sl.addEventListener("touchend", ()=>{ this._drag[key]=false; });
      });
      body.querySelectorAll(".mb[data-meid]").forEach(btn => btn.addEventListener("click", ()=>{
        const on=this._sv(btn.dataset.meid,"off")==="on";
        this._call("switch",on?"turn_off":"turn_on",{entity_id:btn.dataset.meid});
      }));
    }

    /* ═══ SEQUENCES ══════════════════════════════════════════ */
    _seq() {
      const body = this._el("seqb");
      if (!body) return;
      /* Only skip rebuild if we have real sequence buttons rendered already */
      if (body.querySelector(".seqb")) return;
      const seqs = this._disc?.sequences||[];
      if (!seqs.length) { body.innerHTML=`<div class="empty">No sequences found.<br>Create sequences in the MHUB app — they appear here automatically.</div>`; return; }
      const norm=seqs.filter(s=>s.kind==="sequence"||!s.kind);
      const fns =seqs.filter(s=>s.kind==="function");
      let html="";
      if (norm.length) { html+=`<div class="slbl">Sequences</div><div class="seqg">`; norm.forEach(s=>{html+=`<button class="seqb" data-eid="${x(s.entity)}">${I.play}${x(s.name)}</button>`;}); html+=`</div>`; }
      if (fns.length)  { if(norm.length)html+=`<div class="div"></div>`; html+=`<div class="slbl">Functions</div><div class="seqg">`; fns.forEach(s=>{html+=`<button class="seqb" data-eid="${x(s.entity)}">${I.fn}${x(s.name)}</button>`;}); html+=`</div>`; }
      body.innerHTML=html;
      body.querySelectorAll(".seqb").forEach(btn=>btn.addEventListener("click",()=>{
        if(btn.dataset.eid) this._call("button","press",{entity_id:btn.dataset.eid});
        btn.classList.add("fired"); setTimeout(()=>btn.classList.remove("fired"),1200);
      }));
    }

    /* ═══ IR / CEC ═══════════════════════════════════════════ */
    _ir() {
      const body = this._el("irb");
      if (!body) return;
      const irs  = this._disc?.ir_devices ||[];
      const cecs = this._disc?.cec_devices||[];

      /* Only skip rebuild if we already have real IR buttons rendered.
         Do NOT bail if body only has the empty-state div — the async
         registry fetch may not have completed yet when we first render. */
      if (body.querySelector(".irdev")) return;
      if (!irs.length&&!cecs.length) { body.innerHTML=`<div class="empty">No IR or CEC devices found.<br>Make sure IR packs are assigned to ports in the MHUB app, then reload the integration.</div>`; return; }
      const block=(devs,lbl)=>{
        let h=`<div class="slbl">${lbl}</div>`;
        devs.forEach(d=>{
          h+=`<div class="irdev"><div class="irdname">${x(d.name)}</div><div class="irg">`;
          (d.commands||[]).forEach(c=>{h+=`<button class="irb" data-eid="${x(c.entity)}">${x(c.name)}</button>`;});
          h+=`</div></div>`;
        });
        return h;
      };
      let html="";
      if (irs.length)  html+=block(irs,"IR commands");
      if (cecs.length) { if(irs.length)html+=`<div class="div"></div>`; html+=block(cecs,"CEC commands"); }
      body.innerHTML=html;
      body.querySelectorAll(".irb").forEach(btn=>btn.addEventListener("click",()=>{
        if(btn.dataset.eid) this._call("button","press",{entity_id:btn.dataset.eid});
        btn.classList.add("fired"); setTimeout(()=>btn.classList.remove("fired"),700);
      }));
    }

    /* ═══ DIAGNOSTICS ════════════════════════════════════════ */
    _diag() {
      const body = this._el("diagb");
      if (!body) return;
      const d    = this._disc;

      /* MHUBStatusSensor puts all diagnostic_attrs() into extra_state_attributes.
         Re-read live from hass.states so firmware/model updates propagate. */
      const statusState = d?.status ? (this._hass?.states[d?.status] || null) : null;
      const attrs = statusState ? (statusState.attributes || {}) : (d?._diagAttrs || {});

      const isOn = !d?.power_switch || this._sv(d.power_switch,"on")==="on";
      const mdl  = attrs.model        || "—";
      const fw   = attrs.firmware     || "—";
      const api  = attrs.api_version  || "—";
      const ins  = attrs.inputs  != null ? String(attrs.inputs)  : "—";
      const outs = attrs.outputs != null ? String(attrs.outputs) : "—";
      /* Hub name/serial come from status sensor state attributes too */
      const statAttrs = d?.status ? (this._hass?.states[d.status]?.attributes || {}) : {};
      const hubName   = statAttrs.name || "—";
      const serial    = statAttrs.serial_number || "—";

      body.innerHTML=`
        <div class="dgrid">
          <div class="dcell"><div class="dkey">Status</div><div class="dval ${isOn?"ok":"warn"}">${isOn?"Online":"Standby"}</div></div>
          <div class="dcell"><div class="dkey">Model</div><div class="dval">${x(mdl)}</div></div>
          <div class="dcell"><div class="dkey">Inputs</div><div class="dval">${x(ins)}</div></div>
          <div class="dcell"><div class="dkey">Outputs</div><div class="dval">${x(outs)}</div></div>
        </div>
        <div class="div"></div>
        <div class="drow"><span class="dk">Hub name</span><span class="dv">${x(hubName)}</span></div>
        <div class="drow"><span class="dk">Firmware</span><span class="dv">${x(fw)}</span></div>
        <div class="drow"><span class="dk">API version</span><span class="dv">${x(api)}</span></div>
        <div class="drow"><span class="dk">Serial number</span><span class="dv">${x(serial)}</span></div>
        <div class="drow"><span class="dk">Zones discovered</span><span class="dv">${d?.zones?.length||0}</span></div>
        <div class="drow"><span class="dk">Sequences found</span><span class="dv">${d?.sequences?.length||0}</span></div>`;
    }
  }

  /* ─ util ─────────────────────────────────────────────────── */
  function x(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  customElements.define("mhub-card", MhubCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "mhub-card",
    name: "MHUB Card",
    description: "Self-configuring card for the MHUB matrix switcher. No setup needed.",
    preview: true,
    documentationURL: "https://github.com/yourusername/mhub-card",
  });

  console.info(
    "%c MHUB-CARD %c v5.2.0 ",
    "background:#3b8aff;color:#fff;font-weight:bold;padding:2px 4px;border-radius:4px 0 0 4px",
    "background:#0d0f14;color:#3b8aff;font-weight:bold;padding:2px 4px;border-radius:0 4px 4px 0"
  );
})();
