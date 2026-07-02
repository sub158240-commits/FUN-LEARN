// auth.js
const Auth = {
    currentUser: null,
    isPreviewMode: false,

    async init() {
        const stored = sessionStorage.getItem('fl_currentUser');
        if (stored) {
            const savedUser = JSON.parse(stored);
            const fresh = await Store.getUserById(savedUser.id);
            this.currentUser = fresh || savedUser;
        }
        const preview = sessionStorage.getItem('fl_previewMode');
        if (preview === 'true') {
            this.isPreviewMode = true;
        }
    },

    async login(identifier, password) {
        const user = await Store.getUser(identifier);
        if (user && user.password === password) {
            if (user.role === 'student' && user.status === 'pending') {
                return { success: false, message: typeof t !== 'undefined' && t ? t('accountPending') : 'حسابك بانتظار موافقة المعلم.' };
            }
            this.currentUser = user;
            sessionStorage.setItem('fl_currentUser', JSON.stringify(user));
            return { success: true };
        }
        return { success: false };
    },

    async register(userData) {
        let existing = await Store.getUser(userData.username);
        // Supabase query to check email if needed, we'll keep it simple
        if (existing) {
            return { success: false, message: typeof t !== 'undefined' && t ? t('userExists') : 'اسم المستخدم أو البريد مستخدم مسبقاً.' };
        }
        userData.avatar = userData.avatar === 'boy' ? '👦' : '👧';
        const newUser = await Store.addUser(userData);
        if (!newUser) return { success: false, message: 'حدث خطأ أثناء التسجيل' };
        
        // Don't auto login if they are pending, but we simulate they are pending.
        return { success: true };
    },

    logout() {
        this.currentUser = null;
        this.isPreviewMode = false;
        sessionStorage.removeItem('fl_currentUser');
        sessionStorage.removeItem('fl_previewMode');
    },

    async refresh() {
        if (this.currentUser) {
            const fresh = await Store.getUserById(this.currentUser.id);
            if (fresh) {
                this.currentUser = fresh;
                sessionStorage.setItem('fl_currentUser', JSON.stringify(fresh));
            }
        }
    },

    togglePreviewMode() {
        this.isPreviewMode = !this.isPreviewMode;
        sessionStorage.setItem('fl_previewMode', this.isPreviewMode ? 'true' : 'false');
    },

    isLoggedIn() { return this.currentUser !== null; },
    isAdmin()    { return this.currentUser && this.currentUser.role === 'admin' && !this.isPreviewMode; },
};
