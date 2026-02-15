---
name: "test-planner"
description: "Generates comprehensive test plans covering Unit, Integration, E2E, Performance, and Security testing. Invoke when user mentions test plan, test cases, test strategy, QA, or quality assurance."
---

# Test Planner

This skill creates comprehensive test plans from PRD, technical specifications, and development tasks. It covers all testing levels from unit tests to user acceptance testing.

## When to Invoke

Use this skill when:
- User needs a test plan for a new feature or release
- User mentions test cases, test strategy, or QA
- Preparing for quality assurance phase
- Setting up automated testing pipelines
- Planning user acceptance testing
- Before deployment to production
- After completing feature development

## Workflow

### Phase 1: Test Strategy Definition

1. **Testing Objectives**
   - Define quality goals and acceptance criteria
   - Identify risk areas requiring focused testing
   - Establish test coverage targets
   - Set performance benchmarks

2. **Testing Scope**
   - In-scope features and modules
   - Out-of-scope items and rationale
   - Platform and environment coverage
   - Device and browser coverage

3. **Testing Levels**
   - Unit testing (component level)
   - Integration testing (module level)
   - End-to-end testing (system level)
   - User acceptance testing (business level)

### Phase 2: Test Type Planning

#### 1. Unit Testing Strategy
```yaml
unit_testing:
  framework: "Jest / Pytest / JUnit"
  coverage_target: "80%"
  test_types:
    - "Function tests"
    - "Component tests"
    - "Utility tests"
    - "Data validation tests"
  practices:
    - "Test isolation (mocks/stubs)"
    - "Descriptive test names"
    - "Arrange-Act-Assert pattern"
    - "One assertion per test"
  locations:
    frontend: "src/**/*.test.{ts,tsx}"
    backend: "src/**/*.test.{ts,py}"
```

#### 2. Integration Testing Strategy
```yaml
integration_testing:
  framework: "Supertest / Testcontainers / Cypress"
  coverage_target: "70%"
  test_types:
    - "API endpoint tests"
    - "Database integration tests"
    - "Service communication tests"
    - "Third-party API mocks"
  environments:
    - "CI pipeline"
    - "Feature branch testing"
  data_management:
    - "Test data factories"
    - "Database transactions"
    - "Cleanup after tests"
```

#### 3. End-to-End Testing Strategy
```yaml
e2e_testing:
  framework: "Cypress / Playwright / Selenium"
  coverage_target: "Critical user paths"
  test_types:
    - "User journey tests"
    - "Cross-browser tests"
    - "Responsive design tests"
    - "Accessibility tests"
  environments:
    - "Staging environment"
    - "Production mirror"
  browsers:
    - "Chrome (latest)"
    - "Firefox (latest)"
    - "Safari (latest)"
    - "Edge (latest)"
  devices:
    - "Desktop (1920x1080)"
    - "Tablet (768x1024)"
    - "Mobile (375x667)"
```

#### 4. Performance Testing Strategy
```yaml
performance_testing:
  tools:
    - "k6 / JMeter / Locust"
    - "Lighthouse"
    - "New Relic / Datadog"
  test_types:
    - "Load testing"
    - "Stress testing"
    - "Spike testing"
    - "Endurance testing"
  benchmarks:
    api_response_time: "< 200ms p95"
    page_load_time: "< 3s"
    concurrent_users: "1000"
    error_rate: "< 0.1%"
    throughput: "100 req/s"
```

#### 5. Security Testing Strategy
```yaml
security_testing:
  tools:
    - "OWASP ZAP"
    - "SonarQube"
    - "Snyk"
    - "npm audit / pip-audit"
  test_types:
    - "Vulnerability scanning"
    - "Penetration testing"
    - "Dependency audit"
    - "Secret detection"
    - "Access control tests"
  owasp_top_10:
    - "A01: Broken Access Control"
    - "A02: Cryptographic Failures"
    - "A03: Injection"
    - "A04: Insecure Design"
    - "A05: Security Misconfiguration"
```

### Phase 3: Test Case Generation

#### Test Case Template
```yaml
test_case_id: "AUTH-TC-001"
module: "Authentication"
category: "Unit Test"
priority: "P0"
title: "Valid login credentials should authenticate user"
description: "Verify that users can successfully log in with valid credentials"

preconditions:
  - "User account exists in database"
  - "User is not currently logged in"

test_data:
  username: "testuser@example.com"
  password: "ValidPass123!"
  expected_token: "valid_jwt_token"

steps:
  - number: 1
    action: "Enter valid email address"
    expected: "Email field accepts input without error"
  - number: 2
    action: "Enter valid password"
    expected: "Password field accepts input"
  - number: 3
    action: "Click login button"
    expected: |
      - Loading indicator appears
      - User is redirected to dashboard
      - JWT token is stored

assertions:
  - "API returns 200 status"
  - "Response contains valid JWT token"
  - "User session is created in database"
  - "No error messages displayed"

automated: true
automation_script: "tests/auth/login.spec.ts"
```

#### Test Case Generation from User Stories
```
User Story: As a shopper, I want to save items to a wishlist
            so that I can purchase them later.

Generated Test Cases:

AUTH-WISH-001: Add item to wishlist (Happy Path)
- Priority: P0
- Type: E2E
- Steps: Login → Browse products → Click "Add to Wishlist"
- Expected: Item appears in wishlist

AUTH-WISH-002: Add out-of-stock item to wishlist
- Priority: P1
- Type: E2E
- Steps: Login → Find out-of-stock item → Click "Add to Wishlist"
- Expected: Warning message displayed, item not added

AUTH-WISH-003: Add duplicate item to wishlist
- Priority: P1
- Type: E2E
- Steps: Login → Add item to wishlist → Add same item again
- Expected: Message "Item already in wishlist"

AUTH-WISH-004: View empty wishlist
- Priority: P2
- Type: E2E
- Steps: Login → Go to wishlist (empty)
- Expected: Empty state message displayed

AUTH-WISH-005: Remove item from wishlist
- Priority: P1
- Type: E2E
- Steps: Login → Add item → Remove item
- Expected: Item removed from wishlist
```

### Phase 4: Test Execution Plan

#### Test Environment Setup
```yaml
environments:
  development:
    url: "http://localhost:3000"
    database: "dev_db"
    services:
      - "mock_auth_service"
      - "mock_payment_service"

  staging:
    url: "https://staging.example.com"
    database: "staging_db"
    services:
      - "auth_service"
      - "payment_service"

  production:
    url: "https://example.com"
    database: "prod_db"
    services:
      - "auth_service"
      - "payment_service"
```

#### CI/CD Pipeline Integration
```yaml
pipeline:
  stages:
    - name: "Unit Tests"
      trigger: "on push"
      command: "npm test -- --coverage"
      fail_fast: true

    - name: "Integration Tests"
      trigger: "on merge request"
      command: "npm run test:integration"
      requires: ["Unit Tests"]

    - name: "E2E Tests"
      trigger: "on merge to main"
      command: "npm run test:e2e"
      requires: ["Integration Tests"]

    - name: "Performance Tests"
      trigger: "daily"
      command: "npm run test:performance"
      environment: "staging"

    - name: "Security Scan"
      trigger: "on push"
      command: "npm run security:scan"
```

### Phase 5: Test Metrics and Reporting

#### Key Metrics
```yaml
metrics:
  code_coverage:
    unit: "> 80%"
    integration: "> 70%"
    e2e: "> 50%"

  test_results:
    pass_rate: "> 95%"
    flaky_tests: "< 1%"

  performance:
    api_latency_p95: "< 200ms"
    page_load_time: "< 3s"

  defect_metrics:
    escaped_bugs: "< 5 per release"
    mean_time_to_repair: "< 4 hours"
```

#### Test Report Template
```markdown
# Test Report - [Feature Name]

## Summary
- Total Test Cases: 150
- Passed: 145 (96.7%)
- Failed: 3 (2.0%)
- Blocked: 2 (1.3%)
- Coverage: 85%

## Defects Found
| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| DEF-001 | Critical | Login fails on Safari | Fixed |
| DEF-002 | Major | Cart total calculation error | Fixed |
| DEF-003 | Minor | Toast message z-index | Open |

## Recommendations
- All critical paths tested and passing
- 2 minor issues pending fix
- Ready for release with hotfix plan

## Sign-off
- QA Lead: ________________
- Product Owner: ________________
- Tech Lead: ________________
```

### Phase 6: Risk-Based Testing

#### Risk Matrix
```
                    Impact
                  Low    Medium    High
            +--------+--------+--------+
     High   | Medium |  High  |Critical|
Likelihood +--------+--------+--------+
    Medium |  Low   | Medium |  High  |
            +--------+--------+--------+
     Low   |  Low   |  Low   | Medium |
            +--------+--------+--------+
```

#### Risk-Based Test Prioritization
```yaml
risk_based_testing:
  critical_risk:
    test_approach: "Exhaustive testing"
    coverage_target: "100%"
    automation: "Required"
    regression: "Full suite"

  high_risk:
    test_approach: "Boundary value analysis"
    coverage_target: "90%"
    automation: "Preferred"
    regression: "Feature-focused"

  medium_risk:
    test_approach: "Equivalence partitioning"
    coverage_target: "75%"
    automation: "Optional"
    regression: "Smoke tests"

  low_risk:
    test_approach: "Happy path testing"
    coverage_target: "50%"
    automation: "Not required"
    regression: "Not required"
```

### Output Format

When generating a test plan, output in the following structure:

```markdown
# Test Plan - [Project/Feature Name]

## 1. Overview
- **Version**: 1.0
- **Author**: QA Team
- **Date**: YYYY-MM-DD
- **Scope**: [Brief description]

## 2. Test Strategy
[Detailed strategy based on Phase 1]

## 3. Test Types
[Detailed plans for each test type from Phase 2]

## 4. Test Cases
[Generated test cases from Phase 3]

## 5. Environment Requirements
[From Phase 4]

## 6. Execution Schedule
[Timeline and milestones]

## 7. Exit Criteria
- All P0 test cases passed
- Code coverage meets target
- No critical defects open
- Performance benchmarks met

## 8. Risks and Mitigation
[Identified risks with mitigation strategies]

## 9. Approvals
| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| PM | | | |
| Tech Lead | | | |
```
