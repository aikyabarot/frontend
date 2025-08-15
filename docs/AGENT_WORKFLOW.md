# Human-in-the-Loop Agent Workflow

This repository includes a GitHub Actions workflow that enables a human-in-the-loop agent system for automated task execution.

## Features

- 🤖 **Manual trigger via GitHub UI**: Use workflow_dispatch with custom prompts
- 💬 **Slash command support**: Trigger via issue/PR comments with `/agent` commands  
- 🌟 **Auto-branch creation**: Automatically creates feature branches for tasks
- ✅ **Optional auto-approval**: Enable auto-approval and auto-merge for clean PRs
- 📝 **Task logging**: Maintains logs of all agent activities

## Usage

### Manual Trigger (GitHub UI)

1. Go to the **Actions** tab in your repository
2. Select **"Human-in-the-Loop Agent Workflow"**
3. Click **"Run workflow"**
4. Fill in the parameters:
   - **Task prompt**: Describe what you want the agent to do
   - **Auto-merge**: Check if you want automatic approval/merge when PR is clean

### Slash Command Trigger (Issue/PR Comments)

Comment on any issue or PR with:

```bash
# Basic agent command
/agent Your task description here

# Agent command with auto-merge enabled
/agent --auto Your task description here
```

## How It Works

1. **Trigger Detection**: The workflow triggers on manual dispatch or issue comments containing `/agent`
2. **Branch Creation**: Creates a new branch with format `agent/task-{timestamp}-{random}`
3. **Task Execution**: Processes the given prompt (currently creates a task log as demonstration)
4. **PR Creation**: Opens a pull request with the changes
5. **Auto-processing** (if enabled): Auto-approves and enables auto-merge when conditions are met

## Current Implementation

The current implementation serves as a foundation and includes:

- ✅ Workflow triggers (manual + slash commands)
- ✅ Branch creation and management
- ✅ PR creation with detailed descriptions
- ✅ Auto-approval and auto-merge capabilities
- ✅ Task logging system
- ✅ Error handling for various scenarios

## Extending the Agent

To extend the agent with actual task execution capabilities:

1. **Modify the workflow**: Edit `.github/workflows/agent.yml`
2. **Update the execution step**: Replace the placeholder logic in the "Agent task execution" step
3. **Add specialized scripts**: Create task-specific scripts in the `scripts/` directory
4. **Integrate AI services**: Add calls to AI APIs or other automation services

### Example Extensions

```yaml
# In .github/workflows/agent.yml, replace the execution step:
- name: Agent task execution
  run: |
    # Install dependencies for AI integration
    pip install openai anthropic
    
    # Run your custom agent logic
    python scripts/ai-agent.py "${{ steps.parse.outputs.prompt }}"
```

## Configuration

### Repository Settings

For full functionality, ensure your repository has:

- **Branch protection rules** (optional): Configure if you want additional safety
- **Auto-merge enabled**: Repository settings → General → Allow auto-merge
- **Actions permissions**: Actions → General → Allow GitHub Actions to create and approve pull requests

### Workflow Permissions

The workflow requires these permissions (already configured):
- `contents: write` - To create branches and files
- `pull-requests: write` - To create and manage PRs
- `issues: write` - To comment on issues
- `checks: write` - To enable auto-merge

## Security Considerations

- The workflow runs with repository write permissions
- Auto-merge is only enabled when explicitly requested
- All actions are logged and traceable
- Consider adding additional validation steps for sensitive operations

## Examples

### Basic Task
```
/agent Update the README with deployment instructions
```

### Auto-merge Task  
```
/agent --auto Fix the linting errors in the codebase
```

### Manual Trigger
Use the GitHub Actions UI to run complex, multi-step tasks with detailed prompts.

## Troubleshooting

**Auto-merge not working?**
- Check if branch protection rules require reviews
- Ensure "Allow auto-merge" is enabled in repository settings
- Verify there are no merge conflicts

**Slash commands not triggering?**
- Ensure the comment starts with `/agent` (case-sensitive)
- Check that the workflow file is in the default branch
- Verify Actions permissions are correctly set

**Build failures?**
- The helper script includes validation steps
- Check the Actions logs for detailed error messages
- Ensure all dependencies are properly configured