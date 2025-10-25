# X402 Facilitator Demo - Web Frontend

A comprehensive web-based testing interface for the X402 Facilitator Demo project. This frontend provides an intuitive way to test and demonstrate all components of the X402 payment protocol.

## 🌟 Features

### 📊 Overview Dashboard
- **Service Status Monitoring**: Real-time health checks for facilitator and resource servers
- **Resource Catalog**: Visual display of available paid resources
- **Quick Demo**: One-click demonstration of the complete workflow

### 🏦 Facilitator Testing
- **Payment Verification**: Test the `/verify` endpoint with custom payment payloads
- **Payment Settlement**: Test the `/settle` endpoint with various parameters
- **Health Monitoring**: Check facilitator server health and status

### 🔒 Resource Server Testing
- **Resource Catalog**: Fetch and display available resources
- **Protected Resource Access**: Test accessing resources with and without payment
- **Configuration Viewing**: Inspect resource server configuration

### 💳 Client Simulation
- **Payment Payload Generator**: Create mock blockchain payment payloads
- **Client Flow Simulation**: Complete end-to-end client interaction simulation
- **Custom Parameters**: Configure payment amounts, addresses, and tokens

### 🔄 Complete Workflow Demonstration
- **Step-by-Step Visualization**: Interactive workflow with progress tracking
- **Real-time Updates**: Live status updates for each workflow step
- **Error Handling**: Clear error reporting and recovery suggestions

## 🚀 Quick Start

### Prerequisites

Ensure the following services are running:
- **Facilitator Server** on `http://localhost:3003`
- **Resource Server** on `http://localhost:3004`

### Starting the Frontend

1. **Navigate to the frontend directory:**
   ```bash
   cd facilitator-demo/web-frontend
   ```

2. **Start the frontend server:**
   ```bash
   npm start
   ```

3. **Access the interface:**
   Open your browser and go to `http://localhost:3005`

### Alternative: Start All Services

From the main demo directory:
```bash
cd facilitator-demo
node scripts/start-all.js --frontend
```

## 📱 Interface Guide

### Navigation Tabs

#### 📊 Overview
- Monitor service health status
- View available resources
- Run quick demonstrations
- Understand the X402 protocol

#### 🏦 Facilitator
- **Verification Testing**: Submit payment payloads for verification
- **Settlement Testing**: Test payment settlement functionality
- **Health Checks**: Monitor facilitator server status

#### 🔒 Resource Server
- **Catalog Access**: Browse available paid resources
- **Resource Testing**: Test protected resource access
- **Configuration**: View server settings and requirements

#### 💳 Client Demo
- **Payload Generation**: Create mock payment payloads
- **Flow Simulation**: Simulate complete client interactions
- **Parameter Customization**: Adjust payment parameters

#### 🔄 Full Workflow
- **Complete Demonstration**: End-to-end X402 workflow
- **Step Tracking**: Visual progress through each workflow step
- **Error Handling**: Clear error reporting and recovery

## 🔧 Configuration

### Service URLs

The frontend is configured to connect to:
- **Facilitator Server**: `http://localhost:3003`
- **Resource Server**: `http://localhost:3004`
- **Frontend Server**: `http://localhost:3005`

### Customizing Endpoints

To modify service URLs, edit the `CONFIG` object in `app.js`:

```javascript
const CONFIG = {
    facilitatorUrl: 'http://localhost:3003',
    resourceUrl: 'http://localhost:3004',
    // ... other configuration
};
```

## 🧪 Testing Scenarios

### Basic Testing

1. **Service Health Check**
   - Go to Overview tab
   - Click "Check All Services"
   - Verify green status indicators

2. **Resource Discovery**
   - View the resource catalog
   - Note available resources and their prices

3. **Payment Verification**
   - Go to Facilitator tab
   - Modify payment parameters
   - Click "Test Verification"

### Advanced Testing

1. **Complete Workflow**
   - Go to Full Workflow tab
   - Click "Run Complete Workflow"
   - Watch step-by-step progress

2. **Client Simulation**
   - Go to Client Demo tab
   - Generate payment payload
   - Run full client flow simulation

3. **Error Scenarios**
   - Test invalid payment amounts
   - Test malformed payloads
   - Test service unavailability

## 🎨 User Interface

### Design Features
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Real-time Updates**: Live status indicators and progress tracking
- **Color-coded Responses**: Success (green), errors (red), info (blue)
- **Interactive Elements**: Hover effects and smooth transitions

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Clear visual hierarchy and readable text

## 🔍 API Integration

### Facilitator Endpoints
- `POST /verify` - Payment verification
- `POST /settle` - Payment settlement
- `GET /health` - Health check

### Resource Server Endpoints
- `GET /api/catalog` - Resource catalog
- `GET /api/premium-data` - Premium data resource
- `GET /api/exclusive-report` - Exclusive report resource
- `GET /api/market-analysis` - Market analysis resource

### Request/Response Handling
- **CORS Support**: Cross-origin requests enabled
- **Error Handling**: Comprehensive error reporting
- **Response Formatting**: JSON pretty-printing
- **Status Indicators**: Visual feedback for all operations

## 🛠️ Development

### File Structure
```
web-frontend/
├── index.html          # Main HTML interface
├── app.js             # Frontend JavaScript logic
├── server.js          # Static file server
├── package.json       # Node.js dependencies
└── README.md          # This documentation
```

### Adding New Features

1. **New Tab**: Add tab button in HTML and corresponding content section
2. **New API Call**: Add function in `app.js` following existing patterns
3. **New UI Element**: Use existing CSS classes for consistency

### Styling Guidelines
- Use existing CSS classes for consistency
- Follow the color scheme (blue primary, green success, red error)
- Maintain responsive design principles

## 🐛 Troubleshooting

### Common Issues

1. **Services Not Running**
   - **Symptom**: Red status indicators
   - **Solution**: Start facilitator and resource servers
   - **Command**: `node scripts/start-all.js`

2. **CORS Errors**
   - **Symptom**: Browser console errors about CORS
   - **Solution**: Ensure all servers include CORS headers
   - **Check**: Server configuration files

3. **Port Conflicts**
   - **Symptom**: "Port already in use" error
   - **Solution**: Change port in `server.js` or stop conflicting service
   - **Alternative**: Use different port number

4. **Payment Verification Fails**
   - **Symptom**: Verification returns error
   - **Solution**: Check payment payload format
   - **Tip**: Use the payload generator for valid format

### Debug Mode

Open browser developer tools (F12) to:
- View network requests and responses
- Check console for JavaScript errors
- Monitor API call timing and status

## 📚 Related Documentation

- [Main Project README](../README.md)
- [Facilitator API Documentation](../docs/FACILITATOR_API.md)
- [X402 Workflow Guide](../docs/WORKFLOW.md)
- [Setup Instructions](../scripts/README.md)

## 🤝 Contributing

To contribute to the frontend:

1. Follow existing code style and patterns
2. Test all new features thoroughly
3. Update documentation for new functionality
4. Ensure responsive design compatibility

## 📄 License

This project is licensed under the MIT License - see the main project LICENSE file for details.