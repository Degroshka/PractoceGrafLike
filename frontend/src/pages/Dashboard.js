import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';

const Dashboard = () => {
    const navigate = useNavigate();
    const [dashboards, setDashboards] = useState([]);
    const [dataSources, setDataSources] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [newDashboard, setNewDashboard] = useState({
        name: '',
        description: '',
        data_source_id: ''
    });

    useEffect(() => {
        fetchDashboards();
        fetchDataSources();
    }, []);

    const fetchDashboards = async () => {
        try {
            const response = await axios.get('/api/dashboards');
            if (response.data.success) {
                setDashboards(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching dashboards:', error);
        }
    };

    const fetchDataSources = async () => {
        try {
            const response = await axios.get('/api/datasources');
            if (response.data.success) {
                setDataSources(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching data sources:', error);
        }
    };

    const handleCreateDashboard = async () => {
        try {
            const response = await axios.post('/api/dashboards', newDashboard);
            if (response.data.success) {
                setOpenDialog(false);
                setNewDashboard({
                    name: '',
                    description: '',
                    data_source_id: ''
                });
                fetchDashboards();
            }
        } catch (error) {
            console.error('Error creating dashboard:', error);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewDashboard({
            name: '',
            description: '',
            data_source_id: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDashboard(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    Dashboards
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenDialog}
                >
                    Create Dashboard
                </Button>
            </Box>

            <Grid container spacing={3}>
                {dashboards.map((dashboard) => (
                    <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="h2">
                                    {dashboard.name}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {dashboard.description}
                                </Typography>
                                <Typography variant="body2">
                                    Data Source: {dataSources.find(ds => ds.id === dashboard.data_source_id)?.name || 'Unknown'}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                                    >
                                        View Dashboard
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Dashboard Name"
                        type="text"
                        fullWidth
                        value={newDashboard.name}
                        onChange={handleInputChange}
                        required
                    />
                    <TextField
                        margin="dense"
                        name="description"
                        label="Description"
                        type="text"
                        fullWidth
                        value={newDashboard.description}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Data Source</InputLabel>
                        <Select
                            name="data_source_id"
                            value={newDashboard.data_source_id}
                            onChange={handleInputChange}
                            required
                        >
                            {dataSources.map((source) => (
                                <MenuItem key={source.id} value={source.id}>
                                    {source.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleCreateDashboard}
                        variant="contained"
                        color="primary"
                        disabled={!newDashboard.name || !newDashboard.data_source_id}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard; 