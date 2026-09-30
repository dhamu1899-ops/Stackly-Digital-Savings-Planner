// ============================================
// Stackly — Premium JavaScript
// ============================================

// ---------- Session (demo auth) ----------
var SL = {
    read: function(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    write: function(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    drop: function(k) { try { localStorage.removeItem(k); } catch (e) {} },
    user: function() { return SL.read('stacklyUser'); },
    getAccounts: function() {
        var accts = SL.read('stacklyAccounts');
        if (!accts || !Array.isArray(accts)) {
            // Authorized administrative accounts provisioned only through administrative process
            accts = [
                {
                    name: 'Stackly Admin',
                    email: 'admin@stackly.studio',
                    password: 'admin',
                    role: 'admin',
                    createdAt: Date.now()
                },
                {
                    name: 'Stackly Studio Admin',
                    email: 'hello@stackly.studio',
                    password: 'admin',
                    role: 'admin',
                    createdAt: Date.now()
                }
            ];
            SL.write('stacklyAccounts', accts);
        }
        return accts;
    },
    saveAccount: function(account) {
        var accts = SL.getAccounts();
        var idx = -1;
        for (var i = 0; i < accts.length; i++) {
            if (accts[i].email && accts[i].email.toLowerCase() === (account.email || '').toLowerCase()) {
                idx = i;
                break;
            }
        }
        if (idx >= 0) {
            accts[idx] = Object.assign({}, accts[idx], account);
        } else {
            accts.push(account);
        }
        SL.write('stacklyAccounts', accts);
        return account;
    },
    findAccount: function(email) {
        var accts = SL.getAccounts();
        var clean = String(email || '').trim().toLowerCase();
        for (var i = 0; i < accts.length; i++) {
            if (accts[i].email && accts[i].email.toLowerCase() === clean) {
                return accts[i];
            }
        }
        return null;
    },
    nameFromEmail: function(email) {
        var raw = String(email || '').split('@')[0].replace(/[._\-+0-9]+/g, ' ').trim();
        if (!raw) return 'Stackly Saver';
        return raw.split(/\s+/).filter(Boolean).map(function(w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
    },
    initials: function(name) {
        var p = String(name || '').trim().split(/\s+/);
        var a = (p[0] || 'S').charAt(0), b = (p[1] || '').charAt(0);
        return (a + b).toUpperCase();
    },
    say: function(msg) { if (window.toast) { window.toast(msg); } else { alert(msg); } }
};

// ---------- Route guard: client area / admin area ----------
(function guard() {
    var page = location.pathname.split('/').pop() || 'index.html';
    var appPages = ['dashboard.html', 'admin.html', 'goals.html', 'calculator.html'];
    if (appPages.indexOf(page) < 0) return;
    var u = SL.user();
    if (!u) {
        try { sessionStorage.setItem('stacklyNotice', 'Please log in to reach your dashboard.'); } catch (e) {}
        location.replace('login.html?msg=required');
        return;
    }
    var need = page === 'admin.html' ? 'admin' : (page === 'dashboard.html' ? 'client' : null);
    if (need && u.role !== need) {
        var dest = u.role === 'admin' ? 'admin.html' : 'dashboard.html';
        try {
            sessionStorage.setItem('stacklyNotice', u.role === 'admin'
                ? 'Admin accounts open the admin dashboard.'
                : 'Client accounts open the client dashboard.');
        } catch (e) {}
        location.replace(dest);
        return;
    }
    window.__SLUSER = u;
})();

// Preloader
(function() {
    document.body.classList.add('loading');
    var pre = document.getElementById('preloader');
    if (!pre) { document.body.classList.remove('loading'); return; }
    var fill = pre.querySelector('.pre-fill');
    var pct = pre.querySelector('.pre-pct');
    var progress = 0;
    var timer = setInterval(function() {
        progress += (100 / (2600 / 30)) * (0.7 + Math.random() * 0.6);
        if (progress >= 100) progress = 100;
        if (fill) fill.style.width = progress + '%';
        if (pct) pct.textContent = Math.floor(progress) + '%';
        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(function() {
                pre.classList.add('hidden');
                document.body.classList.remove('loading');
            }, 400);
        }
    }, 30);
})();

document.addEventListener('DOMContentLoaded', function() {
    // Navbar
    var nav = document.querySelector('.navbar');

    // Burger
    var burger = document.querySelector('.burger');
    if (burger) {
        burger.addEventListener('click', function() {
            document.querySelector('.navbar').classList.toggle('mobile-open');
        });
    }

    // Mobile app header: hamburger opens the side menu (app pages only)
    var appBurger = document.querySelector('.app-burger');
    if (appBurger) {
        var setMenu = function(open) {
            document.body.classList.toggle('app-menu-open', open);
            appBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
            appBurger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };
        var menuIsOpen = function() { return document.body.classList.contains('app-menu-open'); };
        appBurger.addEventListener('click', function() { setMenu(!menuIsOpen()); });
        var scrim = document.querySelector('.app-scrim');
        if (scrim) scrim.addEventListener('click', function() { setMenu(false); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape' || e.key === 'Esc') setMenu(false); });
        window.addEventListener('resize', function() { if (window.innerWidth > 1024 && menuIsOpen()) setMenu(false); });
        document.querySelectorAll('.side-nav a').forEach(function(a) {
            a.addEventListener('click', function() {
                var href = a.getAttribute('href');
                setMenu(false);
                // in-page links: scroll once the drawer has finished closing
                if (href && href.charAt(0) === '#' && href.length > 1) {
                    var t = document.querySelector(href);
                    if (t) setTimeout(function() { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 380);
                }
            });
        });
    }

    // ---- one throttled scroll pipeline: nav state, reading progress, parallax, scrollspy ----
    var progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    var hero = document.querySelector('.hero.has-bg');
    var heroBgs = hero ? hero.querySelector('.hero-bgs') : null;
    var heroContent = hero ? hero.querySelector('.hero-content') : null;
    var banners = [].slice.call(document.querySelectorAll('.page-hero'));
    var spyLinks = [].slice.call(document.querySelectorAll('.side-nav a[href^="#"]')).filter(function(a) {
        return (a.getAttribute('href') || '').length > 1;
    });
    var vh = window.innerHeight;
    var queued = false;

    var paint = function() {
        queued = false;
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;

        if (nav) nav.classList.toggle('scrolled', y > 50);

        var max = document.documentElement.scrollHeight - vh;
        progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';

        // hero: copy drifts up and fades, the photographic backdrop eases in behind it
        if (hero && y < vh * 1.15) {
            if (heroContent) {
                heroContent.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
                heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.62)).toFixed(3);
            }
            if (heroBgs) heroBgs.style.transform = 'scale(' + (1 + Math.min(y / vh, 1) * 0.08).toFixed(4) + ')';
        }

        // page banners: the photo pans slower than the page (desktop widths only, so no edge is exposed)
        if (banners.length && window.innerWidth >= 769) {
            banners.forEach(function(b) {
                var r = b.getBoundingClientRect();
                if (r.bottom < -80 || r.top > vh + 80) return;
                var off = ((vh / 2) - (r.top + r.height / 2)) * 0.14;
                off = Math.max(-44, Math.min(44, off));
                b.style.backgroundPosition = 'center, center calc(50% + ' + off.toFixed(1) + 'px)';
            });
        }

        // in-page menu follows the section being read
        if (spyLinks.length) {
            var mark = spyLinks[0];
            spyLinks.forEach(function(a) {
                var t = document.querySelector(a.getAttribute('href'));
                if (t && t.getBoundingClientRect().top <= 180) mark = a;
            });
            spyLinks.forEach(function(a) { a.classList.toggle('active', a === mark); });
        }
    };

    var onScroll = function() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function() { vh = window.innerHeight; onScroll(); });
    window.addEventListener('load', function() { vh = window.innerHeight; paint(); });
    paint();

    // Reveal: everything that enters together arrives as a cascade
    var revealEls = document.querySelectorAll('.reveal');
    // framed imagery inside a reveal settles into place (only when its frame clips)
    revealEls.forEach(function(el) {
        el.querySelectorAll('img').forEach(function(img) {
            var p = img.parentElement;
            if (!p) return;
            var o = window.getComputedStyle(p);
            if (o.overflow === 'hidden' || o.overflowX === 'hidden' || o.overflowY === 'hidden') p.classList.add('img-zoom');
        });
    });
    if (!('IntersectionObserver' in window)) {
        revealEls.forEach(function(el) { el.classList.add('visible'); });
    } else {
        var io = new IntersectionObserver(function(entries) {
            var step = 0;
            entries.forEach(function(en) {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                if (step === 0) { en.target.classList.add('visible'); step = 1; return; }
                (function(el, d) {
                    setTimeout(function() { el.classList.add('visible'); }, d);
                })(en.target, step * 95);
                step++;
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        revealEls.forEach(function(el) { io.observe(el); });
        // Safety net: never leave content hidden
        window.addEventListener('load', function() {
            setTimeout(function() {
                document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
                    var r = el.getBoundingClientRect();
                    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
                });
            }, 1200);
        });
    }

    // Counters
    document.querySelectorAll('[data-count]').forEach(function(el) {
        new IntersectionObserver(function(e, o) {
            e.forEach(function(en) {
                if (en.isIntersecting) { animCount(en.target); o.unobserve(en.target); }
            });
        }, { threshold: 0.5 }).observe(el);
    });

    function animCount(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var dec = parseInt(el.getAttribute('data-decimal')) || 0;
        var start = performance.now();
        function update(now) {
            var p = Math.min((now - start) / 2000, 1);
            var ease = 1 - Math.pow(1 - p, 3);
            var val = target * ease;
            el.textContent = prefix + (dec > 0 ? val.toFixed(dec) : Math.floor(val).toLocaleString()) + suffix;
            if (p < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // Charts
    drawCharts();

    // Calc
    initCalc();

    // Goals
    initGoals();

    // FAQ
    document.querySelectorAll('.faq-q').forEach(function(q) {
        q.addEventListener('click', function() {
            var item = this.closest('.faq-item');
            var wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(function(f) { f.classList.remove('open'); });
            if (!wasOpen) item.classList.add('open');
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
        a.addEventListener('click', function(e) {
            var h = this.getAttribute('href');
            if (h && h !== '#') {
                var t = document.querySelector(h);
                if (t) {
                    e.preventDefault();
                    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    var navContainer = a.closest('.side-nav');
                    if (navContainer) {
                        navContainer.querySelectorAll('a').forEach(function(l) { l.classList.remove('active'); });
                        a.classList.add('active');
                    }
                    if (history.pushState) {
                        history.pushState(null, null, h);
                    }
                }
            }
        });
    });

    // App shell: show the logged-in user (name, role, email)
    var me = SL.user() || window.__SLUSER;
    if (me) {
        var setAll = function(sel, val) {
            document.querySelectorAll(sel).forEach(function(el) { el.textContent = val; });
        };
        setAll('[data-user-name]', me.name || 'Stackly Saver');
        setAll('[data-user-email]', me.email || '');
        setAll('[data-user-role]', me.role === 'admin' ? 'Administrator' : 'Client');
        setAll('[data-user-initials]', me.initials || SL.initials(me.name));
        setAll('[data-user-first]', String(me.name || 'there').split(' ')[0]);

        // Site navbar: member chip replaces Log In / Get Started (lives in .nav-right,
        // so it appears in the desktop bar and inside the opened hamburger menu)
        var navRight = document.querySelector('.nav-right');
        if (navRight && !navRight.querySelector('.nav-user')) {
            document.body.classList.add('has-session');
            // drop the signed-out actions so only the member chip remains
            [].forEach.call(navRight.querySelectorAll('.nav-login, .btn-start'), function(n) {
                if (n.parentNode) n.parentNode.removeChild(n);
            });
            var home = me.role === 'admin' ? 'admin.html' : 'dashboard.html';
            var chip = document.createElement('div');
            chip.className = 'nav-user';

            var link = document.createElement('a');
            link.className = 'nav-user-chip';
            link.href = home;
            link.title = 'Open your dashboard';

            var av = document.createElement('span');
            av.className = 'nav-user-av';
            av.textContent = me.initials || SL.initials(me.name);

            var txt = document.createElement('span');
            txt.className = 'nav-user-t';
            var nm = document.createElement('strong');
            nm.textContent = me.name || 'Member';
            var rl = document.createElement('small');
            rl.textContent = me.role === 'admin' ? 'Administrator' : 'Client';
            txt.appendChild(nm); txt.appendChild(rl);

            link.appendChild(av); link.appendChild(txt);

            var out = document.createElement('a');
            out.className = 'nav-logout';
            out.href = '#';
            out.setAttribute('data-logout', '');
            out.textContent = 'Log out';

            chip.appendChild(link); chip.appendChild(out);
            navRight.appendChild(chip);
        }
    }

    // Logout: clear the session and return home
    document.querySelectorAll('[data-logout]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            SL.drop('stacklyUser');
            try { sessionStorage.setItem('stacklyNotice', 'You have been logged out. See you soon.'); } catch (err) {}
            window.location.href = 'index.html';
        });
    });

    // Notices (login required, signup done, logged out, wrong area...)
    var notice = null;
    try {
        notice = sessionStorage.getItem('stacklyNotice');
        if (notice) sessionStorage.removeItem('stacklyNotice');
    } catch (e) {}
    if (!notice) {
        var q = (location.search || '').replace(/^\?/, '').split('&');
        var params = {};
        q.forEach(function(kv) { var p = kv.split('='); if (p[0]) params[p[0]] = decodeURIComponent(p[1] || ''); });
        if (params.msg === 'signup') notice = 'Account created — log in to continue.';
        else if (params.msg === 'required') notice = 'Please log in to reach your dashboard.';
        if (params.msg === 'signup') {
            var profile = SL.read('stacklyProfile');
            var emailField = document.getElementById('loginEmail');
            if (profile && profile.email && emailField && !emailField.value) emailField.value = profile.email;
        }
    }
    if (notice) setTimeout(function() { SL.say(notice); }, 900);

    // Auth
    initAuth();
});

// ---------- Charts ----------
function drawCharts() {
    var el = document.getElementById('mainChart');
    if (!el) return;
    var data = [32,45,38,55,50,64,60,76,70,86,80,96];
    var labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var W = el.clientWidth || 600, H = 260, pad = 28;
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data), range = max - min || 1;
    var pts = data.map(function(v,i) {
        return { x: pad + (i*(W-2*pad))/(data.length-1), y: H-pad-((v-min)/range)*(H-2*pad) };
    });

    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.style.overflow='visible';

    var defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.innerHTML = '<linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FE4C28"/><stop offset="100%" stop-color="#FF7B5C"/></linearGradient><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FE4C28" stop-opacity="0.1"/><stop offset="100%" stop-color="#FE4C28" stop-opacity="0"/></linearGradient>';
    svg.appendChild(defs);

    for (var i = 0; i <= 4; i++) {
        var gy = pad + (i*(H-2*pad))/4;
        var gl = document.createElementNS('http://www.w3.org/2000/svg','line');
        gl.setAttribute('x1',pad); gl.setAttribute('y1',gy);
        gl.setAttribute('x2',W-pad); gl.setAttribute('y2',gy);
        gl.setAttribute('stroke','#E5E1DB'); gl.setAttribute('stroke-width','1');
        gl.setAttribute('stroke-dasharray','4 4');
        svg.appendChild(gl);
    }

    var d = pts.map(function(p,i){ return (i===0?'M':'L')+' '+p.x+' '+p.y; }).join(' ');
    var area = document.createElementNS('http://www.w3.org/2000/svg','path');
    area.setAttribute('d', d+' L '+pts[pts.length-1].x+' '+(H-pad)+' L '+pts[0].x+' '+(H-pad)+' Z');
    area.setAttribute('fill','url(#ag)'); svg.appendChild(area);

    var line = document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d',d); line.setAttribute('fill','none');
    line.setAttribute('stroke','url(#lg)'); line.setAttribute('stroke-width','2.5');
    line.setAttribute('stroke-linecap','round'); line.setAttribute('stroke-linejoin','round');
    svg.appendChild(line);

    pts.forEach(function(p) {
        var c = document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx',p.x); c.setAttribute('cy',p.y);
        c.setAttribute('r','3.5'); c.setAttribute('fill','#fff');
        c.setAttribute('stroke','#FE4C28'); c.setAttribute('stroke-width','2');
        svg.appendChild(c);
    });

    labels.forEach(function(l,i) {
        var lx = pad + (i*(W-2*pad))/(labels.length-1);
        var t = document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('x',lx); t.setAttribute('y',H-6);
        t.setAttribute('text-anchor','middle'); t.setAttribute('font-size','10');
        t.setAttribute('fill','#9B958E'); t.textContent = l; svg.appendChild(t);
    });

    el.appendChild(svg);

    // Donut
    var dc = document.getElementById('donutChart');
    if (!dc) return;
    var dData = [
        { label:'Housing', val:35, c:'#FE4C28' },
        { label:'Food', val:25, c:'#FF7B5C' },
        { label:'Transport', val:20, c:'#C8A96E' },
        { label:'Other', val:20, c:'#E5E1DB' }
    ];
    var total = dData.reduce(function(s,d){return s+d.val;},0);
    var ang = -90, R = 85, cx = 130, cy = 130;

    var ds = document.createElementNS('http://www.w3.org/2000/svg','svg');
    ds.setAttribute('width','100%'); ds.setAttribute('height','100%');
    ds.setAttribute('viewBox','0 0 260 260');

    dData.forEach(function(d) {
        var sweep = (d.val/total)*360;
        var sa = ang*Math.PI/180, ea = (ang+sweep)*Math.PI/180;
        var x1 = cx+R*Math.cos(sa), y1 = cy+R*Math.sin(sa);
        var x2 = cx+R*Math.cos(ea), y2 = cy+R*Math.sin(ea);
        var p = document.createElementNS('http://www.w3.org/2000/svg','path');
        p.setAttribute('d','M '+cx+' '+cy+' L '+x1+' '+y1+' A '+R+' '+R+' 0 '+(sweep>180?1:0)+' 1 '+x2+' '+y2+' Z');
        p.setAttribute('fill',d.c); p.setAttribute('opacity','0.88');
        ds.appendChild(p); ang += sweep;
    });

    var cc = document.createElementNS('http://www.w3.org/2000/svg','circle');
    cc.setAttribute('cx',cx); cc.setAttribute('cy',cy); cc.setAttribute('r','52');
    cc.setAttribute('fill','#fff'); ds.appendChild(cc);

    var ct = document.createElementNS('http://www.w3.org/2000/svg','text');
    ct.setAttribute('x',cx); ct.setAttribute('y',cy-2);
    ct.setAttribute('text-anchor','middle'); ct.setAttribute('font-size','18');
    ct.setAttribute('font-weight','600'); ct.setAttribute('fill','#161311');
    ct.textContent = '$24.5K'; ds.appendChild(ct);

    var cl = document.createElementNS('http://www.w3.org/2000/svg','text');
    cl.setAttribute('x',cx); cl.setAttribute('y',cy+16);
    cl.setAttribute('text-anchor','middle'); cl.setAttribute('font-size','10');
    cl.setAttribute('fill','#9B958E'); cl.textContent = 'Total Saved';
    ds.appendChild(cl);

    dc.appendChild(ds);

    var leg = document.createElement('div');
    leg.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:16px;';
    dData.forEach(function(d) {
        var it = document.createElement('span');
        it.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#5A554F;';
        it.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:'+d.c+';display:inline-block;"></span> '+d.label;
        leg.appendChild(it);
    });
    dc.appendChild(leg);
}

// ---------- Calculator ----------
function initCalc() {
    var form = document.getElementById('savingsForm');
    if (!form) return;
    function calc() {
        var init = parseFloat(document.getElementById('initialAmount').value) || 0;
        var monthly = parseFloat(document.getElementById('monthlyAmount').value) || 0;
        var rate = parseFloat(document.getElementById('interestRate').value) || 0;
        var years = parseFloat(document.getElementById('years').value) || 0;
        var mr = rate/100/12, mo = years*12;
        var fvI = init * Math.pow(1+mr, mo);
        var fvM = mr > 0 ? monthly*((Math.pow(1+mr,mo)-1)/mr) : monthly*mo;
        var total = fvI + fvM;
        var contributed = init + (monthly*mo);
        var interest = total - contributed;
        var fmt = function(v) { return '$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); };
        document.getElementById('resultValue').textContent = fmt(total);
        document.getElementById('breakdownInitial').textContent = fmt(fvI);
        document.getElementById('breakdownMonthly').textContent = fmt(fvM);
        document.getElementById('breakdownInterest').textContent = fmt(interest);
    }
    form.addEventListener('input', calc); calc();
}

// ---------- Goals ----------
function initGoals() {
    document.querySelectorAll('.prog-fill').forEach(function(bar) {
        new IntersectionObserver(function(e, o) {
            e.forEach(function(en) {
                if (en.isIntersecting) {
                    var w = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(function(){ bar.style.width = w; }, 150);
                    o.unobserve(bar);
                }
            });
        }, { threshold: 0.3 }).observe(bar);
    });
}

// ---------- Auth ----------
function initAuth() {
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');

    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function pickRole() { var r = document.querySelector('input[name="role"]:checked'); return r ? r.value : null; }
    function say(msg) { SL.say(msg); }
    function showSuccess() {
        var overlay = document.getElementById('authSuccess');
        if (overlay) overlay.classList.add('active');
    }

    // LOG IN — validate proper email format, then permit successful login
    if (loginForm) loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = val('loginEmail'), pass = val('loginPass'), role = pickRole();
        if (!email || !pass) { say('Enter your email and password to continue.'); return; }
        if (!role) { say('Please select a role first.'); return; }

        // Validate proper email format
        var emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            say('Please enter a proper email address (e.g. you@email.com).');
            return;
        }

        // Retrieve existing profile name if available, else derive from email
        var profile = SL.read('stacklyProfile');
        var sameEmail = profile && profile.email && profile.email.toLowerCase() === email.toLowerCase();
        var name = (sameEmail && profile.name) ? profile.name : SL.nameFromEmail(email);

        // Save session
        SL.write('stacklyUser', { name: name, email: email, role: role, initials: SL.initials(name), since: Date.now() });

        // Save or update account in accounts registry
        SL.saveAccount({ name: name, email: email, password: pass, role: role, lastLogin: Date.now() });

        showSuccess();
        var dest = role === 'admin' ? 'admin.html' : 'dashboard.html';
        setTimeout(function() { window.location.href = dest; }, 2400);
    });

    // SIGN UP — create the password-backed profile, then continue to the login page
    if (signupForm) signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = val('suName'), email = val('suEmail'), pass = val('suPass');
        var confirmEl = document.getElementById('suConfirm');
        var confirmPass = confirmEl ? confirmEl.value.trim() : '';

        // Public signup strictly creates Client accounts
        var role = 'client';

        if (!name || !email || !pass) { say('Fill in your name, email and password.'); return; }
        if (pass.length < 8) { say('Use at least 8 characters for your password.'); return; }
        if (!confirmPass) { say('Confirm your password to continue.'); return; }
        if (pass !== confirmPass) { say('Passwords do not match — try again.'); return; }

        var existing = SL.findAccount(email);
        if (existing && existing.role === 'admin') {
            say('An administrative account with this email already exists.');
            return;
        }

        // Store password-backed account
        var account = {
            name: name,
            email: email,
            password: pass,
            role: role,
            createdAt: Date.now()
        };
        SL.saveAccount(account);
        SL.write('stacklyProfile', { name: name, email: email, role: role, password: pass });

        var overlay = document.getElementById('authSuccess');
        var sub = overlay ? overlay.querySelector('.auth-success-sub') : null;
        if (sub) sub.textContent = 'Taking you to the login page…';
        showSuccess();
        setTimeout(function() { window.location.href = 'login.html?msg=signup'; }, 2200);
    });
    document.querySelectorAll('.toggle-pass').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
            } else {
                input.type = 'password';
                this.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });
    });
}

// ---------- Toasts + global button functionality ----------
(function() {
    function ensureWrap() {
        var w = document.getElementById('toastWrap');
        if (!w) {
            w = document.createElement('div');
            w.id = 'toastWrap';
            w.className = 'toast-wrap';
            document.body.appendChild(w);
        }
        return w;
    }

    function toast(msg) {
        var wrap = ensureWrap();
        var t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = '<span class="t-ico"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><span></span>';
        t.lastChild.textContent = msg;
        wrap.appendChild(t);
        setTimeout(function() {
            t.classList.add('out');
            setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
        }, 3600);
    }
    window.toast = toast;

    document.addEventListener('DOMContentLoaded', function() {

        // 1. Placeholder / utility links
        document.querySelectorAll('a[data-toast], a[href="#"], a[href=""]').forEach(function(a) {
            if (a.__bound) return;
            a.__bound = true;
            a.addEventListener('click', function(e) {
                if (a.hasAttribute('data-logout')) return; // handled by the logout action
                var href = a.getAttribute('href');
                // In-page section anchor: let smooth scroll handle it, do NOT redirect to 404
                if (href && href.charAt(0) === '#' && href.length > 1) {
                    var target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        return;
                    }
                }
                var toastMsg = a.getAttribute('data-toast');
                if (toastMsg) {
                    e.preventDefault();
                    toast(toastMsg);
                    return;
                }
                if (href === '#' || href === '' || !href) {
                    e.preventDefault();
                    window.location.href = '404.html';
                }
            });
        });

        // Newsletter persistence helper
        function saveNewsletterSubscription(email) {
            var clean = String(email || '').trim().toLowerCase();
            if (!clean || clean.indexOf('@') < 0) return false;
            var subs = SL.read('stacklySubscribers') || [];
            var exists = subs.some(function(s) {
                return (typeof s === 'string' ? s : s.email) === clean;
            });
            if (!exists) {
                subs.push({
                    email: clean,
                    source: location.pathname.split('/').pop() || 'index.html',
                    subscribedAt: new Date().toISOString()
                });
                SL.write('stacklySubscribers', subs);
            }
            return true;
        }

        // 2. Newsletter forms (footer)
        document.querySelectorAll('.news-form').forEach(function(f) {
            f.addEventListener('submit', function(e) {
                e.preventDefault();
                var i = f.querySelector('input');
                var val = i ? i.value.trim() : '';
                if (!val) { toast('Enter your email address to subscribe.'); if (i) i.focus(); return; }
                if (val.indexOf('@') < 0) { toast('Please enter a valid email address.'); if (i) i.focus(); return; }
                saveNewsletterSubscription(val);
                if (i) i.value = '';
                toast('Subscribed! One thoughtful email, every week.');
            });
        });

        // 3. Standalone subscribe blocks (e.g. blog)
        document.querySelectorAll('.cta-dark button.btn-brand, .cta-dark .btn-brand').forEach(function(b) {
            if (b.__bound) return;
            b.__bound = true;
            b.addEventListener('click', function(e) {
                e.preventDefault();
                var box = b.parentElement;
                var i = box ? box.querySelector('input') : null;
                var val = i ? i.value.trim() : '';
                if (!val) { toast('Enter your email address to subscribe.'); if (i) i.focus(); return; }
                if (val.indexOf('@') < 0) { toast('Please enter a valid email address.'); if (i) i.focus(); return; }
                saveNewsletterSubscription(val);
                if (i) i.value = '';
                toast('Welcome aboard \u2014 check your inbox to confirm.');
            });
        });

        // 4. Contact form
        var cf = document.getElementById('contactForm');
        if (cf) cf.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameEl = document.getElementById('cName');
            var emailEl = document.getElementById('cEmail');
            var subEl = document.getElementById('cSubject');
            var msgEl = document.getElementById('cMessage');

            var name = (nameEl ? nameEl.value : '').trim();
            var email = (emailEl ? emailEl.value : '').trim();
            var subject = (subEl ? subEl.value : '').trim();
            var message = (msgEl ? msgEl.value : '').trim();

            if (!name || !email || !message) {
                toast('Please fill in your name, email and message.');
                return;
            }

            var btn = cf.querySelector('button[type="submit"]');
            var original = btn ? btn.innerHTML : '';
            if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
            setTimeout(function() {
                try {
                    var enquiries = SL.read('stacklyEnquiries') || [];
                    enquiries.push({
                        id: 'ENQ-' + Date.now(),
                        name: name,
                        email: email,
                        subject: subject || 'General Support',
                        message: message,
                        status: 'pending',
                        submittedAt: new Date().toISOString()
                    });
                    SL.write('stacklyEnquiries', enquiries);

                    if (btn) { btn.disabled = false; btn.innerHTML = original; }
                    cf.reset();
                    toast('Message sent \u2014 we reply within one business day.');
                } catch (err) {
                    if (btn) { btn.disabled = false; btn.innerHTML = original; }
                    toast('Unable to send enquiry. Please try again.');
                }
            }, 600);
        });

        // 5. Social sign-in (no provider wired up) -> 404 page
        document.querySelectorAll('.auth-soc-btn').forEach(function(b) {
            if (b.__bound) return;
            b.__bound = true;
            b.addEventListener('click', function() {
                window.location.href = '404.html';
            });
        });

        // 6. Mobile menu closes on link tap
        document.querySelectorAll('.nav-links a').forEach(function(a) {
            a.addEventListener('click', function() {
                var nav = document.querySelector('.navbar');
                if (nav) nav.classList.remove('mobile-open');
            });
        });
    });
})();
