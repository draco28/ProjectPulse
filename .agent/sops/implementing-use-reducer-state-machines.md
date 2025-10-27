# SOP: Implementing useReducer State Machines

## Purpose

Standard procedure for managing complex component state using React's `useReducer` hook with a state machine pattern. This approach centralizes state logic, makes state transitions predictable, and improves debuggability for components with many interdependent state variables.

## When to Use

**Use useReducer with state machine pattern when:**

- Component has 5+ interdependent state variables
- State updates depend on multiple previous values
- Complex keyboard navigation or interaction flows
- State transitions need to be predictable and testable
- Multiple event handlers update the same state
- You find yourself writing `setState(prev => ...)` repeatedly

**Examples from codebase:**

- Command Palette: 10 actions (open, close, search, navigate, filter)
- Complex forms with multi-step validation
- Modal dialogs with multiple states (loading, success, error)

**Don't use when:**

- Simple boolean toggles (use `useState`)
- Independent state variables (use multiple `useState`)
- State is simple and doesn't need centralized logic

## Prerequisites

- Understanding of React hooks (`useState`, `useEffect`)
- Familiarity with TypeScript discriminated unions
- Knowledge of reducer pattern concepts

## Procedure

### Step 1: Define State Type

Create a TypeScript interface for your component's state.

**Example from CommandPalette.tsx:**

```typescript
interface CommandState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  entityType: 'all' | 'issues' | 'knowledge' | 'wiki' | 'agents';
}
```

**Best Practices:**

- Use specific types (avoid `any`)
- Include union types for enum-like values
- Group related state variables together
- Document complex state properties with comments

### Step 2: Define Action Types

Create discriminated union type for all possible actions.

**Example from CommandPalette.tsx:**

```typescript
type CommandAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MOVE_UP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'SET_ENTITY_TYPE'; payload: CommandState['entityType'] }
  | { type: 'RESET' };
```

**Best Practices:**

- Use SCREAMING_SNAKE_CASE for action types
- Use `payload` property for action data
- Keep action types focused (single responsibility)
- Document complex actions with TSDoc comments

**Gotcha**: Don't use generic action type like `{ type: string; payload: any }` - you lose type safety!

### Step 3: Implement Reducer Function

Write the reducer function with switch statement for all actions.

**Example from CommandPalette.tsx:**

```typescript
function commandReducer(state: CommandState, action: CommandAction): CommandState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };

    case 'CLOSE':
      return { ...state, isOpen: false, query: '', results: [], selectedIndex: 0 };

    case 'SET_QUERY':
      return { ...state, query: action.payload, selectedIndex: 0 };

    case 'SET_RESULTS':
      return { ...state, results: action.payload, isLoading: false };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'MOVE_UP':
      return {
        ...state,
        selectedIndex: state.selectedIndex > 0 ? state.selectedIndex - 1 : state.results.length - 1,
      };

    case 'MOVE_DOWN':
      return {
        ...state,
        selectedIndex: state.selectedIndex < state.results.length - 1 ? state.selectedIndex + 1 : 0,
      };

    case 'SET_ENTITY_TYPE':
      return { ...state, entityType: action.payload, selectedIndex: 0 };

    case 'RESET':
      return { ...state, query: '', results: [], selectedIndex: 0 };

    default:
      return state;
  }
}
```

**Best Practices:**

- Always return new state object (immutability)
- Include `default` case that returns current state
- Keep each case focused on single state transition
- Document complex state transitions with comments
- Use spread operator for unchanged properties

**Gotcha**: Never mutate state directly! Always return new object.

### Step 4: Define Initial State

Create initial state constant outside component (for reusability).

**Example from CommandPalette.tsx:**

```typescript
const initialState: CommandState = {
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,
  entityType: 'all',
};
```

**Best Practices:**

- Define outside component to prevent recreation on re-renders
- Use TypeScript to ensure all required properties are present
- Initialize with sensible defaults
- Document non-obvious initial values

### Step 5: Initialize useReducer in Component

Use `useReducer` hook with your reducer and initial state.

**Example from CommandPalette.tsx:**

```typescript
export function CommandPalette() {
  const [state, dispatch] = useReducer(commandReducer, initialState);

  // ... rest of component
}
```

**Best Practices:**

- Name state variable descriptively (`state`, `formState`, `modalState`)
- Always name dispatch function `dispatch`
- Place at top of component with other hooks

### Step 6: Dispatch Actions from Event Handlers

Replace `setState` calls with `dispatch` calls.

**Example from CommandPalette.tsx:**

```typescript
// Global keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      dispatch({ type: 'OPEN' });
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      dispatch({ type: 'MOVE_DOWN' });
      break;
    case 'ArrowUp':
      e.preventDefault();
      dispatch({ type: 'MOVE_UP' });
      break;
    case 'Enter':
      e.preventDefault();
      if (state.results[state.selectedIndex]) {
        router.push(state.results[state.selectedIndex].url);
        dispatch({ type: 'CLOSE' });
      }
      break;
    case 'Escape':
      e.preventDefault();
      dispatch({ type: 'CLOSE' });
      break;
  }
};

// Input change
onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}

// Button click
onClick={() => dispatch({ type: 'OPEN' })}
```

**Best Practices:**

- Dispatch actions instead of calling setState
- Use object literals for actions (easier to read)
- Include payload for data-carrying actions
- Keep event handlers focused (dispatch, don't compute)

**Gotcha**: Don't do complex logic in event handlers - put it in the reducer!

### Step 7: Access State in JSX

Use state properties directly in your component.

**Example from CommandPalette.tsx:**

```typescript
return (
  <div>
    {state.isOpen && (
      <div onKeyDown={handleKeyDown}>
        <input
          value={state.query}
          onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
        />
        {state.isLoading && <Spinner />}
        {state.results.map((result, index) => (
          <div
            key={result.id}
            className={index === state.selectedIndex ? 'selected' : ''}
          >
            {result.title}
          </div>
        ))}
      </div>
    )}
  </div>
);
```

**Best Practices:**

- Access state properties directly (`state.isOpen`, `state.query`)
- Avoid destructuring if state is large (better for debugging)
- Use conditional rendering based on state
- Pass state to child components as props

## Verification

After implementation, verify:

- [ ] All action types have corresponding reducer cases
- [ ] TypeScript has no errors (full type safety)
- [ ] State updates are immutable (spread operator used)
- [ ] Complex state transitions work correctly
- [ ] Multiple rapid actions don't cause race conditions
- [ ] Default case returns current state
- [ ] Initial state includes all required properties

## Common Pitfalls

### Issue: State Mutation

**Symptom**: React doesn't re-render after dispatch
**Cause**: Mutating state object directly

```typescript
// ❌ WRONG
case 'ADD_ITEM':
  state.items.push(action.payload); // Direct mutation!
  return state;

// ✅ CORRECT
case 'ADD_ITEM':
  return { ...state, items: [...state.items, action.payload] };
```

### Issue: Forgotten Default Case

**Symptom**: TypeScript error "Not all code paths return a value"
**Cause**: Missing default case in switch statement

```typescript
// ❌ WRONG
function reducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
  }
  // Missing default!
}

// ✅ CORRECT
function reducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    default:
      return state;
  }
}
```

### Issue: Lost Type Safety

**Symptom**: TypeScript allows invalid actions
**Cause**: Generic action type instead of discriminated union

```typescript
// ❌ WRONG
type Action = { type: string; payload?: any };

// ✅ CORRECT
type Action = { type: 'OPEN' } | { type: 'SET_QUERY'; payload: string };
```

### Issue: Side Effects in Reducer

**Symptom**: Unexpected behavior, API calls not working
**Cause**: Trying to do async operations in reducer

```typescript
// ❌ WRONG
case 'FETCH_DATA':
  fetch('/api/data').then(data => /* ... */); // Async in reducer!
  return state;

// ✅ CORRECT - Use useEffect for side effects
useEffect(() => {
  const fetchData = async () => {
    const data = await fetch('/api/data');
    dispatch({ type: 'SET_DATA', payload: data });
  };
  fetchData();
}, []);
```

## Testing Strategy

### Unit Testing the Reducer

```typescript
import { commandReducer } from './CommandPalette';

describe('commandReducer', () => {
  it('opens the palette', () => {
    const initialState = { isOpen: false, query: '', results: [] };
    const nextState = commandReducer(initialState, { type: 'OPEN' });
    expect(nextState.isOpen).toBe(true);
  });

  it('closes and resets state', () => {
    const currentState = { isOpen: true, query: 'test', results: [1, 2, 3] };
    const nextState = commandReducer(currentState, { type: 'CLOSE' });
    expect(nextState.isOpen).toBe(false);
    expect(nextState.query).toBe('');
    expect(nextState.results).toEqual([]);
  });

  it('handles keyboard navigation', () => {
    const state = { selectedIndex: 0, results: [1, 2, 3] };
    const nextState = commandReducer(state, { type: 'MOVE_DOWN' });
    expect(nextState.selectedIndex).toBe(1);
  });

  it('wraps navigation at boundaries', () => {
    const state = { selectedIndex: 2, results: [1, 2, 3] };
    const nextState = commandReducer(state, { type: 'MOVE_DOWN' });
    expect(nextState.selectedIndex).toBe(0); // Wraps to start
  });
});
```

### Integration Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('opens with Cmd+K', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('navigates results with arrow keys', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results, then test navigation
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Assert selection changed
  });
});
```

## Performance Considerations

### When to Memoize

**useReducer itself is already optimized**, but you may need to memoize:

1. **Expensive reducer functions** - Use `useMemo` for heavy computations
2. **Child components receiving dispatch** - Dispatch is stable, no memoization needed
3. **Derived state** - Use `useMemo` to compute derived values

**Example:**

```typescript
// Derive filtered results (expensive)
const filteredResults = useMemo(() => {
  return state.results.filter((r) => r.type === state.entityType);
}, [state.results, state.entityType]);
```

**Gotcha**: Don't memoize the reducer function itself - it's not a component!

## Related Documentation

- [React useReducer Docs](https://react.dev/reference/react/useReducer)
- [COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md](../../COMPLETION_PHASE3_DAYS_5_6_FIVE_PAGES.md) - Full implementation details
- [.agent/system/component-patterns.md](../system/component-patterns.md) - Component architecture
- [implementing-use-optimistic-updates.md](implementing-use-optimistic-updates.md) - Related state management pattern

## Examples from Codebase

- **[CommandPalette.tsx](../../apps/web/components/CommandPalette.tsx)** - Full implementation with 10-action state machine
  - Lines 7-37: State and action type definitions
  - Lines 39-68: Reducer function
  - Lines 70-77: Initial state
  - Lines 79-204: Component using useReducer

## Notes

- **Why not useState?** - Command Palette would need 6+ useState calls with complex interdependencies. useReducer centralizes logic and makes state transitions explicit.
- **State Machine Pattern** - Each action represents a state transition. This makes the component's behavior predictable and easier to test.
- **TypeScript Benefits** - Discriminated unions ensure exhaustive case handling and prevent invalid actions at compile time.
- **Debugging** - Redux DevTools can inspect useReducer state if you add the extension connector.

---

**Last Updated**: 2025-10-28
**Created From**: CommandPalette.tsx implementation (Phase 3 Days 5-6)
**Pattern Origin**: React Expert recommendation for complex keyboard navigation state
