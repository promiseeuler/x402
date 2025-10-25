// X402 Facilitator Demo - Frontend Application

// Configuration
const CONFIG = {
    facilitatorUrl: 'http://localhost:3003',
    resourceUrl: 'http://localhost:3004',
    endpoints: {
        facilitator: {
            verify: '/verify',
            settle: '/settle',
            health: '/health'
        },
        resource: {
            catalog: '/api/catalog',
            premiumData: '/api/premium-data',
            exclusiveReport: '/api/exclusive-report',
            marketAnalysis: '/api/market-analysis'
        }
    }
};

// Global state
let workflowState = {
    currentStep: 0,
    steps: [],
    paymentPayload: null,
    resourceData: null
};

// Utility Functions
function showResponse(elementId, data, type = 'info') {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    element.className = `response ${type}`;
    
    if (typeof data === 'object') {
        element.textContent = JSON.stringify(data, null, 2);
    } else {
        element.textContent = data;
    }
}

function updateStatus(elementId, status) {
    const element = document.getElementById(elementId);
    element.className = `status-indicator status-${status}`;
}

function showTab(tabName, event = null) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab if event is provided
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load initial data for certain tabs
    if (tabName === 'overview') {
        checkAllServices();
        loadResourceCatalog();
    }
}

// API Helper Functions
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data: data,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error.message,
            data: null
        };
    }
}

// Service Status Functions
async function checkServiceHealth(url, statusElementId) {
    updateStatus(statusElementId, 'checking');
    
    try {
        const response = await fetch(`${url}/health`, { 
            method: 'GET',
            timeout: 5000 
        });
        
        if (response.ok) {
            updateStatus(statusElementId, 'online');
            return true;
        } else {
            updateStatus(statusElementId, 'offline');
            return false;
        }
    } catch (error) {
        updateStatus(statusElementId, 'offline');
        return false;
    }
}

async function checkAllServices() {
    const facilitatorOnline = await checkServiceHealth(CONFIG.facilitatorUrl, 'facilitator-status');
    const resourceOnline = await checkServiceHealth(CONFIG.resourceUrl, 'resource-status');
    
    return { facilitatorOnline, resourceOnline };
}

// Facilitator Functions
async function testVerification() {
    const scheme = document.getElementById('verify-scheme').value;
    const amount = document.getElementById('verify-amount').value;
    const token = document.getElementById('verify-token').value;
    const payloadText = document.getElementById('verify-payload').value;
    
    let payload;
    try {
        payload = JSON.parse(payloadText);
    } catch (error) {
        showResponse('verify-response', 'Invalid JSON payload: ' + error.message, 'error');
        return;
    }
    
    // Format the request data correctly for the facilitator
    const requestData = {
        paymentPayload: {
            scheme,
            amount,
            token,
            ...payload
        },
        paymentDetails: {
            amount,
            token,
            recipient: '0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4' // Default recipient
        }
    };
    
    const result = await makeRequest(`${CONFIG.facilitatorUrl}${CONFIG.endpoints.facilitator.verify}`, {
        method: 'POST',
        body: JSON.stringify(requestData)
    });
    
    const responseType = result.success ? 'success' : 'error';
    showResponse('verify-response', result, responseType);
}

async function testSettlement() {
    const scheme = document.getElementById('verify-scheme').value;
    const amount = document.getElementById('settle-amount').value;
    const token = document.getElementById('verify-token').value;
    const recipient = document.getElementById('settle-recipient').value;
    const payloadText = document.getElementById('verify-payload').value;
    
    let payload;
    try {
        payload = JSON.parse(payloadText);
    } catch (error) {
        showResponse('settle-response', 'Invalid JSON payload: ' + error.message, 'error');
        return;
    }
    
    // Format the request data correctly for the facilitator
    const requestData = {
        paymentPayload: {
            scheme,
            amount,
            token,
            recipient,
            ...payload
        },
        paymentDetails: {
            amount,
            token,
            recipient
        }
    };
    
    const result = await makeRequest(`${CONFIG.facilitatorUrl}${CONFIG.endpoints.facilitator.settle}`, {
        method: 'POST',
        body: JSON.stringify(requestData)
    });
    
    const responseType = result.success ? 'success' : 'error';
    showResponse('settle-response', result, responseType);
}

async function testFacilitatorHealth() {
    const result = await makeRequest(`${CONFIG.facilitatorUrl}${CONFIG.endpoints.facilitator.health}`);
    const responseType = result.success ? 'success' : 'error';
    showResponse('health-response', result, responseType);
}

// Resource Server Functions
async function fetchResourceCatalog() {
    const result = await makeRequest(`${CONFIG.resourceUrl}${CONFIG.endpoints.resource.catalog}`);
    const responseType = result.success ? 'success' : 'error';
    showResponse('catalog-response', result, responseType);
}

async function loadResourceCatalog() {
    const result = await makeRequest(`${CONFIG.resourceUrl}${CONFIG.endpoints.resource.catalog}`);
    const catalogElement = document.getElementById('resource-catalog');
    
    if (result.success && result.data) {
        let catalogHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">';
        
        // Handle the catalog structure - data.available_resources is the array
        const resources = result.data.available_resources || [];
        resources.forEach(resource => {
            catalogHtml += `
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">${resource.name}</h4>
                    <p style="color: #7f8c8d; margin-bottom: 10px;">${resource.description}</p>
                    <p><strong>Endpoint:</strong> <code>${resource.endpoint}</code></p>
                    <p><strong>Price:</strong> ${resource.price} tokens</p>
                    <p><strong>Token:</strong> <code style="font-size: 0.8em;">${resource.token}</code></p>
                </div>
            `;
        });
        
        catalogHtml += '</div>';
        catalogElement.innerHTML = catalogHtml;
    } else {
        catalogElement.innerHTML = '<p style="color: #e74c3c;">Failed to load resource catalog</p>';
    }
}

async function testResourceWithoutPayment() {
    const endpoint = document.getElementById('resource-endpoint').value;
    const result = await makeRequest(`${CONFIG.resourceUrl}${endpoint}`);
    const responseType = result.status === 402 ? 'info' : (result.success ? 'success' : 'error');
    showResponse('resource-response', result, responseType);
}

async function testResourceWithPayment() {
    const endpoint = document.getElementById('resource-endpoint').value;
    
    // Generate a mock payment payload
    const paymentPayload = generateMockPaymentPayload();
    const encodedPayload = btoa(JSON.stringify(paymentPayload));
    
    const result = await makeRequest(`${CONFIG.resourceUrl}${endpoint}`, {
        headers: {
            'X-Payment': encodedPayload
        }
    });
    
    const responseType = result.success ? 'success' : 'error';
    showResponse('resource-response', result, responseType);
}

async function fetchResourceConfig() {
    const result = await makeRequest(`${CONFIG.resourceUrl}/config`);
    const responseType = result.success ? 'success' : 'error';
    showResponse('config-response', result, responseType);
}

// Client Functions
function generateMockPaymentPayload() {
    const from = document.getElementById('client-from')?.value || '0x1234567890123456789012345678901234567890';
    const to = document.getElementById('client-to')?.value || '0x742d35Cc6634C0532925a3b8D4b4b4b4b4b4b4b4';
    const amount = document.getElementById('client-amount')?.value || '1000000';
    
    return {
        scheme: 'transferWithAuthorization',
        amount: amount,
        token: '0xA0b86a33E6441b8dB4B2f8b8C4b4b4b4b4b4b4b4',
        recipient: to,
        networkId: '8453',
        from,
        to,
        value: amount,
        validAfter: '0',
        validBefore: '999999999999',
        nonce: '0x' + Math.random().toString(16).substr(2, 16),
        signature: '0x' + Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    };
}

function generatePaymentPayload() {
    const payload = generateMockPaymentPayload();
    workflowState.paymentPayload = payload;
    showResponse('payload-response', payload, 'success');
}

async function simulateClientFlow() {
    const endpoint = document.getElementById('client-resource').value;
    let flowLog = 'Starting client flow simulation...\n\n';
    
    try {
        // Step 1: Try to access resource without payment
        flowLog += '1. Attempting to access resource without payment...\n';
        const initialResult = await makeRequest(`${CONFIG.resourceUrl}${endpoint}`);
        
        if (initialResult.status === 402) {
            flowLog += '   ✅ Received 402 Payment Required (expected)\n';
            flowLog += `   Payment requirements: ${JSON.stringify(initialResult.data, null, 2)}\n\n`;
            
            // Step 2: Generate payment payload
            flowLog += '2. Generating payment payload...\n';
            const paymentPayload = generateMockPaymentPayload();
            const encodedPayload = btoa(JSON.stringify(paymentPayload));
            flowLog += '   ✅ Payment payload generated\n\n';
            
            // Step 3: Retry with payment
            flowLog += '3. Retrying request with payment...\n';
            const paidResult = await makeRequest(`${CONFIG.resourceUrl}${endpoint}`, {
                headers: {
                    'X-Payment': encodedPayload
                }
            });
            
            if (paidResult.success) {
                flowLog += '   ✅ Payment successful! Resource accessed.\n';
                flowLog += `   Resource data: ${JSON.stringify(paidResult.data, null, 2)}\n`;
                
                if (paidResult.headers['x-payment-settlement']) {
                    flowLog += `   Settlement details: ${paidResult.headers['x-payment-settlement']}\n`;
                }
            } else {
                flowLog += `   ❌ Payment failed: ${JSON.stringify(paidResult, null, 2)}\n`;
            }
        } else {
            flowLog += `   ❌ Unexpected response: ${JSON.stringify(initialResult, null, 2)}\n`;
        }
        
        showResponse('client-flow-response', flowLog, 'success');
    } catch (error) {
        flowLog += `\n❌ Error during simulation: ${error.message}`;
        showResponse('client-flow-response', flowLog, 'error');
    }
}

// Workflow Functions
function updateWorkflowStep(stepNumber, status) {
    const stepElement = document.getElementById(`step-${stepNumber}`);
    const numberElement = stepElement.querySelector('.step-number');
    
    stepElement.className = `workflow-step ${status}`;
    numberElement.className = `step-number ${status}`;
    
    if (status === 'active') {
        stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function resetWorkflow() {
    for (let i = 1; i <= 7; i++) {
        updateWorkflowStep(i, '');
    }
    workflowState.currentStep = 0;
    document.getElementById('workflow-response').style.display = 'none';
}

async function runFullWorkflow() {
    resetWorkflow();
    let workflowLog = 'Starting complete X402 workflow demonstration...\n\n';
    
    try {
        // Step 1: Resource Discovery
        updateWorkflowStep(1, 'active');
        workflowLog += '🔍 Step 1: Resource Discovery\n';
        const catalogResult = await makeRequest(`${CONFIG.resourceUrl}${CONFIG.endpoints.resource.catalog}`);
        
        if (catalogResult.success) {
            updateWorkflowStep(1, 'completed');
            workflowLog += '   ✅ Resource catalog retrieved successfully\n';
            workflowLog += `   Found ${catalogResult.data.length} available resources\n\n`;
        } else {
            updateWorkflowStep(1, 'error');
            workflowLog += '   ❌ Failed to retrieve resource catalog\n\n';
            throw new Error('Resource discovery failed');
        }
        
        // Step 2: Initial Request (402 Response)
        updateWorkflowStep(2, 'active');
        workflowLog += '🚫 Step 2: Initial Resource Request\n';
        const initialResult = await makeRequest(`${CONFIG.resourceUrl}/api/premium-data`);
        
        if (initialResult.status === 402) {
            updateWorkflowStep(2, 'completed');
            workflowLog += '   ✅ Received 402 Payment Required (expected)\n';
            workflowLog += `   Payment requirements: ${JSON.stringify(initialResult.data, null, 2)}\n\n`;
        } else {
            updateWorkflowStep(2, 'error');
            workflowLog += '   ❌ Expected 402 response but got different status\n\n';
            throw new Error('Unexpected response in step 2');
        }
        
        // Step 3: Payment Payload Creation
        updateWorkflowStep(3, 'active');
        workflowLog += '💳 Step 3: Payment Payload Creation\n';
        const paymentPayload = generateMockPaymentPayload();
        const encodedPayload = btoa(JSON.stringify(paymentPayload));
        
        updateWorkflowStep(3, 'completed');
        workflowLog += '   ✅ Payment payload created and encoded\n';
        workflowLog += `   Payload: ${JSON.stringify(paymentPayload, null, 2)}\n\n`;
        
        // Step 4: Request with Payment
        updateWorkflowStep(4, 'active');
        workflowLog += '🔄 Step 4: Resource Request with Payment\n';
        const paidResult = await makeRequest(`${CONFIG.resourceUrl}/api/premium-data`, {
            headers: {
                'X-Payment': encodedPayload
            }
        });
        
        if (paidResult.success) {
            updateWorkflowStep(4, 'completed');
            updateWorkflowStep(5, 'completed'); // Verification happened internally
            updateWorkflowStep(6, 'completed'); // Settlement happened internally
            updateWorkflowStep(7, 'completed'); // Resource delivered
            
            workflowLog += '   ✅ Request with payment successful\n';
            workflowLog += '   ✅ Payment verification completed (Step 5)\n';
            workflowLog += '   ✅ Payment settlement completed (Step 6)\n';
            workflowLog += '   ✅ Resource delivered successfully (Step 7)\n\n';
            
            workflowLog += `📊 Resource Data Received:\n${JSON.stringify(paidResult.data, null, 2)}\n\n`;
            
            if (paidResult.headers['x-payment-settlement']) {
                workflowLog += `💰 Settlement Details:\n${paidResult.headers['x-payment-settlement']}\n\n`;
            }
            
            workflowLog += '🎉 Complete X402 workflow executed successfully!';
        } else {
            updateWorkflowStep(4, 'error');
            workflowLog += `   ❌ Payment request failed: ${JSON.stringify(paidResult, null, 2)}\n`;
            throw new Error('Payment request failed');
        }
        
        showResponse('workflow-response', workflowLog, 'success');
        
    } catch (error) {
        workflowLog += `\n❌ Workflow failed: ${error.message}`;
        showResponse('workflow-response', workflowLog, 'error');
    }
}

async function runQuickDemo() {
    const services = await checkAllServices();
    
    if (!services.facilitatorOnline || !services.resourceOnline) {
        alert('⚠️ Services are not running. Please start the facilitator and resource servers first.');
        return;
    }
    
    // Switch to workflow tab and run the demo
    showTab('workflow');
    setTimeout(() => {
        runFullWorkflow();
    }, 500);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check service status on load
    checkAllServices();
    loadResourceCatalog();
    
    // Set up default values
    const now = Date.now();
    const futureTime = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    // Update any time-based fields if needed
    console.log('X402 Facilitator Demo Frontend Initialized');
});

// Export functions for global access
window.X402Demo = {
    showTab,
    checkAllServices,
    testVerification,
    testSettlement,
    testFacilitatorHealth,
    fetchResourceCatalog,
    testResourceWithoutPayment,
    testResourceWithPayment,
    fetchResourceConfig,
    generatePaymentPayload,
    simulateClientFlow,
    runFullWorkflow,
    resetWorkflow,
    runQuickDemo
};