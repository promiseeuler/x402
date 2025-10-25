#!/usr/bin/env node

/**
 * Start All Services Script
 * 
 * This script starts all components of the X402 facilitator demo:
 * - Facilitator server (port 3003)
 * - Resource server (port 3004)
 * - Optionally runs client demo
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ServiceManager {
  constructor() {
    this.services = [];
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Start a service in a specific directory
   */
  startService(name, directory, command, args = [], port = null) {
    return new Promise((resolve, reject) => {
      const servicePath = path.join(__dirname, '..', directory);
      
      // Check if directory exists
      if (!fs.existsSync(servicePath)) {
        reject(new Error(`Directory not found: ${servicePath}`));
        return;
      }
      
      // Check if package.json exists
      const packagePath = path.join(servicePath, 'package.json');
      if (!fs.existsSync(packagePath)) {
        reject(new Error(`package.json not found in: ${servicePath}`));
        return;
      }
      
      console.log(`🚀 Starting ${name}...`);
      
      const child = spawn(command, args, {
        cwd: servicePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: this.isWindows
      });
      
      const service = {
        name,
        process: child,
        port,
        started: false
      };
      
      this.services.push(service);
      
      // Handle stdout
      child.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[${name}] ${output.trim()}`);
        
        // Check if service has started successfully
        if (output.includes('running on port') || output.includes('Server running')) {
          service.started = true;
          resolve(service);
        }
      });
      
      // Handle stderr
      child.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[${name}] ERROR: ${error.trim()}`);
      });
      
      // Handle process exit
      child.on('close', (code) => {
        console.log(`[${name}] Process exited with code ${code}`);
        if (code !== 0 && !service.started) {
          reject(new Error(`${name} failed to start (exit code: ${code})`));
        }
      });
      
      // Handle process errors
      child.on('error', (error) => {
        console.error(`[${name}] Process error:`, error.message);
        reject(error);
      });
      
      // Timeout if service doesn't start within 10 seconds
      setTimeout(() => {
        if (!service.started) {
          console.log(`[${name}] Service started (timeout reached)`);
          resolve(service);
        }
      }, 10000);
    });
  }

  /**
   * Install dependencies for a service
   */
  async installDependencies(directory) {
    return new Promise((resolve, reject) => {
      const servicePath = path.join(__dirname, '..', directory);
      
      console.log(`📦 Installing dependencies for ${directory}...`);
      
      const child = spawn('npm', ['install'], {
        cwd: servicePath,
        stdio: 'inherit',
        shell: this.isWindows
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Dependencies installed for ${directory}`);
          resolve();
        } else {
          reject(new Error(`Failed to install dependencies for ${directory} (exit code: ${code})`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Check if dependencies are installed
   */
  checkDependencies(directory) {
    const servicePath = path.join(__dirname, '..', directory);
    const nodeModulesPath = path.join(servicePath, 'node_modules');
    return fs.existsSync(nodeModulesPath);
  }

  /**
   * Stop all services
   */
  stopAll() {
    console.log('\n🛑 Stopping all services...');
    
    this.services.forEach(service => {
      if (service.process && !service.process.killed) {
        console.log(`Stopping ${service.name}...`);
        
        if (this.isWindows) {
          // On Windows, use taskkill to ensure process tree is killed
          spawn('taskkill', ['/pid', service.process.pid, '/t', '/f'], { shell: true });
        } else {
          service.process.kill('SIGTERM');
        }
      }
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
      console.log('Force exiting...');
      process.exit(0);
    }, 5000);
  }

  /**
   * Start all services
   */
  async startAll(options = {}) {
    const { installDeps = false, runClient = false, startFrontend = false } = options;
    
    try {
      console.log('🎯 X402 Facilitator Demo - Starting All Services');
      console.log('=' .repeat(60));
      
      // Install dependencies if requested
      if (installDeps) {
        console.log('\n📦 Installing dependencies...');
        await this.installDependencies('facilitator-server');
        await this.installDependencies('resource-server');
        await this.installDependencies('client-example');
        if (startFrontend) {
          await this.installDependencies('web-frontend');
        }
        console.log('✅ All dependencies installed\n');
      } else {
        // Check if dependencies are installed
        const facilitatorDeps = this.checkDependencies('facilitator-server');
        const resourceDeps = this.checkDependencies('resource-server');
        const clientDeps = this.checkDependencies('client-example');
        const frontendDeps = startFrontend ? this.checkDependencies('web-frontend') : true;
        
        if (!facilitatorDeps || !resourceDeps || !clientDeps || !frontendDeps) {
          console.log('⚠️  Some dependencies may be missing. Run with --install to install them.\n');
        }
      }
      
      // Start facilitator server
      await this.startService(
        'Facilitator',
        'facilitator-server',
        'node',
        ['facilitator.js'],
        3003
      );
      
      // Wait a moment for facilitator to fully start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start resource server
      await this.startService(
        'Resource Server',
        'resource-server',
        'node',
        ['resource-server.js'],
        3004
      );
      
      // Wait a moment for resource server to fully start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start frontend server if requested
      if (startFrontend) {
        console.log('\n🌐 Starting web frontend...');
        await this.startService(
          'Web Frontend',
          'web-frontend',
          'node',
          ['server.js'],
          3005
        );
        
        // Wait a moment for frontend to fully start
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      console.log('\n✅ All services started successfully!');
      console.log('\n🔗 Service URLs:');
      console.log('   Facilitator:     http://localhost:3003');
      console.log('   Resource Server: http://localhost:3004');
      console.log('   API Catalog:     http://localhost:3004/api/catalog');
      if (startFrontend) {
        console.log('   Web Frontend:    http://localhost:3005');
      }
      
      console.log('\n📚 Documentation:');
      console.log('   Main README:     ./docs/README.md');
      console.log('   API Docs:        ./docs/FACILITATOR_API.md');
      console.log('   Workflow:        ./docs/WORKFLOW.md');
      
      // Run client demo if requested
      if (runClient) {
        console.log('\n🎮 Running client demo in 3 seconds...');
        setTimeout(async () => {
          try {
            await this.runClientDemo();
          } catch (error) {
            console.error('Client demo failed:', error.message);
          }
        }, 3000);
      } else {
        console.log('\n🎮 To run the client demo:');
        console.log('   cd client-example && npm start');
        console.log('\n   Or run: node scripts/demo.js');
      }
      
      console.log('\n⏹️  Press Ctrl+C to stop all services');
      
    } catch (error) {
      console.error('❌ Failed to start services:', error.message);
      this.stopAll();
      process.exit(1);
    }
  }

  /**
   * Run client demo
   */
  async runClientDemo() {
    console.log('\n🎮 Starting client demo...');
    
    const child = spawn('node', ['client.js'], {
      cwd: path.join(__dirname, '..', 'client-example'),
      stdio: 'inherit',
      shell: this.isWindows
    });
    
    return new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Client demo completed successfully');
          resolve();
        } else {
          reject(new Error(`Client demo failed (exit code: ${code})`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new ServiceManager();
  
  // Parse command line arguments
  const options = {
    installDeps: args.includes('--install') || args.includes('-i'),
    runClient: args.includes('--demo') || args.includes('-d'),
    startFrontend: args.includes('--frontend') || args.includes('-f')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('X402 Facilitator Demo - Service Manager');
    console.log('');
    console.log('Usage: node start-all.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --install, -i    Install dependencies before starting');
    console.log('  --demo, -d       Run client demo after starting services');
    console.log('  --frontend, -f   Start web frontend server (port 3005)');
    console.log('  --help, -h       Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node start-all.js                # Start all services');
    console.log('  node start-all.js --install      # Install deps and start');
    console.log('  node start-all.js --demo         # Start services and run demo');
    console.log('  node start-all.js --frontend     # Start services and web frontend');
    console.log('  node start-all.js -i -d -f       # Install, start, demo, and frontend');
    process.exit(0);
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Received SIGINT, shutting down...');
    manager.stopAll();
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Received SIGTERM, shutting down...');
    manager.stopAll();
  });
  
  // Start services
  manager.startAll(options);
}

module.exports = ServiceManager;