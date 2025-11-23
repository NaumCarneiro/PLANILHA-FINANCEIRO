/**
 * FinanceFam UI Service
 * Handles DOM updates and rendering
 */

const UI = {
    // --- View Management ---
    showView(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));

        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            setTimeout(() => target.classList.add('active'), 10); // Trigger transition
        }
    },

    showUserSubview(subviewId) {
        document.querySelectorAll('.subview').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.subview').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        const target = document.getElementById(subviewId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Update Nav State
        const navBtn = document.querySelector(`.nav-item[data-target="${subviewId}"]`);
        if (navBtn) navBtn.classList.add('active');
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;

        // Style for error
        if (type === 'error') {
            toast.style.backgroundColor = 'var(--danger)';
        }

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    toggleModal(modalId, show = true) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById(modalId);

        if (show) {
            overlay.classList.remove('hidden');
            modal.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        }
    },

    viewReceipt(url) {
        const img = document.getElementById('receipt-image');
        img.src = url;
        this.toggleModal('modal-view-receipt', true);
    },

    renderUserListLogin() {
        const container = document.getElementById('user-list-login');
        const users = DB.getUsers();
        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = '<p class="subtitle">Nenhum usuário encontrado. Peça ao administrador para criar um.</p>';
            return;
        }

        users.forEach(user => {
            const el = document.createElement('div');
            el.className = 'user-item';
            el.onclick = () => APP.handleUserLogin(user.id);
            el.innerHTML = `
                <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
                <span>${user.name}</span>
                <small class="subtitle">${user.role}</small>
            `;
            container.appendChild(el);
        });
    },

    renderAdminUserList() {
        const container = document.getElementById('list-users');
        const users = DB.getUsers();
        container.innerHTML = '';

        users.forEach(user => {
            const el = document.createElement('div');
            el.className = 'transaction-item'; // Reuse style
            el.innerHTML = `
                <div class="t-info">
                    <div class="t-icon"><i class="fa-solid fa-user"></i></div>
                    <div>
                        <h4>${user.name}</h4>
                        <small>${user.role}</small>
                    </div>
                </div>
                <button class="icon-btn" onclick="APP.deleteUser('${user.id}')"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(el);
        });
    },

    renderAdminList() {
        const container = document.getElementById('list-admins');
        const admins = DB.getAdmins();
        container.innerHTML = '';

        admins.forEach(admin => {
            const el = document.createElement('div');
            el.className = 'transaction-item';
            el.innerHTML = `
                <div class="t-info">
                    <div class="t-icon"><i class="fa-solid fa-user-shield"></i></div>
                    <div>
                        <h4>${admin.username}</h4>
                        <small>ID: ${admin.id.substring(0, 8)}...</small>
                    </div>
                </div>
                <button class="icon-btn" onclick="APP.deleteAdmin('${admin.id}')"><i class="fa-solid fa-trash"></i></button>
            `;
            container.appendChild(el);
        });
    },

    renderLogs() {
        const tbody = document.querySelector('#table-logs tbody');
        const logs = DB.getLogs();
        tbody.innerHTML = '';

        logs.forEach(log => {
            const row = document.createElement('tr');
            const date = new Date(log.timestamp).toLocaleString('pt-BR');
            row.innerHTML = `
                <td>${date}</td>
                <td>${log.action}</td>
                <td>${log.actor}</td>
                <td>${log.target}</td>
            `;
            tbody.appendChild(row);
        });
    },

    renderUserDashboard(user) {
        document.getElementById('user-name-display').innerText = user.name;
        this.updateMonthDisplay();
        this.renderTransactions(user.id);
        this.renderGoals(user.id);
        this.renderSavings(user.id);
    },

    updateMonthDisplay() {
        const date = APP.currentDate;
        const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        document.getElementById('current-month-display').innerText = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    },

    renderTransactions(userId) {
        const container = document.getElementById('transaction-list');
        const transactions = DB.getTransactions(userId);

        // Filter by current month/year
        const currentMonth = APP.currentDate.getMonth();
        const currentYear = APP.currentDate.getFullYear();

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = '';

        let income = 0;
        let expense = 0;

        filtered.forEach(t => {
            const val = parseFloat(t.amount);
            if (t.type === 'income') income += val;
            else expense += val;

            const el = document.createElement('div');
            el.className = 'transaction-item';
            el.innerHTML = `
                <div class="t-info">
                    <div class="t-icon">
                        <i class="fa-solid ${t.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                    </div>
                    <div>
                        <h4>${t.description || t.category}</h4>
                        <small>
                            ${new Date(t.date).toLocaleDateString('pt-BR')} • ${t.category}
                            ${t.receiptUrl ? `<span class="receipt-link" onclick="UI.viewReceipt('${t.receiptUrl}')">• <i class="fa-solid fa-paperclip"></i> Ver Recibo</span>` : ''}
                        </small>
                    </div>
                </div>
                <div class="t-right">
                    <span class="t-amount ${t.type}">R$ ${val.toFixed(2)}</span>
                    <button class="icon-btn" onclick="APP.deleteTransaction('${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(el);
        });

        // Update Summary Cards
        document.getElementById('summary-income').innerText = `R$ ${income.toFixed(2)}`;
        document.getElementById('summary-expense').innerText = `R$ ${expense.toFixed(2)}`;
        document.getElementById('summary-balance').innerText = `R$ ${(income - expense).toFixed(2)}`;

        // Update Chart with ALL transactions (income + expense)
        CHARTS.updateExpenseChart(filtered);
    },

    openGoalAction(goalId, type) {
        document.getElementById('goal-action-id').value = goalId;
        document.getElementById('goal-action-type').value = type;
        document.getElementById('goal-modal-title').innerText = type === 'deposit' ? 'Adicionar à Meta' : 'Resgatar da Meta';
        this.toggleModal('modal-goal-action', true);
    },

    showHistoryDetail(item) {
        document.getElementById('detail-date').innerText = new Date(item.date).toLocaleString('pt-BR');
        document.getElementById('detail-user').innerText = item.actor || 'Desconhecido';
        document.getElementById('detail-type').innerText = item.type === 'deposit' ? 'Depósito' : 'Resgate';
        document.getElementById('detail-amount').innerText = `R$ ${item.amount.toFixed(2)}`;
        document.getElementById('detail-observation').innerText = item.observation || 'Sem observação';

        this.toggleModal('modal-view-history-detail', true);
    },

    renderGoals(userId) {
        const container = document.getElementById('goals-list');
        const goals = DB.getGoals(userId);
        container.innerHTML = '';

        goals.forEach(g => {
            const percent = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
            const el = document.createElement('div');
            el.className = 'card summary'; // Reuse card style
            el.style.display = 'block';
            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                    <h4>${g.title}</h4>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>R$ ${g.currentAmount.toFixed(2)} / R$ ${g.targetAmount.toFixed(2)}</span>
                        <button class="icon-btn" onclick="UI.openGoalHistory('${g.id}')" title="Ver Histórico">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </button>
                    </div>
                </div>
                <div style="background: var(--bg-input); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 1rem;">
                    <div style="background: var(--primary); width: ${percent}%; height: 100%;"></div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-small" onclick="UI.openGoalAction('${g.id}', 'deposit')"><i class="fa-solid fa-plus"></i> Adicionar</button>
                    <button class="btn-small outline" onclick="UI.openGoalAction('${g.id}', 'withdraw')"><i class="fa-solid fa-minus"></i> Resgatar</button>
                </div>
            `;
            container.appendChild(el);
        });
    },

    openGoalHistory(goalId) {
        const goals = DB.get('ff_goals');
        const goal = goals.find(g => g.id === goalId);

        if (!goal) return;

        document.getElementById('goal-history-title').innerText = `Histórico: ${goal.title}`;

        const list = document.getElementById('goal-history-list');
        list.innerHTML = '';

        if (!goal.history || goal.history.length === 0) {
            list.innerHTML = '<li style="padding: 1rem; text-align: center; color: var(--text-muted);">Nenhuma movimentação ainda</li>';
        } else {
            goal.history.slice().reverse().forEach(h => {
                const li = document.createElement('li');
                li.style.padding = '0.5rem 0';
                li.style.borderBottom = '1px solid var(--border)';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.cursor = 'pointer';
                li.onclick = () => this.showHistoryDetail(h);

                li.innerHTML = `
                    <span>${h.type === 'deposit' ? 'Depósito' : 'Resgate'}</span>
                    <span class="${h.type === 'deposit' ? 't-amount income' : 't-amount expense'}">
                        R$ ${h.amount.toFixed(2)}
                    </span>
                `;
                list.appendChild(li);
            });
        }

        this.toggleModal('modal-view-goal-history', true);
    },

    renderSavings(userId) {
        const savings = DB.getSavings(userId);
        document.getElementById('savings-total').innerText = `R$ ${savings.amount.toFixed(2)}`;

        const list = document.getElementById('savings-history-list');
        list.innerHTML = '';

        // Show last 5 history items
        savings.history.slice(-5).reverse().forEach(h => {
            const li = document.createElement('li');
            li.style.padding = '0.5rem 0';
            li.style.borderBottom = '1px solid var(--border)';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.cursor = 'pointer';
            li.onclick = () => this.showHistoryDetail(h); // Click to view details

            li.innerHTML = `
                <span>${h.type === 'deposit' ? 'Depósito' : 'Resgate'}</span>
                <span class="${h.type === 'deposit' ? 't-amount income' : 't-amount expense'}">
                    R$ ${h.amount.toFixed(2)}
                </span>
            `;
            list.appendChild(li);
        });
    }
};
window.UI = UI;
