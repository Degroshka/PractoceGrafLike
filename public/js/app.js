// Global variables
let currentDashboardId = null;

// Auth functions
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showMainContent() {
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// Navigation functions
function showDataSources() {
    document.getElementById('dataSourcesSection').style.display = 'block';
    document.getElementById('dashboardsSection').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'none';
    loadDataSources();
}

function showDashboards() {
    document.getElementById('dataSourcesSection').style.display = 'none';
    document.getElementById('dashboardsSection').style.display = 'block';
    document.getElementById('dashboard-view').style.display = 'none';
    loadDashboards();
}

function showAddDataSourceForm() {
    const form = document.getElementById('addDataSourceForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function showAddDashboardForm() {
    const form = document.getElementById('addDashboardForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Utility functions
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Auth API functions
async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Registration failed');
        }

        showMessage('Registration successful! Please login.', 'success');
        showLoginForm();
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(error.message, 'error');
    }
}

async function login() {
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Login failed');
        }

        if (!result.success) {
            throw new Error(result.message || 'Login failed');
        }

        if (!result.token) {
            throw new Error('Invalid response from server: missing token');
        }

        localStorage.setItem('token', result.token);
        showMainContent();
        loadDataSources();
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('authForms').style.display = 'block';
    showLoginForm();
}

// Data Source API functions
async function loadDataSources() {
    try {
        const response = await fetch('/api/data-sources', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to load data sources');
        }

        const dataSourcesList = document.getElementById('dataSourcesList');
        dataSourcesList.innerHTML = '';

        if (!Array.isArray(result.data)) {
            throw new Error('Invalid data format received from server');
        }

        result.data.forEach(ds => {
            const li = document.createElement('li');
            li.className = 'data-source-item';
            li.innerHTML = `
                <div class="data-source-info">
                    <h3>${ds.name}</h3>
                    <p>Type: ${ds.type}</p>
                    <p>Host: ${ds.host}</p>
                    <p>Database: ${ds.db_name}</p>
                </div>
                <div class="data-source-actions">
                    <button onclick="testConnection(${ds.id})">Test Connection</button>
                    <button onclick="deleteDataSource(${ds.id})">Delete</button>
                </div>
            `;
            dataSourcesList.appendChild(li);
        });

        // Update data source select in dashboard
        const dashboardDataSource = document.getElementById('dashboardDataSource');
        if (dashboardDataSource) {
            dashboardDataSource.innerHTML = '<option value="">Select a data source</option>';
            result.data.forEach(ds => {
                const option = document.createElement('option');
                option.value = ds.id;
                option.textContent = ds.name;
                dashboardDataSource.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading data sources:', error);
        showMessage(error.message, 'error');
    }
}

async function addDataSource() {
    try {
        // Get form values
        const name = document.getElementById('dsName').value.trim();
        const type = document.getElementById('dsType').value;
        const host = document.getElementById('dsHost').value.trim();
        const port = parseInt(document.getElementById('dsPort').value);
        const dbName = document.getElementById('dsDatabase').value.trim();
        const username = document.getElementById('dsUsername').value.trim();
        const password = document.getElementById('dsPassword').value;
        const useSsl = document.getElementById('dsUseSsl').checked;

        // Validate required fields
        if (!name || !type || !host || !port || !dbName || !username || !password) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        const dataSource = {
            name,
            type,
            connection_type: 'local',
            host,
            port,
            db_name: dbName,
            username,
            password,
            use_ssl: useSsl
        };

        console.log('Sending data source:', dataSource); // Debug log

        const response = await fetch('/api/data-sources', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(dataSource)
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to add data source');
        }

        showMessage('Data source added successfully', 'success');
        document.getElementById('addDataSourceForm').style.display = 'none';
        
        // Clear form
        document.getElementById('dsName').value = '';
        document.getElementById('dsType').value = 'mysql';
        document.getElementById('dsHost').value = '';
        document.getElementById('dsPort').value = '';
        document.getElementById('dsDatabase').value = '';
        document.getElementById('dsUsername').value = '';
        document.getElementById('dsPassword').value = '';
        document.getElementById('dsUseSsl').checked = false;

        loadDataSources();
    } catch (error) {
        console.error('Error adding data source:', error);
        showMessage(error.message, 'error');
    }
}

async function deleteDataSource(id) {
    if (!confirm('Are you sure you want to delete this data source?')) {
        return;
    }

    try {
        const response = await fetch(`/api/data-sources/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete data source');
        }

        showMessage('Data source deleted successfully', 'success');
        loadDataSources();
    } catch (error) {
        console.error('Error deleting data source:', error);
        showMessage(error.message, 'error');
    }
}

async function testConnection(id) {
    try {
        const response = await fetch(`/api/data-sources/${id}/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Connection test failed');
        }

        showMessage('Connection successful', 'success');
    } catch (error) {
        console.error('Error testing connection:', error);
        showMessage(error.message, 'error');
    }
}

// Dashboard API functions
async function loadDashboards() {
    try {
        const response = await fetch('/api/dashboards', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to load dashboards');
        }

        const dashboardsList = document.getElementById('dashboardsList');
        dashboardsList.innerHTML = '';

        if (!Array.isArray(result.data)) {
            throw new Error('Invalid data format received from server');
        }

        result.data.forEach(dashboard => {
            const li = document.createElement('li');
            li.className = 'dashboard-item';
            li.innerHTML = `
                <div class="dashboard-info">
                    <h3>${dashboard.name}</h3>
                    <p>${dashboard.description || 'No description'}</p>
                </div>
                <div class="dashboard-actions">
                    <button onclick="viewDashboard(${dashboard.id})">View</button>
                    <button onclick="deleteDashboard(${dashboard.id})">Delete</button>
                </div>
            `;
            dashboardsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading dashboards:', error);
        showMessage(error.message, 'error');
    }
}

async function addDashboard() {
    try {
        const dashboard = {
            name: document.getElementById('dashboardName').value,
            description: document.getElementById('dashboardDescription').value,
            data_source_id: document.getElementById('dashboardDataSource').value
        };

        if (!dashboard.name || !dashboard.data_source_id) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        const response = await fetch('/api/dashboards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(dashboard)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to create dashboard');
        }

        showMessage('Dashboard created successfully', 'success');
        document.getElementById('addDashboardForm').style.display = 'none';
        loadDashboards();
    } catch (error) {
        console.error('Error creating dashboard:', error);
        showMessage(error.message, 'error');
    }
}

async function deleteDashboard(id) {
    if (!confirm('Are you sure you want to delete this dashboard?')) {
        return;
    }

    try {
        const response = await fetch(`/api/dashboards/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to delete dashboard');
        }

        showMessage('Dashboard deleted successfully', 'success');
        loadDashboards();
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        showMessage(error.message, 'error');
    }
}

async function viewDashboard(id) {
    try {
        if (!id) {
            throw new Error('Dashboard ID is required');
        }

        document.getElementById('dashboardsSection').style.display = 'none';
        document.getElementById('dashboard-view').style.display = 'block';
        currentDashboardId = id;

        const response = await fetch(`/api/dashboards/${id}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to load dashboard');
        }

        if (!result.data) {
            throw new Error('Invalid response from server');
        }

        // Load dashboard data and visualizations
        const dashboard = result.data;
        
        // Load data sources for the select
        const dataSourceSelect = document.getElementById('data-source-select');
        dataSourceSelect.innerHTML = '<option value="">Select Data Source</option>';
        
        const dataSourcesResponse = await fetch('/api/data-sources', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        let dataSourcesResult;
        try {
            dataSourcesResult = await dataSourcesResponse.json();
        } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
        }

        if (!dataSourcesResponse.ok) {
            throw new Error(dataSourcesResult.message || 'Failed to load data sources');
        }

        if (!dataSourcesResult.success) {
            throw new Error(dataSourcesResult.message || 'Failed to load data sources');
        }

        if (!Array.isArray(dataSourcesResult.data)) {
            throw new Error('Invalid response from server');
        }

        dataSourcesResult.data.forEach(ds => {
            const option = document.createElement('option');
            option.value = ds.id;
            option.textContent = ds.name;
            if (ds.id === dashboard.data_source_id) {
                option.selected = true;
            }
            dataSourceSelect.appendChild(option);
        });

        // Add event listener for data source selection
        dataSourceSelect.addEventListener('change', async function() {
            const selectedDataSourceId = this.value;
            const tableSelect = document.getElementById('table-select');
            const columnsSelect = document.getElementById('columns-select');
            const chartTypeSelect = document.getElementById('chart-type-select');
            const createVisualizationBtn = document.getElementById('create-visualization-btn');

            // Reset dependent selects
            tableSelect.innerHTML = '<option value="">Select Table</option>';
            columnsSelect.innerHTML = '<option value="">Select Columns</option>';
            chartTypeSelect.innerHTML = '<option value="">Select Chart Type</option>';
            
            // Disable all dependent controls initially
            tableSelect.disabled = true;
            columnsSelect.disabled = true;
            chartTypeSelect.disabled = true;
            createVisualizationBtn.disabled = true;

            if (selectedDataSourceId) {
                try {
                    const tablesResponse = await fetch('/api/data-sources/tables', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({
                            data_source_id: selectedDataSourceId
                        })
                    });

                    let tablesResult;
                    try {
                        tablesResult = await tablesResponse.json();
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        throw new Error('Invalid response from server');
                    }

                    if (!tablesResponse.ok) {
                        throw new Error(tablesResult.message || `HTTP error! status: ${tablesResponse.status}`);
                    }

                    if (!tablesResult.success) {
                        throw new Error(tablesResult.message || 'Failed to load tables');
                    }

                    if (!Array.isArray(tablesResult.data)) {
                        throw new Error('Invalid response from server');
                    }

                    // Enable table select and populate with tables
                    tableSelect.disabled = false;
                    tablesResult.data.forEach(table => {
                        const option = document.createElement('option');
                        option.value = table;
                        option.textContent = table;
                        tableSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading tables:', error);
                    showMessage(error.message, 'error');
                }
            }
        });

        // Add event listener for table selection
        const tableSelect = document.getElementById('table-select');
        tableSelect.addEventListener('change', async function() {
            const selectedTable = this.value;
            const selectedDataSourceId = dataSourceSelect.value;
            const columnsSelect = document.getElementById('columns-select');
            const chartTypeSelect = document.getElementById('chart-type-select');
            const createVisualizationBtn = document.getElementById('create-visualization-btn');

            // Reset dependent selects
            columnsSelect.innerHTML = '<option value="">Select Columns</option>';
            chartTypeSelect.innerHTML = '<option value="">Select Chart Type</option>';
            
            // Disable all dependent controls initially
            columnsSelect.disabled = true;
            chartTypeSelect.disabled = true;
            createVisualizationBtn.disabled = true;

            if (selectedTable && selectedDataSourceId) {
                try {
                    const columnsResponse = await fetch('/api/data-sources/columns', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({
                            data_source_id: selectedDataSourceId,
                            table: selectedTable
                        })
                    });

                    let columnsResult;
                    try {
                        columnsResult = await columnsResponse.json();
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        throw new Error('Invalid response from server');
                    }

                    if (!columnsResponse.ok) {
                        throw new Error(columnsResult.message || `HTTP error! status: ${columnsResponse.status}`);
                    }

                    if (!columnsResult.success) {
                        throw new Error(columnsResult.message || 'Failed to load columns');
                    }

                    if (!Array.isArray(columnsResult.data)) {
                        throw new Error('Invalid response from server');
                    }

                    // Enable columns select and populate with columns
                    columnsSelect.disabled = false;
                    columnsResult.data.forEach(column => {
                        const option = document.createElement('option');
                        option.value = column;
                        option.textContent = column;
                        columnsSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading columns:', error);
                    showMessage(error.message, 'error');
                }
            }
        });

        // Add event listener for columns selection
        const columnsSelect = document.getElementById('columns-select');
        columnsSelect.addEventListener('change', function() {
            const selectedColumns = Array.from(this.selectedOptions).map(option => option.value);
            const chartTypeSelect = document.getElementById('chart-type-select');
            const createVisualizationBtn = document.getElementById('create-visualization-btn');

            // Reset chart type select
            chartTypeSelect.innerHTML = '<option value="">Select Chart Type</option>';
            
            // Disable dependent controls initially
            chartTypeSelect.disabled = true;
            createVisualizationBtn.disabled = true;

            if (selectedColumns.length > 0) {
                // Enable chart type select and populate with available types
                chartTypeSelect.disabled = false;
                const availableTypes = getAvailableChartTypes(selectedColumns);
                availableTypes.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                    chartTypeSelect.appendChild(option);
                });
            }
        });

        // Add event listener for chart type selection
        const chartTypeSelect = document.getElementById('chart-type-select');
        chartTypeSelect.addEventListener('change', function() {
            const createVisualizationBtn = document.getElementById('create-visualization-btn');
            createVisualizationBtn.disabled = !this.value;
        });

        // Add event listener for create visualization button
        const createVisualizationBtn = document.getElementById('create-visualization-btn');
        createVisualizationBtn.addEventListener('click', async function() {
            const selectedDataSourceId = dataSourceSelect.value;
            const selectedTable = tableSelect.value;
            const selectedColumns = Array.from(columnsSelect.selectedOptions).map(option => option.value);
            const selectedChartType = chartTypeSelect.value;

            if (!selectedDataSourceId || !selectedTable || selectedColumns.length === 0 || !selectedChartType) {
                showMessage('Please select all required fields', 'error');
                return;
            }

            try {
                await createVisualization(selectedDataSourceId, selectedTable, selectedColumns, selectedChartType);
            } catch (error) {
                console.error('Error creating visualization:', error);
                showMessage(error.message, 'error');
            }
        });

        // If dashboard has a data source, trigger the change event
        if (dashboard.data_source_id) {
            dataSourceSelect.value = dashboard.data_source_id;
            dataSourceSelect.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error('Error viewing dashboard:', error);
        showMessage(error.message, 'error');
    }
}

function getAvailableChartTypes(selectedColumns) {
    const types = ['table'];
    
    if (selectedColumns.length >= 1) {
        types.push('pie', 'doughnut');
    }
    
    if (selectedColumns.length >= 2) {
        types.push('bar', 'line');
    }
    
    return types;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        showMainContent();
        loadDataSources();
    } else {
        showLoginForm();
    }
});

// Add Chart.js to the page
function loadChartJS() {
    if (!document.getElementById('chartjs-script')) {
        const script = document.createElement('script');
        script.id = 'chartjs-script';
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(script);
    }
}

// Create a new visualization
async function createVisualization(dataSourceId, table, columns, type, options = {}) {
    try {
        // Get table data
        const response = await fetch('/api/data-sources/table-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                data_source_id: dataSourceId,
                table_name: table,
                limit: 0 // Get all data
            })
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        if (!result.data || !result.data.rows) {
            throw new Error('Invalid data structure received from server');
        }

        // Create visualization container
        const container = document.getElementById('visualization-container');
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        container.appendChild(chartContainer);

        // Create canvas
        const ctx = document.createElement('canvas');
        chartContainer.appendChild(ctx);

        // Prepare data based on visualization type
        const chartData = prepareChartData(result.data.rows, columns, type, options);

        // Create chart
        new Chart(ctx, {
            type: type,
            data: chartData,
            options: getChartOptions(type, options)
        });

    } catch (error) {
        console.error('Error creating visualization:', error);
        showMessage(error.message, 'error');
    }
}

function prepareChartData(data, columns, type, options) {
    const datasets = [];
    const labels = new Set();

    // For pie and doughnut charts, we use the first column as labels and second as values
    if (type === 'pie' || type === 'doughnut') {
        const labelColumn = columns[0];
        const valueColumn = columns[1];

        const valueCounts = {};
        data.forEach(row => {
            const label = row[labelColumn];
            const value = parseFloat(row[valueColumn]) || 0;
            valueCounts[label] = (valueCounts[label] || 0) + value;
            labels.add(label);
        });

        return {
            labels: Array.from(labels),
            datasets: [{
                data: Object.values(valueCounts),
                backgroundColor: Array.from(labels).map(() => getRandomColor())
            }]
        };
    }

    // For bar and line charts
    columns.forEach((column, index) => {
        const dataset = {
            label: column,
            data: data.map(row => parseFloat(row[column]) || 0),
            backgroundColor: getRandomColor(),
            borderColor: getRandomColor(),
            borderWidth: 1
        };
        datasets.push(dataset);
    });

    // Use first column as labels for x-axis
    const labelColumn = columns[0];
    data.forEach(row => labels.add(row[labelColumn]));

    return {
        labels: Array.from(labels),
        datasets: datasets
    };
}

function getChartOptions(type, options) {
    const baseOptions = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: options.title || 'Visualization'
            },
            legend: {
                display: true,
                position: 'top'
            }
        }
    };

    if (type === 'bar') {
        baseOptions.scales = {
            y: {
                beginAtZero: true
            }
        };
    }

    return baseOptions;
}

// Helper function to generate random colors
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Example usage:
// createVisualization(1, 'users', ['name', 'age', 'salary'], 'bar', { title: 'User Statistics' });
// createVisualization(1, 'sales', ['month', 'revenue'], 'line', { title: 'Monthly Revenue' });
// createVisualization(1, 'products', ['category', 'count'], 'pie', { title: 'Products by Category' });

// Handle data source selection
document.getElementById('data-source-select').addEventListener('change', async function() {
    const dataSourceId = this.value;
    const tableSelect = document.getElementById('table-select');
    const chartTypeSelect = document.getElementById('chart-type-select');
    const createBtn = document.getElementById('create-visualization-btn');

    if (!dataSourceId) {
        tableSelect.disabled = true;
        chartTypeSelect.disabled = true;
        createBtn.disabled = true;
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/datasources/${dataSourceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get data source details');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        // Get tables from the data source
        const tablesResponse = await fetch('/api/datasources/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ data_source_id: dataSourceId })
        });

        if (!tablesResponse.ok) {
            throw new Error('Failed to get tables');
        }

        const tablesResult = await tablesResponse.json();
        if (!tablesResult.success) {
            throw new Error(tablesResult.message);
        }

        // Update table select
        tableSelect.innerHTML = '<option value="">Select Table</option>';
        tablesResult.data.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            tableSelect.appendChild(option);
        });

        // Enable table select
        tableSelect.disabled = false;
        chartTypeSelect.disabled = false;
        createBtn.disabled = false;

        // Add event listener for table selection
        tableSelect.addEventListener('change', async function() {
            const selectedTable = this.value;
            if (!selectedTable) {
                return;
            }

            try {
                // Get columns for selected table
                const columnsResponse = await fetch('/api/datasources/table-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        data_source_id: dataSourceId,
                        table_name: selectedTable,
                        limit: 0 // Получаем только структуру таблицы
                    })
                });

                if (!columnsResponse.ok) {
                    throw new Error('Failed to get table columns');
                }

                const columnsResult = await columnsResponse.json();
                if (!columnsResult.success) {
                    throw new Error(columnsResult.message);
                }

                // Get or create columns select
                let columnsSelect = document.getElementById('columns-select');
                if (!columnsSelect) {
                    // Create columns select if it doesn't exist
                    const columnsDiv = document.createElement('div');
                    columnsDiv.className = 'form-group';
                    columnsDiv.innerHTML = `
                        <label for="columns-select">Columns:</label>
                        <select id="columns-select" multiple class="form-control" disabled>
                            <option value="">Select Columns</option>
                        </select>
                    `;
                    tableSelect.parentNode.insertBefore(columnsDiv, tableSelect.nextSibling);
                    columnsSelect = document.getElementById('columns-select');
                }

                // Update columns select
                columnsSelect.innerHTML = '<option value="">Select Columns</option>';
                if (columnsResult.data && columnsResult.data.columns) {
                    columnsResult.data.columns.forEach(column => {
                        const option = document.createElement('option');
                        option.value = column.name;
                        option.textContent = column.name;
                        option.dataset.type = column.type;
                        columnsSelect.appendChild(option);
                    });
                }

                // Enable columns select
                columnsSelect.disabled = false;

                // Add event listener for column selection
                columnsSelect.addEventListener('change', function() {
                    const selectedColumns = Array.from(this.selectedOptions);
                    const chartType = document.getElementById('chart-type-select').value;
                    
                    // Проверяем совместимость выбранных колонок с типом графика
                    const isCompatible = checkChartCompatibility(selectedColumns, chartType);
                    
                    // Обновляем доступные типы графиков
                    updateAvailableChartTypes(selectedColumns);
                    
                    // Enable create button only if columns and chart type are selected and compatible
                    document.getElementById('create-visualization-btn').disabled = 
                        selectedColumns.length === 0 || !chartType || !isCompatible;
                });

                // Add event listener for chart type selection
                document.getElementById('chart-type-select').addEventListener('change', function() {
                    const selectedColumns = Array.from(columnsSelect.selectedOptions);
                    const isCompatible = checkChartCompatibility(selectedColumns, this.value);
                    document.getElementById('create-visualization-btn').disabled = 
                        selectedColumns.length === 0 || !this.value || !isCompatible;
                });

                // Функция для проверки совместимости колонок с типом графика
                function checkChartCompatibility(selectedColumns, chartType) {
                    if (!selectedColumns.length || !chartType) return false;

                    const columnTypes = selectedColumns.map(col => col.dataset.type.toLowerCase());
                    
                    switch (chartType) {
                        case 'table':
                            return true; // Таблица поддерживает любые типы данных
                        case 'bar':
                        case 'line':
                            // Для bar и line нужны числовые данные
                            return columnTypes.some(type => 
                                type.includes('int') || 
                                type.includes('float') || 
                                type.includes('double') || 
                                type.includes('decimal')
                            );
                        case 'pie':
                        case 'doughnut':
                            // Для pie и doughnut нужны категориальные данные
                            return columnTypes.some(type => 
                                type.includes('char') || 
                                type.includes('text') || 
                                type.includes('varchar')
                            );
                        default:
                            return false;
                    }
                }

                // Функция для обновления доступных типов графиков
                function updateAvailableChartTypes(selectedColumns) {
                    const chartTypeSelect = document.getElementById('chart-type-select');
                    const columnTypes = selectedColumns.map(col => col.dataset.type.toLowerCase());
                    
                    // Всегда доступна таблица
                    chartTypeSelect.innerHTML = '<option value="">Select Chart Type</option><option value="table">Table</option>';
                    
                    // Проверяем наличие числовых данных для bar и line
                    const hasNumericData = columnTypes.some(type => 
                        type.includes('int') || 
                        type.includes('float') || 
                        type.includes('double') || 
        type.includes('decimal')
                    );
                    
                    if (hasNumericData) {
                        chartTypeSelect.innerHTML += '<option value="bar">Bar Chart</option><option value="line">Line Chart</option>';
                    }
                    
                    // Проверяем наличие категориальных данных для pie и doughnut
                    const hasCategoricalData = columnTypes.some(type => 
                        type.includes('char') || 
                        type.includes('text') || 
                        type.includes('varchar')
                    );
                    
                    if (hasCategoricalData) {
                        chartTypeSelect.innerHTML += '<option value="pie">Pie Chart</option><option value="doughnut">Doughnut Chart</option>';
                    }
                }

                // Add event listener for create visualization button
                document.getElementById('create-visualization-btn').addEventListener('click', async function() {
                    const selectedTable = tableSelect.value;
                    const selectedColumns = Array.from(columnsSelect.selectedOptions).map(option => option.value);
                    const chartType = document.getElementById('chart-type-select').value;

                    if (!selectedTable || selectedColumns.length === 0 || !chartType) {
                        showMessage('Please select a table, columns and chart type', 'error');
                        return;
                    }

                    try {
                        // Проверяем, есть ли данные в кэше
                        const cacheKey = `${dataSourceId}_${selectedTable}_${selectedColumns.join('_')}`;
                        let data;
                        
                        if (window.visualizationCache && window.visualizationCache[cacheKey]) {
                            data = window.visualizationCache[cacheKey];
                        } else {
                            const response = await fetch('/api/datasources/table-data', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                    data_source_id: dataSourceId,
                                    table_name: selectedTable,
                                    columns: selectedColumns,
                                    limit: 1000 // Ограничиваем количество записей для производительности
                                })
                            });

                            if (!response.ok) {
                                throw new Error('Failed to get table data');
                            }

                            const result = await response.json();
                            if (!result.success) {
                                throw new Error(result.message);
                            }

                            data = result.data;
                            
                            // Сохраняем данные в кэш
                            if (!window.visualizationCache) {
                                window.visualizationCache = {};
                            }
                            window.visualizationCache[cacheKey] = data;
                        }

                        // Create visualization
                        const container = document.createElement('div');
                        container.className = 'chart-container';
                        document.getElementById('visualization-container').appendChild(container);

                        if (chartType === 'table') {
                            createTableVisualization(container, data);
                        } else {
                            createChartVisualization(container, data, chartType);
                        }

                    } catch (error) {
                        console.error('Error:', error);
                        showMessage('Failed to create visualization: ' + error.message, 'error');
                    }
                });

                // Функция для создания табличной визуализации
                function createTableVisualization(container, data) {
                    const table = document.createElement('table');
                    table.className = 'data-table';
                    
                    // Create header
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    data.columns.forEach(column => {
                        const th = document.createElement('th');
                        th.textContent = column.name;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);
                    
                    // Create body
                    const tbody = document.createElement('tbody');
                    data.rows.forEach(row => {
                        const tr = document.createElement('tr');
                        data.columns.forEach(column => {
                            const td = document.createElement('td');
                            td.textContent = row[column.name];
                            tr.appendChild(td);
                        });
                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);
                    
                    container.appendChild(table);
                }

                // Функция для создания графической визуализации
                function createChartVisualization(container, data, chartType) {
                    const canvas = document.createElement('canvas');
                    container.appendChild(canvas);

                    // Подготовка данных для графика
                    const labels = data.rows.map(row => row[data.columns[0].name]);
                    const datasets = data.columns.slice(1).map((column, index) => ({
                        label: column.name,
                        data: data.rows.map(row => row[column.name]),
                        backgroundColor: `hsla(${index * 360 / data.columns.length}, 70%, 50%, 0.7)`,
                        borderColor: `hsla(${index * 360 / data.columns.length}, 70%, 50%, 1)`,
                        borderWidth: 1
                    }));

                    new Chart(canvas, {
                        type: chartType,
                        data: {
                            labels: labels,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: true,
                                    text: `${data.columns[0].name} by ${data.columns.slice(1).map(c => c.name).join(', ')}`
                                }
                            }
                        }
                    });
                }

            } catch (error) {
                console.error('Error:', error);
                showMessage('Failed to load table columns: ' + error.message, 'error');
            }
        });

    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to load data source details: ' + error.message, 'error');
    }
});

// Handle visualization creation
document.getElementById('create-visualization-btn').addEventListener('click', async function() {
    const dataSourceId = document.getElementById('data-source-select').value;
    const table = document.getElementById('table-select').value;
    const chartType = document.getElementById('chart-type-select').value;

    if (!dataSourceId || !table || !chartType) {
        showMessage('Please select all required fields', 'error');
        return;
    }

    try {
        // Get table columns
        const token = localStorage.getItem('token');
        const response = await fetch('/api/datasources/table-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                id: dataSourceId,
                table: table,
                columns: ['*'],
                limit: 1
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get table structure');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        // Get column names from the first row
        const columns = Object.keys(result.data[0]);

        // Create visualization
        await createVisualization(dataSourceId, table, columns, chartType, {
            title: `${table} - ${chartType} Chart`,
            limit: 100
        });

    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to create visualization: ' + error.message, 'error');
    }
});

async function loadTableData(dataSourceId, tableName) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
            return;
        }

        const response = await fetch('/api/datasources/table-data', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                data_source_id: dataSourceId,
                table_name: tableName
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load table data');
        }

        return data.data;
    } catch (error) {
        console.error('Error loading table data:', error);
        showMessage('Failed to load table data: ' + error.message, 'error');
        return null;
    }
}

function createTableVisualization(container, data) {
    const table = document.createElement('table');
    table.className = 'data-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    data.columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.column_name;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    data.rows.forEach(row => {
        const tr = document.createElement('tr');
        data.columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = row[column.column_name] ?? '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

function createChartVisualization(container, data, chartType) {
    const canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    // Prepare data for chart
    const labels = data.rows.map(row => row[data.columns[0].column_name]);
    const datasets = [];

    // Create a dataset for each numeric column
    data.columns.slice(1).forEach(column => {
        if (['int', 'float', 'decimal', 'numeric'].includes(column.data_type)) {
            datasets.push({
                label: column.column_name,
                data: data.rows.map(row => row[column.column_name]),
                backgroundColor: getRandomColor(),
                borderColor: getRandomColor(),
                borderWidth: 1
            });
        }
    });

    // Create chart
    new Chart(canvas, {
        type: chartType,
        data: {
            labels: labels,
            datasets: datasets
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

// Update the createVisualization function
async function createVisualization() {
    const dataSourceId = document.getElementById('data-source-select').value;
    const tableName = document.getElementById('table-select').value;
    const chartType = document.getElementById('chart-type-select').value;

    if (!dataSourceId || !tableName || !chartType) {
        showMessage('Please select all required fields', 'error');
        return;
    }

    const data = await loadTableData(dataSourceId, tableName);
    if (!data) return;

    const container = document.createElement('div');
    container.className = 'visualization-item';
    container.innerHTML = `
        <div class="visualization-header">
            <h3>${tableName}</h3>
            <button onclick="this.parentElement.parentElement.remove()" class="delete-btn">Delete</button>
        </div>
        <div class="visualization-content"></div>
    `;

    document.getElementById('visualization-container').appendChild(container);

    const contentContainer = container.querySelector('.visualization-content');
    if (chartType === 'table') {
        createTableVisualization(contentContainer, data);
    } else {
        createChartVisualization(contentContainer, data, chartType);
    }
}

// Update the table select change handler
document.getElementById('table-select').addEventListener('change', function() {
    const chartTypeSelect = document.getElementById('chart-type-select');
    chartTypeSelect.disabled = !this.value;
    document.getElementById('create-visualization-btn').disabled = !this.value;
});

function showDashboard() {
    // Hide all sections
    document.getElementById('dataSourcesSection').style.display = 'none';
    document.getElementById('dashboardsSection').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';

    // Load data sources for the select
    loadDataSources().then(() => {
        // Enable the data source select
        const dataSourceSelect = document.getElementById('data-source-select');
        if (dataSourceSelect) {
            dataSourceSelect.disabled = false;
        }
    }).catch(error => {
        console.error('Error loading data sources:', error);
        showMessage('Failed to load data sources: ' + error.message, 'error');
    });
} 