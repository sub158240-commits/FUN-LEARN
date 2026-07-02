// app.js

// =============================================
//  AUTO TRANSLATOR (Google Translate API)
//  - Batches all pending texts into ONE request
//  - Uses debounce to avoid hammering the API
//  - Only observes new ELEMENT nodes (no characterData loops)
// =============================================
window.AutoTranslator = {
    cache: JSON.parse(localStorage.getItem('fl_trans_cache') || '{}'),
    observer: null,
    _debounceTimer: null,
    _pendingNodes: [],   // {node, text}
    _pendingEls: [],     // {el, text}

    init() {
        if (!this.observer) {
            this.observer = new MutationObserver(mutations => {
                for (let m of mutations) {
                    if (m.type === 'childList') {
                        m.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this._collectFromDOM(node);
                            }
                        });
                    }
                }
                this._scheduleBatch();
            });
        }
    },

    start() {
        this.init();
        this._collectFromDOM(document.body);
        this._scheduleBatch();
        // Only watch for new child elements, NOT characterData
        this.observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        if (this.observer) this.observer.disconnect();
        clearTimeout(this._debounceTimer);
        this._pendingNodes = [];
        this._pendingEls = [];
    },

    _needsTranslation(text) {
        if (!text || !text.trim()) return false;
        // Never translate the brand name
        if (text.includes('FUN') && text.includes('LEARN')) return false;
        const lang = App.language;
        const hasAr = /[\u0600-\u06FF]/.test(text);
        const hasEn = /[a-zA-Z]{2,}/.test(text); // at least 2 letters to avoid XP, ID etc.
        if (lang === 'en' && hasAr) return true;
        if (lang === 'ar' && hasEn && !hasAr) return true;
        return false;
    },

    _collectFromDOM(root) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const el = node.parentElement;
                if (!el) return NodeFilter.FILTER_SKIP;
                const tag = el.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
                if (el.closest && el.closest('.notranslate')) return NodeFilter.FILTER_REJECT;
                if (this._needsTranslation(node.nodeValue)) return NodeFilter.FILTER_ACCEPT;
                return NodeFilter.FILTER_SKIP;
            }
        });
        let node;
        while (node = walker.nextNode()) {
            const text = node.nodeValue.trim();
            if (!this._pendingNodes.find(p => p.node === node)) {
                this._pendingNodes.push({ node, text });
            }
        }
        if (root.querySelectorAll) {
            root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
                if (this._needsTranslation(el.placeholder) && !this._pendingEls.find(p => p.el === el)) {
                    this._pendingEls.push({ el, text: el.placeholder.trim() });
                }
            });
        }
    },

    _scheduleBatch() {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this._runBatch(), 600);
    },

    async _runBatch() {
        const lang = App.language;
        const srcLang = lang === 'ar' ? 'en' : 'ar';

        // Filter to only what still needs translation
        const nodes = this._pendingNodes.filter(p => {
            const key = `${srcLang}->${lang}:${p.text}`;
            if (this.cache[key]) {
                try { p.node.nodeValue = p.node.nodeValue.replace(p.text, this.cache[key]); } catch(e) {}
                return false;
            }
            return true;
        });
        const els = this._pendingEls.filter(p => {
            const key = `${srcLang}->${lang}:${p.text}`;
            if (this.cache[key]) {
                p.el.placeholder = this.cache[key];
                return false;
            }
            return true;
        });

        this._pendingNodes = [];
        this._pendingEls = [];

        // Batch all unique texts into one API call
        const uniqueTexts = [...new Set([...nodes.map(p => p.text), ...els.map(p => p.text)])];
        if (uniqueTexts.length === 0) return;

        try {
            // Google Translate allows multiple q params
            const params = uniqueTexts.map(t => `q=${encodeURIComponent(t)}`).join('&');
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLang}&tl=${lang}&dt=t&${params}`;
            const res = await fetch(url);
            const data = await res.json();

            // Parse response — for single text it's nested array, multi isn't supported this way
            // Fall back: translate one by one but in parallel with rate limit
            await this._translateBatch(uniqueTexts, srcLang, lang, nodes, els);
        } catch(e) {
            // Silent fail — UI still works
        }
    },

    async _translateBatch(texts, srcLang, tgtLang, nodes, els) {
        // Translate up to 5 at a time to avoid rate limiting
        const chunkSize = 5;
        for (let i = 0; i < texts.length; i += chunkSize) {
            const chunk = texts.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async text => {
                const key = `${srcLang}->${tgtLang}:${text}`;
                if (this.cache[key]) return;
                try {
                    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLang}&tl=${tgtLang}&dt=t&q=${encodeURIComponent(text)}`);
                    const data = await res.json();
                    if (data && data[0] && data[0][0]) {
                        this.cache[key] = data[0][0][0];
                    }
                } catch(e) {}
            }));
            // Save cache after each chunk
            localStorage.setItem('fl_trans_cache', JSON.stringify(this.cache));

            // Apply translations to nodes
            nodes.forEach(p => {
                const key = `${srcLang}->${tgtLang}:${p.text}`;
                if (this.cache[key]) {
                    try { p.node.nodeValue = p.node.nodeValue.replace(p.text, this.cache[key]); } catch(e) {}
                }
            });
            els.forEach(p => {
                const key = `${srcLang}->${tgtLang}:${p.text}`;
                if (this.cache[key]) p.el.placeholder = this.cache[key];
            });
        }
    }
};

window.renderAvatar = function(user) {
    if (!user) return '<span style="font-size:2em">🎓</span>';
    let frameStyle = '';
    if (user.equippedFrame) {
        const items = window.Store ? Store.getShopItems() : [];
        const frame = items.find(i => i.id === user.equippedFrame);
        if (frame) frameStyle = `border: 4px solid ${frame.color}; box-shadow: 0 0 12px ${frame.color}; border-radius: 50%;`;
    }
    return `<div style="display:inline-flex; align-items:center; justify-content:center; width:2em; height:2em; border-radius:50%; background:var(--surface-2); font-size:1em; ${frameStyle}">${user.avatar || '🎓'}</div>`;
};

// =============================================
//  TRANSLATION DICTIONARY
// =============================================
const translations = {
    ar: {
        navHome: "الرئيسية", navAccount: "حسابي",
        welcomeBack: "أهلاً بعودتك! 👋", loginSubtitle: "سجّل دخولك وكمّل رحلتك",
        emailOrUsername: "أدخل اسمك أو إيميلك", password: "كلمة المرور",
        loginBtn: "تسجيل الدخول", noAccount: "مستخدم جديد؟",
        registerLink: "إنشاء حساب", createAccount: "سجّل معنا! 🎉",
        registerSubtitle: "انضم للمجتمع واستمتع بالتعلم",
        chooseAvatar: "اختر شخصيتك", username: "اسم المستخدم",
        email: "البريد الإلكتروني", confirmPassword: "تأكيد كلمة المرور",
        registerBtn: "إنشاء الحساب", haveAccount: "عندك حساب؟",
        loginLink: "تسجيل الدخول",
        userExists: "اسم المستخدم أو البريد مستخدم مسبقاً.",
        // Content
        classesTitle: "صفوفك الدراسية 📚", btnBack: "رجوع",
        homeworkTitle: "الواجبات 📝", noHomework: "ما في واجبات الحين! استرح 😄",
        gamesTitle: "الألعاب التفاعلية 🎮", noGames: "ما في ألعاب حالياً.",
        btnLeaderboard: "🏆 لوحة الشرف",
        gameOver: "انتهت اللعبة!", btnToLeaderboard: "🏆 لوحة الشرف",
        btnBackToClass: "🔙 الرجوع للصف", question: "سؤال",
        of: "من", btnAnswer: "✅ أجب",
        leaderboardTitle: "🏆 لوحة الشرف", noResults: "لا توجد نتائج بعد.",
        settings: "الإعدادات", changeLang: "تغيير اللغة",
        currentLang: "العربية", btnSwitch: "تبديل", darkMode: "الوضع الليلي",
        btnLogout: "تسجيل الخروج",
        invalidLogin: "اسم المستخدم أو كلمة المرور غلط!",
        pwdNotMatch: "كلمات المرور ما تطابقت!",
        shopTitle: "🛍️ المتجر", coins: "عملات",
        buyBtn: "شراء", ownedBtn: "مملوك ✓", equipBtn: "تجهيز",
        equippedBtn: "مُجهَّز ✓", noCoins: "ما عندك عملات كافية!",
        boughtSuccess: "تم الشراء! 🎉", hintUsed: "💡 المساعدة: الإجابة تبدأ بـ",
        noHints: "ما عندك مساعدات. اشتري من المتجر!",
        coinsEarned: "عملات ربحت", xpEarned: "XP ربحت",
        streak: "أيام متتالية 🔥", shopHints: "مساعدات", shopFrames: "إطارات", shopMoods: "مزاج",
        // Classes
        c5: "الصف الخامس", c6: "الصف السادس", c7: "الصف السابع",
        game1: "لعبة الجمع السريع",
        loading: "جاري التحميل...",
    },
    en: {
        navHome: "Home", navAccount: "Account",
        welcomeBack: "Welcome back! 👋", loginSubtitle: "Login and keep learning",
        emailOrUsername: "Email or username", password: "Password",
        loginBtn: "Login", noAccount: "New here?",
        registerLink: "Create account", createAccount: "Join us! 🎉",
        registerSubtitle: "Join the community and have fun learning",
        chooseAvatar: "Choose your avatar", username: "Username",
        email: "Email", confirmPassword: "Confirm password",
        registerBtn: "Create account", haveAccount: "Have an account?",
        loginLink: "Login",
        userExists: "Username or email already in use.",
        // Content
        classesTitle: "Your Classes 📚", btnBack: "Back",
        homeworkTitle: "Homework 📝", noHomework: "No homework right now! Enjoy 😄",
        gamesTitle: "Interactive Games 🎮", noGames: "No games yet.",
        btnLeaderboard: "🏆 Leaderboard",
        gameOver: "Game Over!", btnToLeaderboard: "🏆 Leaderboard",
        btnBackToClass: "🔙 Back to class", question: "Question",
        of: "of", btnAnswer: "✅ Answer",
        leaderboardTitle: "🏆 Leaderboard", noResults: "No results yet.",
        settings: "Settings", changeLang: "Change Language",
        currentLang: "English", btnSwitch: "Switch", darkMode: "Dark Mode",
        btnLogout: "Logout",
        invalidLogin: "Wrong username or password!",
        pwdNotMatch: "Passwords do not match!",
        shopTitle: "🛍️ Shop", coins: "coins",
        buyBtn: "Buy", ownedBtn: "Owned ✓", equipBtn: "Equip",
        equippedBtn: "Equipped ✓", noCoins: "Not enough coins!",
        boughtSuccess: "Purchased! 🎉", hintUsed: "💡 Hint: Answer starts with",
        noHints: "No hints. Buy from the shop!",
        coinsEarned: "coins earned", xpEarned: "XP earned",
        streak: "day streak 🔥", shopHints: "Hints", shopFrames: "Frames", shopMoods: "Moods",
        // Classes
        c5: "Grade 5", c6: "Grade 6", c7: "Grade 7",
        game1: "Fast Math Game",
        loading: "Loading...",
    }
};

window.t = function(key) {
    const lang = (typeof App !== 'undefined' && App.language) ? App.language : 'ar';
    return translations[lang][key] !== undefined ? translations[lang][key] : key;
};

// =============================================
//  TOAST HELPER
// =============================================
window.showToast = function(msg, type = '') {
    let el = document.getElementById('toast-el');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-el';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent  = msg;
    el.className    = `toast ${type}`;
    void el.offsetWidth;  // reflow
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2500);
};

// Coin fly animation
window.spawnCoinFly = function(amount) {
    const el = document.createElement('div');
    el.className = 'coin-fly';
    el.textContent = `🪙 +${amount}`;
    el.style.left = '50%'; el.style.top = '20%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
};

// =============================================
//  APP
// =============================================
const App = {
    currentRoute: '',
    language: 'ar',
    isDark: false,

    async init() {
        this.cacheDOM();
        this.bindEvents();
        this.initTheme();
        this.initLang();
        
        await Auth.init();
        
        this.updateLoader();
        window.addEventListener('hashchange', () => this.handleRoute());
    },

    cacheDOM() {
        this.loader      = document.getElementById('loader');
        this.mainContent = document.getElementById('main-content');
        this.bottomNav   = document.getElementById('bottom-nav');
        this.langToggle  = document.getElementById('lang-toggle');
        this.themeToggle = document.getElementById('theme-toggle');
        this.headerCoins = document.getElementById('header-coins-val');
    },

    bindEvents() {
        this.langToggle.addEventListener('click',  () => this.toggleLanguage());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    },

    updateLoader() {
        setTimeout(() => {
            this.loader.style.opacity = '0';
            setTimeout(() => {
                this.loader.classList.add('hidden');
                this.handleRoute();
            }, 450);
        }, 900);
    },

    // ── Theme ──────────────────────────────
    initTheme() {
        if (localStorage.getItem('fl_theme') === 'dark') {
            this.isDark = true;
            document.body.classList.replace('light-mode', 'dark-mode');
        }
    },
    toggleTheme() {
        this.isDark = !this.isDark;
        document.body.classList.toggle('dark-mode', this.isDark);
        document.body.classList.toggle('light-mode', !this.isDark);
        localStorage.setItem('fl_theme', this.isDark ? 'dark' : 'light');
    },

    // ── Language ───────────────────────────
    initLang() {
        const saved = localStorage.getItem('fl_lang');
        if (saved) this.language = saved;
        this.applyLanguage();
    },
    toggleLanguage() {
        this.language = this.language === 'ar' ? 'en' : 'ar';
        localStorage.setItem('fl_lang', this.language);
        this.applyLanguage();
        this.handleRoute();
    },
    applyLanguage() {
        document.documentElement.lang = this.language;
        document.documentElement.dir  = this.language === 'ar' ? 'rtl' : 'ltr';
        const btn = this.langToggle.querySelector('.lang-text');
        if (btn) btn.textContent = this.language === 'ar' ? 'EN' : 'عربي';
        const dict = translations[this.language];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!dict[key]) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = dict[key];
            else el.textContent = dict[key];
        });
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            window.deferredPrompt = e;
        });

        window.AutoTranslator.start();
    },

    // ── Coins display ──────────────────────
    async updateHeaderCoins() {
        if (Auth.isLoggedIn() && (!Auth.isAdmin() || Auth.isPreviewMode)) {
            await Auth.refresh();
            const el = document.getElementById('header-coins-val');
            if (el) el.textContent = Auth.currentUser.coins || 0;
            const wrap = document.getElementById('header-coins-wrap');
            if (wrap) wrap.style.display = 'flex';
        } else {
            const wrap = document.getElementById('header-coins-wrap');
            if (wrap) wrap.style.display = 'none';
        }
    },

    // ── Navigation ─────────────────────────
    navigate(route) { window.location.hash = route; },

    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        this.currentRoute = hash.split('/')[0];
        const param = hash.split('/')[1];

        this.mainContent.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;margin-top:5rem;gap:1rem;"><div class="loader-cartoon">🚀</div><div style="font-weight:900;color:var(--primary);font-size:1.2rem;" data-i18n="loading">جاري التحميل...</div></div>';
        
        await this.updateHeaderCoins();
        this.updateNav();

        if (!Auth.isLoggedIn()) {
            if (localStorage.getItem('fl_landing_seen') !== 'true' && this.currentRoute !== 'landing') {
                this.navigate('landing'); return;
            }
            if (!['login', 'register', 'landing'].includes(this.currentRoute)) {
                this.navigate('login'); return;
            }
        }
        
        if (Auth.isLoggedIn() && ['login', 'register', 'landing'].includes(this.currentRoute)) {
            this.navigate('home'); return;
        }

        const routes = {
            landing:  async () => this.renderLanding(),
            login:    async () => this.renderLogin(),
            register: async () => await this.renderRegister(),
            home:     async () => Auth.isAdmin() ? await AdminView.renderDashboard() : await StudentView.renderHome(),
            account:  async () => await StudentView.renderAccount(),
            class:    async () => await StudentView.renderClass(param),
            homework: async () => await StudentView.renderHomework(param),
            game:     async () => await StudentView.renderGame(param),
            results:  async () => await StudentView.renderResults(),
            shop:     async () => await StudentView.renderShop(),
            admin:    async () => Auth.isAdmin() ? await AdminView.renderDashboard() : this.navigate('home'),
        };
        
        try {
            await (routes[this.currentRoute] || (async () => this.navigate('home')))();
        } catch (e) {
            console.error(e);
            this.mainContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">حدث خطأ</div></div>';
        }
    },

    updateNav() {
        if (Auth.isLoggedIn() && (!Auth.isAdmin() || Auth.isPreviewMode)) {
            this.bottomNav.style.display = 'flex';
            document.querySelectorAll('.nav-item').forEach(item => {
                const active = item.getAttribute('href') === `#${this.currentRoute}`;
                item.classList.toggle('active', active);
                const label = item.querySelector('.nav-label');
                if (label) {
                    const key = label.getAttribute('data-i18n');
                    if (key) label.textContent = t(key);
                }
            });
        } else {
            this.bottomNav.style.display = 'none';
        }
    },

    playWelcomeSpeech(lang) {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        
        const text = lang === 'ar'
            ? 'مرحباً بك، كن مستعداً للبدء!'
            : 'Welcome! Get ready to start!';
        
        const speak = () => {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang  = lang === 'ar' ? 'ar-SA' : 'en-US';
            msg.rate  = 0.82;
            msg.pitch = 1.1;
            
            const voices = window.speechSynthesis.getVoices();
            const prefix = lang === 'ar' ? 'ar' : 'en';
            // Prefer high quality voices (Google/Microsoft Premium first)
            let voice = voices.find(v => v.lang.startsWith(prefix) && v.name.includes('Google'));
            if (!voice) voice = voices.find(v => v.lang.startsWith(prefix) && v.name.includes('Microsoft'));
            if (!voice) voice = voices.find(v => v.lang.startsWith(prefix));
            if (voice) msg.voice = voice;
            
            window.speechSynthesis.speak(msg);
        };

        // Voices may not be loaded yet on first call
        if (window.speechSynthesis.getVoices().length > 0) {
            speak();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null;
                speak();
            };
        }
    },

    // ── Landing Page ───────────────────────
    renderLanding() {
        const tpl = document.getElementById('tpl-landing');
        const content = tpl.content.cloneNode(true);
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(content);
        this.applyLanguage();
    },

    async downloadDesktopApp() {
        if (window.deferredPrompt) {
            // Show the install prompt
            window.deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            window.deferredPrompt = null;
            // After interaction, proceed to website
            this.continueToWebsite();
            return;
        }

        // Fallback for browsers that don't support PWA install or already installed
        const urlFileContent = `[InternetShortcut]\nURL=${window.location.href.split('#')[0]}\nIconIndex=0`;
        const blob = new Blob([urlFileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'FUN_AND_LEARN.url';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // After download, proceed to login
        this.continueToWebsite();
    },

    continueToWebsite() {
        localStorage.setItem('fl_landing_seen', 'true');
        this.navigate('login');
    },

    // ── Login Page ─────────────────────────
    renderLogin() {
        const tpl     = document.getElementById('tpl-login');
        const content = tpl.content.cloneNode(true);
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(content);
        this.applyLanguage();

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id   = document.getElementById('login-identifier').value.trim();
            const pass = document.getElementById('login-password').value;
            const btn  = document.getElementById('login-btn');
            btn.textContent = '⏳';
            
            const res = await Auth.login(id, pass);
            if (res && res.success) {
                if (Auth.currentUser && !localStorage.getItem('fl_first_login_' + Auth.currentUser.id)) {
                    localStorage.setItem('fl_first_login_' + Auth.currentUser.id, 'true');
                    this.playWelcomeSpeech(this.language);
                }
                this.navigate('home');
            } else {
                btn.textContent = t('loginBtn');
                showToast((res && res.message) ? res.message : t('invalidLogin'), 'error');
            }
        });
    },

    // ── Register Page ──────────────────────
    async renderRegister() {
        const tpl     = document.getElementById('tpl-register');
        const content = tpl.content.cloneNode(true);
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(content);
        this.applyLanguage();

        const classSelect = document.getElementById('reg-class');
        if (classSelect) {
            const classes = await Store.getClasses();
            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                classSelect.appendChild(opt);
            });
        }

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const avatarElement = document.querySelector('input[name="avatar"]:checked');
            if(!avatarElement) return;
            const avatar = avatarElement.value;
            const username = document.getElementById('reg-username').value.trim();
            const email    = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirm  = document.getElementById('reg-confirm').value;
            const classId  = document.getElementById('reg-class').value;
            
            if (password !== confirm) { showToast(t('pwdNotMatch'), 'error'); return; }
            
            const btn = document.getElementById('register-btn');
            if(btn) btn.textContent = '⏳';
            
            const res = await Auth.register({ username, email, password, avatar, classId });
            if (res.success) {
                showToast(t('accountPending'), 'success');
                this.navigate('login');
            } else {
                if(btn) btn.textContent = t('registerBtn');
                showToast(res.message, 'error');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
