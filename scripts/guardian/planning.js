#!/usr/bin/env node

/**
 * Guardian Planning Phase
 * 
 * Analyzes the change request and creates a detailed implementation plan
 * with validation checkpoints and rollback strategies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GuardianPlanner {
  constructor(options = {}) {
    this.request = options.request || process.env.CHANGE_REQUEST || '';
    this.targetBranch = options.target || 'main';
    this.validationLevel = options.validation || 'standard';
    this.outputPath = options.output || 'guardian-plan.json';
  }

  log(message) {
    console.log(`[PLANNING] ${message}`);
  }

  analyzeRepository() {
    this.log('Analyzing repository structure...');
    
    const repoAnalysis = {
      packageJson: this.analyzePackageJson(),
      sourceStructure: this.analyzeSourceStructure(),
      testingFramework: this.detectTestingFramework(),
      buildSystem: this.analyzeBuildSystem(),
      lintingSetup: this.analyzeLintingSetup(),
      dependencies: this.analyzeDependencies()
    };

    return repoAnalysis;
  }

  analyzePackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      return {
        name: packageData.name,
        scripts: packageData.scripts || {},
        dependencies: Object.keys(packageData.dependencies || {}),
        devDependencies: Object.keys(packageData.devDependencies || {}),
        framework: this.detectFramework(packageData)
      };
    } catch (error) {
      this.log(`Warning: Could not analyze package.json: ${error.message}`);
      return {};
    }
  }

  detectFramework(packageData) {
    const deps = { ...packageData.dependencies, ...packageData.devDependencies };
    
    if (deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps.angular) return 'angular';
    if (deps.svelte) return 'svelte';
    
    return 'unknown';
  }

  analyzeSourceStructure() {
    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) {
      return { structure: 'no-src-dir', files: [] };
    }

    const getDirectoryStructure = (dir, maxDepth = 3, currentDepth = 0) => {
      if (currentDepth >= maxDepth) return [];
      
      try {
        return fs.readdirSync(dir, { withFileTypes: true })
          .filter(dirent => !dirent.name.startsWith('.'))
          .map(dirent => {
            const fullPath = path.join(dir, dirent.name);
            const relativePath = path.relative(process.cwd(), fullPath);
            
            if (dirent.isDirectory()) {
              return {
                type: 'directory',
                path: relativePath,
                children: getDirectoryStructure(fullPath, maxDepth, currentDepth + 1)
              };
            } else {
              return {
                type: 'file',
                path: relativePath,
                extension: path.extname(dirent.name)
              };
            }
          });
      } catch (error) {
        return [];
      }
    };

    return {
      structure: 'src-based',
      files: getDirectoryStructure(srcDir)
    };
  }

  detectTestingFramework() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      return { framework: 'none', hasTests: false };
    }

    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const allDeps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      if (allDeps.jest || allDeps['@testing-library/react']) {
        return { framework: 'jest', hasTests: this.hasTestFiles() };
      }
      if (allDeps.vitest) {
        return { framework: 'vitest', hasTests: this.hasTestFiles() };
      }
      if (allDeps.mocha) {
        return { framework: 'mocha', hasTests: this.hasTestFiles() };
      }
      
      return { framework: 'none', hasTests: this.hasTestFiles() };
    } catch (error) {
      return { framework: 'unknown', hasTests: false };
    }
  }

  hasTestFiles() {
    const testPatterns = [
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
      '**/*.spec.ts',
      '**/*.spec.tsx'
    ];

    try {
      const result = execSync('find . -name "*.test.*" -o -name "*.spec.*" | head -5', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  analyzeBuildSystem() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      return { system: 'unknown' };
    }

    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const scripts = packageData.scripts || {};
      
      if (scripts.build && packageData.dependencies?.['react-scripts']) {
        return { system: 'create-react-app', buildCommand: 'npm run build' };
      }
      if (scripts.build && packageData.devDependencies?.vite) {
        return { system: 'vite', buildCommand: 'npm run build' };
      }
      if (scripts.build && packageData.devDependencies?.webpack) {
        return { system: 'webpack', buildCommand: 'npm run build' };
      }
      
      return { system: 'custom', buildCommand: scripts.build ? 'npm run build' : null };
    } catch (error) {
      return { system: 'unknown' };
    }
  }

  analyzeLintingSetup() {
    const hasEslint = fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json') || 
                     fs.existsSync('.eslintrc.yaml') || fs.existsSync('.eslintrc.yml');
    const hasPrettier = fs.existsSync('.prettierrc') || fs.existsSync('.prettierrc.json');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    let lintScript = null;
    
    if (fs.existsSync(packagePath)) {
      try {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const scripts = packageData.scripts || {};
        if (scripts.lint) lintScript = 'npm run lint';
        else if (scripts['lint:fix']) lintScript = 'npm run lint:fix';
      } catch (error) {
        // Ignore
      }
    }

    return {
      hasEslint,
      hasPrettier,
      lintCommand: lintScript
    };
  }

  analyzeDependencies() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      return { outdated: [], vulnerable: [] };
    }

    // For now, return empty arrays. In a real implementation,
    // we would run npm audit and npm outdated
    return {
      outdated: [],
      vulnerable: []
    };
  }

  createImplementationPlan() {
    this.log('Creating implementation plan...');
    
    const repoAnalysis = this.analyzeRepository();
    
    const plan = {
      metadata: {
        timestamp: new Date().toISOString(),
        request: this.request,
        targetBranch: this.targetBranch,
        validationLevel: this.validationLevel,
        guardianVersion: '1.0.0'
      },
      repository: repoAnalysis,
      phases: this.generatePhases(repoAnalysis),
      validationChecks: this.generateValidationChecks(repoAnalysis),
      rollbackStrategy: this.generateRollbackStrategy(),
      riskAssessment: this.assessRisks(repoAnalysis),
      estimatedDuration: this.estimateDuration()
    };

    return plan;
  }

  generatePhases(repoAnalysis) {
    const phases = [
      {
        name: 'preparation',
        description: 'Set up working branch and backup current state',
        estimatedMinutes: 2,
        checks: ['branch-creation', 'backup-current-state']
      },
      {
        name: 'implementation',
        description: 'Apply changes according to the request',
        estimatedMinutes: 10,
        checks: ['syntax-validation', 'dependency-check']
      },
      {
        name: 'static-validation',
        description: 'Run linting, type checking, and static analysis',
        estimatedMinutes: 5,
        checks: ['lint-check', 'build-check']
      }
    ];

    // Add runtime validation for non-basic levels
    if (this.validationLevel !== 'basic') {
      phases.push({
        name: 'runtime-validation',
        description: 'Run tests and smoke tests',
        estimatedMinutes: 8,
        checks: repoAnalysis.testingFramework.hasTests ? 
          ['test-suite', 'smoke-test'] : ['smoke-test-only']
      });
    }

    // Add thorough checks for thorough level
    if (this.validationLevel === 'thorough') {
      phases.push({
        name: 'security-validation',
        description: 'Run security and dependency audits',
        estimatedMinutes: 5,
        checks: ['audit-check', 'security-scan']
      });
    }

    return phases;
  }

  generateValidationChecks(repoAnalysis) {
    const checks = {
      'branch-creation': {
        description: 'Create working branch',
        command: 'git checkout -b {branchName}',
        required: true
      },
      'backup-current-state': {
        description: 'Create backup of current state',
        command: 'git stash push -m "Guardian backup"',
        required: false
      },
      'syntax-validation': {
        description: 'Check JavaScript/TypeScript syntax',
        command: 'node -c {files}',
        required: true
      },
      'lint-check': {
        description: 'Run ESLint validation',
        command: repoAnalysis.lintingSetup.lintCommand || 'echo "No linting configured"',
        required: repoAnalysis.lintingSetup.hasEslint
      },
      'build-check': {
        description: 'Verify project builds successfully',
        command: repoAnalysis.buildSystem.buildCommand || 'npm run build',
        required: true
      }
    };

    // Add test checks if tests exist
    if (repoAnalysis.testingFramework.hasTests) {
      checks['test-suite'] = {
        description: 'Run existing test suite',
        command: 'npm test -- --watchAll=false --passWithNoTests',
        required: true
      };
    }

    // Always add smoke test
    checks['smoke-test'] = {
      description: 'Run basic smoke test',
      command: 'node scripts/guardian/smoke.js',
      required: true
    };

    if (this.validationLevel === 'thorough') {
      checks['audit-check'] = {
        description: 'Check for security vulnerabilities',
        command: 'npm audit --audit-level=moderate',
        required: false
      };
      checks['security-scan'] = {
        description: 'Basic security scanning',
        command: 'echo "Security scan placeholder"',
        required: false
      };
    }

    return checks;
  }

  generateRollbackStrategy() {
    return {
      method: 'git-reset',
      steps: [
        'git checkout {originalBranch}',
        'git branch -D {workingBranch}',
        'git stash pop (if backup exists)'
      ],
      automaticTriggers: [
        'build-failure',
        'test-failure-critical',
        'timeout-exceeded'
      ]
    };
  }

  assessRisks(repoAnalysis) {
    const risks = [];
    
    if (!repoAnalysis.testingFramework.hasTests) {
      risks.push({
        level: 'medium',
        description: 'No existing tests detected - only smoke testing available',
        mitigation: 'Generate comprehensive smoke test'
      });
    }

    if (!repoAnalysis.lintingSetup.hasEslint) {
      risks.push({
        level: 'low',
        description: 'No ESLint configuration found',
        mitigation: 'Use basic syntax validation'
      });
    }

    if (repoAnalysis.buildSystem.system === 'unknown') {
      risks.push({
        level: 'high',
        description: 'Build system not recognized',
        mitigation: 'Manual validation required'
      });
    }

    return risks;
  }

  estimateDuration() {
    const baseDuration = 15; // minutes
    const validationLevelMultiplier = {
      'basic': 0.8,
      'standard': 1.0,
      'thorough': 1.5
    };

    return Math.ceil(baseDuration * validationLevelMultiplier[this.validationLevel]);
  }

  savePlan(plan) {
    fs.writeFileSync(this.outputPath, JSON.stringify(plan, null, 2));
    this.log(`Plan saved to ${this.outputPath}`);
  }

  async run() {
    try {
      this.log('Starting planning phase...');
      
      if (!this.request) {
        throw new Error('No change request provided');
      }

      const plan = this.createImplementationPlan();
      this.savePlan(plan);
      
      this.log('Planning phase completed successfully');
      return plan;
    } catch (error) {
      this.log(`Planning failed: ${error.message}`);
      throw error;
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
  const planner = new GuardianPlanner(options);
  
  planner.run().catch(error => {
    console.error('Planning failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianPlanner;