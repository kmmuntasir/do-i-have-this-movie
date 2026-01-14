# Migration Checklist

This document provides a comprehensive checklist for migrating from the original monolithic codebase to the new adapter-based architecture.

## Table of Contents

- [Overview](#overview)
- [Pre-Migration Preparation](#pre-migration-preparation)
- [Code Migration](#code-migration)
- [Testing](#testing)
- [Documentation Updates](#documentation-updates)
- [Deployment](#deployment)
- [Post-Migration](#post-migration)

## Overview

The migration involves refactoring the extension from a monolithic approach (where all site-specific logic is embedded in [`content.js`](../content.js)) to a modular adapter-based architecture. This improves maintainability, extensibility, and code organization.

### Migration Goals

- ✅ Separate site-specific logic into dedicated adapters
- ✅ Implement a registry pattern for adapter management
- ✅ Maintain backward compatibility
- ✅ Improve code testability
- ✅ Enable easy addition of new website support

### Architecture Changes

**Before (Monolithic):**
```
content.js
├── Netflix detection logic
├── IMDb detection logic
├── YTS detection logic
└── Badge injection logic
```

**After (Adapter-Based):**
```
content.js
├── AdapterRegistry
├── BaseAdapter
└── Adapters
    ├── NetflixAdapter
    ├── IMDBAdapter
    └── YTSAdapter
```

## Pre-Migration Preparation

### 1. Create Backup

- [ ] Create a git branch for the migration: `git checkout -b feature/adapter-refactoring`
- [ ] Tag the current state: `git tag pre-migration`
- [ ] Document the current state of the codebase

### 2. Review Existing Code

- [ ] Analyze [`content.js`](../content.js) to identify site-specific logic
- [ ] Document all CSS selectors used for each website
- [ ] Identify common patterns across different websites
- [ ] Note any special handling or edge cases

### 3. Set Up Development Environment

- [ ] Ensure Node.js and npm are installed
- [ ] Install dependencies: `npm install`
- [ ] Verify build process works: `npm run build`
- [ ] Test extension loading in Chrome

### 4. Create New Directory Structure

- [ ] Create `adapters/` directory
- [ ] Create `docs/` directory (if not exists)
- [ ] Create `dist/` directory for bundled output

## Code Migration

### Phase 1: Create Base Adapter

- [ ] Create [`adapters/base-adapter.js`](../adapters/base-adapter.js)
- [ ] Define the abstract base class with required methods:
  - [ ] `canHandle(hostname)`
  - [ ] `getTargetSelectors()`
  - [ ] `extractTitle(element)`
- [ ] Define optional methods with default implementations:
  - [ ] `extractYear(element)` - returns null
  - [ ] `getBadgeParent(element)` - returns element
  - [ ] `getBadgeStyles()` - returns null
  - [ ] `shouldProcessElement(element)` - returns true
- [ ] Add JSDoc comments for all methods

### Phase 2: Create Adapter Registry

- [ ] Create [`adapters/adapter-registry.js`](../adapters/adapter-registry.js)
- [ ] Implement singleton pattern
- [ ] Add `register(adapter)` method
- [ ] Add `getAdapter(hostname)` method
- [ ] Add `getAllAdapters()` method
- [ ] Add input validation for adapter registration
- [ ] Export singleton instance

### Phase 3: Create Site-Specific Adapters

#### Netflix Adapter

- [ ] Create [`adapters/netflix-adapter.js`](../adapters/netflix-adapter.js)
- [ ] Extend [`BaseAdapter`](../adapters/base-adapter.js)
- [ ] Implement `canHandle(hostname)` - check for 'netflix.com'
- [ ] Implement `getTargetSelectors()` - return Netflix selectors
- [ ] Implement `extractTitle(element)` - extract from Netflix cards
- [ ] Implement `getBadgeParent(element)` - return correct parent
- [ ] Export singleton instance

#### IMDb Adapter

- [ ] Create [`adapters/imdb-adapter.js`](../adapters/imdb-adapter.js)
- [ ] Extend [`BaseAdapter`](../adapters/base-adapter.js)
- [ ] Implement `canHandle(hostname)` - check for 'imdb.com'
- [ ] Implement `getTargetSelectors()` - return IMDb selectors
- [ ] Implement `extractTitle(element)` - extract from IMDb cards
- [ ] Implement `extractYear(element)` - extract year from IMDb
- [ ] Implement `getBadgeParent(element)` - return correct parent
- [ ] Export singleton instance

#### YTS Adapter

- [ ] Create [`adapters/yts-adapter.js`](../adapters/yts-adapter.js)
- [ ] Extend [`BaseAdapter`](../adapters/base-adapter.js)
- [ ] Implement `canHandle(hostname)` - check for 'yts.bz'
- [ ] Implement `getTargetSelectors()` - return YTS selectors
- [ ] Implement `extractTitle(element)` - extract from YTS cards
- [ ] Implement `extractYear(element)` - extract year from YTS
- [ ] Implement `getBadgeParent(element)` - return correct parent
- [ ] Export singleton instance

### Phase 4: Refactor Content Script

- [ ] Update [`content.js`](../content.js) to import adapters
- [ ] Initialize `AdapterRegistry` instance
- [ ] Register all adapters at startup
- [ ] Replace site-specific detection with adapter lookup
- [ ] Replace site-specific extraction with adapter methods
- [ ] Update badge injection to use adapter's `getBadgeParent()`
- [ ] Apply custom badge styles from adapter if provided
- [ ] Remove monolithic site-specific code

### Phase 5: Update Build Process

- [ ] Create [`rollup.config.mjs`](../rollup.config.mjs) configuration
- [ ] Install Rollup dependencies:
  - [ ] `rollup`
  - [ ] `@rollup/plugin-node-resolve`
- [ ] Configure input as `content.js`
- [ ] Configure output as `dist/content-bundled.js`
- [ ] Set format to IIFE (Immediately Invoked Function Expression)
- [ ] Update [`package.json`](../package.json) build script
- [ ] Test build process: `npm run build`

### Phase 6: Update Manifest

- [ ] Update [`manifest.json`](../manifest.json) content script path
- [ ] Change from `content.js` to `dist/content-bundled.js`
- [ ] Verify all permissions are correct
- [ ] Verify host permissions for all supported sites

### Phase 7: Remove Mock Code

- [ ] Identify mock code in [`background.js`](../background.js)
- [ ] Remove mock data and responses
- [ ] Replace with actual API calls
- [ ] Test API integration

### Phase 8: Update Popup

- [ ] Review [`popup.html`](../popup.html) for any changes needed
- [ ] Review [`popup.js`](../popup.js) for any changes needed
- [ ] Ensure settings are properly saved and loaded
- [ ] Test popup functionality

## Testing

### Unit Testing (If Applicable)

- [ ] Test `BaseAdapter` abstract methods
- [ ] Test `AdapterRegistry` registration
- [ ] Test `AdapterRegistry` lookup
- [ ] Test each adapter's `canHandle()` method
- [ ] Test each adapter's `extractTitle()` method
- [ ] Test each adapter's `extractYear()` method

### Integration Testing

#### Netflix Testing

- [ ] Load extension in Chrome
- [ ] Visit Netflix.com
- [ ] Navigate to movie listings
- [ ] Verify badges appear on owned items
- [ ] Verify badges don't appear on non-owned items
- [ ] Test SPA navigation
- [ ] Test different page layouts (grid, list, detail)

#### IMDb Testing

- [ ] Visit IMDb.com
- [ ] Navigate to movie listings
- [ ] Verify badges appear correctly
- [ ] Test search results
- [ ] Test individual movie pages
- [ ] Verify year extraction works

#### YTS Testing

- [ ] Visit YTS.bz
- [ ] Browse movie listings
- [ ] Verify badges appear correctly
- [ ] Test related movies section
- [ ] Test similar movies section
- [ ] Verify year extraction works

### Cross-Site Testing

- [ ] Test switching between supported sites
- [ ] Verify adapter selection is correct
- [ ] Test with multiple tabs open
- [ ] Test extension reload

### Edge Case Testing

- [ ] Test with titles containing special characters
- [ ] Test with missing year information
- [ ] Test with sponsored/ad content
- [ ] Test with dynamically loaded content
- [ ] Test with very large libraries
- [ ] Test with network errors

### Performance Testing

- [ ] Measure page load impact
- [ ] Test with 100+ movie cards on a page
- [ ] Verify no memory leaks
- [ ] Check console for errors or warnings

## Documentation Updates

### Code Documentation

- [ ] Add JSDoc comments to all adapter methods
- [ ] Document the adapter pattern in code comments
- [ ] Add inline comments for complex logic
- [ ] Update file headers with descriptions

### User Documentation

- [ ] Update README.md with new architecture description
- [ ] Update supported websites list
- [ ] Add link to architecture documentation
- [ ] Update installation instructions (if needed)

### Developer Documentation

- [ ] Create [`docs/architecture.md`](architecture.md) - ✅ Completed
- [ ] Create [`docs/adding-new-websites.md`](adding-new-websites.md) - ✅ Completed
- [ ] Create [`docs/migration-checklist.md`](migration-checklist.md) - ✅ This file
- [ ] Create [`docs/build-process.md`](build-process.md)
- [ ] Create [`docs/troubleshooting.md`](troubleshooting.md)
- [ ] Create [`docs/development-notes.md`](development-notes.md)

### Migration Documentation

- [ ] Document breaking changes (if any)
- [ ] Create migration guide for users (if needed)
- [ ] Document deprecations (if any)
- [ ] Update changelog

## Deployment

### Pre-Deployment Checks

- [ ] All tests passing
- [ ] No console errors
- [ ] Code reviewed (if team)
- [ ] Documentation complete
- [ ] Changelog updated

### Build and Package

- [ ] Run final build: `npm run build`
- [ ] Verify `dist/content-bundled.js` is generated
- [ ] Check file size is reasonable
- [ ] Test loading unpacked extension

### Version Bump

- [ ] Update version in [`package.json`](../package.json)
- [ ] Update version in [`manifest.json`](../manifest.json)
- [ ] Create git tag for release

### Release

- [ ] Merge feature branch to main
- [ ] Create release notes
- [ ] Publish to Chrome Web Store (if applicable)
- [ ] Announce release (if applicable)

## Post-Migration

### Monitoring

- [ ] Monitor for user-reported issues
- [ ] Check for performance regressions
- [ ] Verify all supported sites work correctly
- [ ] Collect feedback on new architecture

### Maintenance

- [ ] Address any bugs found
- [ ] Optimize performance if needed
- [ ] Update documentation based on feedback
- [ ] Plan future enhancements

### Future Enhancements

- [ ] Implement unit tests
- [ ] Add integration tests
- [ ] Implement rate limiting
- [ ] Add response caching
- [ ] Complete Letterboxd support
- [ ] Add more website adapters

### Cleanup

- [ ] Remove any temporary code
- [ ] Delete old backup branches
- [ ] Archive old documentation
- [ ] Clean up unused dependencies

## Rollback Plan

If critical issues are discovered after migration:

1. **Immediate Rollback**
   - [ ] Revert to pre-migration tag: `git checkout pre-migration`
   - [ ] Rebuild and redeploy
   - [ ] Notify users of rollback

2. **Investigation**
   - [ ] Identify root cause of issues
   - [ ] Document findings
   - [ ] Plan fixes

3. **Re-migration**
   - [ ] Apply fixes to migration code
   - [ ] Re-run testing
   - [ ] Attempt migration again

## Success Criteria

The migration is considered successful when:

- ✅ All existing functionality works correctly
- ✅ Code is more modular and maintainable
- ✅ New website adapters can be added easily
- ✅ Performance is not degraded
- ✅ No critical bugs are reported
- ✅ Documentation is complete and accurate
- ✅ Tests pass (if implemented)

## Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Pre-Migration Preparation | 2-4 hours |
| Phase 1: Base Adapter | 1-2 hours |
| Phase 2: Adapter Registry | 1-2 hours |
| Phase 3: Site Adapters | 4-6 hours |
| Phase 4: Refactor Content Script | 3-4 hours |
| Phase 5: Update Build Process | 1-2 hours |
| Phase 6: Update Manifest | 0.5 hours |
| Phase 7: Remove Mock Code | 1 hour |
| Phase 8: Update Popup | 1 hour |
| Testing | 4-6 hours |
| Documentation Updates | 3-4 hours |
| Deployment | 1-2 hours |
| **Total** | **23-36 hours** |

## Notes and Considerations

### Breaking Changes

- None expected for end users
- Internal API changes for developers adding adapters

### Backward Compatibility

- Extension settings are preserved
- No user configuration changes required
- Existing installations should work seamlessly

### Known Limitations

- Letterboxd support remains partially implemented
- No UI for error handling (logged to console only)
- No rate limiting implemented yet

### Future Improvements

See [`docs/future-enhancements.md`](future-enhancements.md) for planned improvements.

## Additional Resources

- [Architecture Overview](./architecture.md)
- [Adding New Websites](./adding-new-websites.md)
- [Build Process](./build-process.md)
- [Troubleshooting](./troubleshooting.md)
- [Development Notes](./development-notes.md)

---

**Last Updated:** 2026-01-14
**Migration Status:** In Progress
