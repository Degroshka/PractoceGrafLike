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
            db_name: document.getElementById('dsDatabase').value,
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

        // Add event listeners
        dataSourceSelect.onchange = async function() {
            const tableSelect = document.getElementById('table-select');
            tableSelect.disabled = !this.value;
            tableSelect.innerHTML = '<option value="">Select Table</option>';
            
            if (this.value) {
                try {
                    const response = await fetch('/api/data-sources/tables', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({
                            data_source_id: this.value
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to load tables');
                    }

                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.message);
                    }

                    result.data.forEach(table => {
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
        };

        document.getElementById('table-select').onchange = async function() {
            const columnsSelect = document.getElementById('columns-select');
            const yAxisSelect = document.getElementById('y-axis-select');
            const chartTypeSelect = document.getElementById('chart-type-select');
            const createBtn = document.getElementById('create-visualization-btn');
            
            columnsSelect.disabled = !this.value;
            yAxisSelect.disabled = !this.value;
            chartTypeSelect.disabled = !this.value;
            createBtn.disabled = !this.value;
            
            columnsSelect.innerHTML = '<option value="">Select X-axis Column</option>';
            yAxisSelect.innerHTML = '<option value="">Select Y-axis Column</option>';
            
            if (this.value) {
                try {
                    const response = await fetch('/api/data-sources/table-structure', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({
                            data_source_id: document.getElementById('data-source-select').value,
                            table_name: this.value
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to load table structure');
                    }

                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.message || 'Failed to load table structure');
                    }

                    // Add columns to both selects
                    if (result.data && Array.isArray(result.data)) {
                        result.data.forEach(column => {
                            if (!column.name || !column.type) {
                                console.warn('Invalid column data:', column);
                                return;
                            }

                            // Add to X-axis select
                            const option = document.createElement('option');
                            option.value = column.name;
                            option.textContent = `${column.name} (${column.type})`;
                            option.dataset.type = column.type;
                            columnsSelect.appendChild(option);

                            // Add to Y-axis select
                            const yOption = document.createElement('option');
                            yOption.value = column.name;
                            yOption.textContent = `${column.name} (${column.type})`;
                            yOption.dataset.type = column.type;
                            yAxisSelect.appendChild(yOption);
                        });

                        // Enable selects
                        columnsSelect.disabled = false;
                        yAxisSelect.disabled = false;
                        chartTypeSelect.disabled = false;
                    } else {
                        console.error('Invalid data structure:', result.data);
                        throw new Error('Invalid column data structure received from server');
                    }
                } catch (error) {
                    console.error('Error loading table structure:', error);
                    showMessage(error.message, 'error');
                }
            }
        };

        // Add event listener for create visualization button
        document.getElementById('create-visualization-btn').onclick = async function() {
            const dataSourceId = dataSourceSelect.value;
            const table = document.getElementById('table-select').value;
            const columns = Array.from(document.getElementById('columns-select').selectedOptions).map(opt => opt.value);
            const type = document.getElementById('chart-type-select').value;

            if (!dataSourceId || !table || columns.length === 0 || !type) {
                showMessage('Please select all required fields', 'error');
                return;
            }

            await createVisualization(dataSourceId, table, columns, type);
        };

        // Load existing visualizations if dashboard ID is provided
        if (id) {
            try {
                const response = await fetch(`/api/dashboards/${id}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to load dashboard');
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }

                // TODO: Load existing visualizations
            } catch (error) {
                console.error('Error loading dashboard:', error);
                showMessage(error.message, 'error');
            }
        }
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
async function createVisualization() {
    try {
        const dataSourceId = document.getElementById('data-source-select').value;
        const tableName = document.getElementById('table-select').value;
        const chartType = document.getElementById('chart-type-select').value;
        const xAxisColumn = document.getElementById('columns-select').value;
        const yAxisColumn = document.getElementById('y-axis-select').value;

        if (!dataSourceId || !tableName) {
            throw new Error('Data source ID and table name are required');
        }

        // Load table data
        const tableData = await loadTableData(dataSourceId, tableName);
        if (!tableData || !tableData.rows || !tableData.rows.length) {
            throw new Error('No data available for visualization');
        }

        // Create visualization container
        const container = document.createElement('div');
        container.className = 'chart-container';
        document.getElementById('visualization-container').appendChild(container);

        // Create visualization based on type
        if (chartType === 'table') {
            createTableVisualization(container, tableData);
        } else {
            createChartVisualization(container, tableData, chartType);
        }

    } catch (error) {
        console.error('Error creating visualization:', error);
        showMessage(error.message, 'error');
    }
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
        const response = await fetch(`/api/data-sources/${dataSourceId}`, {
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
        tableSelect.addEventListener('change', async function() {
            const selectedTable = this.value;
            if (!selectedTable) {
                return;
            }

            try {
                // Get columns for selected table
                const columnsResponse = await fetch('/api/data-sources/table-data', {
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
                            const response = await fetch('/api/data-sources/table-data', {
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
        const response = await fetch('/api/data-sources/table-data', {
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

        const response = await fetch('/api/data-sources/table-data', {
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

// Update the createVisualization function
async function createVisualization() {
    const dataSourceId = document.getElementById('data-source-select').value;
    const tableName = document.getElementById('table-select').value;
    const xAxisColumn = document.getElementById('columns-select').value;
    const yAxisColumn = document.getElementById('y-axis-select').value;
    const chartType = document.getElementById('chart-type-select').value;

    if (!dataSourceId || !tableName) {
        showMessage('Data source ID and table name are required', 'error');
        return;
    }

    if (!xAxisColumn || !yAxisColumn) {
        showMessage('Please select both X-axis and Y-axis columns', 'error');
        return;
    }

    if (!chartType) {
        showMessage('Please select a chart type', 'error');
        return;
    }

    try {
        const response = await fetch('/api/data-sources/table-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                data_source_id: dataSourceId,
                table_name: tableName,
                columns: [xAxisColumn, yAxisColumn],
                limit: 1000
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get table data');
        }

        const responseText = await response.text();
        console.log('Table data response:', responseText); // Debug log

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Invalid JSON response from server');
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to get table data');
        }

        if (!result.data || !result.data.rows) {
            console.error('Invalid data structure:', result);
            throw new Error('Invalid data structure received from server');
        }

        // Create visualization container
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
            createTableVisualization(contentContainer, result.data);
        } else {
            createChartVisualization(contentContainer, result.data, chartType);
        }

    } catch (error) {
        console.error('Error creating visualization:', error);
        showMessage(error.message, 'error');
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