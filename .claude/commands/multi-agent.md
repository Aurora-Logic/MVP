---
description: Orchestrate multiple specialized agents for complex tasks
---

# Multi-Agent Workflow

Use this command to coordinate multiple specialized agents for complex development tasks.

## Available Agents (14 Total)

### Design & UX Team
| Agent | Specialty | Use For |
|-------|-----------|---------|
| `@ux-designer` | UX-first design (shadcn/Notion/Apple) | User flows, interactions, UX patterns |
| `@frontend-design` | Production-grade UI (anti-AI-slop) | Distinctive interfaces, bold design, polish |
| `@ui-specialist` | UI/CSS implementation | Styling, responsive design, themes |
| `@layout-architect` | CSS layout systems | Grids, flexbox, responsive structure, spacing |

### Engineering Team
| Agent | Specialty | Use For |
|-------|-----------|---------|
| `@js-engineer` | JavaScript development | Features, bugs, logic |
| `@data-architect` | Data modeling & state | localStorage schema, state management, migrations |
| `@performance-engineer` | Performance optimization | Memory leaks, render speed, data operations |
| `@security-specialist` | Security auditing | XSS, injection, input validation, OWASP |

### Quality & Testing Team
| Agent | Specialty | Use For |
|-------|-----------|---------|
| `@qa-tester` | Quality assurance | Validation, smoke tests, regression |
| `@testing-engineer` | Test strategy | Test matrices, edge cases, cross-browser |
| `@code-reviewer` | Code review | Best practices, naming, duplication |
| `@accessibility-expert` | WCAG compliance | Keyboard nav, screen readers, contrast |

### Operations Team
| Agent | Specialty | Use For |
|-------|-----------|---------|
| `@devops-engineer` | Deployment & CI/CD | Hosting, PWA, caching, production readiness |
| `@github-expert` | Git & GitHub | Commits, PRs, releases, GitHub Actions |

## Usage Patterns

### Pattern 1: Full Audit
For comprehensive codebase review:
```
├── @ui-specialist → CSS audit (variables, dark mode, responsive)
├── @js-engineer → JS audit (bugs, performance, security)
├── @qa-tester → Validation sweep (syntax, functions, load order)
├── @code-reviewer → Best practices (naming, duplication, modules)
├── @ux-designer → UX audit (flows, interactions, mobile)
├── @frontend-design → Visual design audit (tokens, components, anti-slop)
├── @security-specialist → Security audit (XSS, input validation)
├── @accessibility-expert → A11y audit (WCAG, keyboard, screen readers)
└── @performance-engineer → Performance audit (memory, rendering, data ops)
```

### Pattern 2: New Feature Development
```
1. @ux-designer → Define user flow and interaction design
2. @layout-architect → Design layout structure
3. @frontend-design → Visual design decisions
4. @js-engineer + @ui-specialist → Parallel implementation
5. @security-specialist → Security review
6. @accessibility-expert → A11y review
7. @code-reviewer → Code quality review
8. @qa-tester → Integration testing
9. @github-expert → Commit and PR
```

### Pattern 3: Bug Fix
```
1. @js-engineer → Diagnose and fix
2. @testing-engineer → Regression test plan
3. @qa-tester → Verify fix
4. @github-expert → Commit
```

### Pattern 4: Deployment
```
1. @qa-tester → Final validation
2. @devops-engineer → Production readiness check
3. @github-expert → Tag release and deploy
```

## Best Practices

- Break tasks into clear, independent subtasks
- Assign each subtask to the most appropriate agent
- Run design agents (UX, frontend-design) before implementation agents
- Run security and accessibility audits after implementation
- Use the QA Tester agent for final verification
- Review all changes with the Code Reviewer before merging
- Use the GitHub Expert for clean commit history
