# Frontend Application with Human-in-the-Loop Agent Workflow

A React-based frontend application enhanced with an automated GitHub Actions agent workflow for task execution and repository management.

## Project Overview

This is a Create React App-style project that includes:
- 🎯 **React frontend** with dashboard, clients, and candidate management
- 🤖 **Automated agent workflow** for task execution via GitHub Actions
- 💬 **Slash command support** for triggering agent tasks from comments
- ✅ **Auto-approval and auto-merge** capabilities for clean PRs

## Quick Start

### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Using the Agent Workflow

The repository includes a sophisticated agent workflow system. See [Agent Workflow Documentation](docs/AGENT_WORKFLOW.md) for detailed usage instructions.

#### Quick Agent Usage

1. **Manual trigger**: Go to Actions tab → "Human-in-the-Loop Agent Workflow" → "Run workflow"
2. **Slash commands**: Comment `/agent <task>` or `/agent --auto <task>` on any issue/PR

## Project Structure

```
├── .github/workflows/          # GitHub Actions workflows
│   └── agent.yml              # Human-in-the-loop agent workflow
├── src/                       # React application source
│   ├── components/            # Reusable UI components
│   ├── context/              # React context providers
│   ├── layouts/              # Layout components
│   └── pages/                # Page components
├── scripts/                   # Utility scripts
│   ├── agent-helper.sh       # Agent workflow utilities
│   └── test-agent.sh         # Smoke tests for agent system
├── docs/                     # Documentation
│   └── AGENT_WORKFLOW.md     # Comprehensive agent workflow guide
└── agent-logs/               # Agent task execution logs
```

## Agent Workflow Features

### 🎯 Task Execution
- Manual triggers via GitHub UI with custom prompts
- Slash command triggers (`/agent` and `/agent --auto`) in comments
- Automatic branch creation with unique naming
- Structured task logging and validation

### 🔄 Automation Capabilities  
- Auto-approval of generated PRs (when enabled)
- Auto-merge for clean PRs without conflicts
- Build validation and integrity checks
- Comprehensive error handling

### 📊 Monitoring & Logging
- Detailed execution logs for every task
- PR descriptions with task summaries
- Comment notifications on originating issues
- Smoke testing capabilities

## Development

### Prerequisites
- Node.js 16+ 
- npm or pnpm
- Git

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production  
- `npm test` - Run tests (currently no tests configured)
- `./scripts/test-agent.sh` - Run agent workflow smoke tests
- `./scripts/agent-helper.sh validate` - Validate project integrity

### Testing the Agent Workflow

Run the smoke test suite to verify all agent components:

```bash
./scripts/test-agent.sh
```

This validates:
- ✅ YAML syntax of workflow file
- ✅ Helper script functionality  
- ✅ Log creation capabilities
- ✅ Directory structure
- ✅ File permissions
- ✅ Required dependencies

## Repository Configuration

For full agent workflow functionality, ensure:

1. **Repository settings**:
   - Actions enabled
   - Allow GitHub Actions to create and approve pull requests
   - Auto-merge enabled (optional)

2. **Branch protection** (optional but recommended):
   - Require PR reviews
   - Require status checks to pass

3. **Permissions**: The workflow has appropriate permissions configured for:
   - Content modification (`contents: write`)
   - PR management (`pull-requests: write`) 
   - Issue commenting (`issues: write`)
   - Status checks (`checks: write`)

## Architecture Decisions

### Agent Workflow Design
- **Trigger flexibility**: Both manual and comment-based triggers supported
- **Safety first**: Auto-merge only when explicitly enabled and conditions are met
- **Extensibility**: Placeholder execution step designed for easy AI/automation integration  
- **Observability**: Comprehensive logging and status reporting

### Frontend Architecture
- **Context-based state**: Centralized app state via React Context
- **Component composition**: Reusable components with clear separation of concerns
- **Build optimization**: Production-ready build configuration with Tailwind CSS

## Future Enhancements

The agent workflow is designed as a foundation for more sophisticated automation:

- 🤖 **AI Integration**: Connect to OpenAI, Anthropic, or other AI services
- 🔍 **Code Analysis**: Automated code review and suggestion capabilities
- 🧪 **Test Generation**: Automatic test creation and validation
- 📦 **Dependency Management**: Automated updates and security patches
- 🚀 **Deployment**: Automated deployment workflows

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Use the agent workflow to assist with development (`/agent help me implement X`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Support

- 📖 **Documentation**: [Agent Workflow Guide](docs/AGENT_WORKFLOW.md)
- 🧪 **Testing**: Run `./scripts/test-agent.sh` to verify setup
- 🐛 **Issues**: Open GitHub issues for bugs or feature requests
- 💬 **Agent Help**: Comment `/agent help` on any issue for assistance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Enhanced with Human-in-the-Loop Agent Workflow** 🤖✨