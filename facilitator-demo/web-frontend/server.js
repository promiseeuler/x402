const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3005;
const FRONTEND_DIR = __dirname;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - Not Found</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file <code>${filePath}</code> was not found.</p>
                        <a href="/">← Back to X402 Demo</a>
                    </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Server Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Server Error</h1>
                        <p>An error occurred while serving the file.</p>
                        <a href="/">← Back to X402 Demo</a>
                    </body>
                    </html>
                `);
            }
        } else {
            // Serve the file
            const contentType = getContentType(filePath);
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payment'
            });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payment'
        });
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Default to index.html for root path
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Construct file path
    const filePath = path.join(FRONTEND_DIR, pathname);

    // Security check: ensure the file is within the frontend directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(FRONTEND_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>403 - Forbidden</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #e74c3c; }
                </style>
            </head>
            <body>
                <h1>403 - Forbidden</h1>
                <p>Access to this path is not allowed.</p>
                <a href="/">← Back to X402 Demo</a>
            </body>
            </html>
        `);
        return;
    }

    // Check if file exists and serve it
    fs.stat(normalizedPath, (err, stats) => {
        if (err || !stats.isFile()) {
            serveFile(res, path.join(FRONTEND_DIR, 'index.html'));
        } else {
            serveFile(res, normalizedPath);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🌐 X402 Facilitator Demo Frontend Server running on http://localhost:${PORT}`);
    console.log(`📊 Access the demo interface at: http://localhost:${PORT}`);
    console.log(`🔧 Serving files from: ${FRONTEND_DIR}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   • Demo Interface: http://localhost:${PORT}`);
    console.log(`   • Facilitator Server: http://localhost:3003`);
    console.log(`   • Resource Server: http://localhost:3004`);
    console.log('');
    console.log('💡 Make sure the facilitator and resource servers are running for full functionality.');
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down frontend server...');
    server.close(() => {
        console.log('✅ Frontend server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down frontend server...');
    server.close(() => {
        console.log('✅ Frontend server stopped.');
        process.exit(0);
    });
});

module.exports = server;