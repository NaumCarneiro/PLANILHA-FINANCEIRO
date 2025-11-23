/**
 * FinanceFam Main App Logic
 */

const APP = {
    currentDate: new Date(),

    init() {
        // Check Auth State
        const role = AUTH.init();
        if (role === 'user') {
            UI.showView('view-user-dashboard');
            UI.renderUserDashboard(AUTH.currentUser);
        } else if (role === 'admin') {
            UI.showView('view-admin-dashboard');
            this.initAdminDashboard();
        } else {
            UI.showView('view-login-user');
            UI.renderUserListLogin();
        }

        this.setupEventListeners();
    },

    setupEventListeners() {
        // --- Login Navigation ---
        document.getElementById('btn-admin-access').onclick = () => UI.showView('view-login-admin');
        document.getElementById('btn-back-to-user-login').onclick = () => UI.showView('view-login-user');

        // --- Admin Login ---
        document.getElementById('form-login-admin').onsubmit = (e) => {
            e.preventDefault();
            const login = e.target['admin-login'].value;
            const pass = e.target['admin-password'].value;

            if (AUTH.loginAdmin(login, pass)) {
                UI.showView('view-admin-dashboard');
                this.initAdminDashboard();
                e.target.reset();
            } else {
                UI.showToast('Credenciais inválidas!', 'error');
            }
        };

        // --- Admin Dashboard ---
        document.getElementById('btn-logout-admin').onclick = () => {
            AUTH.logoutAdmin();
            UI.showView('view-login-user');
            UI.renderUserListLogin();
        };

        // Tabs
        document.querySelectorAll('.sidebar .nav-links li').forEach(li => {
            li.onclick = () => {
                document.querySelectorAll('.sidebar .nav-links li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
                document.getElementById(`tab-${li.dataset.tab}`).classList.remove('hidden');
            };
        });

        // Add User
        document.getElementById('btn-add-user').onclick = () => UI.toggleModal('modal-add-user', true);
        document.querySelector('#modal-add-user .close-modal').onclick = () => UI.toggleModal('modal-add-user', false);

        document.getElementById('form-add-user').onsubmit = (e) => {
            e.preventDefault();
            const name = e.target['name'].value;
            const role = e.target['role'].value;

            DB.addUser({ name, role });
            UI.toggleModal('modal-add-user', false);
            UI.renderAdminUserList();
            UI.showToast('Usuário criado com sucesso!');
            e.target.reset();
        };

        // --- User Dashboard ---
        document.getElementById('btn-logout-user').onclick = () => {
            AUTH.logoutUser();
            UI.showView('view-login-user');
            UI.renderUserListLogin();
        };

        // Bottom Nav
        document.querySelectorAll('.bottom-nav .nav-item:not(.fab)').forEach(btn => {
            btn.onclick = () => UI.showUserSubview(btn.dataset.target);
        });

        // Month Navigation
        document.getElementById('btn-prev-month').onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            UI.renderUserDashboard(AUTH.currentUser);
        };
        document.getElementById('btn-next-month').onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            UI.renderUserDashboard(AUTH.currentUser);
        };

        // --- Goals ---
        document.getElementById('btn-add-goal').onclick = () => UI.toggleModal('modal-add-goal', true);
        document.querySelector('#modal-add-goal .close-modal').onclick = () => UI.toggleModal('modal-add-goal', false);

        document.getElementById('form-add-goal').onsubmit = (e) => {
            e.preventDefault();
            const title = e.target['title'].value;
            const targetAmount = parseFloat(e.target['targetAmount'].value);

            DB.addGoal({
                userId: AUTH.currentUser.id,
                title,
                targetAmount,
                currentAmount: 0
            });

            UI.toggleModal('modal-add-goal', false);
            UI.renderUserDashboard(AUTH.currentUser);
            UI.showToast('Meta criada!');
            e.target.reset();
        };

        // --- Transactions ---
        document.querySelector('#modal-add-transaction .close-modal').onclick = () => UI.toggleModal('modal-add-transaction', false);

        document.getElementById('form-add-transaction').onsubmit = (e) => {
            e.preventDefault();
            const type = e.target['type'].value;
            const amount = parseFloat(e.target['amount'].value);
            const category = e.target['category'].value;
            const description = e.target['description'].value;
            const date = e.target['date'].value || new Date().toISOString().split('T')[0];
            const time = e.target['time'].value || new Date().toTimeString().split(' ')[0].substring(0, 5);
            const recurrence = e.target['recurrence'].value;
            const receiptFile = e.target['receipt'].files[0];

            const transaction = {
                userId: AUTH.currentUser.id,
                type,
                amount,
                category,
                description,
                date,
                time,
                recurrence
            };

            // Handle file upload (convert to base64)
            if (receiptFile) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    transaction.receiptUrl = event.target.result;
                    DB.addTransaction(transaction);
                    UI.toggleModal('modal-add-transaction', false);
                    UI.renderUserDashboard(AUTH.currentUser);
                    UI.showToast(type === 'income' ? 'Renda adicionada!' : 'Gasto adicionado!');
                    e.target.reset();
                };
                reader.readAsDataURL(receiptFile);
            } else {
                DB.addTransaction(transaction);
                UI.toggleModal('modal-add-transaction', false);
                UI.renderUserDashboard(AUTH.currentUser);
                UI.showToast(type === 'income' ? 'Renda adicionada!' : 'Gasto adicionado!');
                e.target.reset();
            }
        };

        // Goal Actions (Deposit/Withdraw)
        document.querySelector('#modal-goal-action .close-modal').onclick = () => UI.toggleModal('modal-goal-action', false);

        document.getElementById('form-goal-action').onsubmit = (e) => {
            e.preventDefault();
            const goalId = e.target['goalId'].value;
            const type = e.target['type'].value;
            const amount = parseFloat(e.target['amount'].value);
            const observation = e.target['observation'].value;

            const result = DB.updateGoalBalance(goalId, amount, type, observation);

            if (result.success) {
                UI.toggleModal('modal-goal-action', false);
                UI.renderUserDashboard(AUTH.currentUser);
                UI.showToast(type === 'deposit' ? 'Valor adicionado à meta!' : 'Valor resgatado da meta!');
                e.target.reset();
            } else {
                UI.showToast(result.message, 'error');
            }
        };

        // --- Savings Actions ---
        const openSavingsModal = (type) => {
            document.getElementById('savings-action-type').value = type;
            document.getElementById('savings-modal-title').innerText = type === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Dinheiro';
            UI.toggleModal('modal-savings-action', true);
        };

        document.getElementById('btn-savings-deposit').onclick = () => openSavingsModal('deposit');
        document.getElementById('btn-savings-withdraw').onclick = () => openSavingsModal('withdraw');
        document.querySelector('#modal-savings-action .close-modal').onclick = () => UI.toggleModal('modal-savings-action', false);

        document.getElementById('form-savings-action').onsubmit = (e) => {
            e.preventDefault();
            const type = e.target['type'].value;
            const amount = parseFloat(e.target['amount'].value);
            const observation = e.target['observation'].value;

            const result = DB.updateSavings(AUTH.currentUser.id, amount, type, observation);

            if (result.success) {
                UI.toggleModal('modal-savings-action', false);
                UI.renderUserDashboard(AUTH.currentUser);
                UI.showToast(type === 'deposit' ? 'Valor guardado!' : 'Valor resgatado!');
                e.target.reset();
            } else {
                UI.showToast(result.message, 'error');
            }
        };

        // --- History Detail Modal ---
        document.querySelector('#modal-view-history-detail .close-modal').onclick = () => UI.toggleModal('modal-view-history-detail', false);

        // --- Goal History Modal ---
        document.querySelector('#modal-view-goal-history .close-modal').onclick = () => UI.toggleModal('modal-view-goal-history', false);

        // --- Receipt Modal ---
        document.querySelector('#modal-view-receipt .close-modal').onclick = () => UI.toggleModal('modal-view-receipt', false);
    },

    // --- Actions ---
    handleUserLogin(userId) {
        if (AUTH.loginUser(userId)) {
            UI.showView('view-user-dashboard');
            UI.renderUserDashboard(AUTH.currentUser);
        }
    },

    initAdminDashboard() {
        UI.renderAdminUserList();
        UI.renderAdminList();
        UI.renderLogs();
    },

    deleteUser(id) {
        if (confirm('Tem certeza?')) {
            DB.deleteUser(id);
            UI.renderAdminUserList();
        }
    },

    deleteAdmin(id) {
        if (confirm('Tem certeza?')) {
            DB.deleteAdmin(id);
            UI.renderAdminList();
        }
    },

    deleteTransaction(id) {
        if (confirm('Excluir lançamento?')) {
            DB.deleteTransaction(id);
            UI.renderUserDashboard(AUTH.currentUser);
        }
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => APP.init());

// Expose to window for inline event handlers
window.APP = APP;
