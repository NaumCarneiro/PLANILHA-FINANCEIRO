/**
 * FinanceFam Chart Service
 */

const CHARTS = {
    expenseChart: null,

    updateExpenseChart(transactions) {
        const ctx = document.getElementById('chart-expenses');
        if (!ctx) return;

        // Group by category and type
        const categories = {};
        transactions.forEach(t => {
            const key = t.category;
            if (!categories[key]) {
                categories[key] = {
                    amount: 0,
                    type: t.type
                };
            }
            categories[key].amount += parseFloat(t.amount);
            categories[key].type = t.type; // Keep track of type
        });

        const labels = Object.keys(categories);
        const data = labels.map(label => categories[label].amount);

        // Assign colors based on type (green for income, varied colors for expenses)
        const expenseColors = ['#ef4444', '#f59e0b', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
        const incomeColor = '#10b981'; // Green for income

        const colors = labels.map((label, index) => {
            return categories[label].type === 'income' ? incomeColor : expenseColors[index % expenseColors.length];
        });

        if (this.expenseChart) {
            this.expenseChart.destroy();
        }

        this.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
};
