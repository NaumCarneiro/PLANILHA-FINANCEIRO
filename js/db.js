/**
 * FinanceFam Database Service
 * Uses LocalStorage to simulate a backend database.
 */

const DB_KEYS = {
    USERS: 'ff_users',
    ADMINS: 'ff_admins',
    TRANSACTIONS: 'ff_transactions',
    GOALS: 'ff_goals',
    SAVINGS: 'ff_savings',
    LOGS: 'ff_logs',
    CURRENT_USER: 'ff_current_user',
    CURRENT_ADMIN: 'ff_current_admin'
};

const DB = {
    init() {
        // Seed default admin if not exists
        const admins = this.get(DB_KEYS.ADMINS) || [];
        if (admins.length === 0) {
            admins.push({
                id: 'admin_default',
                username: '100749',
                password: '70752855484', // In a real app, hash this!
                createdAt: new Date().toISOString()
            });
            this.save(DB_KEYS.ADMINS, admins);
            console.log('Default admin seeded.');
        }
    },

    get(key) {
        const data = localStorage.getItem(key);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error parsing data for key:', key, e);
            return [];
        }
    },

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- Users ---
    getUsers() { return this.get(DB_KEYS.USERS); },
    addUser(user) {
        const users = this.getUsers();
        user.id = crypto.randomUUID();
        user.createdAt = new Date().toISOString();
        users.push(user);
        this.save(DB_KEYS.USERS, users);
        this.logAction('Criou usuário', user.name);
        return user;
    },
    deleteUser(id) {
        let users = this.getUsers();
        const user = users.find(u => u.id === id);
        users = users.filter(u => u.id !== id);
        this.save(DB_KEYS.USERS, users);
        if (user) this.logAction('Excluiu usuário', user.name);
    },

    // --- Admins ---
    getAdmins() { return this.get(DB_KEYS.ADMINS); },
    addAdmin(admin) {
        const admins = this.getAdmins();
        admin.id = crypto.randomUUID();
        admin.createdAt = new Date().toISOString();
        admins.push(admin);
        this.save(DB_KEYS.ADMINS, admins);
        this.logAction('Criou admin', admin.username);
        return admin;
    },
    deleteAdmin(id) {
        let admins = this.getAdmins();
        const admin = admins.find(a => a.id === id);
        // Prevent deleting the last admin or default one if needed, but spec allows delete
        admins = admins.filter(a => a.id !== id);
        this.save(DB_KEYS.ADMINS, admins);
        if (admin) this.logAction('Excluiu admin', admin.username);
    },

    // --- Transactions ---
    getTransactions(userId) {
        return this.get(DB_KEYS.TRANSACTIONS).filter(t => t.userId === userId);
    },
    addTransaction(transaction) {
        const transactions = this.get(DB_KEYS.TRANSACTIONS);
        transaction.id = crypto.randomUUID();
        transaction.createdAt = new Date().toISOString();

        // Handle Recurrence
        if (transaction.recurrence && transaction.recurrence !== 'none') {
            const count = parseInt(transaction.recurrence) || 1; // Handle 'custom' later if needed
            const baseDate = new Date(transaction.date);

            // Add original
            transactions.push(transaction);

            // Add future occurrences
            for (let i = 1; i < count; i++) {
                const nextDate = new Date(baseDate);
                nextDate.setMonth(baseDate.getMonth() + i);

                const recurringTrans = { ...transaction, id: crypto.randomUUID(), date: nextDate.toISOString().split('T')[0] };
                transactions.push(recurringTrans);
            }
        } else {
            transactions.push(transaction);
        }

        this.save(DB_KEYS.TRANSACTIONS, transactions);
        return transaction;
    },
    deleteTransaction(id) {
        let transactions = this.get(DB_KEYS.TRANSACTIONS);
        transactions = transactions.filter(t => t.id !== id);
        this.save(DB_KEYS.TRANSACTIONS, transactions);
    },

    // --- Goals ---
    getGoals(userId) { return this.get(DB_KEYS.GOALS).filter(g => g.userId === userId); },
    addGoal(goal) {
        const goals = this.get(DB_KEYS.GOALS);
        goal.id = crypto.randomUUID();
        goal.history = []; // Init history
        goals.push(goal);
        this.save(DB_KEYS.GOALS, goals);
        return goal;
    },
    updateGoalBalance(goalId, amount, type, observation) {
        let goals = this.get(DB_KEYS.GOALS);
        let goal = goals.find(g => g.id === goalId);

        if (!goal) return { success: false, message: 'Meta não encontrada.' };

        if (type === 'deposit') {
            goal.currentAmount += amount;
        } else if (type === 'withdraw') {
            if (goal.currentAmount < amount) {
                return { success: false, message: 'Saldo insuficiente na meta!' };
            }
            goal.currentAmount -= amount;
        }

        // Ensure history exists (migration for old data)
        if (!goal.history) goal.history = [];

        const currentAdmin = JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_ADMIN) || '{}');
        const currentUser = JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER) || '{}');
        const actorName = currentUser.name || currentAdmin.username || 'Desconhecido';

        goal.history.push({
            id: crypto.randomUUID(),
            type,
            amount,
            date: new Date().toISOString(),
            observation: observation || '',
            actor: actorName
        });

        this.save(DB_KEYS.GOALS, goals);
        return { success: true };
    },

    // --- Savings ---
    getSavings(userId) {
        const savings = this.get(DB_KEYS.SAVINGS).find(s => s.userId === userId);
        return savings || { userId, amount: 0, history: [] };
    },
    updateSavings(userId, amount, type, observation) { // type: 'deposit' | 'withdraw'
        let allSavings = this.get(DB_KEYS.SAVINGS);
        let userSavings = allSavings.find(s => s.userId === userId);

        if (!userSavings) {
            userSavings = { userId, amount: 0, history: [] };
            allSavings.push(userSavings);
        }

        if (type === 'deposit') {
            userSavings.amount += amount;
        } else if (type === 'withdraw') {
            if (userSavings.amount < amount) {
                return { success: false, message: 'Saldo insuficiente!' };
            }
            userSavings.amount -= amount;
        }

        const currentUser = JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER) || '{}');
        const actorName = currentUser.name || 'Desconhecido';

        userSavings.history.push({
            id: crypto.randomUUID(),
            type,
            amount,
            date: new Date().toISOString(),
            observation: observation || '',
            actor: actorName
        });

        // Update in array
        allSavings = allSavings.map(s => s.userId === userId ? userSavings : s);
        this.save(DB_KEYS.SAVINGS, allSavings);
        return { success: true };
    },

    // --- Logs ---
    getLogs() { return this.get(DB_KEYS.LOGS); },
    logAction(action, target) {
        const logs = this.getLogs();
        const currentAdmin = JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_ADMIN) || '{}');
        logs.unshift({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action,
            target,
            actor: currentAdmin.username || 'Unknown'
        });
        this.save(DB_KEYS.LOGS, logs);
    }
};

// Initialize DB on load
DB.init();
window.DB = DB;
