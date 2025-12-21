/**
 * Tests for Document Parsers
 */

import { parsePRD, parseSRS, parseBacklog, parseProjectPlan, parseDocumentSet } from '../parsers';

describe('Document Parsers', () => {
  describe('parsePRD', () => {
    it('extracts numbered sections', () => {
      const content = `
# Product Requirements Document

## 1.0 Introduction

### 1.1 Purpose

## 2.0 Product Overview

### 2.1 User Management
Description of user management feature.

### 2.2 Authentication
OAuth and local auth support.

## 3.0 Requirements
`;
      const result = parsePRD(content);

      expect(result.sections).toHaveLength(6);
      expect(result.sections[0]).toEqual({
        number: '1.0',
        title: 'Introduction',
        level: 2,
      });
      expect(result.sections[1]).toEqual({
        number: '1.1',
        title: 'Purpose',
        level: 3,
      });
      expect(result.sections[2]).toEqual({
        number: '2.0',
        title: 'Product Overview',
        level: 2,
      });
      expect(result.sections[3]).toEqual({
        number: '2.1',
        title: 'User Management',
        level: 3,
      });
    });

    it('handles sections with complex numbering', () => {
      const content = `
## 2.3.1 Subsection A
## 2.3.2 Subsection B
`;
      const result = parsePRD(content);

      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].number).toBe('2.3.1');
      expect(result.sections[1].number).toBe('2.3.2');
    });
  });

  describe('parseSRS', () => {
    it('extracts functional requirements with traces', () => {
      const content = `
# Software Requirements Specification

## Functional Requirements

### FR-001: User Registration
Users must be able to create accounts with email and password.
Traces to: PRD Section 2.1

### FR-002: User Login
Users can authenticate with email/password or OAuth.
Traces to: PRD Section 2.2

## Non-Functional Requirements

### NFR-001: Performance
System must respond within 200ms.
Traces to: PRD Section 3.1
`;
      const result = parseSRS(content);

      expect(result.functionalRequirements).toHaveLength(2);
      expect(result.functionalRequirements[0]).toMatchObject({
        id: 'FR-001',
        type: 'FR',
        title: 'User Registration',
        prdTraces: ['2.1'],
      });
      expect(result.functionalRequirements[1]).toMatchObject({
        id: 'FR-002',
        type: 'FR',
        title: 'User Login',
        prdTraces: ['2.2'],
      });

      expect(result.nonFunctionalRequirements).toHaveLength(1);
      expect(result.nonFunctionalRequirements[0]).toMatchObject({
        id: 'NFR-001',
        type: 'NFR',
        title: 'Performance',
        prdTraces: ['3.1'],
      });
    });

    it('handles requirements without traces', () => {
      const content = `
### FR-003: Password Reset
Users can reset their password via email.
`;
      const result = parseSRS(content);

      expect(result.functionalRequirements).toHaveLength(1);
      expect(result.functionalRequirements[0].prdTraces).toEqual([]);
    });
  });

  describe('parseBacklog', () => {
    it('extracts epics and user stories', () => {
      const content = `
# Product Backlog

## EPIC-001: User Management

### US-001: User Registration Form
**Epic:** EPIC-001
**Story Points:** 3
**Sprint:** 1
Traces to: FR-001, FR-002

As a new user, I want to register with my email.

### US-002: User Profile Page
**Epic:** EPIC-001
**Story Points:** 5
**Sprint:** 2
Traces to: FR-003
Traces to: NFR-001

As a user, I want to view my profile.

## Epic 2: Authentication

### Feature 2.1: OAuth Login
**Sprint:** 1
Traces to: FR-004
`;
      const result = parseBacklog(content);

      expect(result.epics).toHaveLength(2);
      expect(result.epics[0].id).toBe('EPIC-001');
      expect(result.epics[1].id).toBe('EPIC-002');

      expect(result.items).toHaveLength(3);
      expect(result.items[0]).toMatchObject({
        id: 'US-001',
        title: 'User Registration Form',
        epicId: 'EPIC-001',
        frTraces: ['FR-001', 'FR-002'],
        sprintNumber: 1,
      });
      expect(result.items[1]).toMatchObject({
        id: 'US-002',
        frTraces: ['FR-003'],
        nfrTraces: ['NFR-001'],
        sprintNumber: 2,
      });
      expect(result.items[2]).toMatchObject({
        id: 'Feature 2.1',
        frTraces: ['FR-004'],
        sprintNumber: 1,
      });
    });

    it('handles backlog items without sprint assignment', () => {
      const content = `
### US-010: Future Feature
Traces to: FR-010

This is a future feature without sprint assignment.
`;
      const result = parseBacklog(content);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].sprintNumber).toBeNull();
    });
  });

  describe('parseProjectPlan', () => {
    it('extracts sprint scopes', () => {
      const content = `
# Project Plan

## Phase 1: Foundation

### Sprint 1: Setup (Weeks 1-2)

**Goals:**
- Set up development environment
- Implement user authentication

**Scope (Backlog Items):**
- EPIC-001 / US-001 (FR-001, FR-002)
- US-002 (FR-003)
- US-003 (FR-004, NFR-001)

**Deliverables:**
- Working authentication system

### Sprint 2: Core Features (Weeks 3-4)

**Goals:**
- Implement core features

**Scope (Backlog Items):**
- EPIC-002 / US-004 (FR-005)
- Feature 2.1 (FR-006)

**Deliverables:**
- Core feature set
`;
      const result = parseProjectPlan(content);

      expect(result.sprints).toHaveLength(2);

      expect(result.sprints[0]).toMatchObject({
        sprintNumber: 1,
        title: 'Setup (Weeks 1-2)',
      });
      expect(result.sprints[0].backlogItems).toContain('US-001');
      expect(result.sprints[0].backlogItems).toContain('US-002');
      expect(result.sprints[0].backlogItems).toContain('US-003');
      expect(result.sprints[0].backlogItems).toContain('EPIC-001');
      expect(result.sprints[0].frRefs).toContain('FR-001');
      expect(result.sprints[0].frRefs).toContain('FR-002');
      expect(result.sprints[0].nfrRefs).toContain('NFR-001');

      expect(result.sprints[1]).toMatchObject({
        sprintNumber: 2,
        title: 'Core Features (Weeks 3-4)',
      });
      expect(result.sprints[1].backlogItems).toContain('US-004');
      expect(result.sprints[1].backlogItems).toContain('Feature 2.1');
    });

    it('handles sprints without scope sections', () => {
      const content = `
### Sprint 3: Polish

**Goals:**
- Bug fixes

**Deliverables:**
- Stable release
`;
      const result = parseProjectPlan(content);

      expect(result.sprints).toHaveLength(1);
      expect(result.sprints[0].backlogItems).toEqual([]);
    });
  });

  describe('parseDocumentSet', () => {
    it('parses all documents when provided', () => {
      const docs = {
        prd: '## 2.1 Feature A',
        srs: '### FR-001: Test',
        backlog: '### US-001: Story',
        projectPlan: '### Sprint 1: Setup',
      };

      const result = parseDocumentSet(docs);

      expect(result.prd).not.toBeNull();
      expect(result.srs).not.toBeNull();
      expect(result.backlog).not.toBeNull();
      expect(result.projectPlan).not.toBeNull();
    });

    it('returns null for missing documents', () => {
      const docs = {
        prd: '## 2.1 Feature A',
      };

      const result = parseDocumentSet(docs);

      expect(result.prd).not.toBeNull();
      expect(result.srs).toBeNull();
      expect(result.backlog).toBeNull();
      expect(result.projectPlan).toBeNull();
    });
  });
});
