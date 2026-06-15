// THE DALWADI FOUNDATION - staff portal (client). Talks to /api/* (Cloudflare Pages Functions).
// Auth is handled server-side; this only renders state returned by the API.
(function(){
  "use strict";
  var root = document.getElementById('portal-root');
  if (!root) return;
  var OWNER = "pjbrahm369@gmail.com";
  var state: any = { me: null, content: null, users: [] };

  // The site font is whatever staff type into Dev tools (any Google Fonts family).
  // This is only the fallback shown when nothing has been set yet.
  var DEFAULT_FONT = { label: "Cormorant", family: "Cormorant", stack: '"Cormorant", Georgia, serif' };
  function applyFont(f: any){
    if (!f || !f.stack) return;
    var fam = (f.family || "").trim();
    if (fam){
      var id = "font-" + fam.replace(/\s+/g, "-");
      if (!document.getElementById(id)){
        var l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=" + fam.replace(/\s+/g, "+") + ":wght@300;400;500;600;700&display=swap";
        document.head.appendChild(l);
      }
    }
    document.documentElement.style.setProperty("--font", f.stack);
  }
  function applyLogo(src: string){
    Array.prototype.forEach.call(document.querySelectorAll('.brandmark'), function(img: any){ img.setAttribute('src', src); });
    var link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link){ link = document.createElement('link'); link.setAttribute('rel', 'icon'); document.head.appendChild(link); }
    link.setAttribute('href', src);
  }

  function esc(s: any){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" } as any)[c]; }); }
  function api(path: string, opts?: any){ return fetch(path, Object.assign({ credentials: "same-origin", headers: { "Content-Type": "application/json" } }, opts || {})); }
  function toast(msg: string){ var t = document.getElementById('toast')!; t.textContent = msg; t.classList.add('is-on'); setTimeout(function(){ t.classList.remove('is-on'); }, 2200); }

  // ---------- sheet (overlay) ----------
  var veil = document.getElementById('sheet-veil')!;
  function openSheet(html: string){
    var s = document.createElement('div'); s.className = 'sheet'; s.id = 'sheet'; s.innerHTML = html;
    document.body.appendChild(s); veil.classList.add('is-on');
  }
  function closeSheet(){ var s = document.getElementById('sheet'); if (s) s.remove(); veil.classList.remove('is-on'); }
  veil.addEventListener('click', closeSheet);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });

  // ---------- boot ----------
  api('/api/auth/me').then(function(r){ return r.ok ? r.json() : null; }).then(function(me){
    state.me = me && me.email ? me.email : null;
    if (!state.me) return renderSignin();
    return api('/api/content').then(function(r){ return r.json(); }).then(function(c){ state.content = c; applyFont(c && c.settings && c.settings.font); renderPortal(); });
  }).catch(function(){ renderSignin(); });

  function renderSignin(){
    root.innerHTML =
      '<div class="signin">' +
        '<p>This area is for foundation staff. Sign in with your authorized Google account to manage the site.</p>' +
        '<a class="metal metal--dark" href="/api/auth/login">Sign in with Google</a>' +
        (location.search.indexOf('unauthorized') > -1 ? '<p class="note" style="color:#cf4b4b">That account isn’t on the authorized list.</p>' : '') +
      '</div>';
    rebindMetal();
  }

  function renderPortal(){
    root.innerHTML =
      '<div class="portal__head">' +
        '<h1 class="portal__title">Staff Portal</h1>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<span class="portal__who">' + esc(state.me) + '</span>' +
          '<a class="metal metal--sm" href="/api/auth/logout">Sign out</a>' +
        '</div>' +
      '</div>' +
      '<div class="tiles">' +
        tile('pillars', 'Pillars', 'Edit copy &amp; links, or add a pillar') +
        tile('about', 'About page', 'Edit the About story') +
        tile('contribute', 'Contribute', 'Opens Zeffy donations in a new tab') +
        tile('docs', 'Official Documents', 'Upload PDFs, DOCs, or links') +
        tile('announce', 'Announcements', 'Banner across the top of the homepage') +
        tile('dev', 'Dev tools', 'Status &amp; authorized users', true) +
      '</div>';
    rebindMetal();
    root.querySelector('[data-tile=pillars]')!.addEventListener('click', openPillars);
    root.querySelector('[data-tile=about]')!.addEventListener('click', openAbout);
    root.querySelector('[data-tile=contribute]')!.addEventListener('click', function(){ window.open('https://www.zeffy.com', '_blank', 'noopener'); });
    root.querySelector('[data-tile=docs]')!.addEventListener('click', openDocs);
    root.querySelector('[data-tile=announce]')!.addEventListener('click', openAnnouncements);
    root.querySelector('[data-tile=dev]')!.addEventListener('click', openDev);
  }
  function tile(key: string, t: string, d: string, dark?: boolean){
    return '<button type="button" class="metal tile ' + (dark ? 'metal--dark' : '') + '" data-tile="' + key + '">' +
      '<span class="tile__t">' + t + '</span><span class="tile__d">' + d + '</span></button>';
  }

  function saveContent(after?: () => void){
    api('/api/content', { method: 'PUT', body: JSON.stringify(state.content) }).then(function(r){
      if (r.ok){ toast('Saved'); if (after) after(); } else { toast('Save failed'); }
    }).catch(function(){ toast('Save failed'); });
  }

  // ---------- PILLARS ----------
  function openPillars(){
    var html = '<h2>Pillars</h2><div id="pillars-list"></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="add-pillar">+ Add pillar</button></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--dark" id="save-pillars">Save</button>' +
      '<button type="button" class="metal metal--sm" id="cancel">Cancel</button></div>';
    openSheet(html);
    renderPillars(state.content.pillars || []);
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    document.getElementById('add-pillar')!.addEventListener('click', function(){
      var arr = readPillars(); arr.push({ key: 'pillar' + (arr.length + 1), name: '', title: '', body: '', links: [] }); renderPillars(arr);
    });
    document.getElementById('save-pillars')!.addEventListener('click', function(){
      state.content.pillars = readPillars(); saveContent(closeSheet);
    });
  }
  function renderPillars(arr: any[]){
    var box = document.getElementById('pillars-list')!;
    box.innerHTML = arr.map(function(p, i){
      return '<div class="subblock" data-pi="' + i + '" data-key="' + esc(p.key || '') + '">' +
        '<div class="field"><label>Name (tower label)</label><input data-f="name" value="' + esc(p.name) + '"></div>' +
        '<div class="field"><label>Title</label><input data-f="title" value="' + esc(p.title) + '"></div>' +
        '<div class="field"><label>Body</label><textarea data-f="body">' + esc(p.body) + '</textarea></div>' +
        '<label>Links</label><div class="links">' +
          (p.links || []).map(function(l: any, j: number){ return linkRow(l, j); }).join('') +
        '</div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm add-link">+ Link</button></div>' +
        '<label>Impact cards</label>' +
        '<p class="note">Number cards (a stat and a label) and text cards (a paragraph), shown on the impact subpage for this pillar.</p>' +
        '<div class="impacts">' +
          (p.impact || []).map(function(c: any, k: number){ return impactRow(c, k); }).join('') +
        '</div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm add-impact-stat">+ Number card</button>' +
        '<button type="button" class="metal metal--sm add-impact-text">+ Text card</button></div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm rm-pillar" style="color:#cf4b4b">Remove pillar</button></div>' +
      '</div>';
    }).join('');
    rebindMetal();
    Array.prototype.forEach.call(box.querySelectorAll('.add-link'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); var i = +b.closest('.subblock').getAttribute('data-pi'); arr2[i].links.push({ label: '', href: '', ghost: false }); renderPillars(arr2); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.add-impact-stat'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); var i = +b.closest('.subblock').getAttribute('data-pi'); (arr2[i].impact = arr2[i].impact || []).push({ stat: '', label: '' }); renderPillars(arr2); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.add-impact-text'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); var i = +b.closest('.subblock').getAttribute('data-pi'); (arr2[i].impact = arr2[i].impact || []).push({ text: '' }); renderPillars(arr2); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.rm-impact'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); var i = +b.closest('.subblock').getAttribute('data-pi'); arr2[i].impact.splice(+b.getAttribute('data-ik'), 1); renderPillars(arr2); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.rm-pillar'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); arr2.splice(+b.closest('.subblock').getAttribute('data-pi'), 1); renderPillars(arr2); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.rm-link'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); var i = +b.closest('.subblock').getAttribute('data-pi'); arr2[i].links.splice(+b.getAttribute('data-j'), 1); renderPillars(arr2); });
    });
  }
  function linkRow(l: any, j: number){
    return '<div class="linkrow" data-j="' + j + '">' +
      '<input data-lf="label" placeholder="Label" value="' + esc(l.label) + '">' +
      '<input data-lf="href" placeholder="https://" value="' + esc(l.href) + '">' +
      '<button type="button" class="btn-x rm-link" data-j="' + j + '">remove</button></div>';
  }
  function impactRow(c: any, k: number){
    var isText = c && c.text !== undefined && c.stat === undefined && c.label === undefined;
    if (isText){
      return '<div class="impactrow" data-ik="' + k + '" data-ct="text">' +
        '<textarea data-if="text" placeholder="Paragraph of impact text">' + esc(c.text) + '</textarea>' +
        '<button type="button" class="btn-x rm-impact" data-ik="' + k + '">remove</button></div>';
    }
    return '<div class="impactrow" data-ik="' + k + '" data-ct="stat">' +
      '<input data-if="stat" placeholder="Stat (e.g. $250K)" value="' + esc(c && c.stat) + '">' +
      '<input data-if="label" placeholder="Label (e.g. Communities reached)" value="' + esc(c && c.label) + '">' +
      '<button type="button" class="btn-x rm-impact" data-ik="' + k + '">remove</button></div>';
  }
  function readPillars(){
    return Array.prototype.map.call(document.querySelectorAll('#pillars-list .subblock'), function(b: any){
      var f: any = {};
      Array.prototype.forEach.call(b.querySelectorAll('[data-f]'), function(el: any){ f[el.getAttribute('data-f')] = el.value; });
      var links = Array.prototype.map.call(b.querySelectorAll('.linkrow'), function(row: any){
        var lab = row.querySelector('[data-lf=label]').value, href = row.querySelector('[data-lf=href]').value;
        return { label: lab, href: href };
      }).filter(function(l: any){ return l.label || l.href; });
      var impact = Array.prototype.map.call(b.querySelectorAll('.impacts .impactrow'), function(row: any){
        if (row.getAttribute('data-ct') === 'text'){ var t = row.querySelector('[data-if=text]'); return { text: t ? t.value : '' }; }
        var s = row.querySelector('[data-if=stat]'), l = row.querySelector('[data-if=label]');
        return { stat: s ? s.value : '', label: l ? l.value : '' };
      }).filter(function(c: any){ return (c.text && c.text.trim()) || (c.stat && c.stat.trim()) || (c.label && c.label.trim()); });
      // Keep the existing key stable so live.ts can still match this pillar by its
      // baked data-p key after a rename. Only derive a key when none exists yet (a
      // brand-new pillar, which needs a rebuild to appear as a column anyway).
      var key = b.getAttribute('data-key') || (f.name || 'pillar').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'pillar';
      return { key: key, name: f.name, title: f.title, body: f.body, links: links, impact: impact };
    });
  }

  // ---------- ANNOUNCEMENTS ----------
  function openAnnouncements(){
    var a: any = (state.content.settings && state.content.settings.announcement) || {};
    openSheet('<h2>Announcements</h2>' +
      '<p class="note">Shows as a bar across the very top of the homepage. Clear the text to hide the bar.</p>' +
      field('Announcement text', 'ann-text', a.text || '', true) +
      field('Link (optional, https://...)', 'ann-href', a.href || '') +
      '<div class="sheet__row"><button type="button" class="metal metal--dark" id="save">Save</button>' +
      '<button type="button" class="metal metal--sm" id="cancel">Cancel</button></div>');
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    document.getElementById('save')!.addEventListener('click', function(){
      state.content.settings = state.content.settings || {};
      state.content.settings.announcement = { text: val('ann-text').trim(), href: val('ann-href').trim() };
      saveContent(closeSheet);
    });
  }

  // ---------- ABOUT ----------
  function openAbout(){
    var a = state.content.about || {};
    openSheet('<h2>About page</h2>' +
      field('Title', 'a-title', a.title) +
      field('Lede', 'a-lede', a.lede, true) +
      field('Body (one paragraph per line)', 'a-body', (a.body || []).join('\n\n'), true) +
      '<h3>Team / About us</h3><div id="team-list"></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="add-member">+ Add member</button></div>' +
      '<h3>Custom sections</h3>' +
      '<p class="note">Extra blocks shown on the About page after the intro. Select text and use the toolbar to format it.</p>' +
      '<div id="sections-list"></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="add-section">+ Add section</button></div>' +
      '<h3>Photo gallery</h3>' +
      '<p class="note">Shown along the sides of the About page. Up to 30 photos, 5 MB each. Photos are optimized to AVIF in your browser before upload when it is supported. Changes here save immediately.</p>' +
      '<div id="gallery-grid" class="gallery-admin"><p class="note">Loading…</p></div>' +
      '<div class="field"><label>Add photos</label><input id="gallery-file" type="file" accept="image/*" multiple></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="gallery-add">Add photos</button></div>' +
      '<div class="field"><label>Carousel scroll speed <span class="note" id="gallery-speed-note"></span></label>' +
      '<input id="gallery-speed" type="range" min="15" max="130" step="5" value="55">' +
      '<span class="note">Drag left for faster, right for slower. Saves when you let go.</span></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--dark" id="save">Save</button>' +
      '<button type="button" class="metal metal--sm" id="cancel">Cancel</button></div>');
    renderTeam(state.content.team || []);
    try { document.execCommand('styleWithCSS', false, false); } catch (e) {} // formatting uses tags, not inline styles
    renderSections((a as any).sections || []);
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    document.getElementById('add-member')!.addEventListener('click', function(){ var t = readTeam(); t.push({ name: '', title: '', photo: '', bio: '' }); renderTeam(t); });
    document.getElementById('add-section')!.addEventListener('click', function(){ var s = readSections(); s.push({ heading: '', html: '' }); renderSections(s); });
    loadGalleryAdmin();
    document.getElementById('gallery-add')!.addEventListener('click', uploadGalleryFiles);
    var speedEl = document.getElementById('gallery-speed') as HTMLInputElement;
    if (speedEl){ speedEl.addEventListener('input', updateGallerySpeedNote); speedEl.addEventListener('change', saveGallerySpeed); }
    document.getElementById('save')!.addEventListener('click', function(){
      state.content.about = {
        kicker: a.kicker || 'About',
        title: val('a-title'), lede: val('a-lede'),
        body: val('a-body').split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean),
        sections: readSections(),
      };
      state.content.team = readTeam();
      saveContent(closeSheet);
    });
  }
  function renderTeam(arr: any[]){
    var box = document.getElementById('team-list')!;
    box.innerHTML = arr.map(function(m, i){
      return '<div class="subblock" data-mi="' + i + '">' +
        '<div class="field"><label>Name</label><input data-mf="name" value="' + esc(m.name) + '"></div>' +
        '<div class="field"><label>Title</label><input data-mf="title" value="' + esc(m.title) + '"></div>' +
        '<div class="field"><label>Headshot (optional)</label>' +
          '<div class="hs">' +
            '<img class="hs__prev" alt="" ' + (m.photo ? 'src="' + esc(m.photo) + '"' : 'style="display:none"') + '>' +
            '<div class="hs__ctl">' +
              '<input type="file" class="hs__file" accept="image/*">' +
              '<button type="button" class="metal metal--sm hs__clear"' + (m.photo ? '' : ' hidden') + '>Remove</button>' +
            '</div>' +
          '</div>' +
          '<input type="hidden" data-mf="photo" value="' + esc(m.photo || '') + '">' +
          '<p class="note">Uploaded and optimized to AVIF in your browser (WebP/JPEG where AVIF is not supported). Saved when you press Save below.</p>' +
        '</div>' +
        '<div class="field"><label>Short bio</label><textarea data-mf="bio">' + esc(m.bio) + '</textarea></div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm rm-member" style="color:#cf4b4b">Remove member</button></div>' +
      '</div>';
    }).join('');
    rebindMetal();
    Array.prototype.forEach.call(box.querySelectorAll('.rm-member'), function(b: any){
      b.addEventListener('click', function(){ var t = readTeam(); t.splice(+b.closest('.subblock').getAttribute('data-mi'), 1); renderTeam(t); });
    });
    // Headshot upload per member: convert in the browser, then store the result as a data URL
    // in the hidden photo field (which readTeam picks up and saveContent persists).
    Array.prototype.forEach.call(box.querySelectorAll('.subblock'), function(block: any){
      var fileEl = block.querySelector('.hs__file') as HTMLInputElement;
      var hidden = block.querySelector('input[data-mf="photo"]') as HTMLInputElement;
      var prev = block.querySelector('.hs__prev') as HTMLImageElement;
      var clr = block.querySelector('.hs__clear') as HTMLButtonElement;
      if (fileEl) fileEl.addEventListener('change', function(){
        var f = fileEl.files && fileEl.files[0]; if (!f) return;
        if (f.size > 10 * 1024 * 1024){ toast('Image too large (10 MB max)'); fileEl.value = ''; return; }
        toast('Optimizing\u2026');
        toAvif(f, function(blob){
          blobToDataURL(blob, function(durl){
            hidden.value = durl; prev.src = durl; prev.style.display = '';
            if (clr) clr.hidden = false; fileEl.value = ''; toast('Headshot ready (press Save)');
          });
        }, 400);
      });
      if (clr) clr.addEventListener('click', function(){
        hidden.value = ''; prev.removeAttribute('src'); prev.style.display = 'none'; clr.hidden = true;
      });
    });
  }
  function readTeam(){
    return Array.prototype.map.call(document.querySelectorAll('#team-list .subblock'), function(b: any){
      var m: any = {};
      Array.prototype.forEach.call(b.querySelectorAll('[data-mf]'), function(el: any){ m[el.getAttribute('data-mf')] = el.value; });
      return m;
    });
  }
  function renderSections(arr: any[]){
    var box = document.getElementById('sections-list'); if (!box) return;
    box.innerHTML = arr.map(function(s: any, i: number){
      return '<div class="subblock rt-block" data-si="' + i + '">' +
        '<div class="field"><label>Heading (optional)</label><input data-sf="heading" value="' + esc(s.heading) + '"></div>' +
        '<label class="rt-label">Content</label>' +
        '<div class="rt-toolbar">' +
          '<button type="button" class="rt-btn" data-cmd="bold" title="Bold"><b>B</b></button>' +
          '<button type="button" class="rt-btn" data-cmd="italic" title="Italic"><i>I</i></button>' +
          '<button type="button" class="rt-btn" data-cmd="underline" title="Underline"><u>U</u></button>' +
          '<button type="button" class="rt-btn" data-cmd="createLink" title="Add link">Link</button>' +
          '<button type="button" class="rt-btn" data-cmd="unlink" title="Remove link">Unlink</button>' +
        '</div>' +
        '<div class="rt-editor" contenteditable="true" data-sf="html">' + (s.html || '') + '</div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm rm-section" style="color:#cf4b4b">Remove section</button></div>' +
      '</div>';
    }).join('');
    rebindMetal();
    // Toolbar: mousedown (not click) so the editor keeps its text selection; execCommand acts on it.
    Array.prototype.forEach.call(box.querySelectorAll('.rt-btn'), function(b: any){
      b.addEventListener('mousedown', function(e: MouseEvent){
        e.preventDefault();
        var cmd = b.getAttribute('data-cmd');
        if (cmd === 'createLink'){
          var url = prompt('Link URL (https://...)');
          if (url) document.execCommand('createLink', false, url);
        } else {
          document.execCommand(cmd, false);
        }
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll('.rm-section'), function(b: any){
      b.addEventListener('click', function(){ var s = readSections(); s.splice(+b.closest('.rt-block').getAttribute('data-si'), 1); renderSections(s); });
    });
  }
  function readSections(){
    return Array.prototype.map.call(document.querySelectorAll('#sections-list .rt-block'), function(b: any){
      var head = b.querySelector('[data-sf="heading"]');
      var ed = b.querySelector('[data-sf="html"]');
      return { heading: head ? head.value : '', html: ed ? ed.innerHTML : '' };
    });
  }

  // ---------- CONTRIBUTE ----------
  function openContribute(){
    var c = state.content.contribute || {};
    openSheet('<h2>Contribute page</h2>' +
      field('Title', 'c-title', c.title) +
      field('Lede', 'c-lede', c.lede, true) +
      field('Body (one paragraph per line)', 'c-body', (c.body || []).join('\n\n'), true) +
      field('Donate URL', 'c-donate', c.donateUrl) +
      field('Contact email', 'c-email', c.email) +
      '<div class="sheet__row"><button type="button" class="metal metal--dark" id="save">Save</button>' +
      '<button type="button" class="metal metal--sm" id="cancel">Cancel</button></div>');
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    document.getElementById('save')!.addEventListener('click', function(){
      state.content.contribute = {
        kicker: c.kicker || 'Support',
        title: val('c-title'), lede: val('c-lede'),
        body: val('c-body').split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean),
        donateUrl: val('c-donate'), email: val('c-email'),
      };
      saveContent(closeSheet);
    });
  }

  // ---------- DEV TOOLS ----------
  function openDev(){
    var current = (state.content.settings && state.content.settings.font) || DEFAULT_FONT;
    openSheet('<h2>Dev tools</h2>' +
      '<h3>Site font</h3>' +
      '<div class="field"><label>Google font name, applies across the whole site</label>' +
        '<input id="font-name" type="text" placeholder="e.g. Cormorant" value="' + esc(current.family || '') + '"></div>' +
      '<p class="note">Type any family from Google Fonts, spelled exactly (e.g. “IBM Plex Serif”, “Playfair Display”, “Lora”), then Apply.</p>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="apply-font">Apply font</button></div>' +
      '<h3>Site logo</h3>' +
      '<div class="field"><label>Replace the logo (SVG). Shows on the homepage and as the favicon</label>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<img id="logo-prev" alt="" style="height:40px;width:auto;background:#0e1f4d;border-radius:8px;padding:6px" src="' + esc((state.content.settings && state.content.settings.logo) || '/logo.png') + '">' +
          '<input id="logo-file" type="file" accept="image/svg+xml,.svg">' +
          '<button type="button" class="metal metal--sm" id="logo-upload">Upload</button>' +
        '</div></div>' +
      '<h3>Service status</h3><div id="status"><p class="note">Checking…</p></div>' +
      '<h3>Authorized users</h3><div id="users"><p class="note">Loading…</p></div>' +
      '<div class="field" style="margin-top:.8rem"><label>Add user (Google email)</label>' +
        '<div style="display:flex;gap:8px"><input id="new-user" placeholder="name@gmail.com"><button type="button" class="metal metal--sm" id="add-user">Add</button></div></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="cancel">Close</button></div>');
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    rebindMetal();
    loadStatus(); loadUsers();
    document.getElementById('apply-font')!.addEventListener('click', function(){
      var fam = (document.getElementById('font-name') as HTMLInputElement).value.trim().replace(/\s+/g, ' ');
      if (!fam){ toast('Enter a Google font name'); return; }
      var chosen = { label: fam, family: fam, stack: '"' + fam + '", Georgia, serif' };
      state.content.settings = state.content.settings || {};
      state.content.settings.font = chosen;
      applyFont(chosen);                 // live preview
      saveContent();                     // persist -> public pages pick it up
    });
    document.getElementById('logo-upload')!.addEventListener('click', function(){
      var inp = document.getElementById('logo-file') as HTMLInputElement;
      var file = inp && inp.files && inp.files[0];
      if (!file){ toast('Choose an SVG first'); return; }
      var reader = new FileReader();
      reader.onload = function(){
        var txt = String(reader.result || '');
        if (txt.indexOf('<svg') === -1){ toast('That doesn’t look like an SVG'); return; }
        api('/api/logo', { method: 'PUT', body: JSON.stringify({ svg: txt }) }).then(function(r){
          if (!r.ok){ toast('Upload failed'); return; }
          var url = '/api/logo?v=' + Date.now();   // cache-bust so the new mark shows immediately
          state.content.settings = state.content.settings || {};
          state.content.settings.logo = url;
          var prev = document.getElementById('logo-prev') as HTMLImageElement; if (prev) prev.src = url;
          applyLogo(url);
          saveContent(function(){ toast('Logo updated'); });
        }).catch(function(){ toast('Upload failed'); });
      };
      reader.readAsText(file);
    });
    document.getElementById('add-user')!.addEventListener('click', function(){
      var em = (document.getElementById('new-user') as HTMLInputElement).value.trim().toLowerCase();
      if (!em) return;
      api('/api/users', { method: 'POST', body: JSON.stringify({ email: em }) }).then(function(r){
        if (r.ok){ toast('Added'); loadUsers(); } else { toast('Could not add'); }
      });
    });
  }
  function loadStatus(){
    var box = document.getElementById('status'); if (!box) return;
    api('/api/status').then(function(r){ return r.ok ? r.json() : null; }).then(function(s){
      if (!box) return;
      if (!s){ box.innerHTML = '<p class="note">Status unavailable (tokens not configured).</p>'; return; }
      box.innerHTML = line('Cloudflare Pages', s.cloudflare) + line('GitHub', s.github);
    }).catch(function(){ if (box) box.innerHTML = '<p class="note">Status unavailable.</p>'; });
  }
  function line(name: string, d: any){
    d = d || {}; var cls = d.state === 'ok' ? 'ok' : d.state === 'bad' ? 'bad' : d.state === 'warn' ? 'warn' : '';
    return '<div class="statusline"><span class="dot ' + cls + '"></span><span class="lbl">' + name + '</span>' +
      '<span class="meta">' + esc(d.detail || d.state || 'unknown') + '</span></div>';
  }
  function loadUsers(){
    var box = document.getElementById('users'); if (!box) return;
    api('/api/users').then(function(r){ return r.ok ? r.json() : null; }).then(function(list){
      if (!box) return;
      state.users = (list && list.users) || [];
      box.innerHTML = state.users.map(function(em: string){
        var locked = em.toLowerCase() === OWNER;
        return '<div class="userrow"><span class="em">' + esc(em) + '</span>' +
          (locked ? '<span class="lock">owner · locked</span>' : '<button type="button" class="btn-x rm-user" data-em="' + esc(em) + '">remove</button>') + '</div>';
      }).join('');
      Array.prototype.forEach.call(box.querySelectorAll('.rm-user'), function(b: any){
        b.addEventListener('click', function(){
          api('/api/users', { method: 'DELETE', body: JSON.stringify({ email: b.getAttribute('data-em') }) }).then(function(r){
            if (r.ok){ toast('Removed'); loadUsers(); } else { toast('Could not remove'); }
          });
        });
      });
    }).catch(function(){ if (box) box.innerHTML = '<p class="note">Could not load users.</p>'; });
  }

  // ---------- OFFICIAL DOCUMENTS ----------
  function openDocs(){
    openSheet('<h2>Official Documents</h2>' +
      '<div id="docs-list"><p class="note">Loading…</p></div>' +
      '<h3>Add a file</h3>' +
      '<div class="field"><label>PDF, DOC, or DOCX (up to 10 MB)</label>' +
        '<input id="doc-file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></div>' +
      field('Display name (optional)', 'doc-file-name', '') +
      '<div class="sheet__row"><button type="button" class="metal metal--dark metal--sm" id="doc-upload">Upload file</button></div>' +
      '<h3>Or add a link</h3>' +
      field('Link name', 'doc-link-name', '') +
      field('URL', 'doc-link-url', '') +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="doc-add-link">Add link</button></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="cancel">Close</button></div>');
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    rebindMetal();
    loadDocs();
    document.getElementById('doc-upload')!.addEventListener('click', uploadDoc);
    document.getElementById('doc-add-link')!.addEventListener('click', addDocLink);
  }
  function loadDocs(){
    var box = document.getElementById('docs-list'); if (!box) return;
    api('/api/docs').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      renderDocsList((d && d.docs) || []);
    }).catch(function(){ if (box) box.innerHTML = '<p class="note">Could not load documents.</p>'; });
  }
  function renderDocsList(arr: any[]){
    var box = document.getElementById('docs-list'); if (!box) return;
    if (!arr.length){ box.innerHTML = '<p class="note">No documents yet.</p>'; return; }
    box.innerHTML = arr.map(function(d: any){
      var meta = d.kind === 'link' ? 'Link' : ((d.ext || 'file').toUpperCase() + (d.size ? ' · ' + fmtSize(d.size) : ''));
      var open = d.kind === 'link' ? ' target="_blank" rel="noopener"' : '';
      var label = d.kind === 'link' ? 'Open' : 'Download';
      return '<div class="docrow" data-id="' + esc(d.id) + '">' +
        '<span class="docrow__name">' + esc(d.name) + '</span>' +
        '<span class="docrow__meta">' + esc(meta) + '</span>' +
        '<a class="metal metal--sm" href="/api/docs/' + encodeURIComponent(d.id) + '"' + open + '>' + label + '</a>' +
        '<button type="button" class="btn-x doc-del" data-id="' + esc(d.id) + '">Delete</button>' +
      '</div>';
    }).join('');
    rebindMetal();
    Array.prototype.forEach.call(box.querySelectorAll('.doc-del'), function(b: any){
      b.addEventListener('click', function(){ deleteDoc(b.getAttribute('data-id')); });
    });
  }
  function uploadDoc(){
    var input = document.getElementById('doc-file') as HTMLInputElement;
    var f = input && input.files && input.files[0];
    if (!f){ toast('Choose a file first'); return; }
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    if (['pdf', 'doc', 'docx'].indexOf(ext) === -1){ toast('Only PDF, DOC, or DOCX'); return; }
    if (f.size > 10 * 1024 * 1024){ toast('That file is over 10 MB'); return; }
    var name = (document.getElementById('doc-file-name') as HTMLInputElement).value.trim();
    var fd = new FormData(); fd.append('file', f); if (name) fd.append('name', name);
    toast('Uploading…');
    // No api() helper here: let the browser set the multipart Content-Type with its boundary.
    fetch('/api/docs', { method: 'POST', credentials: 'same-origin', body: fd }).then(function(r){
      if (r.ok){ toast('Uploaded'); input.value = ''; (document.getElementById('doc-file-name') as HTMLInputElement).value = ''; loadDocs(); }
      else { r.json().then(function(j){ toast((j && j.message) || 'Upload failed'); }).catch(function(){ toast('Upload failed'); }); }
    }).catch(function(){ toast('Upload failed'); });
  }
  function addDocLink(){
    var name = (document.getElementById('doc-link-name') as HTMLInputElement).value.trim();
    var url = (document.getElementById('doc-link-url') as HTMLInputElement).value.trim();
    if (!url){ toast('Enter a URL'); return; }
    api('/api/docs', { method: 'POST', body: JSON.stringify({ kind: 'link', name: name, url: url }) }).then(function(r){
      if (r.ok){ toast('Link added'); (document.getElementById('doc-link-name') as HTMLInputElement).value = ''; (document.getElementById('doc-link-url') as HTMLInputElement).value = ''; loadDocs(); }
      else { toast('Could not add link'); }
    }).catch(function(){ toast('Could not add link'); });
  }
  function deleteDoc(id: string){
    if (!id) return;
    api('/api/docs?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(function(r){
      if (r.ok){ toast('Deleted'); loadDocs(); } else { toast('Delete failed'); }
    }).catch(function(){ toast('Delete failed'); });
  }
  function fmtSize(n: number){
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  // ---------- GALLERY (About page photos) ----------
  function loadGalleryAdmin(){
    var box = document.getElementById('gallery-grid'); if (!box) return;
    api('/api/gallery').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      renderGalleryAdmin((d && d.gallery) || []);
      var speedEl = document.getElementById('gallery-speed') as HTMLInputElement;
      if (speedEl){ speedEl.value = String((d && typeof d.speed === 'number') ? d.speed : 55); updateGallerySpeedNote(); }
    }).catch(function(){ if (box) box.innerHTML = '<p class="note">Could not load photos.</p>'; });
  }
  function updateGallerySpeedNote(){
    var el = document.getElementById('gallery-speed') as HTMLInputElement;
    var note = document.getElementById('gallery-speed-note');
    if (el && note) note.textContent = '(' + el.value + 's per loop)';
  }
  function saveGallerySpeed(){
    var el = document.getElementById('gallery-speed') as HTMLInputElement; if (!el) return;
    api('/api/gallery', { method: 'POST', body: JSON.stringify({ speed: parseInt(el.value, 10) }) }).then(function(r){
      if (r.ok){ toast('Speed saved'); } else { toast('Could not save speed'); }
    }).catch(function(){ toast('Could not save speed'); });
  }
  function renderGalleryAdmin(arr: any[]){
    var box = document.getElementById('gallery-grid'); if (!box) return;
    box.setAttribute('data-count', String(arr.length));
    var count = '<p class="note">' + arr.length + ' / 30 photos</p>';
    if (!arr.length){ box.innerHTML = count + '<p class="note">No photos yet.</p>'; return; }
    box.innerHTML = count + '<div class="gallery-admin__grid">' + arr.map(function(g: any){
      return '<div class="gthumb" data-id="' + esc(g.id) + '">' +
        '<img src="/api/gallery/' + encodeURIComponent(g.id) + '" alt="" loading="lazy">' +
        '<button type="button" class="gthumb__x" data-id="' + esc(g.id) + '" aria-label="Remove photo">\u00d7</button>' +
      '</div>';
    }).join('') + '</div>';
    Array.prototype.forEach.call(box.querySelectorAll('.gthumb__x'), function(b: any){
      b.addEventListener('click', function(){ deleteGalleryImg(b.getAttribute('data-id')); });
    });
  }
  function deleteGalleryImg(id: string){
    if (!id) return;
    api('/api/gallery?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(function(r){
      if (r.ok){ toast('Removed'); loadGalleryAdmin(); } else { toast('Could not remove'); }
    }).catch(function(){ toast('Could not remove'); });
  }
  // Read a Blob into a data: URL (used to embed a team headshot directly into the saved content).
  function blobToDataURL(blob: Blob, cb: (url: string) => void){
    var fr = new FileReader();
    fr.onload = function(){ cb(String(fr.result)); };
    fr.onerror = function(){ toast('Could not read that image'); };
    fr.readAsDataURL(blob);
  }
  // Re-encode a photo to AVIF in the browser (falls back to WebP, then a resized JPEG) and
  // shrink large images, so stored photos stay small and quick to load. maxDim defaults to 1600.
  function toAvif(file: File, cb: (blob: Blob, type: string) => void, maxDim?: number){
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function(){
      URL.revokeObjectURL(url);
      var md = maxDim || 1600;
      var w = img.naturalWidth || 1, h = img.naturalHeight || 1;
      var scale = Math.min(1, md / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
      var canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
      var ctx = canvas.getContext('2d');
      if (!ctx){ cb(file, file.type || 'image/jpeg'); return; }
      ctx.drawImage(img, 0, 0, cw, ch);
      canvas.toBlob(function(avif){
        if (avif && avif.type === 'image/avif'){ cb(avif, 'image/avif'); return; }
        canvas.toBlob(function(webp){
          if (webp && webp.type === 'image/webp'){ cb(webp, 'image/webp'); return; }
          canvas.toBlob(function(jpg){
            if (jpg){ cb(jpg, 'image/jpeg'); return; }
            cb(file, file.type || 'image/jpeg'); // absolute last resort
          }, 'image/jpeg', 0.85);
        }, 'image/webp', 0.85);
      }, 'image/avif', 0.6);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); cb(file, file.type || 'image/jpeg'); };
    img.src = url;
  }
  function uploadOneGallery(blob: Blob, type: string, baseName: string, done: () => void){
    var ext = type === 'image/avif' ? 'avif' : type === 'image/webp' ? 'webp' : type === 'image/jpeg' ? 'jpg' : ((baseName.split('.').pop() || 'jpg'));
    var fd = new FormData();
    fd.append('file', blob, (baseName.replace(/\.[^.]+$/, '') || 'photo') + '.' + ext);
    // No api() helper: let the browser set the multipart boundary.
    fetch('/api/gallery', { method: 'POST', credentials: 'same-origin', body: fd }).then(function(r){
      if (!r.ok){ r.json().then(function(j){ toast((j && j.message) || 'Upload failed'); }).catch(function(){ toast('Upload failed'); }); }
      done();
    }).catch(function(){ toast('Upload failed'); done(); });
  }
  function uploadGalleryFiles(){
    var input = document.getElementById('gallery-file') as HTMLInputElement;
    var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
    if (!files.length){ toast('Choose photos first'); return; }
    var gbox = document.getElementById('gallery-grid');
    var current = gbox ? (+(gbox.getAttribute('data-count') || '0') || 0) : 0;
    var remaining = Math.max(0, 30 - current);
    var tooBig = files.filter(function(f: File){ return f.size > 5 * 1024 * 1024; });
    var ok = files.filter(function(f: File){ return f.size <= 5 * 1024 * 1024; });
    if (tooBig.length) toast(tooBig.length + ' photo(s) over 5 MB were skipped');
    if (ok.length > remaining){ ok = ok.slice(0, remaining); toast('Only ' + remaining + ' more photo(s) fit'); }
    if (!ok.length){ input.value = ''; if (remaining === 0) toast('The gallery is full (30 photos)'); return; }
    toast('Adding photos\u2026');
    var i = 0;
    function next(){
      if (i >= ok.length){ input.value = ''; loadGalleryAdmin(); return; }
      var f = ok[i++];
      toAvif(f, function(blob, type){ uploadOneGallery(blob, type, f.name, next); });
    }
    next();
  }

  // ---------- helpers ----------
  function field(label: string, id: string, value: any, area?: boolean){
    return '<div class="field"><label>' + label + '</label>' +
      (area ? '<textarea id="' + id + '">' + esc(value) + '</textarea>' : '<input id="' + id + '" value="' + esc(value) + '">') + '</div>';
  }
  function val(id: string){ return (document.getElementById(id) as HTMLInputElement).value; }
  function rebindMetal(){
    Array.prototype.forEach.call(document.querySelectorAll('.metal'), function(node: any){
      if (node.__metal) return; node.__metal = true;
      node.addEventListener('pointermove', function(e: PointerEvent){
        var r = node.getBoundingClientRect();
        node.style.setProperty('--mx', (50 + ((e.clientX - r.left) / r.width * 100 - 50) * 0.7).toFixed(1) + '%');
        node.style.setProperty('--my', (50 + ((e.clientY - r.top) / r.height * 100 - 50) * 0.7).toFixed(1) + '%');
      });
      node.addEventListener('pointerleave', function(){ node.style.setProperty('--mx', '50%'); node.style.setProperty('--my', '28%'); });
    });
  }
})();
