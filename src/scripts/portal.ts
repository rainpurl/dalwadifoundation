// THE DALWADI FOUNDATION — staff portal (client). Talks to /api/* (Cloudflare Pages Functions).
// Auth is handled server-side; this only renders state returned by the API.
(function(){
  "use strict";
  var root = document.getElementById('portal-root');
  if (!root) return;
  var OWNER = "pjbrahm369@gmail.com";
  var state: any = { me: null, content: null, users: [] };

  // curated site fonts (all on Google Fonts)
  var FONTS = [
    { label: "Literata", family: "Literata", stack: '"Literata", Georgia, serif' },
    { label: "Fraunces", family: "Fraunces", stack: '"Fraunces", Georgia, serif' },
    { label: "Cormorant", family: "Cormorant", stack: '"Cormorant", Georgia, serif' },
    { label: "Lora", family: "Lora", stack: '"Lora", Georgia, serif' },
    { label: "Playfair Display", family: "Playfair Display", stack: '"Playfair Display", Georgia, serif' },
    { label: "EB Garamond", family: "EB Garamond", stack: '"EB Garamond", Georgia, serif' },
    { label: "Source Serif 4", family: "Source Serif 4", stack: '"Source Serif 4", Georgia, serif' },
    { label: "Manrope", family: "Manrope", stack: '"Manrope", system-ui, sans-serif' },
    { label: "Inter", family: "Inter", stack: '"Inter", system-ui, sans-serif' },
    { label: "Work Sans", family: "Work Sans", stack: '"Work Sans", system-ui, sans-serif' },
  ];
  function applyFont(f: any){
    if (!f || !f.stack) return;
    var fam = (f.family || "").trim();
    if (fam){
      var id = "font-" + fam.replace(/\s+/g, "-");
      if (!document.getElementById(id)){
        var l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=" + fam.replace(/\s+/g, "+") + ":wght@400;500;600;700&display=swap";
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
        tile('dev', 'Dev tools', 'Status &amp; authorized users', true) +
      '</div>';
    rebindMetal();
    root.querySelector('[data-tile=pillars]')!.addEventListener('click', openPillars);
    root.querySelector('[data-tile=about]')!.addEventListener('click', openAbout);
    root.querySelector('[data-tile=contribute]')!.addEventListener('click', function(){ window.open('https://www.zeffy.com', '_blank', 'noopener'); });
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
      return '<div class="subblock" data-pi="' + i + '">' +
        '<div class="field"><label>Name (tower label)</label><input data-f="name" value="' + esc(p.name) + '"></div>' +
        '<div class="field"><label>Title</label><input data-f="title" value="' + esc(p.title) + '"></div>' +
        '<div class="field"><label>Body</label><textarea data-f="body">' + esc(p.body) + '</textarea></div>' +
        '<label>Links</label><div class="links">' +
          (p.links || []).map(function(l: any, j: number){ return linkRow(l, j); }).join('') +
        '</div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm add-link">+ Link</button>' +
        '<button type="button" class="metal metal--sm rm-pillar" style="color:#cf4b4b">Remove pillar</button></div>' +
      '</div>';
    }).join('');
    rebindMetal();
    Array.prototype.forEach.call(box.querySelectorAll('.add-link'), function(b: any){
      b.addEventListener('click', function(){ var arr2 = readPillars(); var i = +b.closest('.subblock').getAttribute('data-pi'); arr2[i].links.push({ label: '', href: '', ghost: false }); renderPillars(arr2); });
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
  function readPillars(){
    return Array.prototype.map.call(document.querySelectorAll('#pillars-list .subblock'), function(b: any){
      var f: any = {};
      Array.prototype.forEach.call(b.querySelectorAll('[data-f]'), function(el: any){ f[el.getAttribute('data-f')] = el.value; });
      var links = Array.prototype.map.call(b.querySelectorAll('.linkrow'), function(row: any){
        var lab = row.querySelector('[data-lf=label]').value, href = row.querySelector('[data-lf=href]').value;
        return { label: lab, href: href };
      }).filter(function(l: any){ return l.label || l.href; });
      var key = (f.name || 'pillar').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'pillar';
      return { key: key, name: f.name, title: f.title, body: f.body, links: links };
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
      '<div class="sheet__row"><button type="button" class="metal metal--dark" id="save">Save</button>' +
      '<button type="button" class="metal metal--sm" id="cancel">Cancel</button></div>');
    renderTeam(state.content.team || []);
    document.getElementById('cancel')!.addEventListener('click', closeSheet);
    document.getElementById('add-member')!.addEventListener('click', function(){ var t = readTeam(); t.push({ name: '', title: '', photo: '', bio: '' }); renderTeam(t); });
    document.getElementById('save')!.addEventListener('click', function(){
      state.content.about = {
        kicker: a.kicker || 'About',
        title: val('a-title'), lede: val('a-lede'),
        body: val('a-body').split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean),
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
        '<div class="field"><label>Photo URL (optional)</label><input data-mf="photo" value="' + esc(m.photo) + '" placeholder="https://…"></div>' +
        '<div class="field"><label>Short bio</label><textarea data-mf="bio">' + esc(m.bio) + '</textarea></div>' +
        '<div class="sheet__row"><button type="button" class="metal metal--sm rm-member" style="color:#cf4b4b">Remove member</button></div>' +
      '</div>';
    }).join('');
    rebindMetal();
    Array.prototype.forEach.call(box.querySelectorAll('.rm-member'), function(b: any){
      b.addEventListener('click', function(){ var t = readTeam(); t.splice(+b.closest('.subblock').getAttribute('data-mi'), 1); renderTeam(t); });
    });
  }
  function readTeam(){
    return Array.prototype.map.call(document.querySelectorAll('#team-list .subblock'), function(b: any){
      var m: any = {};
      Array.prototype.forEach.call(b.querySelectorAll('[data-mf]'), function(el: any){ m[el.getAttribute('data-mf')] = el.value; });
      return m;
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
    var current = (state.content.settings && state.content.settings.font) || FONTS[0];
    var fontOpts = FONTS.map(function(f){
      return '<option value="' + f.family + '"' + (current.family === f.family ? ' selected' : '') + '>' + f.label + '</option>';
    }).join('');
    openSheet('<h2>Dev tools</h2>' +
      '<h3>Site font</h3>' +
      '<div class="field"><label>Applies across the whole site</label><select id="font-select">' + fontOpts + '</select></div>' +
      '<div class="sheet__row"><button type="button" class="metal metal--sm" id="apply-font">Apply font</button></div>' +
      '<h3>Site logo</h3>' +
      '<div class="field"><label>Replace the logo (SVG) — shows on the homepage and as the favicon</label>' +
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
      var fam = (document.getElementById('font-select') as HTMLSelectElement).value;
      var chosen = FONTS.filter(function(f){ return f.family === fam; })[0];
      if (!chosen) return;
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
