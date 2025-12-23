# Contributing to Multitenant Inventory Management System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues

1. **Check existing issues** - Search for similar issues before creating a new one
2. **Use clear titles** - Describe the issue concisely
3. **Provide details** - Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Error messages or screenshots

### Suggesting Features

1. **Check existing feature requests** - Avoid duplicates
2. **Describe the use case** - Explain why this feature would be useful
3. **Propose implementation** - If you have ideas on how to implement it

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/your-feature-name`
3. **Make your changes** - Follow coding standards
4. **Test your changes** - Ensure all tests pass
5. **Update documentation** - If needed
6. **Submit PR** - Provide clear description of changes

## 📋 Development Setup

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Setup Steps

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/imas.git
   cd imas
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   createdb inventory_system
   psql -d inventory_system -f src/database/migrations/001_create_tables.sql
   node src/database/seeds/run.js
   ```

5. **Start development servers**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend (new terminal)
   cd frontend/web-app
   npm run dev
   ```

## 📝 Coding Standards

### Code Style

- **JavaScript/Node.js**: Follow ESLint configuration
- **React**: Use functional components with hooks
- **Naming**: Use descriptive names, camelCase for variables/functions
- **Comments**: Document complex logic and functions

### Git Commit Messages

Use clear, descriptive commit messages:

```
feat: Add receipt email functionality
fix: Resolve database connection timeout
docs: Update API documentation
refactor: Simplify authentication middleware
test: Add unit tests for receipt service
```

**Prefixes:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### File Structure

- Keep files focused and single-purpose
- Use consistent folder structure
- Group related files together
- Name files descriptively

## 🧪 Testing

### Running Tests

```bash
cd backend
npm test
```

### Writing Tests

- Write tests for new features
- Ensure existing tests pass
- Aim for good test coverage
- Test edge cases and error scenarios

## 📚 Documentation

### Code Documentation

- Document complex functions and classes
- Use JSDoc comments for functions
- Keep README files updated
- Document API changes

### Updating Documentation

- Update relevant docs when adding features
- Keep examples current
- Document breaking changes

## 🔍 Code Review Process

1. **Automated checks** - CI/CD runs tests and linting
2. **Review feedback** - Address reviewer comments
3. **Approval** - At least one maintainer approval required
4. **Merge** - Maintainer will merge after approval

## 🐛 Bug Fixes

### Before Fixing

1. **Reproduce the bug** - Confirm it exists
2. **Identify root cause** - Understand why it happens
3. **Check related code** - Look for similar issues

### Fixing

1. **Write a test** - If possible, add a test that fails
2. **Fix the issue** - Make minimal changes
3. **Verify fix** - Ensure test passes and no regressions
4. **Update docs** - If behavior changed

## ✨ Feature Development

### Planning

1. **Discuss first** - Open an issue to discuss the feature
2. **Get approval** - Wait for maintainer feedback
3. **Design** - Plan the implementation approach
4. **Implement** - Write code following standards

### Implementation

1. **Start small** - Break into smaller PRs if needed
2. **Follow patterns** - Match existing code style
3. **Add tests** - Include unit and integration tests
4. **Update docs** - Document new features

## 🔒 Security

- **Never commit secrets** - Use environment variables
- **Report vulnerabilities** - Email security issues privately
- **Follow security best practices** - Validate inputs, sanitize outputs
- **Review dependencies** - Keep dependencies updated

## 📞 Getting Help

- **Documentation** - Check README.md and other docs
- **Issues** - Search existing issues
- **Discussions** - Use GitHub Discussions for questions
- **Contact** - Reach out to maintainers

## 🎯 Areas for Contribution

### High Priority

- Bug fixes
- Performance improvements
- Security enhancements
- Documentation improvements
- Test coverage

### Feature Ideas

- Mobile app development
- Advanced reporting features
- Integration with third-party services
- UI/UX improvements
- Accessibility enhancements

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

**Thank you for contributing!** 🎉

