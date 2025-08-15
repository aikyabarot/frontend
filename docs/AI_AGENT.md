# AI Agent PR Generator

This repository includes an AI Agent that can convert natural language prompts into code changes through GitHub Actions.

## 🎯 Purpose

The AI Agent provides a **human-in-the-loop** system for generating code changes:
- Converts natural language prompts into React components, pages, or other changes
- Creates branches, commits, and pull requests automatically
- Includes safety measures and authorization controls
- All changes go through PR review before merging

## 🚀 How to Use

### Method 1: Manual Trigger

1. Go to the **Actions** tab in GitHub
2. Select "AI Agent PR Generator" workflow
3. Click "Run workflow"
4. Enter your prompt (e.g., "Create a component called UserProfile")
5. Optionally specify authorized users (defaults to repository owner)

### Method 2: Issue Comments

1. Open any GitHub issue in this repository
2. Post a comment starting with `/agent` followed by your prompt:
   ```
   /agent Create a component called ProductCard with props for name and price
   ```
3. The agent will respond and create a pull request

## 📝 Example Prompts

### Create Components
- `Create a component called UserProfile`
- `Add a component called ProductCard with props for name and price`
- `Create a component called LoadingSpinner`

### Create Pages
- `Add a page called Settings`
- `Create a page called UserDashboard`
- `Add a page called ProductListing`

### General Changes
- `Add a new feature for user authentication`
- `Update the navigation to include a new menu item`

## 🔒 Authorization & Security

### Authorized Users
- By default, only the repository owner (`aikyabarot`) can trigger the agent
- Additional users can be specified in the workflow dispatch input
- Unauthorized users will receive a denial message

### Safety Measures
- **File Limits**: Maximum 10 files per request
- **Size Limits**: Maximum 10KB per file
- **Human Review**: All changes go through pull request review
- **Audit Trail**: All requests are logged as artifacts
- **Branch Protection**: No direct commits to main branch

### What the Agent Can Do
- ✅ Create new React components
- ✅ Create new pages
- ✅ Generate documentation
- ✅ Add basic functionality following existing patterns

### What the Agent Cannot Do
- ❌ Delete existing files
- ❌ Modify critical configuration files
- ❌ Access external APIs or secrets
- ❌ Commit directly to main branch

## 🛠️ Technical Details

### Workflow Components
- **Authorization Check**: Validates user permissions
- **Prompt Analysis**: Parses natural language intent
- **Code Generation**: Creates React components/pages
- **Safety Validation**: Enforces file and size limits
- **Git Operations**: Creates branches and commits
- **PR Creation**: Automatically opens pull requests
- **Artifact Logging**: Records all actions for audit

### Dependencies
The workflow automatically installs required dependencies:
- `@octokit/rest` for GitHub API interactions
- `simple-git` for Git operations
- GitHub CLI for PR management

### File Structure
```
.github/workflows/agent.yml    # Main workflow definition
docs/agent-requests/          # Generated documentation logs
scripts/agent.js              # Auto-generated processing script
```

## 🐛 Troubleshooting

### Agent Not Responding
- Check if you're an authorized user
- Verify the prompt format for issue comments (`/agent [prompt]`)
- Check the Actions tab for workflow run details

### Invalid Prompts
- Be specific about what you want to create
- Use component/page terminology for best results
- Check the workflow artifacts for detailed logs

### Failed Workflow
- Check the workflow run logs in the Actions tab
- Verify repository permissions and secrets
- Ensure the prompt doesn't exceed safety limits

## 📊 Monitoring

All agent activities are logged and available as:
- **Workflow run logs** in the Actions tab
- **Artifact files** with detailed request information
- **Pull request descriptions** with full context

## 🔄 Customization

To customize the agent behavior:

1. **Authorization**: Edit the `AUTHORIZED_USERS` environment variable in the workflow
2. **Safety Limits**: Modify `MAX_FILES` and `MAX_FILE_SIZE` in the workflow
3. **Generation Logic**: The agent script is generated dynamically during workflow runs

## 📚 Examples

### Successful Component Creation
```
Prompt: "Create a component called UserProfile"
Result: src/components/UserProfile.js with basic React component structure
```

### Successful Page Creation
```
Prompt: "Add a page called Settings"
Result: src/pages/SettingsPage.js with page layout following project patterns
```

### Documentation Fallback
```
Prompt: "Make the app better"
Result: Documentation file explaining the request and suggesting more specific prompts
```

---

*This AI Agent is designed to be a helpful assistant while maintaining security and requiring human oversight for all changes.*