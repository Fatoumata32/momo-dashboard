// Chart instances
let typeChart = null;
let monthlyChart = null;
let hourlyChart = null;

// State management
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let transactionTypes = [];

// Initialize charts
function initializeCharts() {
    const typeCtx = document.getElementById('typeChart').getContext('2d');
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');

    // Transaction types chart
    typeChart = new Chart(typeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Number of Transactions',
                data: [],
                backgroundColor: 'rgba(234, 179, 8, 0.5)',
                borderColor: 'rgb(234, 179, 8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Monthly trends chart
    monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Amount (RWF)',
                data: [],
                borderColor: 'rgb(234, 179, 8)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(234, 179, 8, 0.1)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `${value.toLocaleString()} RWF`
                    }
                }
            }
        }
    });

    // Hourly distribution chart
    hourlyChart = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Transaction Count',
                data: [],
                backgroundColor: 'rgba(234, 179, 8, 0.5)',
                borderColor: 'rgb(234, 179, 8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fetch XML data
async function fetchXMLData() {
    try {
        const response = await fetch('/static/xml/data.xml');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        return xmlDoc;
    } catch (error) {
        console.error('Error fetching XML data:', error);
    }
}

// Update dashboard with new data
async function updateDashboard() {
    try {
        const xmlDoc = await fetchXMLData();

        if (!xmlDoc) return;

        const data = parseXMLData(xmlDoc);

        // Update summary cards
        document.getElementById('total-transactions').textContent = data.total_transactions.toLocaleString();
        document.getElementById('total-amount').textContent = formatCurrency(data.total_amount);
        document.getElementById('total-fees').textContent = formatCurrency(data.total_fees);

        // Find most common type
        let maxCount = 0;
        let mostCommonType = '-';
        Object.entries(data.by_type).forEach(([type, info]) => {
            if (info.count > maxCount) {
                maxCount = info.count;
                mostCommonType = type.replace('_', ' ').toUpperCase();
            }
        });
        document.getElementById('most-common-type').textContent = mostCommonType;

        // Update transaction types filter
        const typeFilter = document.getElementById('type-filter');
        transactionTypes = Object.keys(data.by_type);
        typeFilter.innerHTML = '<option value="">All Types</option>' +
            transactionTypes.map(type => 
                `<option value="${type}">${type.replace('_', ' ').toUpperCase()}</option>`
            ).join('');

        // Update type chart
        const types = Object.keys(data.by_type);
        const counts = types.map(type => data.by_type[type].count);
        
        typeChart.data.labels = types.map(t => t.replace('_', ' ').toUpperCase());
        typeChart.data.datasets[0].data = counts;
        typeChart.update();

        // Update monthly chart
        const months = Object.keys(data.monthly_totals);
        const amounts = months.map(month => data.monthly_totals[month].amount);
        
        monthlyChart.data.labels = months.map(m => {
            const [year, month] = m.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        });
        monthlyChart.data.datasets[0].data = amounts;
        monthlyChart.update();

        // Update hourly chart
        const hours = Object.keys(data.hourly_distribution);
        const hourCounts = Array(24).fill(0);
        hours.forEach(hour => {
            hourCounts[parseInt(hour)] = data.hourly_distribution[hour];
        });
        
        hourlyChart.data.datasets[0].data = hourCounts;
        hourlyChart.update();

        // Update top contacts
        const topContactsContainer = document.getElementById('top-contacts');
        topContactsContainer.innerHTML = data.top_contacts.map((contact, index) => 
            `<div class="top-contact-card">
                <div class="flex justify-between items-center">
                    <span class="font-semibold">#${index + 1} ${contact.phone}</span>
                    <span class="text-yellow-600">${contact.count} transactions</span>
                 </div>
                <div class="text-sm text-gray-600 mt-2">
                    Total Amount: ${formatCurrency(contact.amount)}
                </div>
            </div>`
        ).join('');
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Parse XML data into JSON-like structure
function parseXMLData(xmlDoc) {
    const data = {
        total_transactions: parseInt(xmlDoc.querySelector('total_transactions').textContent),
        total_amount: parseFloat(xmlDoc.querySelector('total_amount').textContent),
        total_fees: parseFloat(xmlDoc.querySelector('total_fees').textContent),
        by_type: {},
        monthly_totals: {},
        hourly_distribution: {},
        top_contacts: []
    };

    // Parse 'by_type'
    const types = xmlDoc.querySelectorAll('by_type type');
    types.forEach(type => {
        const name = type.getAttribute('name');
        const count = parseInt(type.querySelector('count').textContent);
        data.by_type[name] = { count };
    });

    // Parse 'monthly_totals'
    const monthly = xmlDoc.querySelectorAll('monthly_totals month');
    monthly.forEach(month => {
        const key = month.getAttribute('key');
        const amount = parseFloat(month.querySelector('amount').textContent);
        data.monthly_totals[key] = { amount };
    });

    // Parse 'hourly_distribution'
    const hours = xmlDoc.querySelectorAll('hourly_distribution hour');
    hours.forEach(hour => {
        const key = hour.getAttribute('key');
        const count = parseInt(hour.querySelector('count').textContent);
        data.hourly_distribution[key] = count;
    });

    // Parse 'top_contacts'
    const contacts = xmlDoc.querySelectorAll('top_contacts contact');
    contacts.forEach(contact => {
        const phone = contact.querySelector('phone').textContent;
        const count = parseInt(contact.querySelector('count').textContent);
        const amount = parseFloat(contact.querySelector('amount').textContent);
        data.top_contacts.push({ phone, count, amount });
    });

    return data;
}

// Update transactions table
async function updateTransactionsTable() {
    const searchInput = document.getElementById('search-input').value;
    const typeFilter = document.getElementById('type-filter').value;
    const dateFilter = document.getElementById('date-filter').value;

    try {
        const response = await fetch(`/api/transactions?page=${currentPage}&limit=${pageSize}&search=${searchInput}&type=${typeFilter}`);
        const data = await response.json();

        totalPages = data.pages;
        updatePagination();

        const tbody = document.getElementById('transactions-table');
        tbody.innerHTML = data.transactions.map(t => 
            `<tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(t.date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${t.type.replace('_', ' ').toUpperCase()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatCurrency(t.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${t.phone_number || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${t.reference_id || '-'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${t.details}
                </td>
            </tr>`
        ).join('');
    } catch (error) {
        console.error('Error updating transactions table:', error);
    }
}

// Update pagination controls
function updatePagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = `
        <button onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>
        ${Array.from({length: totalPages}, (_, i) => 
            `<button onclick="changePage(${i + 1})" ${currentPage === (i + 1) ? 'class="active"' : ''}>
                ${i + 1}
            </button>`
        ).join('')}
        <button onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>
    `;
}

// Handle page change
function changePage(page) {
    currentPage = page;
    updateTransactionsTable();
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    updateDashboard();
    updateTransactionsTable();
});
