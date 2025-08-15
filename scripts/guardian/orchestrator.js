#!/usr/bin/env node

/**
 * Guardian Agent Main Orchestrator
 * 
 * This script coordinates the multi-phase validation pipeline for high-assurance
 * change generation in the frontend repository.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class GuardianOrchestrator {
  constructor() {
    this.config = {
      maxRuntimeMinutes: parseInt(process.env.GUARDIAN_MAX_RUNTIME) || 30,
      autoMergeEnabled: process.env.GUARDIAN_AUTO_MERGE === 'true',
      validationLevel: process.env.GUARDIAN_VALIDATION_LEVEL || 'standard',
      workingDir: process.cwd(),
      artifactsDir: path.join(process.cwd(), 'guardian-artifacts'),
      maxRefinementCycles: 3
    };

    this.state = {
      startTime: Date.now(),
      currentPhase: 'initialization',
      branchName: '',
      planPath: '',
      validationResults: {},
      refinementCycles: 0,
      errors: []
    };

    this.setupArtifactsDir();
  }

  setupArtifactsDir() {
    if (!fs.existsSync(this.config.artifactsDir)) {
      fs.mkdirSync(this.config.artifactsDir, { recursive: true });
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.state.currentPhase}] ${message}`;
    console.log(logMessage);
    
    // Write to log file
    const logFile = path.join(this.config.artifactsDir, 'guardian.log');
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  checkTimeout() {
    const elapsedMinutes = (Date.now() - this.state.startTime) / (1000 * 60);
    if (elapsedMinutes > this.config.maxRuntimeMinutes) {
      throw new Error(`Guardian timeout exceeded: ${elapsedMinutes.toFixed(1)} minutes > ${this.config.maxRuntimeMinutes} minutes`);
    }
  }

  async executePhase(phaseName, scriptPath, args = []) {
    this.state.currentPhase = phaseName;
    this.log(`Starting phase: ${phaseName}`);
    this.checkTimeout();

    try {
      const result = execSync(`node ${scriptPath} ${args.join(' ')}`, {
        cwd: this.config.workingDir,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      this.log(`Phase ${phaseName} completed successfully`);
      return { success: true, output: result };
    } catch (error) {
      this.log(`Phase ${phaseName} failed: ${error.message}`, 'error');
      this.state.errors.push({ phase: phaseName, error: error.message });
      return { success: false, error: error.message, output: error.stdout || '' };
    }
  }

  async run() {
    try {
      this.log('Guardian Agent starting...');
      
      // Phase 1: Planning
      const planningResult = await this.executePhase(
        'planning',
        'scripts/guardian/planning.js',
        ['--output', path.join(this.config.artifactsDir, 'guardian-plan.json')]
      );

      if (!planningResult.success) {
        throw new Error('Planning phase failed');
      }

      // Phase 2: Patch Generation
      const patchResult = await this.executePhase(
        'patch-generation', 
        'scripts/guardian/patch-generation.js',
        ['--plan', path.join(this.config.artifactsDir, 'guardian-plan.json')]
      );

      if (!patchResult.success) {
        throw new Error('Patch generation phase failed');
      }

      // Validation and refinement loop
      let validationPassed = false;
      while (!validationPassed && this.state.refinementCycles < this.config.maxRefinementCycles) {
        this.checkTimeout();

        // Phase 3: Static Validation
        const staticResult = await this.executePhase(
          'static-validation',
          'scripts/guardian/static-validation.js',
          ['--validation', this.config.validationLevel]
        );

        // Phase 4: Runtime Validation (if not basic level)
        let runtimeResult = { success: true };
        if (this.config.validationLevel !== 'basic') {
          runtimeResult = await this.executePhase(
            'runtime-validation',
            'scripts/guardian/runtime-validation.js',
            ['--validation', this.config.validationLevel]
          );
        }

        // Check if validation passed
        validationPassed = staticResult.success && runtimeResult.success;

        if (!validationPassed) {
          this.state.refinementCycles++;
          this.log(`Validation failed, attempting refinement cycle ${this.state.refinementCycles}`);

          // Phase 5: Critique & Refinement
          const refineResult = await this.executePhase(
            'critique-refinement',
            'scripts/guardian/critique-refinement.js',
            [
              '--static-result', staticResult.success ? 'success' : 'failure',
              '--runtime-result', runtimeResult.success ? 'success' : 'failure',
              '--cycle', this.state.refinementCycles.toString()
            ]
          );

          if (!refineResult.success) {
            throw new Error('Refinement phase failed');
          }
        }
      }

      if (!validationPassed) {
        throw new Error(`Max refinement cycles (${this.config.maxRefinementCycles}) exceeded without successful validation`);
      }

      // Create PR
      const prResult = await this.executePhase(
        'create-pr',
        'scripts/guardian/create-pr.js',
        []
      );

      if (!prResult.success) {
        throw new Error('PR creation failed');
      }

      // Auto-merge if enabled
      if (this.config.autoMergeEnabled) {
        const mergeResult = await this.executePhase(
          'auto-merge',
          'scripts/guardian/auto-merge.js',
          []
        );

        if (!mergeResult.success) {
          this.log('Auto-merge failed, but PR was created successfully', 'warn');
        }
      }

      this.log('Guardian Agent completed successfully!');
      this.generateSummaryReport();

    } catch (error) {
      this.log(`Guardian Agent failed: ${error.message}`, 'error');
      this.generateSummaryReport();
      process.exit(1);
    }
  }

  generateSummaryReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: (Date.now() - this.state.startTime) / 1000,
      config: this.config,
      state: this.state,
      success: this.state.errors.length === 0
    };

    const reportPath = path.join(this.config.artifactsDir, 'guardian-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Summary report written to ${reportPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const orchestrator = new GuardianOrchestrator();
  orchestrator.run().catch(error => {
    console.error('Guardian Orchestrator failed:', error);
    process.exit(1);
  });
}

module.exports = GuardianOrchestrator;