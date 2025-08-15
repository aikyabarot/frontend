# Guardian Agent - Advanced Change Generation Workflow

The Guardian Agent is an advanced, multi-phase automated change generation pipeline for the frontend repository. It provides deep repository access, comprehensive validation, refinement loops, and optional auto-merge capabilities with lightweight agent-to-agent coordination.

## Overview

The Guardian Agent workflow consists of multiple phases that work together to ensure high-quality, validated changes:

1. **Planning Phase** - Analyzes the repository and creates implementation plans
2. **Patch Generation** - Generates code changes based on the plan
3. **Static Validation** - Runs linting, syntax checking, and build validation
4. **Runtime Validation** - Executes tests and smoke tests
5. **Critique & Refinement** - Analyzes failures and applies fixes (up to 3 cycles)
6. **Pull Request Creation** - Creates comprehensive PRs with validation summaries
7. **Auto-Merge** - Optional automatic merging with safety checks

## Features

### 🛡️ Multi-Phase Validation
- **Static**: Syntax, linting, build validation
- **Runtime**: Test execution, smoke testing, performance checks
- **Security**: Dependency audits (thorough level)

### 🔄 Adaptive Refinement
- Automatic failure analysis and categorization
- Intelligent refinement strategies
- Multiple refinement cycles with limits

### 🤖 Agent Coordination
- Lightweight coordination between agent instances
- Shared state management
- Conflict resolution

### ⚙️ Configurable Safety
- Three validation levels: `basic`, `standard`, `thorough`
- Configurable runtime limits
- Optional auto-merge with safety checks

## Usage

### GitHub Actions Workflow

Trigger the Guardian Agent through GitHub Actions:

```yaml
# Manually trigger via GitHub UI or API
on:
  workflow_dispatch:
    inputs:
      change_request:
        description: 'Change request description'
        required: true
      validation_level:
        description: 'Validation level'
        default: 'standard'
        type: choice
        options: [basic, standard, thorough]
      enable_auto_merge:
        description: 'Enable automatic merge'
        default: false
        type: boolean
```

### Manual Execution

You can run individual phases manually:

```bash
# Planning Phase
CHANGE_REQUEST="Add user profile component" node scripts/guardian/planning.js

# Patch Generation (requires plan file)
node scripts/guardian/patch-generation.js --plan=guardian-plan.json

# Static Validation
node scripts/guardian/static-validation.js --validation=standard

# Runtime Validation
node scripts/guardian/runtime-validation.js --validation=standard

# Smoke Test Only
node scripts/guardian/smoke.js
```

## Validation Levels

### Basic
- File structure validation
- Syntax checking
- Build validation
- Smoke testing only

### Standard (Default)
- All basic checks
- ESLint validation
- Full test suite execution
- Accessibility checks
- Bundle analysis

### Thorough
- All standard checks
- TypeScript validation (if configured)
- Security audits
- Performance testing
- Comprehensive dependency analysis

## Scripts Overview

### Core Scripts

- **`orchestrator.js`** - Main coordination script
- **`planning.js`** - Repository analysis and planning
- **`patch-generation.js`** - Change generation and application
- **`static-validation.js`** - Static analysis and validation
- **`runtime-validation.js`** - Runtime testing and validation
- **`critique-refinement.js`** - Failure analysis and refinement
- **`create-pr.js`** - Pull request creation
- **`auto-merge.js`** - Automatic merging with safety checks
- **`cleanup.js`** - Artifact and state cleanup
- **`smoke.js`** - Smoke test harness

### Generated Artifacts

The Guardian Agent generates several artifacts during execution:

- `guardian-plan.json` - Implementation plan and repository analysis
- `guardian-patch.json` - Applied changes information
- `guardian-static-validation.json` - Static validation results
- `guardian-runtime-validation.json` - Runtime validation results
- `guardian-critique-cycle-N.json` - Refinement cycle reports
- `guardian-pr-info.json` - Pull request information
- `guardian-auto-merge.json` - Auto-merge results
- `guardian-coordination.json` - Agent coordination data

## Safety Features

### Refinement Limits
- Maximum 3 refinement cycles per run
- Automatic failure categorization
- Progressive refinement strategies

### Auto-Merge Safety Checks
- ✅ Validation results must pass
- ✅ No merge conflicts
- ✅ No breaking changes detected
- ✅ Security clearance (thorough level)

### Branch Management
- Automatic branch creation with timestamps
- Clean branch naming conventions
- Automatic cleanup on completion/failure

### Rollback Strategy
- Git-based rollback mechanisms
- Automatic backup creation
- Emergency cleanup procedures

## Configuration

### Environment Variables

```bash
# Maximum runtime in minutes
GUARDIAN_MAX_RUNTIME=30

# Enable/disable auto-merge
GUARDIAN_AUTO_MERGE=false

# Set validation level
GUARDIAN_VALIDATION_LEVEL=standard

# Change request (for manual runs)
CHANGE_REQUEST="Your change description"
```

### Workflow Inputs

The GitHub Actions workflow accepts these inputs:

- `change_request` - Description of the desired changes
- `target_branch` - Target branch for changes (default: main)
- `max_runtime_minutes` - Maximum execution time (default: 30)
- `enable_auto_merge` - Enable automatic merging (default: false)
- `validation_level` - Validation thoroughness (default: standard)

## Examples

### Adding a New Component

```bash
CHANGE_REQUEST="Add a UserProfile component with avatar, name, and bio fields" \
node scripts/guardian/planning.js --validation=standard
```

### Bug Fix with Thorough Validation

```bash
CHANGE_REQUEST="Fix memory leak in data fetching logic" \
node scripts/guardian/planning.js --validation=thorough
```

### Style Updates

```bash
CHANGE_REQUEST="Update button styles to use new design system colors" \
node scripts/guardian/planning.js --validation=basic
```

## Smoke Test Harness

Since no existing tests were detected in the repository, the Guardian Agent includes a comprehensive smoke test harness:

- React component rendering validation
- Package.json integrity checks
- Source structure validation
- Critical dependency verification
- Build artifact validation

## Monitoring and Debugging

### Logs
All phases generate detailed logs with timestamps and structured information.

### Reports
Comprehensive JSON reports are generated for each phase, enabling:
- Failure analysis
- Performance monitoring
- Agent coordination
- Audit trails

### Artifacts
All generated files are preserved (unless explicitly cleaned up) for debugging and analysis.

## Limitations and Considerations

### Current Implementation
- This is a demonstration implementation with simulated changes
- Real Guardian agents would integrate with AI/ML models for intelligent code generation
- Some features are placeholder implementations for demonstration

### Production Readiness
For production use, consider:
- Integration with actual code generation models
- Enhanced security scanning
- More sophisticated change analysis
- Extended agent coordination protocols

## Troubleshooting

### Common Issues

1. **Planning fails**: Ensure repository structure is valid and dependencies are installed
2. **Validation fails**: Check ESLint configuration and build scripts
3. **Auto-merge blocked**: Review safety check failures in auto-merge report
4. **Branch conflicts**: Use cleanup script to reset state

### Emergency Cleanup

```bash
node scripts/guardian/cleanup.js --branch=guardian-branch-name
```

## Contributing

When extending the Guardian Agent:

1. Follow the existing phase-based architecture
2. Generate comprehensive reports for each phase
3. Include proper error handling and rollback mechanisms
4. Add appropriate safety checks for auto-merge scenarios
5. Update documentation for new features

## License

This Guardian Agent implementation is part of the frontend repository and follows the same license terms.