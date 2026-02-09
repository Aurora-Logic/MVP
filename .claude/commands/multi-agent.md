---
description: Orchestrate multiple specialized agents for complex tasks
---

# Multi-Agent Workflow

Use this command to coordinate multiple specialized agents for complex development tasks.

## Available Agents

| Agent | Specialty | Use For |
|-------|-----------|---------|
| `@ux-designer` | UX-first design (shadcn/Notion/Apple) | User flows, interactions, UX patterns |
| `@frontend-design` | Production-grade UI (anti-AI-slop) | Distinctive interfaces, bold design, polish |
| `@ui-specialist` | UI/CSS implementation | Styling, responsive design, themes |
| `@js-engineer` | JavaScript development | Features, bugs, logic |
| `@qa-tester` | Testing, verification | Quality assurance, validation |
| `@code-reviewer` | Code review | Best practices, documentation |

## Usage Patterns

### Pattern 1: Parallel Development
For tasks that can be split into independent streams:
```
Team Lead: "Build new feature X"
├── @ui-specialist → Design and style the UI
├── @js-engineer → Implement the logic
└── @qa-tester → Write test cases
```

### Pattern 2: Sequential Review
For tasks requiring verification:
```
1. @js-engineer → Implement changes
2. @code-reviewer → Review code quality
3. @qa-tester → Verify functionality
```

### Pattern 3: Complex Feature
For large features:
```
1. @ux-designer → Define user flow and interaction design
2. @ui-specialist + @js-engineer → Parallel implementation
3. @code-reviewer → Review both
4. @qa-tester → Integration testing
```

## Starting a Team Session

1. **In Claude Code CLI:**
   ```
   /agents
   ```
   This opens the interactive agent management interface.

2. **Spawn a teammate:**
   ```
   @ui-specialist Please review the button styles in components.css
   ```

3. **Coordinate work:**
   Each agent will work in parallel, sharing updates through the task list.

## Best Practices

- Break tasks into clear, independent subtasks
- Assign each subtask to the most appropriate agent
- Use the QA Tester agent for final verification
- Review all changes with the Code Reviewer before merging
