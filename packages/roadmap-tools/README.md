# @projectpulse/roadmap-tools

Shared roadmap parsing and materialization utilities for ProjectPulse.

## Usage

### Parsing 13-Project-Plan.md

```typescript
import { parseProjectPlan } from '@projectpulse/roadmap-tools';

const parsed = await parseProjectPlan(documentId);
// Returns: { phases: [...] }
```

### Materializing Roadmap

```typescript
import { materializeRoadmap } from '@projectpulse/roadmap-tools';

const result = await materializeRoadmap(roadmapId);
// Creates Phase/Sprint/Week/Day records in database
```

## Architecture

- **parseProjectPlan**: Parses markdown → JSON structure
- **materializeRoadmap**: JSON → normalized database records
- **Shared by**: Next.js (Session 3) + MCP Server (tools)
