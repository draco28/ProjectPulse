/**
 * Unit tests for CodeBlock component
 * Tests mounting behavior and prop handling
 */

import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../CodeBlock';

// Mock is already set up in jest.setup.js
describe('CodeBlock Component', () => {
  it('renders code content', () => {
    render(<CodeBlock language="typescript" code="const x = 1;" />);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('accepts different language props', () => {
    const { rerender } = render(<CodeBlock language="javascript" code="console.log('test');" />);
    expect(screen.getByText("console.log('test');")).toBeInTheDocument();

    rerender(<CodeBlock language="python" code="print('hello')" />);
    expect(screen.getByText("print('hello')")).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(
      <CodeBlock language="json" code='{"key": "value"}' className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('handles special characters in code', () => {
    const specialCode = '<div className="test">{value}</div>';
    render(<CodeBlock language="tsx" code={specialCode} />);
    expect(screen.getByText(specialCode)).toBeInTheDocument();
  });

  it('renders without crashing for edge cases', () => {
    // Should handle empty strings
    const { container: container1 } = render(<CodeBlock language="typescript" code="" />);
    expect(container1).toBeTruthy();

    // Should handle long code
    const longCode = 'const x = 1; '.repeat(100);
    const { container: container2 } = render(<CodeBlock language="typescript" code={longCode} />);
    expect(container2).toBeTruthy();
  });

  it('component mounts successfully', () => {
    const { container } = render(<CodeBlock language="typescript" code="test" />);
    expect(container.firstChild).toBeTruthy();
  });
});
