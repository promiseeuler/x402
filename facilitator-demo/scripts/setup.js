#!/usr/bin/env node

/**
 * Setup Script for X402 Facilitator Demo
 * 
 * This script installs all dependencies for the demo project:
 * - Facilitator server dependencies
 * - Resource server dependencies  
 * - Client example dependencies
 * - Scripts dependencies
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SetupManager {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.projectRoot = path.join(__dirname, '..');
  }

  /**
   * Install dependencies for a specific directory
   */
  async installDependencies(directory, displayName) {
    return new Promise((resolve, reject) => {
      const targetPath = path.join(this.projectRoot, directory);
      
      // Check if directory exists
      if (!fs.existsSync(targetPath)) {
        console.log(`⚠️  Directory not found: ${directory}`);
        resolve();
        return;
      }
      
      // Check if package.json exists
      const packagePath = path.join(targetPath, 'package.json');
      if (!fs.existsSync(packagePath)) {
        console.log(`⚠️  No package.json found in: ${directory}`);
        resolve();
        return;
      }
      
      console.log(`📦 Installing dependencies for ${displayName}...`);
      
      const child = spawn('npm', ['install'], {
        cwd: targetPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: this.isWindows
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
        // Show progress for long installations
        if (data.toString().includes('added') || data.toString().includes('updated')) {
          process.stdout.write('.');
        }
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`\n✅ ${displayName} dependencies installed successfully`);
          resolve();
        } else {
          console.log(`\n❌ Failed to install ${displayName} dependencies`);
          if (errorOutput) {
            console.error('Error output:', errorOutput.trim());
          }
          reject(new Error(`npm install failed for ${directory} (exit code: ${code})`));
        }
      });
      
      child.on('error', (error) => {
        console.error(`❌ Process error for ${displayName}:`, error.message);
        reject(error);
      });
    });
  }

  /**
   * Check Node.js and npm versions
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    return new Promise((resolve) => {
      // Check Node.js version
      const nodeVersion = process.version;
      console.log(`   Node.js: ${nodeVersion}`);
      
      // Check npm version
      const child = spawn('npm', ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: this.isWindows
      });
      
      let npmVersion = '';
      
      child.stdout.on('data', (data) => {
        npmVersion += data.toString().trim();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`   npm: ${npmVersion}`);
          console.log('✅ Prerequisites check passed\n');
        } else {
          console.log('⚠️  Could not determine npm version\n');
        }
        resolve();
      });
      
      child.on('error', () => {
        console.log('⚠️  npm not found in PATH\n');
        resolve();
      });
    });
  }

  /**
   * Create a summary of installed packages
   */
  generateSummary() {
    console.log('\n📋 Installation Summary:');
    console.log('=' .repeat(50));
    
    const components = [
      { dir: 'facilitator-server', name: 'Facilitator Server' },
      { dir: 'resource-server', name: 'Resource Server' },
      { dir: 'client-example', name: 'Client Example' },
      { dir: 'scripts', name: 'Demo Scripts' }
    ];
    
    components.forEach(component => {
      const packagePath = path.join(this.projectRoot, component.dir, 'package.json');
      
      if (fs.existsSync(packagePath)) {
        try {
          const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          const deps = Object.keys(packageData.dependencies || {});
          const devDeps = Object.keys(packageData.devDependencies || {});
          
          console.log(`\n📦 ${component.name}:`);
          if (deps.length > 0) {
            console.log(`   Dependencies: ${deps.join(', ')}`);
          }
          if (devDeps.length > 0) {
            console.log(`   Dev Dependencies: ${devDeps.join(', ')}`);
          }
          
          // Check if node_modules exists
          const nodeModulesPath = path.join(this.projectRoot, component.dir, 'node_modules');
          if (fs.existsSync(nodeModulesPath)) {
            console.log(`   Status: ✅ Installed`);
          } else {
            console.log(`   Status: ❌ Not installed`);
          }
        } catch (error) {
          console.log(`\n📦 ${component.name}: ❌ Error reading package.json`);
        }
      } else {
        console.log(`\n📦 ${component.name}: ⚠️  No package.json found`);
      }
    });
  }

  /**
   * Run the complete setup
   */
  async runSetup(options = {}) {
    const { skipPrereqs = false, verbose = false } = options;
    
    console.log('🚀 X402 Facilitator Demo - Setup');
    console.log('=' .repeat(40));
    console.log('This script will install all dependencies for the demo project.\n');
    
    try {
      // Check prerequisites
      if (!skipPrereqs) {
        await this.checkPrerequisites();
      }
      
      // Install dependencies for each component
      const components = [
        { dir: 'facilitator-server', name: 'Facilitator Server' },
        { dir: 'resource-server', name: 'Resource Server' },
        { dir: 'client-example', name: 'Client Example' },
        { dir: 'scripts', name: 'Demo Scripts' }
      ];
      
      console.log('📦 Installing dependencies...');
      
      for (const component of components) {
        await this.installDependencies(component.dir, component.name);
      }
      
      console.log('\n🎉 Setup completed successfully!');
      
      // Generate summary
      this.generateSummary();
      
      console.log('\n🚀 Next steps:');
      console.log('   1. Start all services:');
      console.log('      cd scripts && npm start');
      console.log('      # or: node scripts/start-all.js');
      console.log('');
      console.log('   2. Run the demo:');
      console.log('      cd scripts && npm run demo');
      console.log('      # or: node scripts/demo.js');
      console.log('');
      console.log('   3. Read the documentation:');
      console.log('      ./docs/README.md');
      console.log('');
      console.log('   4. Start with full demo:');
      console.log('      cd scripts && npm run start:full');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('   • Ensure Node.js and npm are installed');
      console.error('   • Check your internet connection');
      console.error('   • Try running with administrator/sudo privileges');
      console.error('   • Clear npm cache: npm cache clean --force');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const setup = new SetupManager();
  
  // Parse command line arguments
  const options = {
    skipPrereqs: args.includes('--skip-prereqs'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('X402 Facilitator Demo - Setup Script');
    console.log('');
    console.log('Usage: node setup.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --skip-prereqs       Skip prerequisite checks');
    console.log('  --verbose, -v        Show verbose output');
    console.log('  --help, -h           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node setup.js                    # Full setup');
    console.log('  node setup.js --skip-prereqs     # Skip version checks');
    console.log('  node setup.js --verbose          # Verbose output');
    process.exit(0);
  }
  
  // Run setup
  setup.runSetup(options);
}

module.exports = SetupManager;