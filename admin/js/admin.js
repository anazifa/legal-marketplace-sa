// Admin Panel JavaScript

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const modalBackdrop = document.getElementById('modal-backdrop');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('[data-section]');

// State
let currentSection = 'dashboard';
let userData = [];
let projectsData = [];
let categoriesData = [];
let skillsData = [];

// Case Management
let currentPage = 1;
const itemsPerPage = 10;
let totalCases = 0;
let cases = [];

// Navigation
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.add('hidden');
        if (section.id === `${sectionId}-section`) {
            section.classList.remove('hidden');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active-nav');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active-nav');
        }
    });

    currentSection = sectionId;
    updateSectionData(sectionId);
}

// Event Listeners
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        showSection(section);
    });
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    modalBackdrop.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    modalBackdrop.classList.add('hidden');
}

// API Calls
async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function updateSectionData(section) {
    switch (section) {
        case 'dashboard':
            await updateDashboardData();
            break;
        case 'users':
            await updateUsersData();
            break;
        case 'projects':
            await updateProjectsData();
            break;
        case 'categories':
            await updateCategoriesData();
            break;
        case 'skills':
            await updateSkillsData();
            break;
        case 'reports':
            await updateReportsData();
            break;
    }
}

// Dashboard Functions
async function updateDashboardData() {
    const stats = await fetchData('dashboard/stats');
    if (stats) {
        // Update Quick Stats
        document.getElementById('active-firms').textContent = stats.activeFirms;
        document.getElementById('active-clients').textContent = stats.activeClients;
        document.getElementById('active-cases').textContent = stats.activeCases;
        document.getElementById('monthly-revenue').textContent = `$${stats.monthlyRevenue.toLocaleString()}`;

        // Update Secondary Stats
        document.getElementById('pending-cases').textContent = stats.pendingCases;
        document.getElementById('pending-payments').textContent = stats.pendingPayments;
        document.getElementById('new-clients').textContent = stats.newClients;
        document.getElementById('new-firms').textContent = stats.newFirms;

        // Update Activity Feed
        updateActivityFeed(stats.recentActivity);

        // Update Charts
        updateMonthlyTrendsChart(stats.monthlyTrends);
        updateCaseDistributionChart(stats.caseDistribution);

        // Update System Alerts
        updateSystemAlerts(stats.systemAlerts);
    }
}

function updateActivityFeed(activities) {
    const feed = document.getElementById('activity-feed');
    feed.innerHTML = '';

    activities.forEach(activity => {
        const div = document.createElement('div');
        div.className = 'flex items-start space-x-3 p-3 bg-gray-50 rounded-lg';
        
        const iconClass = getActivityIcon(activity.type);
        div.innerHTML = `
            <div class="flex-shrink-0">
                <i class="${iconClass}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-800">${activity.message}</p>
                <p class="text-xs text-gray-500">${formatTimeAgo(activity.timestamp)}</p>
            </div>
        `;
        feed.appendChild(div);
    });
}

function getActivityIcon(type) {
    switch (type) {
        case 'new_client':
            return 'fas fa-user-plus text-green-500';
        case 'new_firm':
            return 'fas fa-building text-blue-500';
        case 'new_case':
            return 'fas fa-gavel text-yellow-500';
        case 'payment':
            return 'fas fa-dollar-sign text-purple-500';
        default:
            return 'fas fa-info-circle text-gray-500';
    }
}

function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleDateString();
}

function updateMonthlyTrendsChart(data) {
    const ctx = document.getElementById('monthly-trends-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'New Clients',
                    data: data.newClients,
                    borderColor: 'rgb(34, 197, 94)',
                    tension: 0.1
                },
                {
                    label: 'New Cases',
                    data: data.newCases,
                    borderColor: 'rgb(234, 179, 8)',
                    tension: 0.1
                },
                {
                    label: 'Revenue',
                    data: data.revenue,
                    borderColor: 'rgb(168, 85, 247)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCaseDistributionChart(data) {
    const ctx = document.getElementById('case-distribution-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(234, 179, 8)',
                    'rgb(239, 68, 68)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateSystemAlerts(alerts) {
    const alertsContainer = document.getElementById('system-alerts');
    alertsContainer.innerHTML = '';

    alerts.forEach(alert => {
        const div = document.createElement('div');
        div.className = `p-4 rounded-lg ${getAlertClass(alert.severity)}`;
        div.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="${getAlertIcon(alert.severity)}"></i>
                </div>
                <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium">${alert.title}</h3>
                    <p class="mt-1 text-sm">${alert.message}</p>
                    <div class="mt-2 text-xs text-gray-500">${formatTimeAgo(alert.timestamp)}</div>
                </div>
            </div>
        `;
        alertsContainer.appendChild(div);
    });
}

function getAlertClass(severity) {
    switch (severity) {
        case 'error':
            return 'bg-red-50 text-red-800';
        case 'warning':
            return 'bg-yellow-50 text-yellow-800';
        case 'success':
            return 'bg-green-50 text-green-800';
        default:
            return 'bg-blue-50 text-blue-800';
    }
}

function getAlertIcon(severity) {
    switch (severity) {
        case 'error':
            return 'fas fa-exclamation-circle text-red-500';
        case 'warning':
            return 'fas fa-exclamation-triangle text-yellow-500';
        case 'success':
            return 'fas fa-check-circle text-green-500';
        default:
            return 'fas fa-info-circle text-blue-500';
    }
}

// Users Functions
async function updateUsersData() {
    userData = await fetchData('users');
    if (userData) {
        renderUsersTable(userData);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                        <img class="h-10 w-10 rounded-full" src="${user.avatar_url || '/logo.svg'}" alt="">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.full_name}</div>
                        <div class="text-sm text-gray-500">${user.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-800">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(user.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editUser('${user.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getRoleColor(role) {
    switch (role) {
        case 'admin':
            return 'red';
        case 'lawyer':
            return 'blue';
        case 'client':
            return 'green';
        default:
            return 'gray';
    }
}

// Projects Functions
async function updateProjectsData() {
    projectsData = await fetchData('projects');
    if (projectsData) {
        renderProjectsTable(projectsData);
    }
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-table-body');
    tbody.innerHTML = '';

    projects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${project.title}</div>
                <div class="text-sm text-gray-500">${project.description.substring(0, 50)}...</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${project.client_name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(project.status)}-100 text-${getStatusColor(project.status)}-800">
                    ${project.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                $${project.budget_min} - $${project.budget_max}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewProject('${project.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                <button onclick="deleteProject('${project.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'open':
            return 'green';
        case 'in_progress':
            return 'blue';
        case 'completed':
            return 'purple';
        case 'cancelled':
            return 'red';
        default:
            return 'gray';
    }
}

// Categories Functions
async function updateCategoriesData() {
    categoriesData = await fetchData('categories');
    if (categoriesData) {
        renderCategories(categoriesData);
    }
}

function renderCategories(categories) {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow-md p-6';
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="text-lg font-semibold">${category.name}</h3>
                <div class="flex gap-2">
                    <button onclick="editCategory('${category.id}')" class="text-indigo-600 hover:text-indigo-900">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCategory('${category.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="text-gray-600 mt-2">${category.description}</p>
            <div class="mt-4">
                <span class="text-sm text-gray-500">${category.skills_count || 0} skills</span>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Skills Functions
async function updateSkillsData() {
    skillsData = await fetchData('skills');
    if (skillsData) {
        renderSkills(skillsData);
    }
}

function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    skills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2';
        div.innerHTML = `
            <span>${skill.name}</span>
            <button onclick="editSkill('${skill.id}')" class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteSkill('${skill.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

// Reports Functions
async function updateReportsData() {
    const reportsData = await fetchData('reports');
    if (reportsData) {
        updateRevenueReportChart(reportsData.revenue);
        updateUserActivityChart(reportsData.userActivity);
        updateProjectStatsChart(reportsData.projectStats);
        updateCategoryDistributionChart(reportsData.categoryDistribution);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
});

// Form Submissions
document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('add-user-modal');
            updateUsersData();
        }
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Initialize case management
async function initializeCaseManagement() {
    await loadCases();
    await loadPracticeAreas();
    await loadUsers();
    setupCaseEventListeners();
}

// Load cases with filters
async function loadCases() {
    try {
        const filters = {
            status: document.getElementById('case-status-filter').value,
            practiceArea: document.getElementById('practice-area-filter').value,
            dateFrom: document.getElementById('date-from').value,
            dateTo: document.getElementById('date-to').value,
            search: document.getElementById('case-search').value,
            page: currentPage,
            limit: itemsPerPage
        };

        const response = await fetch('/api/admin/cases?' + new URLSearchParams(filters));
        const data = await response.json();
        
        cases = data.cases;
        totalCases = data.total;
        
        renderCasesTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading cases:', error);
        showNotification('Error loading cases', 'error');
    }
}

// Render cases table
function renderCasesTable() {
    const tbody = document.getElementById('cases-table-body');
    tbody.innerHTML = '';

    cases.forEach(caseItem => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                ${caseItem.id.substring(0, 8)}...
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                ${escapeHtml(caseItem.title)}
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                ${escapeHtml(caseItem.client_name)}
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                ${escapeHtml(caseItem.lawyer_name || 'Unassigned')}
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(caseItem.status)}">
                    ${caseItem.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                ${escapeHtml(caseItem.practice_area)}
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                ${new Date(caseItem.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                <button onclick="editCase('${caseItem.id}')" class="text-indigo-600 hover:text-indigo-900">
                    Edit
                </button>
                <button onclick="deleteCase('${caseItem.id}')" class="ml-4 text-red-600 hover:text-red-900">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Get status class for styling
function getStatusClass(status) {
    const classes = {
        pending: 'bg-yellow-100 text-yellow-800',
        active: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

// Load practice areas
async function loadPracticeAreas() {
    try {
        const response = await fetch('/api/admin/practice-areas');
        const areas = await response.json();
        
        const select = document.getElementById('practice-area-filter');
        const modalSelect = document.getElementById('case-practice-area');
        
        areas.forEach(area => {
            const option = new Option(area.name, area.id);
            select.add(option.cloneNode(true));
            modalSelect.add(option);
        });
    } catch (error) {
        console.error('Error loading practice areas:', error);
        showNotification('Error loading practice areas', 'error');
    }
}

// Load users for client and lawyer dropdowns
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        const clientSelect = document.getElementById('case-client');
        const lawyerSelect = document.getElementById('case-lawyer');
        
        users.forEach(user => {
            const option = new Option(`${user.full_name} (${user.email})`, user.id);
            if (user.role === 'client') {
                clientSelect.add(option);
            } else if (user.role === 'lawyer') {
                lawyerSelect.add(option.cloneNode(true));
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Setup event listeners
function setupCaseEventListeners() {
    // Filter changes
    document.getElementById('case-status-filter').addEventListener('change', loadCases);
    document.getElementById('practice-area-filter').addEventListener('change', loadCases);
    document.getElementById('date-from').addEventListener('change', loadCases);
    document.getElementById('date-to').addEventListener('change', loadCases);
    
    // Search input with debounce
    const searchInput = document.getElementById('case-search');
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadCases, 300);
    });

    // Form submission
    document.getElementById('case-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCase();
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadCases();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage * itemsPerPage < totalCases) {
            currentPage++;
            loadCases();
        }
    });
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(totalCases / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalCases);

    document.getElementById('pagination-start').textContent = start;
    document.getElementById('pagination-end').textContent = end;
    document.getElementById('pagination-total').textContent = totalCases;

    const numbers = document.getElementById('pagination-numbers');
    numbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = `btn-pagination ${i === currentPage ? 'active' : ''}`;
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage = i;
            loadCases();
        });
        numbers.appendChild(button);
    }

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Edit case
async function editCase(id) {
    try {
        const response = await fetch(`/api/admin/cases/${id}`);
        const caseData = await response.json();
        
        document.getElementById('case-id').value = caseData.id;
        document.getElementById('case-title').value = caseData.title;
        document.getElementById('case-description').value = caseData.description;
        document.getElementById('case-client').value = caseData.client_id;
        document.getElementById('case-lawyer').value = caseData.lawyer_id || '';
        document.getElementById('case-practice-area').value = caseData.practice_area;
        document.getElementById('case-status').value = caseData.status;
        document.getElementById('case-priority').value = caseData.priority;
        document.getElementById('case-deadline').value = caseData.deadline?.split('Z')[0] || '';
        document.getElementById('budget-min').value = caseData.budget_range?.min || '';
        document.getElementById('budget-max').value = caseData.budget_range?.max || '';
        
        // Update attachments list
        const attachmentList = document.getElementById('attachment-list');
        attachmentList.innerHTML = '';
        if (caseData.attachments?.length) {
            caseData.attachments.forEach(attachment => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between py-2';
                div.innerHTML = `
                    <span>${escapeHtml(attachment.name)}</span>
                    <button type="button" onclick="removeAttachment('${attachment.id}')" class="text-red-600 hover:text-red-900">
                        Remove
                    </button>
                `;
                attachmentList.appendChild(div);
            });
        }

        document.getElementById('case-modal-title').textContent = 'Edit Case';
        openModal('add-case-modal');
    } catch (error) {
        console.error('Error loading case details:', error);
        showNotification('Error loading case details', 'error');
    }
}

// Save case
async function saveCase() {
    try {
        const caseId = document.getElementById('case-id').value;
        const formData = new FormData();
        
        // Add form fields
        formData.append('title', document.getElementById('case-title').value);
        formData.append('description', document.getElementById('case-description').value);
        formData.append('client_id', document.getElementById('case-client').value);
        formData.append('lawyer_id', document.getElementById('case-lawyer').value);
        formData.append('practice_area', document.getElementById('case-practice-area').value);
        formData.append('status', document.getElementById('case-status').value);
        formData.append('priority', document.getElementById('case-priority').value);
        formData.append('deadline', document.getElementById('case-deadline').value);
        
        // Add budget range
        const budgetRange = {
            min: parseFloat(document.getElementById('budget-min').value) || null,
            max: parseFloat(document.getElementById('budget-max').value) || null
        };
        formData.append('budget_range', JSON.stringify(budgetRange));
        
        // Add attachments
        const attachments = document.getElementById('case-attachments').files;
        for (let i = 0; i < attachments.length; i++) {
            formData.append('attachments', attachments[i]);
        }

        const url = caseId ? `/api/admin/cases/${caseId}` : '/api/admin/cases';
        const method = caseId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            body: formData
        });

        if (!response.ok) throw new Error('Failed to save case');

        closeModal('add-case-modal');
        showNotification('Case saved successfully', 'success');
        loadCases();
    } catch (error) {
        console.error('Error saving case:', error);
        showNotification('Error saving case', 'error');
    }
}

// Delete case
async function deleteCase(id) {
    if (!confirm('Are you sure you want to delete this case?')) return;

    try {
        const response = await fetch(`/api/admin/cases/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete case');

        showNotification('Case deleted successfully', 'success');
        loadCases();
    } catch (error) {
        console.error('Error deleting case:', error);
        showNotification('Error deleting case', 'error');
    }
}

// Remove attachment
async function removeAttachment(attachmentId) {
    try {
        const caseId = document.getElementById('case-id').value;
        const response = await fetch(`/api/admin/cases/${caseId}/attachments/${attachmentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to remove attachment');

        // Refresh the case details
        await editCase(caseId);
    } catch (error) {
        console.error('Error removing attachment:', error);
        showNotification('Error removing attachment', 'error');
    }
}

// Utility function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize case management when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('case-management')) {
        initializeCaseManagement();
    }
}); 