#!/usr/bin/env node

/**
 * Guardian Cleanup
 * 
 * Handles cleanup of Guardian workflow artifacts and state
 * in case of failures or completion.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GuardianCleanup {
  constructor(options = {}) {
    this.branchName = options.branch || '';
    this.keepArtifacts = options['keep-artifacts'] === 'true';
    this.workingDir = process.cwd();
    this.artifactPatterns = [
      'guardian-*.json',
      'guardian-*.log',
      'guardian-artifacts/',
      '.guardian-*'
    ];
  }

  log(message, level = 'info') {
    console.log(`[CLEANUP] ${message}`);
  }

  async cleanupBranch() {
    if (!this.branchName) {
      this.log('No branch name provided, skipping branch cleanup');
      return;
    }

    this.log(`Cleaning up branch: ${this.branchName}`);
    
    try {
      // Get current branch
      const currentBranch = execSync('git branch --show-current', {
        cwd: this.workingDir,
        encoding: 'utf8'
      }).trim();

      // If we're on the Guardian branch, switch to main
      if (currentBranch === this.branchName) {
        this.log('Switching from Guardian branch to main');
        try {
          execSync('git checkout main', {
            cwd: this.workingDir,
            stdio: 'pipe'
          });
        } catch (error) {
          this.log('Could not switch to main branch, trying master', 'warn');
          execSync('git checkout master', {
            cwd: this.workingDir,
            stdio: 'pipe'
          });
        }
      }

      // Delete local branch if it exists
      try {
        execSync(`git branch -D ${this.branchName}`, {
          cwd: this.workingDir,
          stdio: 'pipe'
        });
        this.log(`Deleted local branch: ${this.branchName}`);
      } catch (error) {
        this.log(`Could not delete local branch: ${error.message}`, 'warn');
      }

      // Delete remote branch if it exists
      try {
        execSync(`git push origin --delete ${this.branchName}`, {
          cwd: this.workingDir,
          stdio: 'pipe'
        });
        this.log(`Deleted remote branch: ${this.branchName}`);
      } catch (error) {
        this.log(`Could not delete remote branch: ${error.message}`, 'warn');
      }

    } catch (error) {
      this.log(`Branch cleanup failed: ${error.message}`, 'error');
    }
  }

  async cleanupArtifacts() {
    if (this.keepArtifacts) {
      this.log('Keeping artifacts as requested');
      return;
    }

    this.log('Cleaning up Guardian artifacts...');
    
    const artifactsRemoved = [];
    const artifactsFailed = [];

    // Clean up Guardian files
    const guardianFiles = [
      'guardian-plan.json',
      'guardian-patch.json',
      'guardian-static-validation.json',
      'guardian-runtime-validation.json',
      'guardian-smoke-test.json',
      'guardian-pr.json',
      'guardian-pr-info.json',
      'guardian-auto-merge.json',
      'guardian-coordination.json',
      'guardian.log'
    ];

    for (const file of guardianFiles) {
      const filePath = path.join(this.workingDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          artifactsRemoved.push(file);
        } catch (error) {
          artifactsFailed.push({ file, error: error.message });
        }
      }
    }

    // Clean up critique cycle files
    for (let i = 1; i <= 5; i++) {
      const critiqueFile = `guardian-critique-cycle-${i}.json`;
      const filePath = path.join(this.workingDir, critiqueFile);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          artifactsRemoved.push(critiqueFile);
        } catch (error) {
          artifactsFailed.push({ file: critiqueFile, error: error.message });
        }
      }
    }

    // Clean up artifacts directory
    const artifactsDir = path.join(this.workingDir, 'guardian-artifacts');
    if (fs.existsSync(artifactsDir)) {
      try {
        fs.rmSync(artifactsDir, { recursive: true, force: true });
        artifactsRemoved.push('guardian-artifacts/');
      } catch (error) {
        artifactsFailed.push({ file: 'guardian-artifacts/', error: error.message });
      }
    }

    // Clean up any generated components or files that were created for testing
    const testFiles = [
      'src/components/NewComponent.js',
      'GUARDIAN_CHANGES.md'
    ];

    for (const file of testFiles) {
      const filePath = path.join(this.workingDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          artifactsRemoved.push(file);
        } catch (error) {
          artifactsFailed.push({ file, error: error.message });
        }
      }
    }

    this.log(`Removed ${artifactsRemoved.length} artifacts`);
    if (artifactsFailed.length > 0) {
      this.log(`Failed to remove ${artifactsFailed.length} artifacts`, 'warn');
    }

    return { removed: artifactsRemoved, failed: artifactsFailed };
  }

  async cleanupGitState() {
    this.log('Cleaning up git state...');
    
    try {
      // Clear any staged changes
      execSync('git reset HEAD', {
        cwd: this.workingDir,
        stdio: 'pipe'
      });

      // Discard any unstaged changes in Guardian files
      const guardianFiles = this.findGuardianModifiedFiles();
      for (const file of guardianFiles) {
        try {
          execSync(`git checkout HEAD -- "${file}"`, {
            cwd: this.workingDir,
            stdio: 'pipe'
          });
        } catch (error) {
          // File might not exist in HEAD, that's okay
        }
      }

      // Clean untracked Guardian files
      execSync('git clean -fd guardian-*', {
        cwd: this.workingDir,
        stdio: 'pipe'
      });

      this.log('Git state cleaned up');
    } catch (error) {
      this.log(`Git cleanup failed: ${error.message}`, 'warn');
    }
  }

  findGuardianModifiedFiles() {
    try {
      const result = execSync('git status --porcelain', {
        cwd: this.workingDir,
        encoding: 'utf8'
      });

      return result
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.substring(3)) // Remove status prefix
        .filter(file => 
          file.startsWith('guardian-') || 
          file.includes('Guardian') ||
          file === 'GUARDIAN_CHANGES.md'
        );
    } catch (error) {
      return [];
    }
  }

  async restoreBackup() {
    this.log('Checking for Guardian backup...');
    
    try {
      // Check if there's a Guardian backup stash
      const stashList = execSync('git stash list', {
        cwd: this.workingDir,
        encoding: 'utf8'
      });

      const guardianStash = stashList
        .split('\n')
        .find(line => line.includes('Guardian backup'));

      if (guardianStash) {
        const stashIndex = guardianStash.split(':')[0];
        this.log(`Found Guardian backup: ${stashIndex}`);
        
        try {
          execSync(`git stash pop ${stashIndex}`, {
            cwd: this.workingDir,
            stdio: 'pipe'
          });
          this.log('Guardian backup restored');
        } catch (error) {
          this.log(`Could not restore backup: ${error.message}`, 'warn');
        }
      } else {
        this.log('No Guardian backup found');
      }
    } catch (error) {
      this.log(`Backup check failed: ${error.message}`, 'warn');
    }
  }

  generateCleanupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      branchName: this.branchName,
      keepArtifacts: this.keepArtifacts,
      workingDir: this.workingDir,
      actions: {
        branchCleanup: !!this.branchName,
        artifactCleanup: !this.keepArtifacts,
        gitStateCleanup: true,
        backupRestore: true
      },
      status: 'completed'
    };

    const reportPath = path.join(this.workingDir, 'guardian-cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Cleanup report written to ${reportPath}`);

    return report;
  }

  async emergencyCleanup() {
    this.log('Performing emergency cleanup...');
    
    // Force cleanup everything regardless of errors
    try {
      await this.cleanupGitState();
    } catch (error) {
      this.log(`Emergency git cleanup failed: ${error.message}`, 'error');
    }

    try {
      await this.cleanupBranch();
    } catch (error) {
      this.log(`Emergency branch cleanup failed: ${error.message}`, 'error');
    }

    try {
      // Force remove all Guardian files
      this.keepArtifacts = false;
      await this.cleanupArtifacts();
    } catch (error) {
      this.log(`Emergency artifact cleanup failed: ${error.message}`, 'error');
    }

    this.log('Emergency cleanup completed');
  }

  async run() {
    try {
      this.log('Starting Guardian cleanup...');
      
      // Restore any backup first
      await this.restoreBackup();
      
      // Clean up git state
      await this.cleanupGitState();
      
      // Clean up branch
      await this.cleanupBranch();
      
      // Clean up artifacts
      await this.cleanupArtifacts();
      
      const report = this.generateCleanupReport();
      
      this.log('Guardian cleanup completed successfully');
      return { success: true, report };
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
      
      // Attempt emergency cleanup
      await this.emergencyCleanup();
      
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
  const cleanup = new GuardianCleanup(options);
  
  cleanup.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianCleanup;