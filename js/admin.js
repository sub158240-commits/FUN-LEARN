// admin.js
const AdminView = {

    // ── DASHBOARD ─────────────────────────────────────────────────────
    async renderDashboard() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        const users = await Store.getUsers();
        const classes = await Store.getClasses();
        const allResults = await Store.getAllGameResults();
        const pendingCount = users.filter(u => u.role === 'student' && u.status === 'pending').length;
        const studentCount = users.filter(u => u.role === 'student').length;

        let html = `
            <div class="fade-in stagger">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
                    <div class="section-title mb-0">لوحة التحكم ⚙️</div>
                    <button class="btn btn-warning btn-sm" onclick="AdminView.startPreviewMode()">👀 تصفح كطالب</button>
                </div>

                <!-- Stats Overview -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem; margin-bottom:1.25rem;">
                    <div class="card text-center" style="padding:1rem; cursor:pointer;" onclick="AdminView.renderManageStudents()">
                        <div style="font-size:1.8rem;">👨‍🎓</div>
                        <div style="font-size:1.6rem; font-weight:900; color:var(--primary);">${studentCount}</div>
                        <div style="font-size:0.75rem; color:var(--muted-light); font-weight:700;">طالب</div>
                    </div>
                    <div class="card text-center" style="padding:1rem; cursor:pointer; ${pendingCount > 0 ? 'border-color:var(--gold); background:rgba(245,158,11,0.08);' : ''}" onclick="AdminView.renderManageStudents()">
                        <div style="font-size:1.8rem;">⏳</div>
                        <div style="font-size:1.6rem; font-weight:900; color:${pendingCount > 0 ? 'var(--gold)' : 'var(--text)'};">${pendingCount}</div>
                        <div style="font-size:0.75rem; color:var(--muted-light); font-weight:700;">بانتظار الموافقة</div>
                    </div>
                    <div class="card text-center" style="padding:1rem; cursor:pointer;" onclick="AdminView.renderManageGames()">
                        <div style="font-size:1.8rem;">🎮</div>
                        <div style="font-size:1.6rem; font-weight:900; color:var(--green);">${allResults.length}</div>
                        <div style="font-size:0.75rem; color:var(--muted-light); font-weight:700;">جلسة لعب</div>
                    </div>
                </div>

                <!-- Menu Cards -->
                <div class="card card-interactive" onclick="AdminView.renderManageStudents()" style="margin-bottom:0.75rem;">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="font-size:2rem;">👨‍🎓</div>
                        <div>
                            <h3 style="color: var(--primary); margin:0 0 0.2rem;">إدارة الطلاب</h3>
                            <p class="text-muted" style="font-size: 0.85rem; margin:0;">موافقة، تعديل، نقل وحذف الطلاب</p>
                        </div>
                        <div class="class-card-arrow" style="margin-right:auto;">›</div>
                    </div>
                </div>

                <div class="card card-interactive" onclick="AdminView.renderManageClasses()" style="margin-bottom:0.75rem;">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="font-size:2rem;">📚</div>
                        <div>
                            <h3 style="color: var(--primary); margin:0 0 0.2rem;">الصفوف والواجبات</h3>
                            <p class="text-muted" style="font-size: 0.85rem; margin:0;">إنشاء واجبات بأسئلة داخلية، تصحيح تلقائي، تقارير مفصلة</p>
                        </div>
                        <div class="class-card-arrow" style="margin-right:auto;">›</div>
                    </div>
                </div>

                <div class="card card-interactive" onclick="AdminView.renderManageGames()" style="margin-bottom:0.75rem;">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="font-size:2rem;">🎮</div>
                        <div>
                            <h3 style="color: var(--primary); margin:0 0 0.2rem;">الألعاب التفاعلية</h3>
                            <p class="text-muted" style="font-size: 0.85rem; margin:0;">إنشاء ألعاب، عرض نتائج الطلاب</p>
                        </div>
                        <div class="class-card-arrow" style="margin-right:auto;">›</div>
                    </div>
                </div>

                <div class="card card-interactive" onclick="AdminView.renderReports()" style="margin-bottom:0.75rem;">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="font-size:2rem;">📊</div>
                        <div>
                            <h3 style="color: var(--primary); margin:0 0 0.2rem;">التقارير والإحصائيات</h3>
                            <p class="text-muted" style="font-size: 0.85rem; margin:0;">نتائج الألعاب، تسليم الواجبات</p>
                        </div>
                        <div class="class-card-arrow" style="margin-right:auto;">›</div>
                    </div>
                </div>

                <div class="card card-interactive" onclick="AdminView.renderAdminSettings()">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="font-size:2rem;">🔐</div>
                        <div>
                            <h3 style="color: var(--primary); margin:0 0 0.2rem;">إعدادات حساب الأدمن</h3>
                            <p class="text-muted" style="font-size: 0.85rem; margin:0;">تغيير اليوزر وكلمة المرور</p>
                        </div>
                        <div class="class-card-arrow" style="margin-right:auto;">›</div>
                    </div>
                </div>
            </div>
        `;
        App.mainContent.innerHTML = html;
    },

    startPreviewMode() {
        if (!Auth.isPreviewMode) {
            Auth.isPreviewMode = true;
            sessionStorage.setItem('fl_previewMode', 'true');
        }
        const old = document.getElementById('preview-bar');
        if (old) old.remove();
        const previewBar = document.createElement('div');
        previewBar.id = 'preview-bar';
        previewBar.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#F59E0B; color:#92400E; padding:0.6rem 1rem; font-weight:bold; z-index:99999; display:flex; justify-content:space-between; align-items:center; border-bottom: 3px solid #B45309; font-size:0.9rem;';
        previewBar.innerHTML = `
            <span>👀 وضع المعاينة &mdash; أنت تتصفح البرنامج كطالب</span>
            <button onclick="AdminView.exitPreviewMode()" style="background:#92400E; color:white; border:none; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">🔙 الرجوع إلى لوحة الإدارة</button>
        `;
        document.body.appendChild(previewBar);
        document.body.style.paddingTop = '45px';
        showToast('أنت الآن تتصفح كطالب 👀', 'success');
        window.location.hash = 'home';
        App.handleRoute();
    },

    exitPreviewMode() {
        Auth.isPreviewMode = false;
        sessionStorage.removeItem('fl_previewMode');
        const bar = document.getElementById('preview-bar');
        if (bar) bar.remove();
        document.body.style.paddingTop = '';
        window.location.hash = 'home';
        App.handleRoute();
    },

    // ── STUDENTS ──────────────────────────────────────────────────────
    async renderManageStudents() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        const users = await Store.getUsers();
        const classes = await Store.getClasses();
        const students = users.filter(u => u.role === 'student');
        const pendingStudents = students.filter(s => s.status === 'pending');
        const activeStudents = students.filter(s => s.status === 'active');

        // Build class counts map
        const classCounts = {};
        classes.forEach(c => { classCounts[c.id] = { name: c.name, icon: c.icon || '📚', count: 0 }; });
        activeStudents.forEach(s => { if (s.classId && classCounts[s.classId]) classCounts[s.classId].count++; });

        let currentFilter = AdminView.currentStudentFilter || 'all';

        let html = `
            <div class="fade-in">
                <button class="btn btn-ghost btn-sm mb-2" onclick="AdminView.renderDashboard()">‹ عودة</button>
                <div class="section-title mb-2">إدارة الطلاب 👨‍🎓</div>

                <!-- Class distribution summary -->
                <div class="card mb-3" style="padding:1.25rem; background:linear-gradient(135deg,var(--primary-light,rgba(79,70,229,0.08)),var(--surface))">
                    <div style="font-weight:900; font-size:0.95rem; margin-bottom:0.75rem; color:var(--primary);">📊 توزيع الطلاب حسب الصف</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:0.5rem;">
                        ${Object.values(classCounts).map(c => `
                            <div style="background:var(--surface-2); border-radius:var(--r-md); padding:0.6rem; text-align:center; border:1px solid var(--border);">
                                <div style="font-size:1.4rem;">${c.icon}</div>
                                <div style="font-size:1.4rem; font-weight:900; color:var(--primary);">${c.count}</div>
                                <div style="font-size:0.72rem; color:var(--muted-light); font-weight:700;">${c.name}</div>
                            </div>
                        `).join('')}
                        <div style="background:var(--surface-2); border-radius:var(--r-md); padding:0.6rem; text-align:center; border:1px solid var(--border);">
                            <div style="font-size:1.4rem;">❓</div>
                            <div style="font-size:1.4rem; font-weight:900; color:var(--text);">${students.filter(s=>!s.classId && s.status==='active').length}</div>
                            <div style="font-size:0.72rem; color:var(--muted-light); font-weight:700;">غير محدد</div>
                        </div>
                    </div>
                </div>

                <!-- Bulk move -->
                <div class="card mb-3" style="padding: 1rem; background: var(--surface-2);">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <select id="bulk-move-class" class="form-input" style="flex:1;">
                            <option value="" disabled selected>اختر الصف لنقل المحددين...</option>
                            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary btn-sm" onclick="AdminView.bulkMoveStudents()">نقل المحددين</button>
                    </div>
                </div>
        `;

        // ── Filter UI ──
        html += `
            <div style="margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
                <label style="font-weight:bold; color:var(--text);">عرض طلاب:</label>
                <select class="form-input" style="max-width:250px;" onchange="AdminView.currentStudentFilter = this.value; AdminView.renderManageStudents()">
                    <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>الكل (جميع الطلاب)</option>
                    ${classes.map(c => `<option value="${c.id}" ${currentFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    <option value="__none__" ${currentFilter === '__none__' ? 'selected' : ''}>غير محدد</option>
                </select>
            </div>
        `;

        // ── Pending students first ──
        const filteredPending = currentFilter === 'all' ? pendingStudents : pendingStudents.filter(s => (s.classId || '__none__') === currentFilter);
        if (filteredPending.length > 0) {
            html += `<div style="font-weight:900; color:var(--gold); margin-bottom:0.5rem; font-size:0.9rem;">⏳ بانتظار الموافقة (${filteredPending.length})</div>`;
            filteredPending.forEach(s => {
                const cls = classes.find(c => c.id === s.classId);
                const className = cls ? cls.name : 'غير محدد';
                html += `
                    <div class="card mb-2" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-color: var(--gold); border-bottom-color: #B45309;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <input type="checkbox" class="student-checkbox" value="${s.id}" style="width:18px;height:18px;cursor:pointer;">
                            <div>
                                <div style="font-weight: 900; font-size: 1.05rem; color: var(--text);">${s.avatar || '👤'} ${s.username}</div>
                                <div style="font-size: 0.82rem; color: var(--muted-light); font-weight: 700;">🏫 ${className}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted);">${s.email}</div>
                                <div style="color:var(--gold);font-weight:bold;font-size:0.8rem;margin-top:0.2rem;">⏳ بانتظار الموافقة</div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                            <button class="btn btn-success btn-sm" onclick="AdminView.approveStudent('${s.id}')">موافقة ✓</button>
                            <button class="btn btn-secondary btn-sm" onclick="AdminView.showEditStudent('${s.id}')">✏️ تعديل</button>
                            <button class="btn btn-danger btn-sm" onclick="AdminView.deleteStudent('${s.id}')">حذف</button>
                        </div>
                    </div>
                `;
            });
        }

        // ── Active students grouped by class ──
        if (activeStudents.length > 0) {
            html += `<div style="font-weight:900; color:var(--text); margin:0.75rem 0 0.5rem; font-size:0.9rem;">✅ الطلاب النشطون — مرتبون حسب الصف</div>`;

            // Group by class
            const groups = {}; // classId -> {name, icon, students[]}
            activeStudents.forEach(s => {
                const key = s.classId || '__none__';
                if (!groups[key]) {
                    const cls = classes.find(c => c.id === s.classId);
                    groups[key] = { name: cls ? cls.name : 'غير محدد', icon: cls ? (cls.icon || '📚') : '❓', students: [] };
                }
                groups[key].students.push(s);
            });

            for (const [groupKey, group] of Object.entries(groups)) {
                if (currentFilter !== 'all' && groupKey !== currentFilter) continue;
                html += `
                    <div style="background:var(--primary); color:white; border-radius:var(--r-md); padding:0.5rem 1rem; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:1.2rem;">${group.icon}</span>
                        <span style="font-weight:900;">${group.name}</span>
                        <span style="margin-right:auto; background:rgba(255,255,255,0.2); border-radius:100px; padding:0.1rem 0.5rem; font-size:0.85rem;">${group.students.length} طالب</span>
                    </div>
                `;
                group.students.forEach(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    const className = cls ? cls.name : 'غير محدد';
                    html += `
                        <div class="card mb-2" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <input type="checkbox" class="student-checkbox" value="${s.id}" style="width:18px;height:18px;cursor:pointer;">
                                <div>
                                    <div style="font-weight: 900; font-size: 1.05rem; color: var(--text);">${s.avatar || '👤'} ${s.username}</div>
                                    <div style="font-size: 0.82rem; color: var(--muted-light); font-weight: 700;">⚡ ${s.xp || 0} XP &nbsp;·&nbsp; 🪙 ${s.coins || 0}</div>
                                    <div style="display:flex; align-items:center; gap:0.4rem; margin-top:0.3rem;">
                                        <span style="font-size:0.75rem; color:var(--muted-light); font-weight:700;">🔑</span>
                                        <span id="pwd-${s.id}" style="font-size:0.78rem; font-family:monospace; color:var(--text); letter-spacing:0.05em; display:none;">${s.password || '—'}</span>
                                        <span id="pwd-dots-${s.id}" style="font-size:0.78rem; color:var(--muted-light);">••••••</span>
                                        <button onclick="AdminView.togglePwd('${s.id}')" style="background:none;border:none;cursor:pointer;font-size:0.85rem;padding:0;line-height:1;" id="pwd-eye-${s.id}">👁️</button>
                                    </div>
                                    <div style="color:var(--green);font-size:0.78rem;margin-top:0.2rem;">✅ نشط</div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <button class="btn btn-secondary btn-sm" onclick="AdminView.showEditStudent('${s.id}')">✏️ تعديل</button>
                                <button class="btn btn-danger btn-sm" onclick="AdminView.deleteStudent('${s.id}')">حذف</button>
                            </div>
                        </div>
                    `;
                });
            }
        }

        if (students.length === 0) {
            html += `<div class="empty-state"><div class="empty-state-icon">👨‍🎓</div><div class="empty-state-title">لا يوجد طلاب مسجلين بعد</div></div>`;
        }

        html += `</div>`;
        App.mainContent.innerHTML = html;
    },

    async approveStudent(id) {
        await Store.updateUser(id, { status: 'active' });
        showToast('تمت الموافقة على الطالب!', 'success');
        await this.renderManageStudents();
    },

    async showEditStudent(id) {
        const user = await Store.getUserById(id);
        const classes = await Store.getClasses();
        if (!user) return;
        const old = document.getElementById('edit-modal');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99998; display:flex; align-items:center; justify-content:center; padding:1rem;';
        modal.innerHTML = `
            <div style="background:var(--surface); border-radius:var(--r-xl); padding:2rem; width:100%; max-width:400px; border: 3px solid var(--border); border-bottom: 6px solid var(--border-2);">
                <h3 style="margin-bottom:1.5rem; color:var(--text);">✏️ تعديل بيانات الطالب</h3>
                <div class="form-group">
                    <label style="font-weight:800; color:var(--text-2); display:block; margin-bottom:0.4rem;">اسم المستخدم</label>
                    <input type="text" id="edit-username" class="form-input" value="${user.username}">
                </div>
                <div class="form-group">
                    <label style="font-weight:800; color:var(--text-2); display:block; margin-bottom:0.4rem;">الصف الدراسي</label>
                    <select id="edit-class" class="form-input">
                        <option value="">غير محدد</option>
                        ${classes.map(c => `<option value="${c.id}" ${c.id === user.classId ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-weight:800; color:var(--text-2); display:block; margin-bottom:0.4rem;">الحالة</label>
                    <select id="edit-status" class="form-input">
                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>⏳ بانتظار الموافقة</option>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>✅ نشط</option>
                    </select>
                </div>
                <div style="display:flex; gap:0.75rem; margin-top:1rem;">
                    <button class="btn btn-primary btn-block" onclick="AdminView.saveEditStudent('${id}')">💾 حفظ</button>
                    <button class="btn btn-ghost btn-block" onclick="document.getElementById('edit-modal').remove()">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    },

    async saveEditStudent(id) {
        const username = document.getElementById('edit-username').value.trim();
        const classId = document.getElementById('edit-class').value;
        const status = document.getElementById('edit-status').value;
        if (!username) { showToast('اسم المستخدم مطلوب', 'error'); return; }
        const btn = document.querySelector('#edit-modal .btn-primary');
        if (btn) btn.textContent = '⏳';
        await Store.updateUser(id, { username, classId: classId || null, status });
        document.getElementById('edit-modal').remove();
        showToast('تم حفظ التعديلات!', 'success');
        await this.renderManageStudents();
    },

    async bulkMoveStudents() {
        const checkboxes = document.querySelectorAll('.student-checkbox:checked');
        const targetClassId = document.getElementById('bulk-move-class').value;
        if (checkboxes.length === 0) { showToast('الرجاء تحديد طالب واحد على الأقل.', 'error'); return; }
        if (!targetClassId) { showToast('الرجاء اختيار الصف المستهدف.', 'error'); return; }
        if (!confirm(`نقل ${checkboxes.length} طالب إلى الصف المحدد؟`)) return;
        for (const cb of checkboxes) await Store.updateUser(cb.value, { classId: targetClassId });
        showToast('تم نقل الطلاب بنجاح!', 'success');
        await this.renderManageStudents();
    },

    async deleteStudent(id) {
        if (confirm('هل أنت متأكد من حذف الطالب؟')) {
            await Store.deleteUser(id);
            showToast('تم حذف الطالب.', 'success');
            await this.renderManageStudents();
        }
    },

    togglePwd(id) {
        const pwdEl   = document.getElementById(`pwd-${id}`);
        const dotsEl  = document.getElementById(`pwd-dots-${id}`);
        const eyeBtn  = document.getElementById(`pwd-eye-${id}`);
        if (!pwdEl || !dotsEl) return;
        const isHidden = pwdEl.style.display === 'none';
        pwdEl.style.display  = isHidden ? 'inline' : 'none';
        dotsEl.style.display = isHidden ? 'none'   : 'inline';
        if (eyeBtn) eyeBtn.textContent = isHidden ? '🙈' : '👁️';
    },

    // ── CLASSES & HOMEWORKS ───────────────────────────────────────────
    async renderManageClasses() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        const classes = await Store.getClasses();
        let html = `
            <div class="fade-in">
                <button class="btn btn-ghost btn-sm mb-2" onclick="AdminView.renderDashboard()">‹ عودة</button>
                <div class="section-title mb-2">الصفوف والواجبات 📚</div>

                <div class="card mb-3">
                    <form id="add-class-form" onsubmit="AdminView.addClass(event)">
                        <div class="form-group">
                            <input type="text" id="new-class-name" class="form-input" placeholder="اسم الصف الجديد (مثال: الصف الخامس)" required>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit">إضافة صف 🏫</button>
                    </form>
                </div>
                <div class="classes-list">
        `;

        for (const cls of classes) {
            const hws = await Store.getHomeworkByClass(cls.id);
            const users = await Store.getUsers();
            const classStudentCount = users.filter(u => u.role === 'student' && u.status === 'active' && u.classId === cls.id).length;
            let hwsHtml = '';
            for (const hw of hws) {
                const results = await Store.getHomeworkResultsByHw(hw.id);
                const dueStr = hw.dueDate ? new Date(hw.dueDate).toLocaleString('ar-SA') : 'مفتوح';
                const isExpired = hw.dueDate && new Date() > new Date(hw.dueDate);
                const isQuiz = hw.hwType === 'quiz';
                // Avg score for quiz type
                let avgHtml = '';
                if (isQuiz && results.length > 0) {
                    const avgScore = (results.reduce((s, r) => s + (r.total > 0 ? r.score / r.total * 100 : 0), 0) / results.length).toFixed(0);
                    const avgColor = avgScore >= 70 ? 'var(--green)' : avgScore >= 40 ? 'var(--gold)' : 'var(--red)';
                    avgHtml = `<div style="font-size:0.78rem; color:${avgColor}; font-weight:800;">📊 متوسط الدرجات: ${avgScore}%</div>`;
                }
                hwsHtml += `
                    <div style="background:var(--surface-2); border-radius:var(--r-md); padding:0.75rem 1rem; margin-bottom:0.75rem; border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <div>
                                <div style="font-weight:800; font-size:0.95rem;">${isQuiz ? '📋' : '📝'} ${hw.title} <span style="font-size:0.7rem; background:${isQuiz ? 'var(--primary)' : 'var(--green)'}; color:white; border-radius:100px; padding:0.1rem 0.4rem;">${isQuiz ? 'واجب داخلي' : 'Google Forms'}</span></div>
                                <div style="font-size:0.78rem; color:var(--muted-light);">الانتهاء: <span style="${isExpired ? 'color:var(--red);font-weight:bold;' : ''}">${dueStr}</span></div>
                                <div style="font-size:0.78rem; color:var(--green); margin-top:0.2rem;">✅ أكمل الواجب: ${results.length} من ${classStudentCount} طالب</div>
                                ${avgHtml}
                            </div>
                            <div style="display:flex; flex-direction:column; gap:0.3rem; align-items:flex-end;">
                                <button class="btn btn-danger btn-sm" style="padding:0.2rem 0.5rem; font-size:0.78rem;" onclick="AdminView.deleteHomework('${hw.id}')">حذف</button>
                                <button class="btn btn-primary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.78rem;" onclick="AdminView.showHomeworkDetails('${hw.id}', ${isQuiz})">📊 التفاصيل</button>
                                ${!isQuiz && hw.responsesLink ? `<a href="${hw.responsesLink}" target="_blank" class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.78rem; text-decoration:none;">📋 نتائج الفورم</a>` : ''}
                            </div>
                        </div>
                        ${!isQuiz && hw.link ? `
                        <div style="display:none;" id="hw-preview-${hw.id}">
                            <iframe src="${hw.link}" style="width:100%;height:400px;border:none;border-radius:var(--r-sm);margin-top:0.5rem;" allowfullscreen></iframe>
                        </div>
                        <button class="btn btn-ghost btn-sm" style="font-size:0.78rem; width:100%; margin-top:0.3rem;" onclick="AdminView.toggleHwPreview('${hw.id}')">👁️ معاينة الفورم</button>` : ''}
                    </div>
                `;
            }

            html += `
                <div class="card mb-3" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 1rem;">
                        <div>
                            <span style="font-size: 1.2rem; font-weight: 900; color: var(--text);">${cls.icon || '📚'} ${cls.name}</span>
                            <span style="margin-right:0.5rem; font-size:0.82rem; color:var(--muted-light);">👨‍🎓 ${classStudentCount} طالب</span>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="AdminView.deleteClass('${cls.id}')">حذف الصف</button>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h4 class="mb-1" style="color: var(--text-2);">الواجبات (${hws.length}):</h4>
                        ${hws.length === 0 ? '<p class="text-muted" style="font-size:0.9rem;">لا توجد واجبات مضافة.</p>' : hwsHtml}
                    </div>

                    <!-- Tab switcher for homework type -->
                    <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
                        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="AdminView.showAddQuizHw('${cls.id}')">📋 + واجب داخلي (أسئلة)</button>
                        <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="AdminView.showAddFormHw('${cls.id}')">📝 + Google Forms</button>
                    </div>

                    <!-- Quiz homework builder -->
                    <div id="add-quiz-hw-${cls.id}" style="background: var(--surface-2); padding: 1.25rem; border-radius: var(--r-md); border: 2px dashed var(--primary); display:none;">
                        <h4 class="mb-2" style="color: var(--primary);">📋 إضافة واجب بأسئلة داخلية</h4>
                        <form onsubmit="AdminView.addQuizHomework(event, '${cls.id}')">
                            <div class="form-group">
                                <input type="text" id="qhw-title-${cls.id}" class="form-input" placeholder="عنوان الواجب" required>
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.85rem; color:var(--muted-light); display:block; margin-bottom:0.25rem;">تاريخ انتهاء الواجب (اختياري)</label>
                                <input type="datetime-local" id="qhw-due-${cls.id}" class="form-input">
                            </div>
                            <div id="qhw-questions-${cls.id}" class="mb-2"></div>
                            <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                                <button type="button" class="btn btn-ghost btn-sm btn-block" onclick="AdminView.addQuizHwQuestion('text', '${cls.id}')">+ سؤال كتابي</button>
                                <button type="button" class="btn btn-ghost btn-sm btn-block" onclick="AdminView.addQuizHwQuestion('mcq', '${cls.id}')">+ سؤال اختياري</button>
                            </div>
                            <button class="btn btn-primary btn-block btn-sm" type="submit">حفظ الواجب ✅</button>
                        </form>
                    </div>

                    <!-- Google Forms homework form -->
                    <div id="add-form-hw-${cls.id}" style="background: var(--surface-2); padding: 1.25rem; border-radius: var(--r-md); border: 2px dashed var(--border-2); display:none;">
                        <h4 class="mb-1" style="color: var(--primary);">📝 إضافة واجب (Google Forms)</h4>
                        <form onsubmit="AdminView.addHomework(event, '${cls.id}')">
                            <div class="form-group">
                                <input type="text" id="hw-title-${cls.id}" class="form-input" placeholder="عنوان الواجب" required>
                            </div>
                            <div class="form-group">
                                <input type="url" id="hw-url-${cls.id}" class="form-input" placeholder="رابط Google Forms للتضمين (Embed URL)" required>
                            </div>
                            <div class="form-group">
                                <input type="url" id="hw-resp-${cls.id}" class="form-input" placeholder="رابط نتائج الفورم (اختياري)">
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.85rem; color:var(--muted-light); display:block; margin-bottom:0.25rem;">تاريخ انتهاء الواجب (اختياري)</label>
                                <input type="datetime-local" id="hw-due-${cls.id}" class="form-input">
                            </div>
                            <button class="btn btn-success btn-block btn-sm" type="submit">إضافة الواجب +</button>
                        </form>
                    </div>
                </div>
            `;
        }
        html += `</div></div>`;
        App.mainContent.innerHTML = html;
    },

    showAddQuizHw(classId) {
        const quizDiv = document.getElementById(`add-quiz-hw-${classId}`);
        const formDiv = document.getElementById(`add-form-hw-${classId}`);
        if (quizDiv) { quizDiv.style.display = quizDiv.style.display === 'none' ? 'block' : 'none'; }
        if (formDiv) formDiv.style.display = 'none';
        // Add first question if empty
        const container = document.getElementById(`qhw-questions-${classId}`);
        if (container && container.children.length === 0) AdminView.addQuizHwQuestion('mcq', classId);
    },

    showAddFormHw(classId) {
        const quizDiv = document.getElementById(`add-quiz-hw-${classId}`);
        const formDiv = document.getElementById(`add-form-hw-${classId}`);
        if (formDiv) { formDiv.style.display = formDiv.style.display === 'none' ? 'block' : 'none'; }
        if (quizDiv) quizDiv.style.display = 'none';
    },

    addQuizHwQuestion(type, classId) {
        const container = document.getElementById(`qhw-questions-${classId}`);
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'question-row card';
        div.style.cssText = 'padding:1rem; margin-bottom:0.75rem; border:1px solid var(--border);';
        div.dataset.type = type;
        let inner = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <h4 style="margin:0; font-size:0.95rem; color:var(--text-2);">${type === 'text' ? '📝 سؤال كتابي' : '🔘 سؤال اختياري'}</h4>
                <button type="button" class="btn btn-danger btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div class="form-group">
                <input type="text" class="form-input q-text" placeholder="اكتب السؤال هنا..." required>
            </div>
            <div class="form-group mb-2">
                <input type="url" class="form-input q-img" placeholder="رابط صورة توضيحية للسؤال (اختياري)">
            </div>
        `;
        if (type === 'text') {
            inner += `<div class="form-group mb-0"><input type="text" class="form-input q-ans" placeholder="الإجابة الصحيحة" required></div>`;
        } else {
            inner += `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
                    <input type="text" class="form-input q-opt" placeholder="الخيار الأول" required>
                    <input type="text" class="form-input q-opt" placeholder="الخيار الثاني" required>
                    <input type="text" class="form-input q-opt" placeholder="الخيار الثالث" required>
                    <input type="text" class="form-input q-opt" placeholder="الخيار الرابع" required>
                </div>
                <div class="form-group mb-0">
                    <select class="form-input q-ans" required>
                        <option value="" disabled selected>اختر الإجابة الصحيحة...</option>
                        <option value="0">الخيار الأول</option>
                        <option value="1">الخيار الثاني</option>
                        <option value="2">الخيار الثالث</option>
                        <option value="3">الخيار الرابع</option>
                    </select>
                </div>
            `;
        }
        div.innerHTML = inner;
        container.appendChild(div);
    },

    async addQuizHomework(e, classId) {
        e.preventDefault();
        const title = document.getElementById(`qhw-title-${classId}`).value.trim();
        const dueDate = document.getElementById(`qhw-due-${classId}`).value;
        const rows = document.querySelectorAll(`#qhw-questions-${classId} .question-row`);
        if (rows.length === 0) { showToast('يجب إضافة سؤال واحد على الأقل!', 'error'); return; }
        const questions = [];
        let valid = true;
        rows.forEach(r => {
            const type = r.dataset.type;
            const qText = r.querySelector('.q-text').value.trim();
            const qImg = r.querySelector('.q-img') ? r.querySelector('.q-img').value.trim() : '';
            
            let qObj = { type, q: qText };
            if (qImg) qObj.img = qImg;
            
            if (type === 'text') {
                qObj.a = r.querySelector('.q-ans').value.trim();
                questions.push(qObj);
            } else {
                const opts = Array.from(r.querySelectorAll('.q-opt')).map(inp => inp.value.trim());
                const ansIdx = r.querySelector('.q-ans').value;
                if (!ansIdx) { valid = false; }
                else {
                    qObj.opts = opts;
                    qObj.a = opts[parseInt(ansIdx)];
                    questions.push(qObj);
                }
            }
        });
        if (!valid) { showToast('تأكد من اختيار الإجابة الصحيحة لكل سؤال.', 'error'); return; }
        const btn = e.submitter;
        btn.textContent = '⏳';
        await Store.addHomework({ classId, title, hwType: 'quiz', questions, dueDate: dueDate || null });
        showToast('تم إضافة الواجب بنجاح! ✅', 'success');
        await this.renderManageClasses();
    },

    toggleHwPreview(hwId) {
        const el = document.getElementById(`hw-preview-${hwId}`);
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    },

    async showHomeworkDetails(hwId, isQuiz) {
        const results = await Store.getHomeworkResultsByHw(hwId);
        const hw = await Store.getHomeworkById(hwId);
        const old = document.getElementById('hw-details-modal');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.id = 'hw-details-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99998; display:flex; align-items:center; justify-content:center; padding:1rem;';

        let listHtml = '';
        if (results.length === 0) {
            listHtml = '<p class="text-muted text-center" style="padding:2rem 0;">لم يُسلّم أي طالب بعد.</p>';
        } else if (isQuiz && hw && hw.questions && hw.questions.length > 0) {
            // Quiz type: show detailed results with score and wrong answers
            listHtml = results.map(r => {
                const pct = r.total > 0 ? Math.round(r.score / r.total * 100) : 0;
                const barColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--red)';
                
                return `
                    <div style="padding:0.75rem; background:var(--surface-2); border-radius:var(--r-sm); margin-bottom:0.75rem; border:1px solid var(--border);">
                        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.4rem;">
                            <span style="font-size:1.3rem;">${r.user?.avatar || '👤'}</span>
                            <div style="flex:1;">
                                <div style="font-weight:800;">${r.user?.username || 'غير معروف'}</div>
                                <div style="font-size:0.75rem; color:var(--muted-light);">${new Date(r.createdAt).toLocaleString('ar-SA')}</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-weight:900; font-size:1.1rem; color:${barColor};">${r.score}/${r.total}</div>
                                <div style="font-size:0.72rem; color:${barColor};">${pct}%</div>
                            </div>
                        </div>
                        <div style="background:var(--surface); border-radius:100px; height:6px; overflow:hidden; margin-bottom:0.5rem;">
                            <div style="background:${barColor}; width:${pct}%; height:100%; border-radius:100px;"></div>
                        </div>
                        <button class="btn btn-secondary btn-sm btn-block" onclick="AdminView.viewStudentPaper('${hwId}', '${r.userId}')">👁️ رؤية ورقة الواجب بالكامل</button>
                    </div>
                `;
            }).join('');
        } else {
            // Google Forms: just show who submitted
            listHtml = results.map(r => `
                <div style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem; background:var(--surface-2); border-radius:var(--r-sm); margin-bottom:0.5rem;">
                    <span style="font-size:1.3rem;">${r.user?.avatar || '👤'}</span>
                    <div>
                        <div style="font-weight:800;">${r.user?.username || 'غير معروف'}</div>
                        <div style="font-size:0.78rem; color:var(--muted-light);">${new Date(r.createdAt).toLocaleString('ar-SA')}</div>
                    </div>
                    <div style="margin-right:auto; color:var(--green); font-weight:800;">✅ سلّم</div>
                </div>
            `).join('');
        }

        // Summary stats for quiz
        let summaryHtml = '';
        if (isQuiz && results.length > 0) {
            const avgScore = (results.reduce((s, r) => s + (r.total > 0 ? r.score / r.total * 100 : 0), 0) / results.length).toFixed(0);
            const maxScore = Math.max(...results.map(r => r.total > 0 ? Math.round(r.score / r.total * 100) : 0));
            const minScore = Math.min(...results.map(r => r.total > 0 ? Math.round(r.score / r.total * 100) : 0));
            const color = avgScore >= 70 ? 'var(--green)' : avgScore >= 40 ? 'var(--gold)' : 'var(--red)';
            summaryHtml = `
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; margin-bottom:1rem; text-align:center;">
                    <div style="background:var(--surface-2); border-radius:var(--r-md); padding:0.6rem; border:1px solid var(--border);">
                        <div style="font-size:1.2rem; font-weight:900; color:${color};">${avgScore}%</div>
                        <div style="font-size:0.7rem; color:var(--muted-light);">المتوسط</div>
                    </div>
                    <div style="background:var(--surface-2); border-radius:var(--r-md); padding:0.6rem; border:1px solid var(--border);">
                        <div style="font-size:1.2rem; font-weight:900; color:var(--green);">${maxScore}%</div>
                        <div style="font-size:0.7rem; color:var(--muted-light);">الأعلى</div>
                    </div>
                    <div style="background:var(--surface-2); border-radius:var(--r-md); padding:0.6rem; border:1px solid var(--border);">
                        <div style="font-size:1.2rem; font-weight:900; color:var(--red);">${minScore}%</div>
                        <div style="font-size:0.7rem; color:var(--muted-light);">الأدنى</div>
                    </div>
                </div>`;
        }

        modal.innerHTML = `
            <div style="background:var(--surface); border-radius:var(--r-xl); padding:2rem; width:100%; max-width:480px; max-height:85vh; overflow-y:auto; border:3px solid var(--border); border-bottom:6px solid var(--border-2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <div>
                        <h3 style="margin:0 0 0.2rem; color:var(--text);">📊 تفاصيل الواجب</h3>
                        <div style="font-size:0.82rem; color:var(--muted-light);">سلّم ${results.length} طالب</div>
                    </div>
                    <button onclick="document.getElementById('hw-details-modal').remove()" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--text);">✕</button>
                </div>
                ${summaryHtml}
                ${listHtml}
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    },

    async addClass(e) {
        e.preventDefault();
        const name = document.getElementById('new-class-name').value;
        const btn = e.submitter;
        btn.textContent = '⏳';
        await Store.addClass({ name, icon: '📚' });
        showToast('تمت إضافة الصف!', 'success');
        await this.renderManageClasses();
    },
    async deleteClass(id) {
        if (confirm('هل أنت متأكد من حذف الصف؟')) {
            await Store.deleteClass(id);
            showToast('تم الحذف!', 'success');
            await this.renderManageClasses();
        }
    },
    async addHomework(e, classId) {
        e.preventDefault();
        const title = document.getElementById(`hw-title-${classId}`).value;
        const link = document.getElementById(`hw-url-${classId}`).value;
        const responsesLink = document.getElementById(`hw-resp-${classId}`).value;
        const dueDate = document.getElementById(`hw-due-${classId}`).value;
        const btn = e.submitter;
        btn.textContent = '⏳';
        await Store.addHomework({ classId, title, link, dueDate: dueDate || null, responsesLink: responsesLink || null, hwType: 'google_form' });
        showToast('تم إضافة الواجب بنجاح!', 'success');
        await this.renderManageClasses();
    },
    async deleteHomework(id) {
        if (confirm('هل أنت متأكد من حذف الواجب؟')) {
            await Store.deleteHomework(id);
            showToast('تم الحذف!', 'success');
            await this.renderManageClasses();
        }
    },

    // ── GAMES ─────────────────────────────────────────────────────────
    async renderManageGames() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        const classes = await Store.getClasses();

        let html = `
            <div class="fade-in">
                <button class="btn btn-ghost btn-sm mb-2" onclick="AdminView.renderDashboard()">‹ عودة</button>
                <div class="section-title mb-2">الألعاب التفاعلية</div>

                <div class="card mb-3" style="padding: 1.5rem;">
                    <h3 class="mb-2" style="color: var(--primary);">إنشاء لعبة جديدة 🎮</h3>
                    <form onsubmit="AdminView.createGame(event)">
                        <div class="form-group">
                            <input type="text" id="game-title" class="form-input" placeholder="عنوان اللعبة" required>
                        </div>
                        <div class="form-group">
                            <select id="game-class" class="form-input" required>
                                <option value="" disabled selected>اختر الصف...</option>
                                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div id="questions-container" class="mb-2"></div>
                        <div style="display:flex; gap: 1rem; margin-bottom: 1.5rem;">
                            <button type="button" class="btn btn-ghost btn-block btn-sm" onclick="AdminView.addQuestionRow('text')">+ سؤال كتابي</button>
                            <button type="button" class="btn btn-ghost btn-block btn-sm" onclick="AdminView.addQuestionRow('mcq')">+ سؤال اختياري</button>
                        </div>
                        <div class="form-group" style="display:flex; align-items:center; gap:0.75rem; background:var(--surface-2); padding:0.75rem; border-radius:var(--r-md); border:1px solid var(--border); margin-bottom:1rem;">
                            <span style="font-size:1.2rem;">🔁</span>
                            <div style="flex:1;">
                                <div style="font-weight:800; font-size:0.9rem;">عدد مرات اللعب المسموح</div>
                                <div style="font-size:0.75rem; color:var(--muted-light);">0 = غير محدود</div>
                            </div>
                            <input type="number" id="game-max-plays" class="form-input" style="width:80px; text-align:center;" min="0" value="0" placeholder="0">
                        </div>
                        <button class="btn btn-primary btn-block" type="submit">حفظ اللعبة ✅</button>
                    </form>
                </div>

                <h3 class="mb-2" style="color: var(--text-2);">الألعاب الحالية:</h3>
        `;

        for (const cls of classes) {
            const classGames = await Store.getGamesByClass(cls.id);
            html += `<div class="card mb-3" style="padding: 1rem;">
                <h4 style="margin-bottom: 0.75rem; color: var(--primary); border-bottom:2px solid var(--border); padding-bottom:0.5rem;">${cls.icon || '📚'} ${cls.name}</h4>`;
            if (classGames.length === 0) {
                html += `<p class="text-muted" style="font-size:0.9rem;">لا توجد ألعاب لهذا الصف.</p>`;
            } else {
                for (const g of classGames) {
                    const results = await Store.getResultsByGame(g.id);
                    const avgScore = results.length > 0
                        ? (results.reduce((s, r) => s + (r.score / r.total * 100), 0) / results.length).toFixed(0)
                        : '--';
                    const topScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : '--';
                    const maxPlaysLabel = (g.maxPlays === 0 || !g.maxPlays) ? 'غير محدود' : g.maxPlays + ' مرة';
                    html += `
                    <div style="background:var(--surface-2); border-radius:var(--r-md); padding:1rem; margin-bottom:0.75rem; border:1px solid var(--border);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <div style="font-weight:800; font-size:1rem; color:var(--text);">🎮 ${g.title}</div>
                                <div style="font-size:0.8rem; color:var(--muted-light); margin-top:0.2rem;">❓ ${g.questions.length} أسئلة</div>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="AdminView.deleteGame('${g.id}')">حذف</button>
                        </div>
                        <!-- Max plays control -->
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.6rem; padding:0.5rem 0.75rem; background:var(--surface); border-radius:var(--r-sm); border:1px solid var(--border);">
                            <span style="font-size:1rem;">🔁</span>
                            <span style="font-size:0.82rem; font-weight:700; flex:1;">الحد الأقصى للعب: <strong style="color:var(--primary);">${maxPlaysLabel}</strong></span>
                            <input type="number" id="mp-${g.id}" class="form-input" style="width:65px; text-align:center; padding:0.25rem; font-size:0.85rem;" min="0" value="${g.maxPlays || 0}" placeholder="0">
                            <button class="btn btn-primary btn-sm" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="AdminView.updateMaxPlays('${g.id}')">حفظ</button>
                        </div>
                        <!-- Stats Bar -->
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; margin-top:0.75rem; text-align:center;">
                            <div style="background:var(--surface); border-radius:var(--r-sm); padding:0.5rem; border:1px solid var(--border);">
                                <div style="font-size:1.1rem; font-weight:900; color:var(--primary);">${results.length}</div>
                                <div style="font-size:0.7rem; color:var(--muted-light);">مرة لُعبت</div>
                            </div>
                            <div style="background:var(--surface); border-radius:var(--r-sm); padding:0.5rem; border:1px solid var(--border);">
                                <div style="font-size:1.1rem; font-weight:900; color:var(--green);">${avgScore}%</div>
                                <div style="font-size:0.7rem; color:var(--muted-light);">متوسط النتائج</div>
                            </div>
                            <div style="background:var(--surface); border-radius:var(--r-sm); padding:0.5rem; border:1px solid var(--border);">
                                <div style="font-size:1.1rem; font-weight:900; color:var(--gold);">${topScore === '--' ? '--' : topScore + '/' + g.questions.length}</div>
                                <div style="font-size:0.7rem; color:var(--muted-light);">أعلى نتيجة</div>
                            </div>
                        </div>
                        ${results.length > 0 ? `<button class="btn btn-ghost btn-sm" style="width:100%; margin-top:0.5rem; font-size:0.82rem;" onclick="AdminView.showGameResults('${g.id}')">📊 عرض نتائج الطلاب</button>` : ''}
                    </div>`;
                }
            }
            html += `</div>`;
        }
        html += `</div>`;
        App.mainContent.innerHTML = html;
        setTimeout(() => AdminView.addQuestionRow('text'), 50);
    },

    async updateMaxPlays(gameId) {
        const input = document.getElementById(`mp-${gameId}`);
        if (!input) return;
        const val = parseInt(input.value, 10);
        await Store.updateGameMaxPlays(gameId, isNaN(val) ? 0 : Math.max(0, val));
        showToast('تم تحديث حد اللعب ✅', 'success');
        await this.renderManageGames();
    },


    async showGameResults(gameId) {
        const results = await Store.getResultsByGame(gameId);
        const old = document.getElementById('game-results-modal');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.id = 'game-results-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99998; display:flex; align-items:center; justify-content:center; padding:1rem;';
        let listHtml = results.map((r, i) => {
            const pct = Math.round(r.score / r.total * 100);
            const barColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--red)';
            return `
                <div style="padding:0.75rem; background:var(--surface-2); border-radius:var(--r-sm); margin-bottom:0.5rem; border:1px solid var(--border);">
                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.4rem;">
                        <span>${r.user?.avatar || '👤'}</span>
                        <span style="font-weight:800; flex:1;">${r.user?.username || 'غير معروف'}</span>
                        <span style="font-weight:900; color:${barColor};">${r.score}/${r.total}</span>
                    </div>
                    <div style="background:var(--surface); border-radius:100px; height:6px; overflow:hidden;">
                        <div style="background:${barColor}; width:${pct}%; height:100%; border-radius:100px; transition:width 0.5s;"></div>
                    </div>
                    <div style="font-size:0.72rem; color:var(--muted-light); margin-top:0.25rem;">${new Date(r.createdAt).toLocaleString('ar-SA')}</div>
                </div>
            `;
        }).join('');
        modal.innerHTML = `
            <div style="background:var(--surface); border-radius:var(--r-xl); padding:2rem; width:100%; max-width:440px; max-height:80vh; overflow-y:auto; border:3px solid var(--border); border-bottom:6px solid var(--border-2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
                    <h3 style="margin:0; color:var(--text);">📊 نتائج الطلاب (${results.length})</h3>
                    <button onclick="document.getElementById('game-results-modal').remove()" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--text);">✕</button>
                </div>
                ${listHtml || '<p class="text-muted text-center">لا توجد نتائج بعد.</p>'}
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    },

    addQuestionRow(type) {
        const container = document.getElementById('questions-container');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'question-row card';
        div.style.padding = '1rem';
        div.style.marginBottom = '0.75rem';
        div.dataset.type = type;
        let inner = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <h4 style="margin:0; font-size:0.95rem; color:var(--text-2);">${type === 'text' ? '📝 سؤال كتابي' : '🔘 سؤال اختياري'}</h4>
                <button type="button" class="btn btn-danger btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div class="form-group">
                <input type="text" class="form-input q-text" placeholder="اكتب السؤال هنا..." required>
            </div>
        `;
        if (type === 'text') {
            inner += `<div class="form-group mb-0"><input type="text" class="form-input q-ans" placeholder="الإجابة الصحيحة" required></div>`;
        } else {
            inner += `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
                    <input type="text" class="form-input q-opt" placeholder="الخيار الأول" required>
                    <input type="text" class="form-input q-opt" placeholder="الخيار الثاني" required>
                    <input type="text" class="form-input q-opt" placeholder="الخيار الثالث" required>
                    <input type="text" class="form-input q-opt" placeholder="الخيار الرابع" required>
                </div>
                <div class="form-group mb-0">
                    <select class="form-input q-ans" required>
                        <option value="" disabled selected>اختر الإجابة الصحيحة...</option>
                        <option value="0">الخيار الأول</option>
                        <option value="1">الخيار الثاني</option>
                        <option value="2">الخيار الثالث</option>
                        <option value="3">الخيار الرابع</option>
                    </select>
                </div>
            `;
        }
        div.innerHTML = inner;
        container.appendChild(div);
    },

    async createGame(e) {
        e.preventDefault();
        const title = document.getElementById('game-title').value.trim();
        const classId = document.getElementById('game-class').value;
        const rows = document.querySelectorAll('.question-row');
        if (rows.length === 0) { showToast('يجب إضافة سؤال واحد على الأقل!', 'error'); return; }
        const questions = [];
        let valid = true;
        rows.forEach(r => {
            const type = r.dataset.type;
            const qText = r.querySelector('.q-text').value.trim();
            if (type === 'text') {
                questions.push({ type, q: qText, a: r.querySelector('.q-ans').value.trim() });
            } else {
                const opts = Array.from(r.querySelectorAll('.q-opt')).map(inp => inp.value.trim());
                const ansIdx = r.querySelector('.q-ans').value;
                if (!ansIdx) valid = false;
                else questions.push({ type, q: qText, opts, a: opts[parseInt(ansIdx)] });
            }
        });
        if (!valid) { showToast('تأكد من اختيار الإجابة الصحيحة لكل سؤال.', 'error'); return; }
        const btn = e.submitter;
        btn.textContent = '⏳';
        const maxPlaysVal = parseInt(document.getElementById('game-max-plays')?.value || '0', 10);
        await Store.addGame({ title, classId, questions, maxPlays: isNaN(maxPlaysVal) ? 0 : maxPlaysVal });
        showToast('تم حفظ اللعبة بنجاح!', 'success');
        await this.renderManageGames();
    },

    async deleteGame(id) {
        if (confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
            await Store.deleteGame(id);
            showToast('تم الحذف!', 'success');
            await this.renderManageGames();
        }
    },

    // ── ADMIN SETTINGS ────────────────────────────────────────────────
    async renderAdminSettings() {
        const admin = Auth.currentUser;
        App.mainContent.innerHTML = `
            <div class="fade-in">
                <button class="btn btn-ghost btn-sm mb-2" onclick="AdminView.renderDashboard()">‹ عودة</button>
                <div class="section-title mb-3">🔐 إعدادات حساب الأدمن</div>

                <!-- Change Username -->
                <div class="card mb-3" style="padding:1.5rem;">
                    <h3 style="color:var(--primary); margin-bottom:1.25rem;">👤 تغيير اليوزر</h3>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:800;">اليوزر الحالي</label>
                        <input type="text" class="form-input" value="${admin.username}" disabled style="opacity:0.6;">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:800;">اليوزر الجديد</label>
                        <input type="text" id="new-username" class="form-input" placeholder="اكتب اليوزر الجديد" autocapitalize="none">
                    </div>
                    <button class="btn btn-primary btn-block" onclick="AdminView.changeAdminUsername()">💾 حفظ اليوزر</button>
                </div>

                <!-- Change Password -->
                <div class="card" style="padding:1.5rem;">
                    <h3 style="color:var(--primary); margin-bottom:1.25rem;">🔑 تغيير كلمة المرور</h3>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:800;">كلمة المرور الحالية</label>
                        <input type="password" id="current-password" class="form-input" placeholder="كلمة المرور الحالية">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:800;">كلمة المرور الجديدة</label>
                        <input type="password" id="new-password" class="form-input" placeholder="كلمة المرور الجديدة">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-weight:800;">تأكيد كلمة المرور</label>
                        <input type="password" id="confirm-password" class="form-input" placeholder="أعد إدخال كلمة المرور الجديدة">
                    </div>
                    <button class="btn btn-primary btn-block" onclick="AdminView.changeAdminPassword()">💾 حفظ كلمة المرور</button>
                </div>
            </div>
        `;
    },

    async changeAdminUsername() {
        const newUsername = document.getElementById('new-username').value.trim();
        if (!newUsername) { showToast('أدخل اليوزر الجديد', 'error'); return; }
        if (newUsername === Auth.currentUser.username) { showToast('اليوزر نفس القديم!', 'error'); return; }

        // Check if username already taken
        const existing = await Store.getUser(newUsername);
        if (existing) { showToast('هذا اليوزر مستخدم مسبقاً!', 'error'); return; }

        const btn = document.querySelector('.card .btn-primary');
        if (btn) btn.textContent = '⏳';

        const updated = await Store.updateUser(Auth.currentUser.id, { username: newUsername });
        if (updated) {
            Auth.currentUser = updated;
            sessionStorage.setItem('fl_currentUser', JSON.stringify(updated));
            showToast('✅ تم تغيير اليوزر بنجاح!', 'success');
            await this.renderAdminSettings();
        } else {
            showToast('حدث خطأ أثناء الحفظ', 'error');
            if (btn) btn.textContent = '💾 حفظ اليوزر';
        }
    },

    async changeAdminPassword() {
        const currentPass   = document.getElementById('current-password').value;
        const newPass       = document.getElementById('new-password').value;
        const confirmPass   = document.getElementById('confirm-password').value;

        if (!currentPass || !newPass || !confirmPass) { showToast('اكمل جميع الحقول', 'error'); return; }
        if (currentPass !== Auth.currentUser.password) { showToast('كلمة المرور الحالية غلط!', 'error'); return; }
        if (newPass !== confirmPass) { showToast('كلمتا المرور ما تطابقتا!', 'error'); return; }
        if (newPass.length < 6) { showToast('كلمة المرور لازم تكون 6 أحرف على الأقل', 'error'); return; }

        const btns = document.querySelectorAll('.card .btn-primary');
        btns.forEach(b => b.textContent = '⏳');

        const updated = await Store.updateUser(Auth.currentUser.id, { password: newPass });
        if (updated) {
            Auth.currentUser = updated;
            sessionStorage.setItem('fl_currentUser', JSON.stringify(updated));
            showToast('✅ تم تغيير كلمة المرور بنجاح!', 'success');
            await this.renderAdminSettings();
        } else {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    },

    // ── REPORTS ───────────────────────────────────────────────────────
    async renderReports() {
        App.mainContent.innerHTML = '<div style="display:flex;justify-content:center;margin-top:4rem;"><div class="loader-circle"></div></div>';
        const allResults = await Store.getAllGameResults();
        const classes = await Store.getClasses();

        // Group by game
        const byGame = {};
        allResults.forEach(r => {
            if (!byGame[r.gameTitle]) byGame[r.gameTitle] = [];
            byGame[r.gameTitle].push(r);
        });

        let html = `
            <div class="fade-in">
                <button class="btn btn-ghost btn-sm mb-2" onclick="AdminView.renderDashboard()">‹ عودة</button>
                <div class="section-title mb-2">📊 التقارير والإحصائيات</div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
                    <div class="card text-center" style="padding:1rem;">
                        <div style="font-size:2rem;">🎮</div>
                        <div style="font-size:1.8rem; font-weight:900; color:var(--primary);">${allResults.length}</div>
                        <div style="font-size:0.8rem; color:var(--muted-light);">إجمالي جلسات اللعب</div>
                    </div>
                    <div class="card text-center" style="padding:1rem;">
                        <div style="font-size:2rem;">📝</div>
                        <div style="font-size:1.8rem; font-weight:900; color:var(--green);">${Object.keys(byGame).length}</div>
                        <div style="font-size:0.8rem; color:var(--muted-light);">ألعاب مختلفة</div>
                    </div>
                </div>

                <h3 class="mb-2" style="color:var(--text-2);">نتائج الألعاب حسب اللعبة:</h3>
        `;

        if (allResults.length === 0) {
            html += `<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">لا توجد نتائج بعد</div></div>`;
        } else {
            for (const [gameTitle, results] of Object.entries(byGame)) {
                const avg = (results.reduce((s, r) => s + r.score / r.total * 100, 0) / results.length).toFixed(0);
                const color = avg >= 70 ? 'var(--green)' : avg >= 40 ? 'var(--gold)' : 'var(--red)';
                html += `
                <div class="card mb-2" style="padding:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <div style="font-weight:900; font-size:1rem;">🎮 ${gameTitle}</div>
                        <div style="font-size:1.2rem; font-weight:900; color:${color};">${avg}%</div>
                    </div>
                    <div style="font-size:0.82rem; color:var(--muted-light); margin-bottom:0.5rem;">لُعبت ${results.length} مرة</div>
                    <div style="background:var(--surface-2); border-radius:100px; height:8px; overflow:hidden; margin-bottom:0.75rem;">
                        <div style="background:${color}; width:${avg}%; height:100%; border-radius:100px;"></div>
                    </div>
                    <div style="max-height:160px; overflow-y:auto;">
                        ${results.slice(0, 10).map(r => `
                            <div style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0; border-bottom:1px solid var(--border);">
                                <span>${r.user?.avatar || '👤'}</span>
                                <span style="flex:1; font-size:0.85rem; font-weight:700;">${r.user?.username || '—'}</span>
                                <span style="font-weight:900; color:${Math.round(r.score/r.total*100) >= 70 ? 'var(--green)' : 'var(--red)'};">${r.score}/${r.total}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }
        }

        // Homework completion per class
        html += `<h3 class="mb-2 mt-2" style="color:var(--text-2);">تسليم الواجبات حسب الصف:</h3>`;
        for (const cls of classes) {
            const hws = await Store.getHomeworkByClass(cls.id);
            if (hws.length === 0) continue;
            html += `<div class="card mb-2" style="padding:1rem;">
                <h4 style="margin-bottom:0.75rem; color:var(--primary);">${cls.icon || '📚'} ${cls.name}</h4>`;
            for (const hw of hws) {
                const results = await Store.getHomeworkResultsByHw(hw.id);
                html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0; border-bottom:1px solid var(--border);">
                    <span style="font-size:0.85rem;">📝 ${hw.title}</span>
                    <span style="font-weight:900; color:var(--green);">✅ ${results.length}</span>
                </div>`;
            }
            html += `</div>`;
        }

        html += `</div>`;
        App.mainContent.innerHTML = html;
    },

    async viewStudentPaper(hwId, userId) {
        const hw = await Store.getHomeworkById(hwId);
        const result = await Store.getHomeworkResultForUser(userId, hwId);
        const user = await Store.getUserById(userId);
        
        if (!hw || !result || !user) return;
        
        const old = document.getElementById('student-paper-modal');
        if (old) old.remove();
        
        const modal = document.createElement('div');
        modal.id = 'student-paper-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:99999; display:flex; align-items:center; justify-content:center; padding:1rem;';
        
        let questionsHtml = hw.questions.map((q, idx) => {
            const studentAns = (result.answers && result.answers[idx]) ? result.answers[idx] : '';
            const isCorrect = studentAns.toString().trim().toLowerCase() === q.a.toString().trim().toLowerCase();
            const color = isCorrect ? 'var(--green)' : 'var(--red)';
            const icon = isCorrect ? '✅' : '❌';
            
            return `
            <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-md); padding:1rem; margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="font-weight:bold; color:var(--text);">السؤال ${idx + 1}</span>
                    <span style="font-size:1.2rem;">${icon}</span>
                </div>
                ${q.img ? `<div style="text-align:center; margin-bottom:0.5rem;"><img src="${q.img}" style="max-height:150px; border-radius:var(--r-sm);"></div>` : ''}
                <div style="font-size:1.05rem; font-weight:800; color:var(--text-2); margin-bottom:1rem;">${q.q}</div>
                
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <div style="background:var(--surface); padding:0.75rem; border-radius:var(--r-sm); border:1px solid ${color};">
                        <span style="font-size:0.8rem; color:var(--muted-light); display:block; margin-bottom:0.2rem;">إجابة الطالب:</span>
                        <strong style="color:${color};">${studentAns || '(لم يجب)'}</strong>
                    </div>
                    ${!isCorrect ? `
                    <div style="background:var(--surface); padding:0.75rem; border-radius:var(--r-sm); border:1px solid var(--green);">
                        <span style="font-size:0.8rem; color:var(--muted-light); display:block; margin-bottom:0.2rem;">الإجابة الصحيحة:</span>
                        <strong style="color:var(--green);">${q.a}</strong>
                    </div>` : ''}
                </div>
            </div>`;
        }).join('');
        
        const pct = Math.round(result.score / result.total * 100);
        const barColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--red)';

        modal.innerHTML = `
            <div style="background:var(--surface); border-radius:var(--r-xl); width:100%; max-width:600px; max-height:90vh; display:flex; flex-direction:column; border: 3px solid var(--border);">
                <!-- Header -->
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; color:var(--text); display:flex; align-items:center; gap:0.5rem;">
                            <span>📄 ورقة إجابة: ${user.username}</span>
                        </h3>
                        <div style="font-size:0.85rem; color:var(--muted-light); margin-top:0.2rem;">${hw.title}</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('student-paper-modal').remove()">✕ إغلاق</button>
                </div>
                
                <!-- Body -->
                <div style="padding:1.5rem; overflow-y:auto; flex:1;">
                    <div style="text-align:center; margin-bottom:2rem;">
                        <div style="font-size:2.5rem; font-weight:900; color:${barColor};">${result.score} / ${result.total}</div>
                        <div style="background:var(--surface-2); border-radius:100px; height:8px; width:150px; overflow:hidden; margin:0.5rem auto;">
                            <div style="background:${barColor}; width:${pct}%; height:100%; border-radius:100px;"></div>
                        </div>
                        <div style="font-size:1rem; font-weight:bold; color:${barColor};">${pct}%</div>
                    </div>
                    
                    ${questionsHtml}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
};

window.AdminView = AdminView;
