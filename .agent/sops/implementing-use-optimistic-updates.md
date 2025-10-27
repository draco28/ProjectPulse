# SOP: Implementing useOptimistic Updates

## Purpose

Standard procedure for implementing instant UI feedback during Server Actions using React's `useOptimistic` hook. This pattern provides immediate visual response to user actions while the actual mutation happens in the background, significantly improving perceived performance.

## When to Use

**Use useOptimistic for mutations that:**

- Need instant visual feedback (toggles, likes, status changes)
- Take >200ms to complete on server
- Are highly likely to succeed (optimistic assumption)
- Can be easily reverted if they fail
- Don't require server data to compute optimistic state

**Examples from codebase:**

- Agent Personas: Toggle active/inactive status (instant switch animation)
- Like/favorite buttons
- Read/unread status toggles
- Simple form submissions with predictable outcomes

**Don't use when:**

- Mutation creates new data that needs server-generated ID
- Mutation requires complex server-side validation
- Failure is common or expected
- Optimistic state cannot be computed client-side

## Prerequisites

- Next.js 14+ with Server Actions
- React 18+ (useOptimistic, useTransition)
- Understanding of Server Actions vs API routes
- TypeScript for type safety

## Procedure

### Step 1: Create Server Action

Create a Server Action that performs the mutation.

**Example from apps/web/app/agents/actions.ts:**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export async function toggleAgentStatus(agentId: number, currentStatus: boolean) {
  try {
    const agent = await prisma.agentPersona.update({
      where: { id: agentId },
      data: { isActive: !currentStatus },
    });

    // Revalidate the page to reflect changes
    revalidatePath('/agents');

    return { success: true, agent };
  } catch (error) {
    console.error('Failed to toggle agent status:', error);
    return { success: false, error: 'Failed to toggle agent status' };
  }
}
```

**Best Practices:**

- Mark file with `'use server'` directive at the top
- Return structured response: `{ success: boolean, data?, error? }`
- Use `revalidatePath` to update cache after mutation
- Include error handling with try-catch
- Log errors for debugging

**Gotcha**: Server Actions must be async and return serializable data (no functions, Dates must be strings).

### Step 2: Import useOptimistic and useTransition

Import React hooks in your Client Component.

**Example from AgentCard.tsx:**

```typescript
'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleAgentStatus } from '@/app/agents/actions';
```

**Best Practices:**

- Mark component with `'use client'` directive
- Import Server Action function
- Import both useOptimistic and useTransition together

**Gotcha**: useOptimistic only works in Client Components. Don't forget `'use client'` directive!

### Step 3: Initialize useTransition

Use `useTransition` to track pending state during mutation.

**Example from AgentCard.tsx:**

```typescript
export function AgentCard({ agent }: AgentCardProps) {
  const [isPending, startTransition] = useTransition();

  // ... rest of component
}
```

**Best Practices:**

- Name boolean `isPending` (convention)
- Name function `startTransition` (convention)
- Place at top of component with other hooks

**Why useTransition?** - It marks the Server Action as a non-blocking transition, allowing React to keep the UI responsive while the mutation runs.

### Step 4: Initialize useOptimistic

Create optimistic state that updates immediately.

**Example from AgentCard.tsx:**

```typescript
export function AgentCard({ agent }: AgentCardProps) {
  const [isPending, startTransition] = useTransition();

  // useOptimistic for instant UI feedback
  const [optimisticAgent, setOptimisticAgent] = useOptimistic(
    agent, // Current state
    (state, newStatus: boolean) => ({ ...state, isActive: newStatus }) // Optimistic updater
  );

  // ... rest of component
}
```

**Parameters:**

1. **Current state** - The actual data from server (props)
2. **Optimistic updater function** - How to compute optimistic state
   - Receives current state and update payload
   - Returns new optimistic state
   - Must be pure function (no side effects)

**Best Practices:**

- Name optimistic state descriptively: `optimisticAgent`, `optimisticLikes`
- Keep updater function pure (no API calls, no side effects)
- Use spread operator for immutability
- Type the payload parameter explicitly

**Gotcha**: The updater function must be pure - no async operations, no API calls!

### Step 5: Create Action Handler

Wrap Server Action call with `startTransition` and optimistic update.

**Example from AgentCard.tsx:**

```typescript
const handleToggle = () => {
  startTransition(async () => {
    // Optimistic update (instant UI change)
    setOptimisticAgent(!optimisticAgent.isActive);

    // Server Action (runs in background)
    const result = await toggleAgentStatus(agent.id, agent.isActive);

    if (!result.success) {
      // Revert optimistic update on error
      console.error('Failed to toggle agent:', result.error);
      // Note: In production, show error toast
    }
  });
};
```

**Execution Order:**

1. `setOptimisticAgent()` - Updates UI instantly
2. React re-renders with optimistic state
3. `toggleAgentStatus()` - Runs in background
4. Server responds
5. React replaces optimistic state with real state (from revalidation)

**Best Practices:**

- Call `setOptimisticAgent` BEFORE Server Action
- Wrap entire async operation with `startTransition`
- Handle errors gracefully (show toast, log error)
- Don't manually revert on success (Next.js does this automatically)

**Gotcha**: If Server Action fails, the optimistic state will NOT revert automatically. You must handle error case explicitly!

### Step 6: Use Optimistic State in JSX

Render using optimistic state instead of original props.

**Example from AgentCard.tsx:**

```typescript
return (
  <div className={optimisticAgent.isActive ? 'ring-2 ring-coral/50' : ''}>
    {/* Status Badge */}
    <div className={optimisticAgent.isActive ? 'bg-green-500/10' : 'bg-slate/10'}>
      {optimisticAgent.isActive ? 'Active' : 'Inactive'}
    </div>

    {/* Toggle Switch */}
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={optimisticAgent.isActive ? 'bg-coral' : 'bg-black/20'}
    >
      <div className={optimisticAgent.isActive ? 'left-5' : 'left-0.5'} />
    </button>

    {/* Agent Info */}
    <h3>{optimisticAgent.name}</h3>
    <p>{optimisticAgent.description}</p>

    {/* Loading Overlay */}
    {isPending && (
      <div className="loading-overlay">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    )}
  </div>
);
```

**Best Practices:**

- Use `optimisticAgent` instead of `agent` for rendering
- Disable interactive elements when `isPending` is true
- Show loading indicator using `isPending` state
- Apply visual feedback for optimistic state (animations, colors)

**Gotcha**: Always disable buttons/inputs during `isPending` to prevent double-submission!

### Step 7: Add Visual Feedback

Provide clear visual indication that action is in progress.

**Example from AgentCard.tsx:**

```typescript
// Loading overlay
{isPending && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
    <i className="fas fa-spinner fa-spin text-2xl text-coral"></i>
  </div>
)}

// Disabled state
<button
  onClick={handleToggle}
  disabled={isPending}
  className={`smooth-transition ${isPending ? 'opacity-50' : ''}`}
>
  {/* Toggle switch UI */}
</button>

// CSS transition for smooth animation
.smooth-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Best Practices:**

- Show spinner or loading indicator when `isPending`
- Add opacity or blur to indicate disabled state
- Use CSS transitions for smooth visual feedback
- Keep loading state subtle (don't block entire UI)

## Verification

After implementation, verify:

- [ ] UI updates instantly on user action (no delay)
- [ ] Loading indicator appears during Server Action
- [ ] Button/input disabled during mutation
- [ ] Success: UI stays in optimistic state (revalidation succeeds)
- [ ] Error: User sees error message (toast, alert)
- [ ] Multiple rapid clicks don't cause race conditions
- [ ] TypeScript has no errors
- [ ] Optimistic updater function is pure

## Common Pitfalls

### Issue: No Instant Feedback

**Symptom**: UI doesn't update until server responds
**Cause**: Forgot to call `setOptimisticAgent` before Server Action

```typescript
// ❌ WRONG
const handleToggle = () => {
  startTransition(async () => {
    const result = await toggleAgentStatus(agent.id, agent.isActive);
    // UI only updates AFTER server responds (slow!)
  });
};

// ✅ CORRECT
const handleToggle = () => {
  startTransition(async () => {
    setOptimisticAgent(!optimisticAgent.isActive); // Instant!
    const result = await toggleAgentStatus(agent.id, agent.isActive);
  });
};
```

### Issue: Optimistic State Not Used

**Symptom**: UI doesn't update optimistically
**Cause**: Rendering with original props instead of optimistic state

```typescript
// ❌ WRONG
return <div>{agent.isActive ? 'Active' : 'Inactive'}</div>;

// ✅ CORRECT
return <div>{optimisticAgent.isActive ? 'Active' : 'Inactive'}</div>;
```

### Issue: Side Effects in Updater

**Symptom**: Unexpected behavior, API calls failing
**Cause**: Trying to do async operations in updater function

```typescript
// ❌ WRONG
const [optimisticAgent, setOptimisticAgent] = useOptimistic(agent, async (state, newStatus) => {
  // Async not allowed!
  await fetch('/api/log');
  return { ...state, isActive: newStatus };
});

// ✅ CORRECT
const [optimisticAgent, setOptimisticAgent] = useOptimistic(
  agent,
  (state, newStatus) => ({ ...state, isActive: newStatus }) // Pure function
);
```

### Issue: Not Disabling During Mutation

**Symptom**: User can trigger multiple mutations, race conditions
**Cause**: Not disabling button when `isPending`

```typescript
// ❌ WRONG
<button onClick={handleToggle}>Toggle</button>

// ✅ CORRECT
<button onClick={handleToggle} disabled={isPending}>Toggle</button>
```

### Issue: Optimistic State Not Reverting on Error

**Symptom**: UI shows incorrect state after error
**Cause**: Not handling error case to revert optimistic update

```typescript
// ❌ WRONG
const handleToggle = () => {
  startTransition(async () => {
    setOptimisticAgent(!optimisticAgent.isActive);
    await toggleAgentStatus(agent.id, agent.isActive);
    // If error, optimistic state persists (WRONG!)
  });
};

// ✅ CORRECT
const handleToggle = () => {
  startTransition(async () => {
    setOptimisticAgent(!optimisticAgent.isActive);
    const result = await toggleAgentStatus(agent.id, agent.isActive);

    if (!result.success) {
      // Show error and revert (or rely on revalidation)
      console.error('Failed:', result.error);
      toast.error('Failed to update. Please try again.');
    }
  });
};
```

**Note**: In most cases, `revalidatePath` in the Server Action will automatically revert the optimistic state on next render. But showing an error toast is good UX.

## Testing Strategy

### Unit Testing the Updater

```typescript
// Extract updater for testing
const agentUpdater = (state, newStatus: boolean) => ({
  ...state,
  isActive: newStatus,
});

describe('agentUpdater', () => {
  it('updates isActive status', () => {
    const currentState = { id: 1, name: 'Agent', isActive: false };
    const nextState = agentUpdater(currentState, true);

    expect(nextState.isActive).toBe(true);
    expect(nextState.name).toBe('Agent'); // Other props unchanged
  });

  it('is a pure function', () => {
    const state = { id: 1, isActive: false };
    const result1 = agentUpdater(state, true);
    const result2 = agentUpdater(state, true);

    expect(result1).toEqual(result2); // Same input = same output
    expect(result1).not.toBe(state); // Returns new object
  });
});
```

### Integration Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentCard } from './AgentCard';

// Mock Server Action
jest.mock('@/app/agents/actions', () => ({
  toggleAgentStatus: jest.fn(),
}));

describe('AgentCard Optimistic Updates', () => {
  it('updates UI instantly on toggle', async () => {
    const agent = { id: 1, name: 'Test Agent', isActive: false };
    const mockToggle = require('@/app/agents/actions').toggleAgentStatus;
    mockToggle.mockResolvedValue({ success: true });

    render(<AgentCard agent={agent} />);

    const toggleButton = screen.getByRole('button');

    // Before toggle
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Click toggle
    fireEvent.click(toggleButton);

    // UI updates IMMEDIATELY (optimistic)
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Wait for Server Action
    await waitFor(() => expect(mockToggle).toHaveBeenCalled());
  });

  it('shows loading state during mutation', async () => {
    const agent = { id: 1, name: 'Test Agent', isActive: false };
    const mockToggle = require('@/app/agents/actions').toggleAgentStatus;
    mockToggle.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000)));

    render(<AgentCard agent={agent} />);

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Loading indicator appears
    expect(screen.getByRole('img', { name: /spinner/i })).toBeInTheDocument();
    expect(toggleButton).toBeDisabled();

    await waitFor(() => expect(mockToggle).toHaveBeenCalled());
  });

  it('handles error gracefully', async () => {
    const agent = { id: 1, name: 'Test Agent', isActive: false };
    const mockToggle = require('@/app/agents/actions').toggleAgentStatus;
    mockToggle.mockResolvedValue({ success: false, error: 'Server error' });

    render(<AgentCard agent={agent} />);

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Optimistic update happens
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Wait for error
    await waitFor(() => expect(mockToggle).toHaveBeenCalled());

    // Error logged (check console.error was called)
  });
});
```

## Performance Considerations

### When to Use useOptimistic

**Good for:**

- Toggles (on/off, active/inactive)
- Counters (likes, favorites)
- Status changes (read/unread, done/pending)
- Simple form updates (name, title edits)

**Not good for:**

- Creating new records (no ID to display)
- Complex validation that needs server response
- Multi-step workflows
- Operations with side effects on other data

### Bundle Size Impact

**useOptimistic + useTransition add minimal overhead:**

- ~1-2KB to bundle (built into React)
- No additional dependencies needed
- Client Component required (already counted)

## Related Documentation

- [React useOptimistic Docs](https://react.dev/reference/react/useOptimistic)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](../../COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md) - Full implementation
- [implementing-use-reducer-state-machines.md](implementing-use-reducer-state-machines.md) - Related state pattern

## Examples from Codebase

- **[AgentCard.tsx](../../apps/web/components/agents/AgentCard.tsx)** - Full implementation
  - Lines 18-24: useOptimistic initialization
  - Lines 26-40: Action handler with optimistic update
  - Lines 53-145: JSX using optimistic state and isPending

- **[apps/web/app/agents/actions.ts](../../apps/web/app/agents/actions.ts)** - Server Action
  - Lines 1-20: toggleAgentStatus Server Action

## Notes

- **Why useOptimistic?** - Provides instant feedback (perceived performance boost of 200-500ms) without complex state management.
- **Automatic Revert** - When `revalidatePath` runs, Next.js fetches fresh data and replaces optimistic state automatically.
- **Error Handling** - Always handle errors in the action handler. Show user-friendly messages (toasts, alerts).
- **Type Safety** - TypeScript ensures updater function returns correct shape, preventing runtime errors.

---

**Last Updated**: 2025-10-28
**Created From**: AgentCard.tsx implementation (Phase 3 Days 5-6)
**Pattern Origin**: React Expert recommendation for instant toggle feedback
