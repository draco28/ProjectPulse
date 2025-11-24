# Roadmap UI - Component Specifications

## Component Tree

```
/roadmap (page)
├── FilterableRoadmapView
│   ├── ViewToggle [Tree | Timeline]
│   ├── RoadmapFilters (existing)
│   ├── CurrentPositionBanner (existing)
│   └── [View Content]
│       ├── RoadmapTree (existing, enhanced)
│       └── RoadmapTimeline (new)

/roadmap/create (page)
└── RoadmapWizard
    ├── WizardStepIndicator
    ├── [Step Content]
    │   ├── Step1ProjectInfo
    │   ├── Step2Phases
    │   ├── Step3Sprints
    │   └── Step4Preview
    └── WizardNavigation

/roadmap/import (page)
└── RoadmapImport
    ├── JsonFileUpload
    ├── JsonPasteArea
    ├── ImportPreview
    └── ImportValidationErrors
```

---

## New Pages

### `/roadmap/create` - Creation Wizard

```tsx
// apps/web/app/(authenticated)/roadmap/create/page.tsx
export default function CreateRoadmapPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create Roadmap</h1>
      <RoadmapWizard />
    </div>
  );
}
```

### `/roadmap/import` - Import Page

```tsx
// apps/web/app/(authenticated)/roadmap/import/page.tsx
export default function ImportRoadmapPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Import Roadmap</h1>
      <RoadmapImport />
    </div>
  );
}
```

---

## Wizard Components

### RoadmapWizard.tsx

Main wizard container with state management.

```tsx
interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  data: {
    title: string;
    description: string;
    startDate: Date | null;
    phases: Phase[];
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

interface Phase {
  id: string;  // UUID for tracking
  title: string;
  description: string;
  duration: string;  // "4 weeks"
  sprints: Sprint[];
}

interface Sprint {
  id: string;
  name: string;
  duration: string;
  goals: string[];
  deliverables: string[];
}
```

**Features**:
- Local state with useReducer
- Auto-save to localStorage every 30s
- Draft recovery on mount
- Validation before step navigation

### WizardStepIndicator.tsx

Progress dots showing current step.

```tsx
interface WizardStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}
```

**Design**:
```
  ●────●────○────○
  1    2    3    4
Info Phases Sprints Preview
```

### Step1ProjectInfo.tsx

Basic project information.

```tsx
interface Step1Props {
  data: { title: string; description: string; startDate: Date | null };
  onChange: (data: Partial<Step1Props['data']>) => void;
  errors: Record<string, string>;
}
```

**Fields**:
- Title (required, max 200 chars)
- Description (optional, max 2000 chars)
- Start Date (required, date picker)

### Step2Phases.tsx

Phase definition with add/remove.

```tsx
interface Step2Props {
  phases: Phase[];
  onChange: (phases: Phase[]) => void;
  errors: Record<string, string>;
}
```

**UI**:
- List of phase cards
- "Add Phase" button
- Each card has: title, description, duration dropdown
- Delete button on each card (confirm if has sprints)

### Step3Sprints.tsx

Sprints per phase.

```tsx
interface Step3Props {
  phases: Phase[];
  onChange: (phases: Phase[]) => void;
  errors: Record<string, string>;
}
```

**UI**:
- Accordion of phases
- Each phase shows its sprints
- "Add Sprint" button per phase
- Sprint fields: name, duration, goals (tag input), deliverables (tag input)

### Step4Preview.tsx

Full hierarchy preview before creation.

```tsx
interface Step4Props {
  data: WizardState['data'];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}
```

**UI**:
- Read-only tree view of the roadmap
- Summary stats: X phases, Y sprints, Z weeks
- Start date and estimated end date
- "Create Roadmap" button

### WizardNavigation.tsx

Navigation buttons.

```tsx
interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canProceed: boolean;
}
```

---

## Import Components

### RoadmapImport.tsx

Container managing import flow.

```tsx
type ImportMethod = 'file' | 'paste';
type ImportStatus = 'idle' | 'parsing' | 'previewing' | 'importing' | 'success' | 'error';

interface ImportState {
  method: ImportMethod;
  rawInput: string;  // File content or pasted JSON
  parsed: ParsedRoadmap | null;
  validationErrors: ValidationError[];
  status: ImportStatus;
}
```

### JsonFileUpload.tsx

Drag-and-drop file upload.

```tsx
interface JsonFileUploadProps {
  onFileSelect: (content: string) => void;
  isDisabled: boolean;
}
```

**Features**:
- Drag-drop zone with visual feedback
- Click to browse
- Accept only .json files
- Max file size: 1MB
- Parse and validate on upload

### JsonPasteArea.tsx

Textarea for pasting JSON.

```tsx
interface JsonPasteAreaProps {
  value: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
}
```

**Features**:
- Monospace font
- Syntax highlighting (optional)
- "Format JSON" button
- Character count

### ImportPreview.tsx

Show parsed structure.

```tsx
interface ImportPreviewProps {
  roadmap: ParsedRoadmap;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
}
```

### ImportValidationErrors.tsx

Display validation errors.

```tsx
interface ValidationError {
  path: string[];
  message: string;
}

interface ImportValidationErrorsProps {
  errors: ValidationError[];
}
```

---

## Timeline Components

See `ROADMAP-TIMELINE-DESIGN.md` for detailed timeline specifications.

---

## Edit Components

### InlineEditForm.tsx

Reusable inline edit component.

```tsx
interface InlineEditFormProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}
```

**Behavior**:
- Show input on double-click
- Save on blur or Enter
- Cancel on Escape
- Show loading state during save

### ProgressSlider.tsx

Quick progress update.

```tsx
interface ProgressSliderProps {
  value: number;  // 0-100
  onChange: (value: number) => void;
  onCommit: (value: number) => Promise<void>;
  isDisabled?: boolean;
}
```

**Design**:
- Horizontal slider with gradient fill
- Shows percentage label
- Commits on mouse up (debounced)

### StatusDropdown.tsx

Quick status change.

```tsx
interface StatusDropdownProps {
  value: Status;
  onChange: (status: Status) => Promise<void>;
  isDisabled?: boolean;
}

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
```

---

## Existing Components to Modify

### RoadmapTree.tsx

Add edit mode support:
- Pass `isEditable` prop
- Show edit controls when enabled
- Handle inline edit callbacks

### PhaseCard.tsx, SprintCard.tsx, WeekCard.tsx

Add inline editing:
- Double-click on title to edit
- Show ProgressSlider
- Show StatusDropdown
- Handle optimistic updates

### EmptyRoadmapState.tsx

Update CTA:
- Show "Create Roadmap" button
- Show "Import Roadmap" button
- Remove "Complete Onboarding" text

---

## Design System Reference

### Neumorphic Classes
- `neu-raised` - Raised surface
- `neu-pressed` - Pressed/inset surface
- `neu-flat` - Flat surface

### Status Colors
- NOT_STARTED: `bg-slate-100 text-slate-600`
- IN_PROGRESS: `bg-blue-100 text-blue-600`
- COMPLETED: `bg-green-100 text-green-600`
- BLOCKED: `bg-red-100 text-red-600`
- CANCELLED: `bg-gray-100 text-gray-600`

### Icons (Lucide React)
- Plus, Trash2, Edit2, Check, X
- Calendar, Clock, Target, Flag
- ChevronDown, ChevronRight
- Upload, FileJson, Clipboard
