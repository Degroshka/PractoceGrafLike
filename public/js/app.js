// Auth functions
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showDataSources() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginForm();
        return;
    }
    
    document.getElementById('dataSourcesSection').style.display = 'block';
    document.getElementById('dashboardsSection').style.display = 'none';
    loadDataSources();
}

function showDashboards() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginForm();
        return;
    }
    
    document.getElementById('dataSourcesSection').style.display = 'none';
    document.getElementById('dashboardsSection').style.display = 'block';
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

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Auth functions
async function register() {
    try {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();
        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            showMessage('Регистрация успешна! Теперь вы можете войти.', 'success');
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            showDataSources();
        } else {
            showMessage(result.message || 'Ошибка при регистрации', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при регистрации', 'error');
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
        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            showMessage('Login successful!', 'success');
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            showDataSources();
        } else {
            showMessage(result.message || 'Неверный email или пароль', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при входе', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('authForms').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    showLoginForm();
}

// Data Source functions
async function loadDataSources() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Please login first', 'error');
            return;
        }

        console.log('Fetching data sources...');
        const response = await fetch('/api/data-sources', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Try to parse the response as JSON
        let result;
        try {
            const text = await response.text();
            console.log('Response text:', text);
            result = JSON.parse(text);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Failed to parse server response as JSON');
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to load data sources');
        }

        const dataSourcesList = document.getElementById('dataSourcesList');
        dataSourcesList.innerHTML = '';

        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Invalid data format received from server');
        }

        result.data.forEach(dataSource => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="data-source-item">
                    <span>${dataSource.name} (${dataSource.type})</span>
                    <div class="data-source-actions">
                        <button onclick="testConnection(${dataSource.id})">Test Connection</button>
                        <button onclick="deleteDataSource(${dataSource.id})">Delete</button>
                    </div>
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
        showMessage(error.message || 'Failed to load data sources', 'error');
    }
}

async function addDataSource() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Please login first', 'error');
            return;
        }

        // Get user ID from token
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
        }

        const tokenPayload = atob(tokenParts[1]);
        const tokenData = JSON.parse(tokenPayload);
        const userId = tokenData.user_id;

        if (!userId) {
            throw new Error('User ID not found in token');
        }

        const dataSource = {
            name: document.getElementById('dsName').value,
            type: document.getElementById('dsType').value,
            connection_type: 'local',
            host: document.getElementById('dsHost').value,
            port: parseInt(document.getElementById('dsPort').value),
            database: document.getElementById('dsDatabase').value,
            username: document.getElementById('dsUsername').value,
            password: document.getElementById('dsPassword').value,
            use_ssl: document.getElementById('dsUseSsl').checked,
            user_id: parseInt(userId) // Ensure user_id is a number
        };

        console.log('Sending data source:', dataSource); // Debug log

        const response = await fetch('/api/data-sources', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataSource)
        });

        const responseText = await response.text();
        console.log('Response text:', responseText); // Debug log

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Failed to parse server response as JSON');
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to add data source');
        }

        showMessage('Data source added successfully', 'success');
        document.getElementById('addDataSourceForm').style.display = 'none';
        loadDataSources();
    } catch (error) {
        console.error('Error adding data source:', error);
        showMessage(error.message || 'Failed to add data source', 'error');
    }
}

async function deleteDataSource(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этот источник данных?')) {
            return;
        }

        const response = await fetch(`/api/data-sources/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        console.log('Delete response status:', response.status);
        console.log('Delete response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            if (response.status === 401) {
                showMessage('Session expired. Please login again.', 'error');
                logout();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Delete response data:', data);
        
        if (data.success) {
            showMessage('Источник данных успешно удален', 'success');
            loadDataSources(); // Reload the list
        } else {
            showMessage(data.message || 'Failed to delete data source', 'error');
        }
    } catch (error) {
        console.error('Error deleting data source:', error);
        showMessage('Failed to delete data source: ' + error.message, 'error');
    }
}

async function testConnection(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Please login first', 'error');
            return;
        }

        console.log('Testing connection for data source:', id);
        const response = await fetch(`/api/data-sources/${id}/test`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                include_password: true // Add this flag to include password in test
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Response text:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Failed to parse server response as JSON');
        }

        if (!result.success) {
            throw new Error(result.message || 'Connection test failed');
        }

        showMessage(result.data.message || 'Connection successful', 'success');
    } catch (error) {
        console.error('Error testing connection:', error);
        showMessage(error.message || 'Failed to test connection', 'error');
    }
}

// Dashboard functions
async function loadDashboards() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
            return;
        }

        const response = await fetch('/api/dashboards', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showMessage('Session expired. Please login again.', 'error');
                logout();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Load dashboards response:', data);
        
        if (data.success) {
            const dashboardsList = document.getElementById('dashboardsList');
            dashboardsList.innerHTML = '';
            
            data.data.forEach(dashboard => {
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
        } else {
            showMessage(data.error || 'Failed to load dashboards', 'error');
        }
    } catch (error) {
        console.error('Error loading dashboards:', error);
        showMessage('Failed to load dashboards', 'error');
    }
}

async function deleteDashboard(id) {
    if (!confirm('Вы уверены, что хотите удалить эту панель?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
            return;
        }

        const response = await fetch(`/api/dashboards/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showMessage('Панель успешно удалена', 'success');
            loadDashboards();
        } else {
            showMessage(data.error || 'Failed to delete dashboard', 'error');
        }
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        showMessage('Failed to delete dashboard', 'error');
    }
}

async function addDashboard() {
    const name = document.getElementById('dashboardName').value;
    const description = document.getElementById('dashboardDescription').value;
    const dataSourceId = document.getElementById('dashboardDataSource').value;

    if (!name || !dataSourceId) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
            return;
        }

        const response = await fetch('/api/dashboards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                description,
                data_source_id: dataSourceId,
                config: { panels: [] }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            showMessage('Dashboard created successfully!', 'success');
            document.getElementById('addDashboardForm').reset();
            document.getElementById('addDashboardForm').style.display = 'none';
            loadDashboards();
        } else {
            showMessage(data.error || 'Failed to create dashboard', 'error');
        }
    } catch (error) {
        console.error('Error creating dashboard:', error);
        showMessage('Failed to create dashboard', 'error');
    }
}

// Consolidated data source change handler
async function handleDataSourceChange() {
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
        if (!token) {
            showLoginForm();
            return;
        }

        // Get tables from the data source
        const tablesResponse = await fetch('/api/data-sources/tables', {
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
        tableSelect.onchange = async function() {
            const selectedTable = this.value;
            const columnsSelect = document.getElementById('columns-select');
            
            // Reset UI state
            if (columnsSelect) {
                columnsSelect.innerHTML = '<option value="">Select Columns</option>';
                columnsSelect.disabled = true;
            }
            if (chartTypeSelect) {
                chartTypeSelect.innerHTML = `
                    <option value="">Select Chart Type</option>
                    <option value="table">Table</option>
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                `;
                chartTypeSelect.disabled = true;
            }
            if (createBtn) {
                createBtn.disabled = true;
            }

            if (!selectedTable) {
                return;
            }

            try {
                console.log('Fetching table structure for:', selectedTable);
                const response = await fetch('/api/data-sources/table-structure', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        data_source_id: dataSourceId,
                        table_name: selectedTable
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to get table columns');
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }

                // Update columns select
                if (columnsSelect && result.data && result.data.columns) {
                    // Clear and update options
                    columnsSelect.innerHTML = '<option value="">Select Columns</option>';
                    result.data.columns.forEach(column => {
                        const option = document.createElement('option');
                        option.value = column.name;
                        option.textContent = `${column.name} (${column.type})`;
                        if (column.type) {
                            option.dataset.type = column.type.toLowerCase();
                        }
                        columnsSelect.appendChild(option);
                    });

                    // Enable the select
                    columnsSelect.disabled = false;

                    // Add event listeners
                    columnsSelect.onchange = function() {
                        const hasSelectedColumns = this.selectedOptions.length > 0;
                        
                        // Enable/disable chart type select based on column selection
                        if (chartTypeSelect) {
                            chartTypeSelect.disabled = !hasSelectedColumns;
                        }

                        // Enable create button if both selects have values
                        if (createBtn) {
                            createBtn.disabled = !(hasSelectedColumns && chartTypeSelect?.value);
                        }
                    };

                    // Add event listener for chart type selection
                    if (chartTypeSelect) {
                        chartTypeSelect.onchange = function() {
                            // Enable create button if both selects have values
                            if (createBtn) {
                                createBtn.disabled = !(columnsSelect.selectedOptions.length > 0 && this.value);
                            }
                        };
                    }
                }

            } catch (error) {
                console.error('Error:', error);
                showMessage('Failed to load table columns: ' + error.message, 'error');
                
                // Reset UI state on error
                if (columnsSelect) {
                    columnsSelect.innerHTML = '<option value="">Select Columns</option>';
                    columnsSelect.disabled = true;
                }
                if (chartTypeSelect) {
                    chartTypeSelect.innerHTML = '<option value="">Select Chart Type</option>';
                    chartTypeSelect.disabled = true;
                }
                if (createBtn) {
                    createBtn.disabled = true;
                }
            }
        };

    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to load data source details: ' + error.message, 'error');
    }
}

// Update viewDashboard function to use the consolidated handler
async function viewDashboard(id) {
    try {
        // Show dashboard view
        document.getElementById('dashboardsSection').style.display = 'none';
        document.getElementById('dashboard-view').style.display = 'block';

        // Load data sources for the select
        const dataSourcesResponse = await fetch('/api/data-sources', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!dataSourcesResponse.ok) {
            throw new Error('Failed to load data sources');
        }

        const dataSourcesResult = await dataSourcesResponse.json();
        if (!dataSourcesResult.success) {
            throw new Error(dataSourcesResult.message);
        }

        const dataSourceSelect = document.getElementById('data-source-select');
        dataSourceSelect.innerHTML = '<option value="">Select Data Source</option>';
        dataSourcesResult.data.forEach(ds => {
            const option = document.createElement('option');
            option.value = ds.id;
            option.textContent = ds.name;
            dataSourceSelect.appendChild(option);
        });

        // Add event listener for data source selection
        dataSourceSelect.onchange = handleDataSourceChange;

    } catch (error) {
        console.error('Error viewing dashboard:', error);
        showMessage(error.message, 'error');
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        showDataSources();
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
function createTableVisualization(container, data, title = '') {
    // Create title if provided
    if (title) {
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        container.appendChild(titleElement);
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Get columns from first row if not provided
    const columns = data.columns || Object.keys(data.rows[0] || {}).map(name => ({ name }));
    
    columns.forEach(column => {
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
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = row[column.name] ?? '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    container.appendChild(table);
}

function createChartVisualization(container, data, chartType) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const xAxisColumn = document.getElementById('columns-select').value;
    const yAxisColumn = document.getElementById('y-axis-select').value;

    // Helper function to safely convert values
    const safeConvert = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value instanceof Date) return value.toLocaleDateString();
        return String(value);
    };

    // Helper function to aggregate data for pie/doughnut charts
    const aggregateData = (rows, labelKey, valueKey) => {
        const aggregated = {};
        rows.forEach(row => {
            const label = safeConvert(row[labelKey]);
            const value = parseFloat(row[valueKey]) || 0;
            aggregated[label] = (aggregated[label] || 0) + value;
        });
        return {
            labels: Object.keys(aggregated),
            values: Object.values(aggregated)
        };
    };

    // Prepare data for chart
    let labels, values, backgroundColor;

    if (chartType === 'pie' || chartType === 'doughnut') {
        // For pie/doughnut charts, aggregate data by x-axis values
        const aggregated = aggregateData(data.rows, xAxisColumn, yAxisColumn);
        labels = aggregated.labels;
        values = aggregated.values;
        backgroundColor = labels.map(() => getRandomColor());
    } else {
        // For other charts, process data based on type
        labels = data.rows.map(row => safeConvert(row[xAxisColumn]));
        
        // Try to convert values to numbers for better visualization
        values = data.rows.map(row => {
            const val = row[yAxisColumn];
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            }
            return 0;
        });

        // For line and bar charts, use different colors for each data point
        if (chartType === 'line' || chartType === 'bar') {
            backgroundColor = values.map(() => getRandomColor());
        } else {
            backgroundColor = getRandomColor();
        }
    }

    // Create chart
    new Chart(canvas, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: yAxisColumn,
                data: values,
                backgroundColor: backgroundColor,
                borderColor: chartType === 'pie' || chartType === 'doughnut' ? backgroundColor : getRandomColor(),
                borderWidth: 1,
                fill: chartType === 'line' ? false : true,
                tension: chartType === 'line' ? 0.4 : 0
            }]
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
                    text: `${yAxisColumn} by ${xAxisColumn}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== undefined) {
                                label += context.parsed.y.toLocaleString();
                            } else if (context.parsed !== undefined) {
                                label += context.parsed.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            },
            scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            return label.length > 10 ? label.substr(0, 10) + '...' : label;
                        }
                    }
                }
            }
        }
    });
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