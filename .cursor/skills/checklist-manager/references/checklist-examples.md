# Checklist Examples

This file provides example checklists for different project types to help structure your work.

## Table of Contents
1. [Feature Development](#feature-development)
2. [Refactoring](#refactoring)
3. [Migration](#migration)
4. [Multi-Page Data Update](#multi-page-data-update)
5. [Bug Fix (Complex)](#bug-fix-complex)

---

## Feature Development

Example: Adding a new user authentication feature

```markdown
# User Authentication Feature Checklist

## 作業概要
Implement OAuth 2.0 authentication to replace existing basic authentication system.

---

## 更新対象ファイルチェックリスト

### 1. Authentication Service
**ファイル**: `lib/auth/oauth-service.ts`

#### 実装項目
- [ ] Create OAuthService class with token management
- [ ] Implement authorize() method
- [ ] Implement refresh() method
- [ ] Add token storage with encryption

#### 確認項目
- [ ] Authorization flow works end-to-end
- [ ] Token refresh works correctly
- [ ] Tokens are securely stored

---

### 2. Login Component
**ファイル**: `components/auth/LoginForm.tsx`

#### 実装項目
- [ ] Replace form submission with OAuth redirect
- [ ] Add "Sign in with Google" button
- [ ] Handle OAuth callback
- [ ] Add loading states

#### 確認項目
- [ ] Login button redirects to OAuth provider
- [ ] Callback handles success/error states
- [ ] Loading indicators display correctly

---

### 3. Protected Route Middleware
**ファイル**: `middleware/auth.ts`

#### 実装項目
- [ ] Check for valid OAuth token
- [ ] Redirect to login if unauthorized
- [ ] Handle token expiration

#### 確認項目
- [ ] Protected pages require authentication
- [ ] Expired tokens trigger re-authentication
- [ ] Unauthorized users are redirected

---

## 統合テスト項目
- [ ] Full authentication flow works (login → protected page)
- [ ] Token refresh happens automatically
- [ ] Logout clears all tokens
- [ ] Error states display user-friendly messages

## 完了基準
- [ ] All checklist items completed
- [ ] Integration tests passing
- [ ] Security review completed
- [ ] Documentation updated
```

---

## Refactoring

Example: Converting class components to functional components with hooks

```markdown
# React Hooks Migration Checklist

## 作業概要
Migrate all class components to functional components using React Hooks.

---

## 更新対象ファイルチェックリスト

### 1. UserProfile Component
**ファイル**: `components/UserProfile.tsx`

#### 実装項目
- [ ] Convert class to function component
- [ ] Replace this.state with useState
- [ ] Replace componentDidMount with useEffect
- [ ] Replace componentWillUnmount cleanup with useEffect cleanup
- [ ] Remove this.setState calls

#### 確認項目
- [ ] Component renders correctly
- [ ] Side effects work as before
- [ ] Cleanup functions execute on unmount
- [ ] No console errors

---

### 2. Dashboard Component
**ファイル**: `components/Dashboard.tsx`

#### 実装項目
- [ ] Convert class to function component
- [ ] Replace this.state with useState (multiple states)
- [ ] Replace lifecycle methods with useEffect
- [ ] Extract custom hook for data fetching

#### 確認項目
- [ ] All state updates work correctly
- [ ] Data fetching works on mount
- [ ] Re-renders only when necessary

---

## 統合テスト項目
- [ ] All migrated components render without errors
- [ ] Performance is equal or better than before
- [ ] No memory leaks (check with React DevTools)

## 完了基準
- [ ] All class components converted
- [ ] Tests updated and passing
- [ ] PropTypes replaced with TypeScript types
```

---

## Migration

Example: Database migration from MongoDB to PostgreSQL

```markdown
# Database Migration Checklist

## 作業概要
Migrate application data layer from MongoDB to PostgreSQL with Prisma ORM.

---

## 更新対象ファイルチェックリスト

### 1. Schema Definition
**ファイル**: `prisma/schema.prisma`

#### 実装項目
- [ ] Define User model
- [ ] Define Post model
- [ ] Define Comment model with relations
- [ ] Add indexes for performance

#### 確認項目
- [ ] Schema validates (prisma validate)
- [ ] Migrations generated successfully

---

### 2. User Repository
**ファイル**: `lib/repositories/user-repository.ts`

#### 実装項目
- [ ] Replace MongoDB client with Prisma client
- [ ] Update findById method
- [ ] Update create method
- [ ] Update update method
- [ ] Update delete method

#### 確認項目
- [ ] All CRUD operations work
- [ ] TypeScript types are correct
- [ ] Error handling works

---

### 3. Data Migration Script
**ファイル**: `scripts/migrate-data.ts`

#### 実装項目
- [ ] Connect to both MongoDB and PostgreSQL
- [ ] Migrate users collection
- [ ] Migrate posts collection
- [ ] Migrate comments with proper relations
- [ ] Verify data integrity

#### 確認項目
- [ ] All records migrated
- [ ] No data loss
- [ ] Relations preserved correctly

---

## 統合テスト項目
- [ ] Application works end-to-end with PostgreSQL
- [ ] Performance is acceptable
- [ ] Data consistency verified

## 完了基準
- [ ] All data migrated successfully
- [ ] MongoDB dependency removed
- [ ] Production deployment successful
```

---

## Multi-Page Data Update

Example: Updating demo data across multiple pages (similar to your current project)

```markdown
# Demo Data Update Checklist

## 作業概要
Update demo data from sales/inventory/purchasing to focus on AP/AR/GL (accounting modules).

---

## 更新対象ファイルチェックリスト

### 1. Business List Page
**ファイル**: `app/business/page.tsx`

#### 実装項目
- [ ] Remove: Sales (SD), Inventory (MM), Purchasing (MM), Production (PP)
- [ ] Keep/Add: Accounts Receivable (AR), Accounts Payable (AP), General Ledger (GL)
- [ ] Update requirement counts for AP/AR/GL

#### 確認項目
- [ ] Page displays without errors
- [ ] Only AR/AP/GL businesses shown
- [ ] Row clicks navigate to detail pages

---

### 2. Dashboard Page
**ファイル**: `app/dashboard/page.tsx`

#### 実装項目
- [ ] Update pending review items (remove sales-related)
- [ ] Update business area distribution chart
- [ ] Adjust percentages for AR/AP/GL

#### 確認項目
- [ ] Dashboard displays without errors
- [ ] Charts render correctly
- [ ] Data matches other pages

---

### 3. Tickets List Page
**ファイル**: `app/tickets/page.tsx`

#### 実装項目
- [ ] Filter tickets to AP/AR/GL only
- [ ] Update area tags (SD/MM → AP/AR/GL)
- [ ] Update business references

#### 確認項目
- [ ] Tickets list displays correctly
- [ ] Area filters work for AP/AR/GL
- [ ] Detail links work

---

## 統合テスト項目
- [ ] All pages display without errors
- [ ] Data is consistent across pages
- [ ] No references to old modules (SD/MM/PP/HR)

## 完了基準
- [ ] All demo data updated to AP/AR/GL
- [ ] Application runs without errors
- [ ] Visual consistency maintained
```

---

## Bug Fix (Complex)

Example: Fixing a complex state management bug affecting multiple components

```markdown
# State Sync Bug Fix Checklist

## 作業概要
Fix race condition causing state inconsistency between parent and child components.

---

## 更新対象ファイルチェックリスト

### 1. Parent Component State Management
**ファイル**: `components/ParentContainer.tsx`

#### 実装項目
- [ ] Add useRef to track latest state
- [ ] Debounce state updates to avoid race condition
- [ ] Add key to force child re-render when needed

#### 確認項目
- [ ] State updates propagate correctly
- [ ] No infinite re-render loops
- [ ] Performance is acceptable

---

### 2. Child Component Props Handling
**ファイル**: `components/ChildComponent.tsx`

#### 実装項目
- [ ] Use useEffect with proper dependencies
- [ ] Add cleanup function to cancel pending operations
- [ ] Memoize expensive computations

#### 確認項目
- [ ] Component responds to prop changes
- [ ] No stale closures
- [ ] Cleanup prevents memory leaks

---

### 3. Unit Tests
**ファイル**: `__tests__/state-sync.test.tsx`

#### 実装項目
- [ ] Add test for race condition scenario
- [ ] Add test for rapid state updates
- [ ] Add test for cleanup on unmount

#### 確認項目
- [ ] All new tests pass
- [ ] Existing tests still pass
- [ ] Coverage maintained

---

## 統合テスト項目
- [ ] Manual testing confirms bug is fixed
- [ ] No regressions in related features
- [ ] Performance profiling shows no degradation

## 完了基準
- [ ] Bug no longer reproducible
- [ ] Tests prevent regression
- [ ] Code reviewed and approved
```

---

## Tips for Creating Effective Checklists

1. **Be Specific**: "Update component" → "Replace useState with useReducer in UserForm.tsx"
2. **Include Verification**: Every implementation section should have corresponding verification items
3. **Order by Dependency**: Place prerequisite tasks first
4. **Break Down Large Tasks**: If a task seems too big, split it into sub-tasks
5. **Add Context**: Include file paths, function names, and specific details
6. **Plan for Integration**: Always include integration tests section
7. **Define Success**: Clear completion criteria prevent scope creep
