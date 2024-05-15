const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE_PATH = path.join(__dirname, 'resources.json');

// Function to load data from JSON file
const loadData = () => {
    try {
        const jsonData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return JSON.parse(jsonData);
    } catch (err) {
        console.error('Error reading data file:', err);
        return [];
    }
};

// Function to save data to JSON file
const saveData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing data to file:', err);
    }
};

let data = loadData(); // Array to store resource data

const server = http.createServer((req, res) => {
    const { method, url } = req;

    if (url === '/resources' && method === 'GET') {
        // Retrieve a list of all resources
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(data));
    } else if (url.startsWith('/resources/') && method === 'GET') {
        // Retrieve a specific resource by its ID
        const id = parseInt(url.split('/')[2]);
        const resource = data.find(item => item.id === id);
        if (resource) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(resource));
        } else {
            res.statusCode = 404;
            res.end('Resource not found');
        }
    } else if (url === '/resources' && method === 'POST') {
        // Create a new resource
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newData = JSON.parse(body);
                if (!newData.hasOwnProperty('id')) {
                    res.statusCode = 400;
                    res.end('ID is required');
                    return;
                }
                // Check if the ID already exists
                if (data.some(item => item.id === newData.id)) {
                    res.statusCode = 409;
                    res.end('ID already exists');
                    return;
                }
                data.push(newData);
                saveData(data);
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(newData));
            } catch (err) {
                res.statusCode = 400;
                res.end('Invalid data format');
            }
        });
    } else if (url.startsWith('/resources/') && method === 'PUT') {
        // Update an existing resource by its ID
        const id = parseInt(url.split('/')[2]);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newData = JSON.parse(body);
                const index = data.findIndex(item => item.id === id);
                if (index !== -1) {
                    newData.id = id;
                    data[index] = newData;
                    saveData(data);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(newData));
                } else {
                    res.statusCode = 404;
                    res.end('Resource not found');
                }
            } catch (err) {
                res.statusCode = 400;
                res.end('Invalid data format');
            }
        });
    } else if (url.startsWith('/resources/') && method === 'PATCH') {
        // Partial update of an existing resource by its ID
        const id = parseInt(url.split('/')[2]);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const partialData = JSON.parse(body);
                const index = data.findIndex(item => item.id === id);
                if (index !== -1) {
                    Object.assign(data[index], partialData);
                    saveData(data);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data[index]));
                } else {
                    res.statusCode = 404;
                    res.end('Resource not found');
                }
            } catch (err) {
                res.statusCode = 400;
                res.end('Invalid data format');
            }
        });
    } else if (url.startsWith('/resources/') && method === 'DELETE') {
        // Delete a resource by its ID
        const id = parseInt(url.split('/')[2]);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data.splice(index, 1);
            saveData(data);
            res.statusCode = 200;
            res.end('Resource deleted successfully');
        } else {
            res.statusCode = 404;
            res.end('Resource not found');
        }
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log('Server is running on port ${PORT}');
});