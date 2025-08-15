#!/usr/bin/env node

/**
 * Guardian Critique & Refinement Phase
 * 
 * Analyzes validation failures and attempts to refine the changes
 * to address issues found during static and runtime validation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GuardianCritiqueRefinement {
  constructor(options = {}) {
    this.branchName = options.branch || '';
    this.staticResult = options['static-result'] || 'unknown';
    this.runtimeResult = options['runtime-result'] || 'unknown';
    this.cycle = parseInt(options.cycle) || 1;
    this.workingDir = process.cwd();
    this.maxCycles = 3;
  }

  log(message, level = 'info') {
    console.log(`[CRITIQUE] ${message}`);
  }

  loadValidationResults() {
    const results = {
      static: null,
      runtime: null,
      patch: null
    };

    // Load static validation results
    const staticPath = path.join(this.workingDir, 'guardian-static-validation.json');
    if (fs.existsSync(staticPath)) {
      results.static = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
    }

    // Load runtime validation results
    const runtimePath = path.join(this.workingDir, 'guardian-runtime-validation.json');
    if (fs.existsSync(runtimePath)) {
      results.runtime = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
    }

    // Load patch information
    const patchPath = path.join(this.workingDir, 'guardian-patch.json');
    if (fs.existsSync(patchPath)) {
      results.patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
    }

    return results;
  }

  analyzeFailures(results) {
    this.log('Analyzing validation failures...');
    
    const analysis = {
      issues: [],
      categories: {
        syntax: [],
        build: [],
        lint: [],
        test: [],
        runtime: [],
        dependency: []
      },
      severity: 'low',
      fixable: true
    };

    // Analyze static validation failures
    if (results.static?.results?.failed) {
      for (const failure of results.static.results.failed) {
        const issue = {
          type: 'static',
          name: failure.name,
          error: failure.error,
          command: failure.command,
          category: this.categorizeIssue(failure)
        };
        
        analysis.issues.push(issue);
        analysis.categories[issue.category].push(issue);
      }
    }

    // Analyze runtime validation failures
    if (results.runtime && !results.runtime.summary.overallSuccess) {
      if (results.runtime.results.smokeTest?.success === false) {
        analysis.issues.push({
          type: 'runtime',
          name: 'Smoke Test Failure',
          error: results.runtime.results.smokeTest.error,
          category: 'runtime'
        });
      }

      if (results.runtime.results.testSuite?.success === false) {
        analysis.issues.push({
          type: 'runtime',
          name: 'Test Suite Failure',
          error: results.runtime.results.testSuite.error,
          category: 'test'
        });
      }
    }

    // Determine severity
    if (analysis.categories.syntax.length > 0 || analysis.categories.build.length > 0) {
      analysis.severity = 'high';
    } else if (analysis.categories.test.length > 0 || analysis.categories.runtime.length > 0) {
      analysis.severity = 'medium';
    }

    // Determine if fixable
    analysis.fixable = this.isFixable(analysis);

    this.log(`Found ${analysis.issues.length} issues (severity: ${analysis.severity})`);
    return analysis;
  }

  categorizeIssue(failure) {
    const error = failure.error.toLowerCase();
    const name = failure.name.toLowerCase();

    if (name.includes('syntax') || error.includes('syntax error')) {
      return 'syntax';
    }
    if (name.includes('build') || error.includes('build failed')) {
      return 'build';
    }
    if (name.includes('eslint') || name.includes('lint')) {
      return 'lint';
    }
    if (name.includes('test') || error.includes('test')) {
      return 'test';
    }
    if (name.includes('audit') || error.includes('vulnerability')) {
      return 'dependency';
    }
    
    return 'runtime';
  }

  isFixable(analysis) {
    // Some issues are generally fixable
    const fixableCategories = ['lint', 'syntax', 'dependency'];
    const hasFixableIssues = fixableCategories.some(cat => analysis.categories[cat].length > 0);
    
    // Build failures might be fixable depending on the error
    const buildIssues = analysis.categories.build;
    const fixableBuildIssues = buildIssues.filter(issue => 
      issue.error.includes('lint') || 
      issue.error.includes('warning') ||
      issue.error.includes('syntax')
    );

    return hasFixableIssues || fixableBuildIssues.length > 0;
  }

  generateRefinements(analysis, results) {
    this.log('Generating refinement strategies...');
    
    const refinements = [];

    // Fix linting issues
    if (analysis.categories.lint.length > 0) {
      refinements.push({
        type: 'lint-fix',
        description: 'Apply automatic lint fixes',
        commands: [
          'npx eslint src/ --fix',
          'npm run lint -- --fix'
        ],
        files: this.findAffectedFiles(analysis.categories.lint)
      });
    }

    // Fix syntax issues
    if (analysis.categories.syntax.length > 0) {
      refinements.push({
        type: 'syntax-fix',
        description: 'Fix syntax errors in generated code',
        action: 'manual-review',
        files: this.findAffectedFiles(analysis.categories.syntax)
      });
    }

    // Fix dependency issues
    if (analysis.categories.dependency.length > 0) {
      refinements.push({
        type: 'dependency-fix',
        description: 'Update vulnerable dependencies',
        commands: [
          'npm audit fix',
          'npm update'
        ]
      });
    }

    // Fix build issues
    if (analysis.categories.build.length > 0) {
      const buildIssue = analysis.categories.build[0];
      if (buildIssue.error.includes('lint')) {
        refinements.push({
          type: 'build-lint-fix',
          description: 'Fix build failure caused by linting',
          commands: ['npx eslint src/ --fix']
        });
      } else if (buildIssue.error.includes('warning')) {
        refinements.push({
          type: 'build-warning-fix',
          description: 'Address build warnings',
          action: 'reduce-warnings'
        });
      }
    }

    // Fix test failures
    if (analysis.categories.test.length > 0) {
      refinements.push({
        type: 'test-fix',
        description: 'Update tests to match changes',
        action: 'update-tests',
        note: 'This may require manual intervention'
      });
    }

    // Fix runtime issues
    if (analysis.categories.runtime.length > 0) {
      refinements.push({
        type: 'runtime-fix',
        description: 'Fix runtime errors in components',
        action: 'component-review',
        files: results.patch?.changes?.map(c => c.path) || []
      });
    }

    return refinements;
  }

  findAffectedFiles(issues) {
    const files = new Set();
    
    for (const issue of issues) {
      if (issue.command && issue.command.includes('"')) {
        // Extract file path from command
        const match = issue.command.match(/"([^"]+)"/);
        if (match) {
          files.add(match[1]);
        }
      }
    }

    return Array.from(files);
  }

  async applyRefinements(refinements) {
    this.log(`Applying ${refinements.length} refinements...`);
    
    const results = [];

    for (const refinement of refinements) {
      try {
        const result = await this.applyRefinement(refinement);
        results.push({ ...refinement, result, success: true });
        this.log(`✓ Applied: ${refinement.description}`);
      } catch (error) {
        results.push({ ...refinement, error: error.message, success: false });
        this.log(`✗ Failed: ${refinement.description} - ${error.message}`, 'error');
      }
    }

    return results;
  }

  async applyRefinement(refinement) {
    switch (refinement.type) {
      case 'lint-fix':
        return await this.applyLintFix(refinement);
      
      case 'dependency-fix':
        return await this.applyDependencyFix(refinement);
      
      case 'build-lint-fix':
        return await this.applyBuildLintFix(refinement);
      
      case 'syntax-fix':
        return await this.applySyntaxFix(refinement);
      
      case 'build-warning-fix':
        return await this.applyBuildWarningFix(refinement);
      
      default:
        throw new Error(`Unknown refinement type: ${refinement.type}`);
    }
  }

  async applyLintFix(refinement) {
    const commands = refinement.commands || ['npx eslint src/ --fix'];
    
    for (const command of commands) {
      try {
        const result = execSync(command, {
          cwd: this.workingDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });
        return { command, output: result };
      } catch (error) {
        // Try next command if available
        if (commands.indexOf(command) === commands.length - 1) {
          throw error;
        }
      }
    }
  }

  async applyDependencyFix(refinement) {
    const commands = refinement.commands || ['npm audit fix'];
    let lastError;

    for (const command of commands) {
      try {
        const result = execSync(command, {
          cwd: this.workingDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });
        return { command, output: result };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('All dependency fix commands failed');
  }

  async applyBuildLintFix(refinement) {
    // This is similar to lint fix but specifically for build issues
    return await this.applyLintFix(refinement);
  }

  async applySyntaxFix(refinement) {
    // For syntax fixes, we'll try some basic automated fixes
    const files = refinement.files || [];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        try {
          let content = fs.readFileSync(file, 'utf8');
          
          // Basic syntax fixes
          content = this.applySyntaxFixesToContent(content);
          
          fs.writeFileSync(file, content);
        } catch (error) {
          this.log(`Warning: Could not fix syntax in ${file}: ${error.message}`, 'warn');
        }
      }
    }

    return { action: 'syntax-fixes-applied', files };
  }

  applySyntaxFixesToContent(content) {
    // Basic syntax fixes - in a real implementation this would be more sophisticated
    
    // Fix missing semicolons (very basic)
    content = content.replace(/(\w+)\n/g, (match, p1) => {
      if (!p1.endsWith(';') && !p1.endsWith('{') && !p1.endsWith('}')) {
        return p1 + ';\n';
      }
      return match;
    });

    // Fix common React import issues
    if (content.includes('createElement') && !content.includes('import React')) {
      content = "import React from 'react';\n" + content;
    }

    return content;
  }

  async applyBuildWarningFix(refinement) {
    // Try to reduce build warnings by applying common fixes
    const fixes = [];

    // Check for unused variables in recently created files
    const patch = this.loadPatchInfo();
    if (patch?.changes) {
      for (const change of patch.changes) {
        if (change.type === 'create' && fs.existsSync(change.path)) {
          try {
            let content = fs.readFileSync(change.path, 'utf8');
            const originalContent = content;
            
            // Remove unused imports/variables (basic implementation)
            content = this.removeUnusedImports(content);
            
            if (content !== originalContent) {
              fs.writeFileSync(change.path, content);
              fixes.push(change.path);
            }
          } catch (error) {
            // Ignore errors for individual files
          }
        }
      }
    }

    return { action: 'warning-fixes-applied', files: fixes };
  }

  removeUnusedImports(content) {
    // Very basic unused import removal
    const lines = content.split('\n');
    const importLines = lines.filter(line => line.trim().startsWith('import'));
    const codeContent = lines.filter(line => !line.trim().startsWith('import')).join('\n');
    
    const usedImports = importLines.filter(importLine => {
      const match = importLine.match(/import\s+(?:\{([^}]+)\}|\w+)/);
      if (match) {
        const imported = match[1] || match[0];
        return codeContent.includes(imported.trim());
      }
      return true; // Keep if we can't parse
    });

    return [...usedImports, '', ...lines.filter(line => !line.trim().startsWith('import'))].join('\n');
  }

  loadPatchInfo() {
    const patchPath = path.join(this.workingDir, 'guardian-patch.json');
    if (fs.existsSync(patchPath)) {
      return JSON.parse(fs.readFileSync(patchPath, 'utf8'));
    }
    return null;
  }

  async commitRefinements(refinementResults) {
    this.log('Committing refinements...');
    
    try {
      execSync('git add .', { cwd: this.workingDir, stdio: 'pipe' });
      
      const commitMessage = `Guardian Refinement Cycle ${this.cycle}

Applied ${refinementResults.length} refinements:
${refinementResults.map(r => `- ${r.description} (${r.success ? 'success' : 'failed'})`).join('\n')}

[skip ci]`;

      execSync(`git commit -m "${commitMessage}"`, { cwd: this.workingDir, stdio: 'pipe' });
      this.log('Refinements committed successfully');
    } catch (error) {
      if (error.message.includes('nothing to commit')) {
        this.log('No changes to commit after refinements');
      } else {
        throw new Error(`Failed to commit refinements: ${error.message}`);
      }
    }
  }

  generateCritiqueReport(analysis, refinements, refinementResults) {
    const report = {
      timestamp: new Date().toISOString(),
      cycle: this.cycle,
      branch: this.branchName,
      staticResult: this.staticResult,
      runtimeResult: this.runtimeResult,
      analysis,
      refinements,
      refinementResults,
      success: refinementResults.every(r => r.success),
      recommendation: this.generateRecommendation(analysis, refinementResults)
    };

    const reportPath = path.join(this.workingDir, `guardian-critique-cycle-${this.cycle}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Critique report written to ${reportPath}`);

    return report;
  }

  generateRecommendation(analysis, refinementResults) {
    const successfulRefinements = refinementResults.filter(r => r.success).length;
    const totalRefinements = refinementResults.length;

    if (successfulRefinements === totalRefinements && totalRefinements > 0) {
      return {
        action: 'retry-validation',
        confidence: 'high',
        message: 'All refinements applied successfully. Retry validation.'
      };
    } else if (successfulRefinements > totalRefinements / 2) {
      return {
        action: 'retry-validation',
        confidence: 'medium',
        message: 'Most refinements applied. Retry validation with caution.'
      };
    } else if (this.cycle >= this.maxCycles) {
      return {
        action: 'manual-review',
        confidence: 'low',
        message: 'Max refinement cycles reached. Manual review required.'
      };
    } else {
      return {
        action: 'continue-refinement',
        confidence: 'medium',
        message: 'Some refinements failed. Continue with next cycle.'
      };
    }
  }

  async run() {
    try {
      this.log(`Starting critique & refinement cycle ${this.cycle}...`);
      
      if (this.cycle > this.maxCycles) {
        throw new Error(`Maximum refinement cycles (${this.maxCycles}) exceeded`);
      }

      const results = this.loadValidationResults();
      const analysis = this.analyzeFailures(results);
      
      if (analysis.issues.length === 0) {
        this.log('No issues found to refine');
        return { success: true, skipped: true };
      }

      if (!analysis.fixable) {
        this.log('Issues found are not automatically fixable');
        return { success: false, reason: 'not-fixable', analysis };
      }

      const refinements = this.generateRefinements(analysis, results);
      const refinementResults = await this.applyRefinements(refinements);
      
      await this.commitRefinements(refinementResults);
      
      const report = this.generateCritiqueReport(analysis, refinements, refinementResults);
      
      const success = refinementResults.every(r => r.success);
      if (success) {
        this.log('Critique & refinement completed successfully');
      } else {
        this.log('Some refinements failed', 'error');
      }
      
      return { success, report };
    } catch (error) {
      this.log(`Critique & refinement failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
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
  const critique = new GuardianCritiqueRefinement(options);
  
  critique.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Critique & refinement failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianCritiqueRefinement;