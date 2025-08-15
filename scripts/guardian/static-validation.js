#!/usr/bin/env node

/**
 * Guardian Static Validation Phase
 * 
 * Runs static analysis, linting, type checking, and build validation
 * on the generated changes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GuardianStaticValidator {
  constructor(options = {}) {
    this.branchName = options.branch || '';
    this.validationLevel = options.validation || 'standard';
    this.workingDir = process.cwd();
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, level = 'info') {
    console.log(`[STATIC-VAL] ${message}`);
  }

  async runValidation(name, command, required = true) {
    this.log(`Running ${name}...`);
    
    try {
      const result = execSync(command, {
        cwd: this.workingDir,
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      this.results.passed.push({
        name,
        command,
        output: result.trim()
      });

      this.log(`✓ ${name} passed`);
      return { success: true, output: result };
    } catch (error) {
      const failure = {
        name,
        command,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || ''
      };

      if (required) {
        this.results.failed.push(failure);
        this.log(`✗ ${name} failed: ${error.message}`, 'error');
      } else {
        this.results.warnings.push(failure);
        this.log(`⚠ ${name} warning: ${error.message}`, 'warn');
      }

      return { success: false, error: error.message, output: error.stdout || error.stderr || '' };
    }
  }

  async validateSyntax() {
    this.log('Validating JavaScript syntax...');
    
    // Find all JS/JSX files in src directory
    const jsFiles = this.findSourceFiles(['.js', '.jsx']);
    
    if (jsFiles.length === 0) {
      this.log('No JavaScript files found to validate');
      return { success: true };
    }

    // Validate each file syntax
    for (const file of jsFiles) {
      const result = await this.runValidation(
        `Syntax check: ${file}`,
        `node -c "${file}"`,
        true
      );
      
      if (!result.success) {
        return result;
      }
    }

    return { success: true };
  }

  async validateLinting() {
    this.log('Running ESLint validation...');
    
    // Check if ESLint is configured
    const hasEslintConfig = fs.existsSync('.eslintrc.js') || 
                           fs.existsSync('.eslintrc.json') || 
                           fs.existsSync('.eslintrc.yaml') ||
                           fs.existsSync('.eslintrc.yml');

    if (!hasEslintConfig) {
      this.log('No ESLint configuration found, skipping lint check');
      return { success: true };
    }

    // Try different lint commands
    const lintCommands = [
      'npm run lint',
      'npx eslint src/',
      'npx eslint src --ext .js,.jsx'
    ];

    for (const command of lintCommands) {
      try {
        const result = await this.runValidation('ESLint', command, false);
        if (result.success) {
          return result;
        }
      } catch (error) {
        // Try next command
        continue;
      }
    }

    this.log('Could not run ESLint - trying basic syntax validation only');
    return await this.validateSyntax();
  }

  async validateBuild() {
    this.log('Validating build process...');
    
    // Check for build script in package.json
    const packagePath = path.join(this.workingDir, 'package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }

    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const buildScript = packageData.scripts?.build;

    if (!buildScript) {
      this.log('No build script found in package.json');
      return { success: true };
    }

    // Set CI environment to treat warnings as errors
    process.env.CI = 'true';
    
    const result = await this.runValidation(
      'Build validation',
      'npm run build',
      true
    );

    return result;
  }

  async validateTypeScript() {
    this.log('Checking for TypeScript validation...');
    
    // Check if TypeScript is configured
    const hasTsConfig = fs.existsSync('tsconfig.json');
    const packagePath = path.join(this.workingDir, 'package.json');
    
    if (!hasTsConfig) {
      this.log('No TypeScript configuration found, skipping TS validation');
      return { success: true };
    }

    let hasTypeScript = false;
    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      hasTypeScript = packageData.dependencies?.typescript || 
                     packageData.devDependencies?.typescript;
    }

    if (!hasTypeScript) {
      this.log('TypeScript not found in dependencies, skipping TS validation');
      return { success: true };
    }

    // Run TypeScript compiler in check mode
    const result = await this.runValidation(
      'TypeScript validation',
      'npx tsc --noEmit',
      this.validationLevel === 'thorough'
    );

    return result;
  }

  async validateDependencies() {
    this.log('Validating dependencies...');
    
    if (this.validationLevel === 'basic') {
      this.log('Skipping dependency validation (basic level)');
      return { success: true };
    }

    // Run npm audit
    const auditResult = await this.runValidation(
      'Dependency audit',
      'npm audit --audit-level=moderate',
      this.validationLevel === 'thorough'
    );

    // Check for outdated dependencies if thorough
    if (this.validationLevel === 'thorough') {
      await this.runValidation(
        'Outdated dependencies check',
        'npm outdated',
        false // Not required, just informational
      );
    }

    return auditResult;
  }

  async validateFileStructure() {
    this.log('Validating file structure...');
    
    const requiredFiles = ['src/App.js', 'src/index.js', 'public/index.html'];
    const missingFiles = [];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.workingDir, file))) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      const error = `Missing required files: ${missingFiles.join(', ')}`;
      this.results.failed.push({
        name: 'File structure validation',
        error,
        command: 'file existence check'
      });
      this.log(`✗ File structure validation failed: ${error}`, 'error');
      return { success: false, error };
    }

    this.results.passed.push({
      name: 'File structure validation',
      command: 'file existence check',
      output: 'All required files present'
    });

    this.log('✓ File structure validation passed');
    return { success: true };
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
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
        success: this.results.failed.length === 0
      },
      results: this.results
    };

    const reportPath = path.join(this.workingDir, 'guardian-static-validation.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Static validation report written to ${reportPath}`);

    return report;
  }

  async run() {
    try {
      this.log(`Starting static validation (level: ${this.validationLevel})...`);
      
      // Core validations (always run)
      await this.validateFileStructure();
      await this.validateSyntax();
      await this.validateBuild();

      // Standard level validations
      if (this.validationLevel !== 'basic') {
        await this.validateLinting();
        await this.validateTypeScript();
      }

      // Thorough level validations
      if (this.validationLevel === 'thorough') {
        await this.validateDependencies();
      }

      const report = this.generateValidationReport();
      
      if (this.results.failed.length > 0) {
        this.log(`Static validation failed with ${this.results.failed.length} errors`, 'error');
        return { success: false, report };
      } else {
        this.log('Static validation completed successfully');
        return { success: true, report };
      }
    } catch (error) {
      this.log(`Static validation failed: ${error.message}`, 'error');
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
  const validator = new GuardianStaticValidator(options);
  
  validator.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Static validation failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianStaticValidator;