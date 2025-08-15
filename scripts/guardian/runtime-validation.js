#!/usr/bin/env node

/**
 * Guardian Runtime Validation Phase
 * 
 * Runs tests, smoke tests, and runtime checks on the generated changes.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class GuardianRuntimeValidator {
  constructor(options = {}) {
    this.branchName = options.branch || '';
    this.validationLevel = options.validation || 'standard';
    this.workingDir = process.cwd();
    this.results = {
      testSuite: null,
      smokeTest: null,
      performanceTest: null,
      warnings: []
    };
  }

  log(message, level = 'info') {
    console.log(`[RUNTIME-VAL] ${message}`);
  }

  async runCommand(name, command, options = {}) {
    this.log(`Running ${name}...`);
    
    const defaultOptions = {
      cwd: this.workingDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB
      timeout: 300000 // 5 minutes
    };
    
    const execOptions = { ...defaultOptions, ...options };
    
    try {
      const result = execSync(command, execOptions);
      this.log(`✓ ${name} passed`);
      return { success: true, output: result.toString() };
    } catch (error) {
      this.log(`✗ ${name} failed: ${error.message}`, 'error');
      return { 
        success: false, 
        error: error.message,
        output: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || ''
      };
    }
  }

  async runExistingTests() {
    this.log('Checking for existing test suite...');
    
    // Check if there are any test files
    const testFiles = this.findTestFiles();
    if (testFiles.length === 0) {
      this.log('No existing test files found');
      return { success: true, skipped: true, reason: 'No test files found' };
    }

    this.log(`Found ${testFiles.length} test files`);
    
    // Check package.json for test script
    const packagePath = path.join(this.workingDir, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return { success: false, error: 'package.json not found' };
    }

    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const testScript = packageData.scripts?.test;

    if (!testScript) {
      this.log('No test script found in package.json');
      return { success: true, skipped: true, reason: 'No test script configured' };
    }

    // Run tests with no-watch flag for CI
    const testCommand = testScript.includes('react-scripts') 
      ? 'npm test -- --watchAll=false --passWithNoTests --verbose'
      : 'npm test';

    const result = await this.runCommand('Test Suite', testCommand, { timeout: 600000 }); // 10 minutes
    this.results.testSuite = result;
    
    return result;
  }

  async runSmokeTest() {
    this.log('Running smoke test...');
    
    const smokeTestPath = path.join(this.workingDir, 'scripts/guardian/smoke.js');
    if (!fs.existsSync(smokeTestPath)) {
      return { success: false, error: 'Smoke test script not found' };
    }

    const result = await this.runCommand('Smoke Test', `node ${smokeTestPath}`);
    this.results.smokeTest = result;
    
    return result;
  }

  async runPerformanceTest() {
    if (this.validationLevel !== 'thorough') {
      this.log('Skipping performance test (not thorough level)');
      return { success: true, skipped: true };
    }

    this.log('Running performance test...');
    
    try {
      // Simple performance test - measure build time
      const startTime = Date.now();
      const buildResult = await this.runCommand(
        'Performance - Build Time', 
        'npm run build',
        { timeout: 600000 }
      );
      const buildTime = Date.now() - startTime;
      
      this.results.performanceTest = {
        success: buildResult.success,
        buildTimeMs: buildTime,
        buildTimeSec: Math.round(buildTime / 1000 * 100) / 100
      };

      if (buildTime > 120000) { // 2 minutes
        this.results.warnings.push({
          type: 'performance',
          message: `Build time is slow: ${this.results.performanceTest.buildTimeSec}s`
        });
      }

      this.log(`Build completed in ${this.results.performanceTest.buildTimeSec}s`);
      return this.results.performanceTest;
    } catch (error) {
      this.results.performanceTest = { success: false, error: error.message };
      return this.results.performanceTest;
    }
  }

  async runBundleAnalysis() {
    if (this.validationLevel !== 'thorough') {
      return { success: true, skipped: true };
    }

    this.log('Analyzing bundle size...');
    
    const buildDir = path.join(this.workingDir, 'build');
    if (!fs.existsSync(buildDir)) {
      return { success: false, error: 'Build directory not found' };
    }

    try {
      // Analyze build directory
      const staticDir = path.join(buildDir, 'static');
      if (!fs.existsSync(staticDir)) {
        return { success: true, warning: 'Static build directory not found' };
      }

      const jsDir = path.join(staticDir, 'js');
      const cssDir = path.join(staticDir, 'css');
      
      let totalJsSize = 0;
      let totalCssSize = 0;

      if (fs.existsSync(jsDir)) {
        const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
          const stats = fs.statSync(path.join(jsDir, file));
          totalJsSize += stats.size;
        }
      }

      if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
        for (const file of cssFiles) {
          const stats = fs.statSync(path.join(cssDir, file));
          totalCssSize += stats.size;
        }
      }

      const bundleAnalysis = {
        totalJsSize,
        totalCssSize,
        totalJsSizeKB: Math.round(totalJsSize / 1024 * 100) / 100,
        totalCssSizeKB: Math.round(totalCssSize / 1024 * 100) / 100
      };

      // Warn about large bundles
      if (totalJsSize > 500 * 1024) { // 500KB
        this.results.warnings.push({
          type: 'bundle-size',
          message: `Large JavaScript bundle: ${bundleAnalysis.totalJsSizeKB}KB`
        });
      }

      this.log(`Bundle analysis: JS ${bundleAnalysis.totalJsSizeKB}KB, CSS ${bundleAnalysis.totalCssSizeKB}KB`);
      return { success: true, analysis: bundleAnalysis };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async runAccessibilityCheck() {
    if (this.validationLevel === 'basic') {
      return { success: true, skipped: true };
    }

    this.log('Running basic accessibility checks...');
    
    // This is a placeholder for accessibility checking
    // In a real implementation, you might use tools like axe-core
    
    const srcFiles = this.findSourceFiles(['.js', '.jsx']);
    const accessibilityIssues = [];

    for (const file of srcFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic checks for common accessibility issues
        if (content.includes('<img') && !content.includes('alt=')) {
          accessibilityIssues.push(`${file}: Image without alt attribute`);
        }
        
        if (content.includes('<button') && content.includes('onClick') && !content.includes('onKeyPress')) {
          // This is a very basic check - real accessibility testing would be more sophisticated
          accessibilityIssues.push(`${file}: Button may need keyboard support`);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    if (accessibilityIssues.length > 0) {
      this.results.warnings.push({
        type: 'accessibility',
        issues: accessibilityIssues
      });
      this.log(`Found ${accessibilityIssues.length} potential accessibility issues`);
    }

    return { success: true, issues: accessibilityIssues };
  }

  findTestFiles() {
    const testExtensions = ['.test.js', '.test.jsx', '.spec.js', '.spec.jsx'];
    const files = [];
    
    const searchDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          searchDir(fullPath);
        } else if (entry.isFile()) {
          const hasTestExtension = testExtensions.some(ext => entry.name.includes(ext));
          if (hasTestExtension) {
            files.push(fullPath);
          }
        }
      }
    };

    searchDir(this.workingDir);
    return files;
  }

  findSourceFiles(extensions) {
    const files = [];
    
    const searchDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          searchDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    searchDir(path.join(this.workingDir, 'src'));
    return files;
  }

  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      branch: this.branchName,
      validationLevel: this.validationLevel,
      summary: {
        testSuitePassed: this.results.testSuite?.success !== false,
        smokeTestPassed: this.results.smokeTest?.success === true,
        performanceTestPassed: this.results.performanceTest?.success !== false,
        warningCount: this.results.warnings.length,
        overallSuccess: this.isOverallSuccess()
      },
      results: this.results
    };

    const reportPath = path.join(this.workingDir, 'guardian-runtime-validation.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Runtime validation report written to ${reportPath}`);

    return report;
  }

  isOverallSuccess() {
    // Required: smoke test must pass
    if (this.results.smokeTest?.success !== true) {
      return false;
    }

    // If test suite exists and ran, it must pass
    if (this.results.testSuite && !this.results.testSuite.skipped && !this.results.testSuite.success) {
      return false;
    }

    // Performance test failure is not blocking for standard level
    if (this.validationLevel === 'thorough' && this.results.performanceTest?.success === false) {
      return false;
    }

    return true;
  }

  async run() {
    try {
      this.log(`Starting runtime validation (level: ${this.validationLevel})...`);
      
      // Core validations
      await this.runSmokeTest();
      await this.runExistingTests();

      // Additional validations based on level
      if (this.validationLevel !== 'basic') {
        await this.runAccessibilityCheck();
        await this.runBundleAnalysis();
      }

      if (this.validationLevel === 'thorough') {
        await this.runPerformanceTest();
      }

      const report = this.generateValidationReport();
      const success = this.isOverallSuccess();
      
      if (success) {
        this.log('Runtime validation completed successfully');
      } else {
        this.log('Runtime validation failed', 'error');
      }
      
      return { success, report };
    } catch (error) {
      this.log(`Runtime validation failed: ${error.message}`, 'error');
      const report = this.generateValidationReport();
      return { success: false, error: error.message, report };
    }
  }
}

// CLI handling
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    options[key] = value;
  }
  
  return options;
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  const validator = new GuardianRuntimeValidator(options);
  
  validator.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Runtime validation failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianRuntimeValidator;