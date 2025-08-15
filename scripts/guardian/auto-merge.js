#!/usr/bin/env node

/**
 * Guardian Auto-Merge
 * 
 * Handles automatic merging of Guardian-generated PRs
 * with additional safety checks and agent coordination.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GuardianAutoMerge {
  constructor(options = {}) {
    this.prNumber = options['pr-number'] || '';
    this.validationLevel = options.validation || 'standard';
    this.workingDir = process.cwd();
    this.safetyChecks = {
      validationPassed: false,
      noConflicts: false,
      noBreakingChanges: false,
      securityClear: false
    };
  }

  log(message, level = 'info') {
    console.log(`[AUTO-MERGE] ${message}`);
  }

  loadPRInfo() {
    const prInfoPath = path.join(this.workingDir, 'guardian-pr-info.json');
    if (!fs.existsSync(prInfoPath)) {
      throw new Error('PR info not found - cannot proceed with auto-merge');
    }

    return JSON.parse(fs.readFileSync(prInfoPath, 'utf8'));
  }

  async performSafetyChecks(prInfo) {
    this.log('Performing auto-merge safety checks...');
    
    // Check 1: Validation Results
    await this.checkValidationResults(prInfo);
    
    // Check 2: Merge Conflicts
    await this.checkMergeConflicts(prInfo);
    
    // Check 3: Breaking Changes
    await this.checkBreakingChanges(prInfo);
    
    // Check 4: Security (for thorough level)
    if (this.validationLevel === 'thorough') {
      await this.checkSecurity(prInfo);
    } else {
      this.safetyChecks.securityClear = true; // Skip for non-thorough
    }

    return this.safetyChecks;
  }

  async checkValidationResults(prInfo) {
    this.log('Checking validation results...');
    
    const reports = prInfo.reports;
    
    // Static validation must pass
    const staticPassed = reports.staticValidation?.summary?.success || false;
    
    // Runtime validation must pass
    const runtimePassed = reports.runtimeValidation?.summary?.overallSuccess || false;
    
    // For auto-merge, both must pass
    this.safetyChecks.validationPassed = staticPassed && runtimePassed;
    
    if (!this.safetyChecks.validationPassed) {
      this.log(`Validation check failed: static=${staticPassed}, runtime=${runtimePassed}`, 'error');
    } else {
      this.log('Validation check passed');
    }
  }

  async checkMergeConflicts(prInfo) {
    this.log('Checking for merge conflicts...');
    
    try {
      // Fetch latest changes from target branch
      execSync(`git fetch origin ${prInfo.target}`, { 
        cwd: this.workingDir, 
        stdio: 'pipe' 
      });
      
      // Check if merge would have conflicts
      execSync(`git merge-tree $(git merge-base HEAD origin/${prInfo.target}) HEAD origin/${prInfo.target}`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      this.safetyChecks.noConflicts = true;
      this.log('No merge conflicts detected');
    } catch (error) {
      this.safetyChecks.noConflicts = false;
      this.log('Merge conflicts detected or merge-tree failed', 'error');
    }
  }

  async checkBreakingChanges(prInfo) {
    this.log('Checking for breaking changes...');
    
    // Simple heuristic checks for breaking changes
    const reports = prInfo.reports;
    let hasBreakingChanges = false;

    // Check patch analysis
    if (reports.patch?.analysis) {
      const analysis = reports.patch.analysis;
      
      // High complexity changes might be breaking
      if (analysis.complexity === 'high') {
        this.log('High complexity changes detected - potential breaking change', 'warn');
        hasBreakingChanges = true;
      }
      
      // Removal changes might be breaking
      if (analysis.type === 'removal') {
        this.log('Removal changes detected - potential breaking change', 'warn');
        hasBreakingChanges = true;
      }
    }

    // Check if any existing tests failed (would indicate breaking changes)
    if (reports.runtimeValidation?.results?.testSuite?.success === false) {
      this.log('Test suite failed - indicates breaking changes', 'error');
      hasBreakingChanges = true;
    }

    // Check if critical files were modified
    const criticalFiles = ['package.json', 'src/App.js', 'src/index.js'];
    if (reports.patch?.changes) {
      for (const change of reports.patch.changes) {
        if (criticalFiles.includes(change.path) && change.type !== 'create') {
          this.log(`Critical file modified: ${change.path}`, 'warn');
          // Don't consider this breaking for auto-merge, but log it
        }
      }
    }

    this.safetyChecks.noBreakingChanges = !hasBreakingChanges;
    
    if (hasBreakingChanges) {
      this.log('Potential breaking changes detected', 'error');
    } else {
      this.log('No breaking changes detected');
    }
  }

  async checkSecurity(prInfo) {
    this.log('Performing security checks...');
    
    try {
      // Check for dependency vulnerabilities
      const auditResult = execSync('npm audit --audit-level=high --json', {
        cwd: this.workingDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditResult);
      const highVulns = audit.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;
      
      if (highVulns > 0 || criticalVulns > 0) {
        this.log(`Security vulnerabilities found: ${criticalVulns} critical, ${highVulns} high`, 'error');
        this.safetyChecks.securityClear = false;
      } else {
        this.log('No high/critical security vulnerabilities found');
        this.safetyChecks.securityClear = true;
      }
    } catch (error) {
      // If audit fails, we'll be cautious and block auto-merge
      this.log('Security audit failed - blocking auto-merge', 'error');
      this.safetyChecks.securityClear = false;
    }
  }

  canAutoMerge() {
    const required = ['validationPassed', 'noConflicts', 'noBreakingChanges'];
    const requiredPassed = required.every(check => this.safetyChecks[check]);
    
    // For thorough level, security must also pass
    if (this.validationLevel === 'thorough') {
      return requiredPassed && this.safetyChecks.securityClear;
    }
    
    return requiredPassed;
  }

  async performMerge(prInfo) {
    this.log(`Attempting to merge PR #${prInfo.number}...`);
    
    try {
      // Switch to target branch
      execSync(`git checkout ${prInfo.target}`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      // Pull latest changes
      execSync(`git pull origin ${prInfo.target}`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      // Merge the feature branch
      execSync(`git merge --no-ff ${prInfo.branch} -m "Guardian Auto-Merge: ${prInfo.title}"`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      // Push merged changes
      execSync(`git push origin ${prInfo.target}`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      this.log('Merge completed successfully');
      return { success: true, merged: true };
    } catch (error) {
      this.log(`Merge failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async cleanupBranch(prInfo) {
    this.log(`Cleaning up feature branch ${prInfo.branch}...`);
    
    try {
      // Delete local branch
      execSync(`git branch -D ${prInfo.branch}`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      // Delete remote branch
      execSync(`git push origin --delete ${prInfo.branch}`, {
        cwd: this.workingDir,
        stdio: 'pipe'
      });
      
      this.log('Branch cleanup completed');
    } catch (error) {
      this.log(`Branch cleanup failed: ${error.message}`, 'warn');
    }
  }

  generateMergeReport(prInfo, safetyChecks, mergeResult) {
    const report = {
      timestamp: new Date().toISOString(),
      prNumber: prInfo.number,
      branch: prInfo.branch,
      target: prInfo.target,
      validationLevel: this.validationLevel,
      safetyChecks,
      canAutoMerge: this.canAutoMerge(),
      mergeAttempted: !!mergeResult,
      mergeResult: mergeResult || null,
      decision: this.canAutoMerge() ? 'auto-merged' : 'manual-review-required',
      recommendation: this.generateRecommendation()
    };

    const reportPath = path.join(this.workingDir, 'guardian-auto-merge.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Auto-merge report written to ${reportPath}`);

    return report;
  }

  generateRecommendation() {
    if (!this.safetyChecks.validationPassed) {
      return {
        action: 'fix-validation',
        message: 'Fix validation failures before attempting merge'
      };
    }
    
    if (!this.safetyChecks.noConflicts) {
      return {
        action: 'resolve-conflicts',
        message: 'Resolve merge conflicts manually'
      };
    }
    
    if (!this.safetyChecks.noBreakingChanges) {
      return {
        action: 'review-breaking-changes',
        message: 'Review potential breaking changes before merge'
      };
    }
    
    if (!this.safetyChecks.securityClear) {
      return {
        action: 'fix-security',
        message: 'Address security vulnerabilities before merge'
      };
    }

    return {
      action: 'merged',
      message: 'All safety checks passed - auto-merged successfully'
    };
  }

  async notifyAgents(prInfo, report) {
    this.log('Notifying other agents of merge status...');
    
    // In a real implementation, this would send notifications to other Guardian agents
    // or external systems. For now, we'll just log the coordination data.
    
    const coordination = {
      event: 'guardian-auto-merge',
      prNumber: prInfo.number,
      branch: prInfo.branch,
      status: report.decision,
      timestamp: new Date().toISOString(),
      nextActions: report.recommendation.action === 'merged' ? [] : [report.recommendation.action]
    };

    // Save coordination data for other agents
    const coordPath = path.join(this.workingDir, 'guardian-coordination.json');
    fs.writeFileSync(coordPath, JSON.stringify(coordination, null, 2));
    
    this.log(`Agent coordination data saved to ${coordPath}`);
  }

  async run() {
    try {
      this.log(`Starting auto-merge for PR #${this.prNumber}...`);
      
      const prInfo = this.loadPRInfo();
      const safetyChecks = await this.performSafetyChecks(prInfo);
      
      let mergeResult = null;
      
      if (this.canAutoMerge()) {
        this.log('All safety checks passed - proceeding with auto-merge');
        mergeResult = await this.performMerge(prInfo);
        
        if (mergeResult.success) {
          await this.cleanupBranch(prInfo);
        }
      } else {
        this.log('Safety checks failed - auto-merge blocked', 'warn');
        this.log(`Failed checks: ${Object.entries(safetyChecks).filter(([k, v]) => !v).map(([k]) => k).join(', ')}`);
      }

      const report = this.generateMergeReport(prInfo, safetyChecks, mergeResult);
      await this.notifyAgents(prInfo, report);
      
      if (this.canAutoMerge() && mergeResult?.success) {
        this.log('Auto-merge completed successfully');
        return { success: true, merged: true, report };
      } else {
        this.log('Auto-merge not performed - manual review required');
        return { success: true, merged: false, report };
      }
    } catch (error) {
      this.log(`Auto-merge failed: ${error.message}`, 'error');
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
  const autoMerge = new GuardianAutoMerge(options);
  
  autoMerge.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Auto-merge failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianAutoMerge;