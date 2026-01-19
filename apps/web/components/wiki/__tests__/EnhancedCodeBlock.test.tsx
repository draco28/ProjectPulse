/**
 * Component tests for EnhancedCodeBlock
 * Tests clipboard API integration, fallback behavior, and error handling
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedCodeBlock } from '../EnhancedCodeBlock';

// Mock the CodeBlock child component
jest.mock('../CodeBlock', () => ({
  CodeBlock: ({ code }: { code: string; language: string }) => (
    <pre data-testid="code-block">
      <code>{code}</code>
    </pre>
  ),
}));

describe('EnhancedCodeBlock', () => {
  const mockCode = 'const greeting = "Hello, World!";';
  const mockLanguage = 'typescript';

  // Save original document.execCommand
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    // Restore original implementations
    document.execCommand = originalExecCommand;
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render code block with language badge', () => {
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByTestId('code-block')).toHaveTextContent(mockCode);
    });

    it('should render copy button in idle state', () => {
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent('Copy');
      expect(copyButton).not.toBeDisabled();
    });
  });

  describe('Modern Clipboard API (success flow)', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      // Mock modern clipboard API
      navigator.clipboard.writeText = jest.fn().mockResolvedValue(undefined);

      // Mock secure context
      (window as any).isSecureContext = true;
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should copy code to clipboard when button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Verify clipboard API called with correct code
      expect(writeTextSpy).toHaveBeenCalledWith(mockCode);
    });

    it('should show "Copied!" success message', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });

      // Verify button shows success text
      expect(copyButton).toHaveTextContent('Copied!');
    });

    it('should reset to idle state after 2 seconds', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for success state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });

      // Fast-forward time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Verify button reset to idle state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copy');
      });
    });

    it('should disable button while copying', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock slow clipboard API
      navigator.clipboard.writeText = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)));

      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Verify button disabled during copy
      expect(copyButton).toBeDisabled();
      expect(copyButton).toHaveTextContent('Copying...');

      // Fast-forward to complete copy
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Wait for copy to complete
      await waitFor(() => {
        expect(copyButton).not.toBeDisabled();
      });
    });
  });

  describe('Clipboard API (error handling)', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers();

      // Mock clipboard API with rejection
      navigator.clipboard.writeText = jest
        .fn()
        .mockRejectedValue(new Error('Clipboard write failed'));

      (window as any).isSecureContext = true;

      // Mock console.error to suppress error logs in tests
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      consoleErrorSpy.mockRestore();
    });

    it('should show error state when clipboard write fails', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for error state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Failed');
      });

      // Verify console.error called
      expect(console.error).toHaveBeenCalledWith('Copy to clipboard failed:', expect.any(Error));
    });

    it('should reset from error state after 2 seconds', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for error state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Failed');
      });

      // Fast-forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Verify reset to idle
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copy');
      });
    });
  });

  describe('Fallback for older browsers', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      // Mock secure context to false to trigger fallback
      (window as any).isSecureContext = false;

      // Mock document.execCommand
      document.execCommand = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should use execCommand fallback when clipboard API unavailable', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for fallback to execute
      await waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });
    });

    it('should show success message with fallback method', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for success state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });
    });

    it('should show error when execCommand fails', async () => {
      // Mock execCommand failure
      document.execCommand = jest.fn().mockReturnValue(false);

      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });

      // Click copy button
      await user.click(copyButton);

      // Wait for error state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Failed');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button', { name: /copy code to clipboard/i });
      expect(copyButton).toHaveAttribute('aria-label');
      expect(copyButton).toHaveAttribute('type', 'button');
    });

    it('should update aria-label in different states', async () => {
      navigator.clipboard.writeText = jest.fn().mockResolvedValue(undefined);

      (window as any).isSecureContext = true;

      const user = userEvent.setup({ delay: null });
      render(<EnhancedCodeBlock language={mockLanguage} code={mockCode} />);

      const copyButton = screen.getByRole('button');

      // Initial state
      expect(copyButton).toHaveAttribute('aria-label', 'Copy code to clipboard');

      // Click to copy
      await user.click(copyButton);

      // Success state
      await waitFor(() => {
        expect(copyButton).toHaveAttribute('aria-label', 'Copied!');
      });
    });
  });
});
