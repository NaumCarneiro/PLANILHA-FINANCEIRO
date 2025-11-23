/**
 * FinanceFam Auth Service
 */

const AUTH = {
    currentUser: null,
    currentAdmin: null,

    init() {
        // Check for active sessions
        const userSession = localStorage.getItem(DB_KEYS.CURRENT_USER);
        const adminSession = localStorage.getItem(DB_KEYS.CURRENT_ADMIN);

        if (userSession) {
            this.currentUser = JSON.parse(userSession);
            return 'user';
        }
        if (adminSession) {
            this.currentAdmin = JSON.parse(adminSession);
            return 'admin';
        }
        return null;
    },

    loginUser(userId) {
        const users = DB.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            this.currentUser = user;
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            return true;
        }
        return false;
    },

    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
    },

    loginAdmin(username, password) {
        const admins = DB.getAdmins();
        const admin = admins.find(a => a.username === username && a.password === password);
        if (admin) {
            this.currentAdmin = admin;
            localStorage.setItem(DB_KEYS.CURRENT_ADMIN, JSON.stringify(admin));
            return true;
        }
        return false;
    },

    logoutAdmin() {
        this.currentAdmin = null;
        localStorage.removeItem(DB_KEYS.CURRENT_ADMIN);
    }
};
