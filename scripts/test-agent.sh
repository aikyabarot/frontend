#!/bin/bash

# Smoke test for the agent workflow components
# This script verifies that all components are working correctly

set -e

echo "🧪 Running agent workflow smoke tests..."

# Test 1: Validate YAML syntax
echo "1. Validating workflow YAML syntax..."
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/agent.yml')); print('   ✅ YAML syntax valid')"

# Test 2: Check helper script functionality
echo "2. Testing helper script..."
if ./scripts/agent-helper.sh validate > /dev/null 2>&1; then
    echo "   ✅ Helper script validation works"
else
    echo "   ❌ Helper script validation failed"
    exit 1
fi

# Test 3: Test log creation
echo "3. Testing log creation..."
TEST_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE=$(./scripts/agent-helper.sh create-log "Test smoke test" "$TEST_TIMESTAMP" "false")
if [[ -f "$LOG_FILE" ]]; then
    echo "   ✅ Log creation works: $LOG_FILE"
    rm "$LOG_FILE"  # Clean up test file
else
    echo "   ❌ Log creation failed"
    exit 1
fi

# Test 4: Check directory structure
echo "4. Checking directory structure..."
REQUIRED_DIRS=(".github/workflows" "scripts" "agent-logs" "docs")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "   ✅ $dir exists"
    else
        echo "   ❌ $dir missing"
        exit 1
    fi
done

# Test 5: Check required files
echo "5. Checking required files..."
REQUIRED_FILES=(".github/workflows/agent.yml" "scripts/agent-helper.sh" "docs/AGENT_WORKFLOW.md" "agent-logs/README.md")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
        exit 1
    fi
done

# Test 6: Verify script permissions
echo "6. Checking script permissions..."
if [[ -x "scripts/agent-helper.sh" ]]; then
    echo "   ✅ Helper script is executable"
else
    echo "   ❌ Helper script is not executable"
    exit 1
fi

echo ""
echo "🎉 All smoke tests passed! The agent workflow is ready to use."
echo ""
echo "To test the workflow:"
echo "1. Go to the Actions tab in your GitHub repository"
echo "2. Select 'Human-in-the-Loop Agent Workflow'"
echo "3. Click 'Run workflow' and provide a test prompt"
echo ""
echo "Or comment on any issue/PR with: /agent Test the agent workflow"