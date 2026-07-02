// student.js

const CLASS_COLORS = ['purple', 'blue', 'green', 'orange'];

const StudentView = {

    // ── HOME ──────────────────────────────────────────────────────────
    async renderHome() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        
        await Auth.refresh(); // Ensure we have latest user data (coins, xp, streak)
        const user    = Auth.currentUser;
        const classes = await Store.getClasses();
        const results = await Store.getUserGameResults(user.id);
        const totalXP = (user.xp || 0);
        const level   = Math.floor(totalXP / 100) + 1;
        const xpPct   = ((totalXP % 100) / 100 * 100).toFixed(0);

        let html = `
        <div class="fade-in stagger">
            <!-- Streak banner (if streak > 0) -->
            ${(user.streak > 0) ? `
            <div class="streak-banner mb-2">
                <div class="streak-icon">🔥</div>
                <div>
                    <div class="streak-text">${user.streak} ${t('streak')}</div>
                    <div class="streak-sub">${user.username}</div>
                </div>
            </div>` : ''}

            <!-- XP Bar -->
            <div class="xp-bar-wrap mb-2">
                <div class="xp-bar-header">
                    <span class="xp-bar-label">⚡ Level ${level}</span>
                    <span class="xp-bar-label">${totalXP} XP</span>
                </div>
                <div class="xp-bar-track">
                    <div class="xp-bar-fill" style="width: ${xpPct}%"></div>
                </div>
            </div>

            <!-- Classes -->
            <div class="section-title">${t('classesTitle')}</div>
        `;

        if (classes.length === 0) {
            html += `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">لا توجد صفوف بعد</div></div>`;
        } else {
            // In preview mode (admin browsing as student), show all classes
            const isPreview = Auth.isPreviewMode;
            const userClass = isPreview ? null : classes.find(c => c.id === user.classId);
            const displayClasses = isPreview ? classes : (userClass ? [userClass] : []);
            
            if (displayClasses.length === 0) {
                html += `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">لم يتم تحديد صف لك بعد</div></div>`;
            } else {
                for (let i = 0; i < displayClasses.length; i++) {
                    const cls = displayClasses[i];
                    const color    = cls.color || CLASS_COLORS[i % CLASS_COLORS.length];
                    const hwCount  = (await Store.getHomeworkByClass(cls.id)).length;
                    const gmCount  = (await Store.getGamesByClass(cls.id)).length;
                    html += `
                    <div class="class-card" onclick="window.location.hash='class/${cls.id}'">
                        <div class="class-card-icon ${color}">${cls.icon || '📚'}</div>
                        <div class="class-card-body">
                            <div class="class-card-title">${cls.name}</div>
                            <div class="class-card-sub">📝 ${hwCount} واجب &nbsp;·&nbsp; 🎮 ${gmCount} لعبة</div>
                        </div>
                        <div class="class-card-arrow">›</div>
                    </div>`;
                }
            }
        }

        html += `
            <!-- Quick stats -->
            <div class="section-title mt-2">📊 إحصائياتك</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
                <div class="card text-center" style="padding:1rem;">
                    <div style="font-size:2rem;">🎮</div>
                    <div style="font-size:1.6rem;font-weight:900;color:var(--primary);">${results.length}</div>
                    <div style="font-size:0.8rem;color:var(--muted-light);font-weight:700;">جلسة لعب</div>
                </div>
                <div class="card text-center card-interactive" style="padding:1rem;" onclick="App.navigate('shop')">
                    <div style="font-size:2rem;">🪙</div>
                    <div style="font-size:1.6rem;font-weight:900;color:#92400E;">${user.coins || 0}</div>
                    <div style="font-size:0.8rem;color:var(--muted-light);font-weight:700;">${t('coins')}</div>
                </div>
            </div>

            <!-- Go to shop -->
            <button class="btn btn-warning btn-block" onclick="App.navigate('shop')" style="margin-bottom:0.5rem;">
                🛍️ ${t('shopTitle')}
            </button>
            <button class="btn btn-ghost btn-block" onclick="App.navigate('results')">
                ${t('btnLeaderboard')}
            </button>
        </div>`;

        App.mainContent.innerHTML = html;
    },

    // ── CLASS ─────────────────────────────────────────────────────────
    async renderClass(classId) {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        
        const classes = await Store.getClasses();
        const cls = classes.find(c => c.id === classId);
        if (!cls) return App.navigate('home');

        const homeworks = await Store.getHomeworkByClass(classId);
        const games     = await Store.getGamesByClass(classId);
        const name      = cls.name;

        let html = `
        <div class="fade-in">
            <button class="btn btn-ghost btn-sm mb-2" onclick="window.history.back()">‹ ${t('btnBack')}</button>
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
                <div class="class-card-icon ${cls.color || 'purple'}" style="width:56px;height:56px;font-size:2rem;">${cls.icon}</div>
                <h2 style="font-size:1.4rem;font-weight:900;color:var(--text);">${name}</h2>
            </div>

            <div class="section-title">${t('homeworkTitle')}</div>`;

        if (homeworks.length === 0) {
            html += `<div class="empty-state" style="padding:1.5rem 0.5rem;">
                <div class="empty-state-icon">😄</div>
                <div class="empty-state-title">${t('noHomework')}</div>
            </div>`;
        } else {
            homeworks.forEach(hw => {
                const addedStr = hw.addedDate ? new Date(hw.addedDate).toLocaleDateString() : '';
                const dueStr = hw.dueDate ? new Date(hw.dueDate).toLocaleString() : 'مفتوح';
                html += `
                <div class="class-card" onclick="window.location.hash='homework/${hw.id}'">
                    <div class="class-card-icon blue" style="font-size:1.6rem;">📝</div>
                    <div class="class-card-body">
                        <div class="class-card-title">${hw.title}</div>
                        <div class="class-card-sub" style="font-size:0.75rem;">إضافة: ${addedStr} | انتهاء: <span style="${hw.dueDate && new Date() > new Date(hw.dueDate) ? 'color:var(--red);font-weight:bold;' : ''}">${dueStr}</span></div>
                    </div>
                    <div class="class-card-arrow">›</div>
                </div>`;
            });
        }

        html += `<div class="section-title mt-2">${t('gamesTitle')}</div>`;

        if (games.length === 0) {
            html += `<div class="empty-state" style="padding:1.5rem 0.5rem;">
                <div class="empty-state-icon">🎮</div>
                <div class="empty-state-title">${t('noGames')}</div>
            </div>`;
        } else {
            games.forEach(game => {
                const title = game.titleKey ? t(game.titleKey) : game.title;
                html += `
                <div class="class-card" onclick="window.location.hash='game/${game.id}'" style="border-color:var(--green);border-bottom-color:var(--green-dark);">
                    <div class="class-card-icon green" style="font-size:1.6rem;">🎮</div>
                    <div class="class-card-body">
                        <div class="class-card-title">${title}</div>
                        <div class="class-card-sub">🪙 ${game.questions ? game.questions.length * 5 : 0} عملات محتملة</div>
                    </div>
                    <div class="class-card-arrow">›</div>
                </div>`;
            });
        }

        html += `</div>`;
        App.mainContent.innerHTML = html;
    },

    // ── HOMEWORK ──────────────────────────────────────────────────────
    async renderHomework(hwId) {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        
        // Use direct query since we added getHomeworkById
        let hw = await Store.getHomeworkById(hwId);
        if (!hw) return App.navigate('home');
        
        const isDone = await Store.hasCompletedHomework(Auth.currentUser.id, hwId);
        const isTimeUp = hw.dueDate && new Date() > new Date(hw.dueDate);

        window.markHomeworkDone = async (btn) => {
            if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
            await Store.saveHomeworkResult(Auth.currentUser.id, hwId);
            showToast('🎉 تم تسجيل تسليمك بنجاح! +10 عملات، +50 XP', 'success');
            setTimeout(() => App.navigate('class/' + hw.classId), 1500);
        };

        if (isTimeUp && !isDone) {
            App.mainContent.innerHTML = `
            <div class="fade-in">
                <button class="btn btn-ghost btn-sm mb-2" onclick="window.history.back()">‹ ${t('btnBack')}</button>
                <div class="empty-state">
                    <div class="empty-state-icon">⏰</div>
                    <div class="empty-state-title" style="color:var(--red);">انتهى الوقت!</div>
                    <p class="text-muted" style="margin-top:0.5rem;">عذراً، انتهى الوقت المخصص لهذا الواجب.</p>
                </div>
            </div>`;
            return;
        }

        App.mainContent.innerHTML = `
        <div class="fade-in">
            <button class="btn btn-ghost btn-sm mb-2" onclick="window.history.back()">‹ ${t('btnBack')}</button>
            <h2 style="font-size:1.2rem; font-weight:900; margin-bottom:0.75rem;">${hw.title}</h2>
            
            ${ isDone ? `
            <div style="background:var(--green-light,rgba(34,197,94,0.1)); border:2px solid var(--green); border-radius:var(--r-lg); padding:1rem; text-align:center; margin-bottom:1rem;">
                <div style="font-size:2rem;">✅</div>
                <div style="font-weight:900; color:var(--green);">لقد سلّمت هذا الواجب بالفعل!</div>
            </div>` : '' }

            <div class="card" style="padding:0; overflow:hidden; border-radius:var(--r-lg); margin-bottom:1rem;">
                <iframe src="${hw.link}" style="width:100%; height:62vh; border:none; display:block;"></iframe>
            </div>

            ${ !isDone ? `
            <div style="background:var(--surface-2); border:2px solid var(--border); border-radius:var(--r-lg); padding:1.25rem; text-align:center;">
                <p style="color:var(--text-2); font-weight:700; margin-bottom:0.75rem;">بعد الضغط على زر <strong>إرسال</strong> في الاستمارة أعلاه، اضغط هنا لتسجيل تسليمك:</p>
                <button class="btn btn-success btn-block" onclick="markHomeworkDone(this)" style="font-size:1.1rem; padding:0.9rem;">
                    ✅ لقد أرسلت الواجب — سجّل التسليم
                </button>
            </div>` : '' }
        </div>`;
    },

    // ── GAME ──────────────────────────────────────────────────────────
    async renderGame(gameId) {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        
        const games = await Store.getGames();
        const game = games.find(g => g.id === gameId);
        if (!game) return App.navigate('home');

        // ── Check play limit ──────────────────────────────────────────
        const isAdminPreview = Auth.isPreviewMode || (Auth.currentUser && Auth.currentUser.role === 'admin');
        if (!isAdminPreview && game.maxPlays > 0) {
            const playCount = await Store.getGamePlayCount(Auth.currentUser.id, gameId);
            if (playCount >= game.maxPlays) {
                App.mainContent.innerHTML = `
                <div class="fade-in" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:3rem 1.5rem;">
                    <div style="font-size:5rem; margin-bottom:1rem;">🔒</div>
                    <h2 style="color:var(--text); margin-bottom:0.5rem;">انتهت محاولاتك!</h2>
                    <p class="text-muted" style="margin-bottom:1.5rem;">لعبت هذه اللعبة <strong>${playCount}</strong> من أصل <strong>${game.maxPlays}</strong> مرات مسموح.</p>
                    <p class="text-muted" style="font-size:0.85rem; margin-bottom:1.5rem;">تواصل مع معلمك إذا أردت محاولة إضافية.</p>
                    <button class="btn btn-primary" onclick="App.navigate('home')">🏠 العودة للرئيسية</button>
                </div>`;
                return;
            }
        }

        // ✅ Shuffle questions randomly (Fisher-Yates)
        const shuffled = [...game.questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Use shuffled copy, original game object is unchanged
        const gameQuestions = shuffled;

        let currentQ = 0;
        let score = 0;
        let hints = Auth.currentUser.hints || 0;
        
        const renderQ = async () => {
            if (currentQ >= gameQuestions.length) {
                App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
                
                // Save and show result
                await Store.saveResult({
                    userId: Auth.currentUser.id,
                    gameId: game.id,
                    score,
                    total: gameQuestions.length
                });
                await Auth.refresh(); // Update coins/xp display
                App.updateHeaderCoins();
                
                const coinsEarned = score * 5;
                if (coinsEarned > 0) setTimeout(() => spawnCoinFly(coinsEarned), 500);

                App.mainContent.innerHTML = `
                <div class="fade-in">
                    <div class="game-over-card">
                        <h2>${t('gameOver')}</h2>
                        <div class="game-score-display">${score}/${gameQuestions.length}</div>
                        ${coinsEarned > 0 ? `<div class="game-coins-earned">🪙 +${coinsEarned} ${t('coins')}</div>` : ''}
                        
                        <div style="display:flex;gap:1rem;margin-top:1.5rem;">
                            <button class="btn btn-primary btn-block" onclick="App.navigate('class/${game.classId}')">
                                ${t('btnBackToClass')}
                            </button>
                            <button class="btn btn-ghost btn-block" onclick="App.navigate('results')">
                                ${t('btnToLeaderboard')}
                            </button>
                        </div>
                    </div>
                </div>`;
                return;
            }

            const q = gameQuestions[currentQ];
            const pct = (currentQ / gameQuestions.length) * 100;

            App.mainContent.innerHTML = `
            <div class="fade-in game-wrap">
                <button class="btn btn-ghost btn-sm mb-2" style="position:absolute; top:1.5rem; right:1.5rem;" onclick="window.history.back()">X</button>
                <div class="game-progress-bar">
                    <div class="game-progress-fill" style="width: ${pct}%"></div>
                </div>

                <div class="game-question-card">
                    <div style="color:var(--muted-light);font-weight:800;margin-bottom:1rem;text-transform:uppercase;letter-spacing:1px;font-size:0.9rem;">
                        ${t('question')} ${currentQ+1} ${t('of')} ${gameQuestions.length}
                    </div>
                    <div class="game-question-text">${q.q}</div>

                    ${q.type === 'mcq' ? 
                        `<div style="display:grid;grid-template-columns:1fr;gap:0.75rem;margin-top:2rem;">
                            ${q.opts.map((opt, idx) => `
                                <button class="btn btn-ghost btn-block" style="justify-content:flex-start;text-align:right;font-size:1.1rem;" onclick="submitMCQ('${opt.replace(/'/g, "\\'")}')">
                                    <span style="display:inline-block; width:24px; height:24px; text-align:center; background:var(--bg); border-radius:50%; margin-left:10px;">${idx+1}</span> ${opt}
                                </button>
                            `).join('')}
                        </div>` 
                        : 
                        `<input type="text" id="game-answer" class="game-answer-input" autocomplete="off" autofocus>`
                    }
                </div>

                <div class="game-hint-bar">
                    <button class="btn btn-warning btn-sm" id="btn-hint">
                        💡 مساعدة (${hints})
                    </button>
                </div>

                ${q.type !== 'mcq' ? `
                <button class="btn btn-success btn-block btn-lg" id="btn-answer">
                    ${t('btnAnswer')}
                </button>` : ''}
            </div>`;

            const btnHnt = document.getElementById('btn-hint');

            const handleAnswer = (isCorrect) => {
                const overlay = document.createElement('div');
                overlay.className = isCorrect ? 'flash-success' : 'flash-error';
                overlay.innerHTML = `<div style="font-size: 5rem;">${isCorrect ? '✅' : '❌'}</div>`;
                document.body.appendChild(overlay);

                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    osc.connect(ctx.destination);
                    if (isCorrect) {
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(440, ctx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                    } else {
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(150, ctx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                    }
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                } catch (e) {}

                if (isCorrect) score++;
                
                setTimeout(() => {
                    overlay.remove();
                    currentQ++;
                    renderQ();
                }, 800);
            };

            if (q.type !== 'mcq') {
                const input  = document.getElementById('game-answer');
                const btnAns = document.getElementById('btn-answer');

                const submitAns = () => {
                    const val = input.value.trim();
                    if (!val) return;
                    const isCorrect = (val == q.a || val.toLowerCase() === q.a.toLowerCase());
                    handleAnswer(isCorrect);
                };

                btnAns.addEventListener('click', submitAns);
                input.addEventListener('keypress', e => { if (e.key === 'Enter') submitAns(); });
                input.focus();
            }

            window.submitMCQ = (selectedOption) => {
                const isCorrect = (selectedOption == q.a);
                handleAnswer(isCorrect);
            };

            btnHnt.addEventListener('click', async () => {
                hints = Auth.currentUser.hints || 0;
                if (hints <= 0) { showToast(t('noHints'), 'error'); return; }
                
                await Store.updateUser(Auth.currentUser.id, { hints: hints - 1 });
                await Auth.refresh();
                hints = Auth.currentUser.hints || 0;
                btnHnt.innerHTML = `💡 مساعدة (${hints})`;
                
                let hintTxt = '';
                if (q.type === 'mcq') {
                    const wrongOpts = q.opts.filter(o => o !== q.a);
                    hintTxt = 'ليس: ' + wrongOpts[0];
                } else {
                    hintTxt = t('hintUsed') + ' ' + q.a.charAt(0);
                }
                
                const popup = document.createElement('div');
                popup.className = 'hint-popup';
                popup.textContent = hintTxt;
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 3000);
            });
        };

        renderQ();
    },

    // ── LEADERBOARD / RESULTS ─────────────────────────────────────────
    async renderResults() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        const classId = Auth.currentUser ? Auth.currentUser.classId : null;
        const users = await Store.getLeaderboard(classId);

        let html = `
        <div class="fade-in">
            <div class="section-title text-center mb-0">${t('leaderboardTitle')}</div>
            <p class="text-center text-muted mb-2" style="font-size:0.9rem;">أبطال هذا الصف 🌟</p>
        `;

        if (users.length === 0) {
            html += `<p class="text-center text-muted" style="margin-top:2rem;">${t('noResults')}</p>`;
        } else {
            const top3 = users.slice(0, 3);
            const rest = users.slice(3);

            html += `<div class="podium-container">`;
            const places = [
                { idx: 1, p: top3[1] },
                { idx: 0, p: top3[0] },
                { idx: 2, p: top3[2] }
            ];
            
            places.forEach(item => {
                if (!item.p) return;
                const rClass = item.idx === 0 ? 'place-1' : (item.idx === 1 ? 'place-2' : 'place-3');
                const medal = item.idx === 0 ? '🥇' : (item.idx === 1 ? '🥈' : '🥉');
                html += `
                <div class="podium-place ${rClass}">
                    <div class="podium-avatar">
                        ${item.idx === 0 ? '<div class="podium-crown">👑</div>' : ''}
                        ${window.renderAvatar(item.p)}
                    </div>
                    <div class="podium-bar">
                        <div style="font-size:0.8rem;">${medal}</div>
                        <div>${item.p.xp || 0}</div>
                        <div style="font-size:0.6rem;opacity:0.8;">XP</div>
                    </div>
                    <div class="podium-name">${item.p.username}</div>
                </div>`;
            });
            html += `</div>`;

            if (rest.length > 0) {
                html += `<ul class="rank-list">`;
                rest.forEach((u, i) => {
                    html += `
                    <li class="rank-item">
                        <div class="rank-number">${i + 4}</div>
                        <div class="rank-avatar">${window.renderAvatar(u, 'font-size: 0.6em;')}</div>
                        <div class="rank-details">
                            <div class="rank-name">${u.username}</div>
                        </div>
                        <div class="rank-score">⚡ ${u.xp || 0} XP</div>
                    </li>`;
                });
                html += `</ul>`;
            }
        }

        html += `</div>`;
        App.mainContent.innerHTML = html;
    },

    // ── SHOP ──────────────────────────────────────────────────────────
    async renderShop() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        
        await Auth.refresh(); // ensure coins/items are synced
        const items = Store.getShopItems();
        const user = Auth.currentUser;
        const ownedIds = await Store.getUserItems(user.id);

        let html = `
        <div class="fade-in">
            <div style="background:var(--gold); color:#92400E; padding:1.5rem; border-radius:var(--r-xl); margin-bottom:1.5rem; text-align:center; border: 3px solid #B45309; border-bottom-width:6px;">
                <div style="font-size:3rem; margin-bottom:0.5rem; line-height:1;">🛍️</div>
                <h2 style="font-weight:900; font-size:1.6rem; margin-bottom:0.25rem;">متجر اللعبة</h2>
                <p style="font-weight:700; opacity:0.9;">استخدم عملاتك لشراء مميزات!</p>
            </div>
            
            <div class="section-title mb-2">إطارات الصور 🖼️</div>
            <div class="shop-items-grid mb-3">
        `;
        
        items.filter(i => i.type === 'frame').forEach(item => {
            const isOwned = ownedIds.includes(item.id);
            const isEquipped = user.equippedFrame === item.id;
            let status = 'buy';
            if (isEquipped) status = 'equipped';
            else if (isOwned) status = 'owned';
            
            let btnClass = 'btn-primary';
            let btnText = `${item.price} 🪙`;
            if (status === 'equipped') { btnClass = 'btn-success'; btnText = t('equippedBtn'); }
            else if (status === 'owned') { btnClass = 'btn-secondary'; btnText = t('equipBtn'); }
            else if (user.coins < item.price) { btnClass = 'btn-ghost'; }
            
            html += `
            <div class="shop-item ${status === 'equipped' ? 'equipped' : ''} ${status === 'owned' ? 'owned' : ''}">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <button class="btn ${btnClass} btn-sm btn-block" style="padding:0.4rem; font-size:0.85rem;" onclick="StudentView.buyItem('${item.id}', '${status}')">
                    ${btnText}
                </button>
            </div>`;
        });
        
        html += `</div>
            <div class="section-title mb-2">مساعدات وأدوات 💡</div>
            <div class="shop-items-grid">
        `;

        items.filter(i => i.type === 'hint').forEach(item => {
            let btnClass = user.coins >= item.price ? 'btn-primary' : 'btn-ghost';
            html += `
            <div class="shop-item">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <button class="btn ${btnClass} btn-sm btn-block" style="padding:0.4rem; font-size:0.85rem;" onclick="StudentView.buyItem('${item.id}', 'buy')">
                    ${item.price} 🪙
                </button>
            </div>`;
        });

        html += `</div></div>`;
        App.mainContent.innerHTML = html;
    },

    async buyItem(itemId, status) {
        const item = Store.getShopItems().find(i => i.id === itemId);
        const user = Auth.currentUser;
        
        if (status === 'buy') {
            if (user.coins < item.price) { showToast(t('noCoins'), 'error'); return; }
            if (confirm(`هل تريد شراء "${item.name}" مقابل ${item.price} عملة؟`)) {
                await Store.buyItem(user.id, itemId);
                showToast(t('boughtSuccess'), 'success');
                App.updateHeaderCoins();
                this.renderShop();
            }
        } else if (status === 'owned') {
            await Store.equipFrame(user.id, itemId);
            showToast('تم التجهيز!', 'success');
            await Auth.refresh();
            this.renderShop();
        }
    },

    // ── ACCOUNT ───────────────────────────────────────────────────────
    async renderAccount() {
        await Auth.refresh();
        const user = Auth.currentUser;
        let frameStyle = '';
        if (user.equippedFrame) {
            const frame = Store.getShopItems().find(i => i.id === user.equippedFrame);
            if (frame) frameStyle = `border: 6px solid ${frame.color};`;
        }

        let html = `
        <div class="fade-in">
            <div class="profile-header">
                <div class="profile-avatar-wrap">
                    ${window.renderAvatar(user, 'font-size: 1.5em;')}
                </div>
                <div class="profile-name">${user.username}</div>
                <div class="profile-email">${user.email}</div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">⚡ ${user.xp || 0}</div>
                        <div class="profile-stat-label">نقاط الخبرة</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">🔥 ${user.streak || 0}</div>
                        <div class="profile-stat-label">متتالية</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">💡 ${user.hints || 0}</div>
                        <div class="profile-stat-label">مساعدات</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="setting-row card-interactive" onclick="App.toggleTheme()">
                    <div class="setting-icon" style="background:var(--surface-2);">🌙</div>
                    <div class="setting-info">
                        <div class="setting-title" data-i18n="darkMode">${t('darkMode')}</div>
                    </div>
                    <div class="class-card-arrow">›</div>
                </div>
                <div class="setting-row card-interactive" onclick="App.toggleLanguage()">
                    <div class="setting-icon" style="background:var(--surface-2);">🌐</div>
                    <div class="setting-info">
                        <div class="setting-title" data-i18n="changeLang">${t('changeLang')}</div>
                        <div class="setting-subtitle" data-i18n="currentLang">${t('currentLang')}</div>
                    </div>
                    <div class="class-card-arrow">›</div>
                </div>
                <div class="setting-row card-interactive" onclick="Auth.logout(); App.navigate('login');" style="border-bottom:none;">
                    <div class="setting-icon" style="background:var(--red-light); color:var(--red);">🚪</div>
                    <div class="setting-info">
                        <div class="setting-title" style="color:var(--red);" data-i18n="btnLogout">${t('btnLogout')}</div>
                    </div>
                </div>
            </div>
        </div>`;
        App.mainContent.innerHTML = html;
        App.applyLanguage();
    }
};

window.StudentView = StudentView;
