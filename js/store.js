// store.js
const supabaseUrl = 'https://lgcnsoorqfdcnyfipwwj.supabase.co';
const supabaseKey = 'sb_publishable_bQkAOE7ii7ZNKlDETUaJ4g_AUCM229n';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Utility to map snake_case to camelCase
function toCamel(obj) {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(v => toCamel(v));
    const newObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
}

const Store = {
    async getUsers() {
        const { data } = await supabaseClient.from('users').select('*');
        return toCamel(data) || [];
    },
    async getUser(username) {
        const { data } = await supabaseClient.from('users').select('*').eq('username', username).maybeSingle();
        return toCamel(data);
    },
    async getUserById(id) {
        const { data } = await supabaseClient.from('users').select('*').eq('id', id).maybeSingle();
        return toCamel(data);
    },
    async addUser(user) {
        const { data } = await supabaseClient.from('users').insert([{
            username: user.username,
            email: user.email || (user.username + '@local.com'),
            password: user.password,
            role: user.role || 'student',
            status: user.role === 'admin' ? 'active' : 'pending',
            class_id: user.classId || null,
            avatar: user.avatar || '👦'
        }]).select();
        return toCamel(data ? data[0] : null);
    },
    async updateUser(id, updates) {
        // Convert camelCase updates to snake_case for Supabase
        const snakeUpdates = {};
        for (const key in updates) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeUpdates[snakeKey] = updates[key];
        }
        const { data } = await supabaseClient.from('users').update(snakeUpdates).eq('id', id).select();
        return toCamel(data ? data[0] : null);
    },
    async deleteUser(id) {
        await supabaseClient.from('users').delete().eq('id', id);
    },
    async spendCoins(id, amount) {
        const user = await this.getUserById(id);
        if (!user) return false;
        if (user.role === 'admin') return true; // Admin always has coins
        if ((user.coins || 0) >= amount) {
            await this.updateUser(id, { coins: user.coins - amount });
            return true;
        }
        return false;
    },
    async addCoins(id, amount) {
        const user = await this.getUserById(id);
        if (user && user.role !== 'admin') {
            await this.updateUser(id, { coins: (user.coins || 0) + amount });
        }
    },
    async addXP(id, amount) {
        const user = await this.getUserById(id);
        if (user) await this.updateUser(id, { xp: (user.xp || 0) + amount });
    },
    
    // Classes
    async getClasses() {
        const { data } = await supabaseClient.from('classes').select('*');
        return toCamel(data) || [];
    },
    async addClass(cls) {
        const { data } = await supabaseClient.from('classes').insert([cls]).select();
        return toCamel(data ? data[0] : null);
    },
    async deleteClass(id) {
        await supabaseClient.from('classes').delete().eq('id', id);
    },

    // Homework
    async getHomeworkByClass(classId) {
        const { data } = await supabaseClient.from('homework').select('*').eq('class_id', classId).order('added_date', { ascending: false });
        return toCamel(data) || [];
    },
    async getHomeworkById(id) {
        const { data } = await supabaseClient.from('homework').select('*').eq('id', id).maybeSingle();
        return toCamel(data);
    },
    async addHomework(hw) {
        const { data } = await supabaseClient.from('homework').insert([{
            title: hw.title,
            link: hw.link,
            class_id: hw.classId,
            due_date: hw.dueDate || null,
            responses_link: hw.responsesLink || null
        }]).select();
        return toCamel(data ? data[0] : null);
    },
    async deleteHomework(id) {
        await supabaseClient.from('homework').delete().eq('id', id);
    },
    async hasCompletedHomework(userId, hwId) {
        const { data } = await supabaseClient.from('homework_results').select('*').eq('user_id', userId).eq('hw_id', hwId).maybeSingle();
        return !!data;
    },
    async saveHomeworkResult(userId, hwId) {
        const already = await this.hasCompletedHomework(userId, hwId);
        if (already) return; // prevent duplicate
        await supabaseClient.from('homework_results').insert([{ user_id: userId, hw_id: hwId }]);
        await this.addCoins(userId, 10);
        await this.addXP(userId, 50);
    },
    async getHomeworkResultsByHw(hwId) {
        const { data } = await supabaseClient.from('homework_results').select('*, users(*)').eq('hw_id', hwId);
        if (!data) return [];
        return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            hwId: r.hw_id,
            createdAt: r.created_at,
            user: toCamel(r.users)
        }));
    },

    // Games
    async getGames() {
        const { data } = await supabaseClient.from('games').select('*');
        return toCamel(data) || [];
    },
    async getGamesByClass(classId) {
        const { data } = await supabaseClient.from('games').select('*').eq('class_id', classId);
        return toCamel(data) || [];
    },
    async addGame(game) {
        const { data } = await supabaseClient.from('games').insert([{
            title: game.title, class_id: game.classId, questions: game.questions,
            max_plays: game.maxPlays || 0  // 0 = unlimited
        }]).select();
        return toCamel(data ? data[0] : null);
    },
    async updateGameMaxPlays(gameId, maxPlays) {
        await supabaseClient.from('games').update({ max_plays: maxPlays }).eq('id', gameId);
    },
    async getGamePlayCount(userId, gameId) {
        const { count } = await supabaseClient.from('game_results')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('game_id', gameId);
        return count || 0;
    },
    async deleteGame(id) {
        await supabaseClient.from('games').delete().eq('id', id);
    },
    async saveResult(result) {
        await supabaseClient.from('game_results').insert([{
            user_id: result.userId, game_id: result.gameId, score: result.score, total: result.total
        }]);
        await this.addCoins(result.userId, result.score * 5);
        await this.addXP(result.userId, result.score * 10);
    },
    async getResultsByGame(gameId) {
        const { data } = await supabaseClient.from('game_results').select('*, users(*)').eq('game_id', gameId).order('created_at', { ascending: false });
        if (!data) return [];
        return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            gameId: r.game_id,
            score: r.score,
            total: r.total,
            createdAt: r.created_at,
            user: toCamel(r.users)
        }));
    },
    async getUserGameResults(userId) {
        const { data } = await supabaseClient.from('game_results').select('*, games(*)').eq('user_id', userId).order('created_at', { ascending: false });
        if (!data) return [];
        return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            gameId: r.game_id,
            score: r.score,
            total: r.total,
            createdAt: r.created_at,
            gameTitle: r.games ? r.games.title : ''
        }));
    },
    async getAllGameResults() {
        const { data } = await supabaseClient.from('game_results').select('*, users(*), games(*)').order('created_at', { ascending: false });
        if (!data) return [];
        return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            gameId: r.game_id,
            score: r.score,
            total: r.total,
            createdAt: r.created_at,
            user: toCamel(r.users),
            gameTitle: r.games ? r.games.title : ''
        }));
    },

    // Leaderboard
    async getLeaderboard(classId) {
        let query = supabaseClient.from('users')
            .select('*')
            .eq('role', 'student')
            .eq('status', 'active');
        
        if (classId) {
            query = query.eq('class_id', classId);
        }
            
        const { data } = await query.order('xp', { ascending: false }).limit(20);
        return toCamel(data) || [];
    },

    // Items
    getShopItems() {
        return [
            { id: 'f1', name: 'إطار ذهبي', price: 50, icon: '🌟', type: 'frame', color: 'gold' },
            { id: 'f2', name: 'إطار ناري', price: 100, icon: '🔥', type: 'frame', color: '#ff4500' },
            { id: 'f3', name: 'إطار ماسي', price: 200, icon: '💎', type: 'frame', color: '#00ffff' },
            { id: 'h1', name: 'تلميحة 💡', price: 30, icon: '💡', type: 'hint' },
            { id: 'h2', name: 'حزمة تلميحات (3)', price: 75, icon: '📦', type: 'hint', amount: 3 }
        ];
    },
    async buyItem(userId, itemId) {
        const item = this.getShopItems().find(i => i.id === itemId);
        if (!item) return false;
        
        const user = await this.getUserById(userId);
        if (!user || user.coins < item.price) return false;

        if (item.type === 'frame') {
            await supabaseClient.from('user_items').insert([{ user_id: userId, item_id: itemId }]);
        } else if (item.type === 'hint') {
            await this.updateUser(userId, { hints: (user.hints || 0) + (item.amount || 1) });
        }
        await this.spendCoins(userId, item.price);
        return true;
    },
    async equipFrame(userId, itemId) {
        await this.updateUser(userId, { equipped_frame: itemId });
    },
    async getUserItems(userId) {
        const { data } = await supabaseClient.from('user_items').select('*').eq('user_id', userId);
        return (data || []).map(r => r.item_id);
    }
};

window.Store = Store;
