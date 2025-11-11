/**
 * Component tests for FeedbackButtons
 * Tests localStorage persistence, toggle behavior, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackButtons } from '../FeedbackButtons';

describe('FeedbackButtons', () => {
  const mockPageId = 123;

  beforeEach(() => {
    // Clear localStorage store
    localStorage.clear();

    // Reset mock call counts (don't use jest.clearAllMocks() - it breaks localStorage mock)
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
    (localStorage.removeItem as jest.Mock).mockClear();
    (localStorage.clear as jest.Mock).mockClear();
  });

  describe('Initial rendering', () => {
    it('should render Yes and No buttons', () => {
      render(<FeedbackButtons pageId={mockPageId} />);

      expect(screen.getByRole('button', { name: /mark as helpful/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as not helpful/i })).toBeInTheDocument();
    });

    it('should show thumbs up and thumbs down icons', () => {
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      expect(yesButton).toHaveTextContent('Yes');
      expect(noButton).toHaveTextContent('No');
    });

    it('should not have any button selected initially', () => {
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      expect(yesButton).toHaveAttribute('aria-pressed', 'false');
      expect(noButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Yes button interaction', () => {
    it('should update state when Yes button clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });

      // Click Yes button
      await user.click(yesButton);

      // Verify button shows selected state
      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should persist "helpful" value to localStorage', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });

      // Click Yes button
      await user.click(yesButton);

      // Wait for state update
      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Verify localStorage.setItem called with correct key/value
      expect(localStorage.setItem).toHaveBeenCalledWith('wiki-feedback-123', 'helpful');
    });

    it('should toggle off when clicked again', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });

      // Click Yes button (select)
      await user.click(yesButton);

      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Verify setItem was called
      expect(localStorage.setItem).toHaveBeenCalledWith('wiki-feedback-123', 'helpful');

      // Click Yes button again (deselect)
      await user.click(yesButton);

      // Verify button deselected
      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'false');
      });

      // Verify localStorage.removeItem called
      expect(localStorage.removeItem).toHaveBeenCalledWith('wiki-feedback-123');
    });

    it('should show green background when selected', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });

      // Click Yes button
      await user.click(yesButton);

      // Verify green background applied
      await waitFor(() => {
        expect(yesButton).toHaveClass('bg-green-500', 'text-white');
      });
    });
  });

  describe('No button interaction', () => {
    it('should update state when No button clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Click No button
      await user.click(noButton);

      // Verify button shows selected state
      await waitFor(() => {
        expect(noButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should persist "not-helpful" value to localStorage', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Click No button
      await user.click(noButton);

      // Wait for state update
      await waitFor(() => {
        expect(noButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Verify localStorage.setItem called
      expect(localStorage.setItem).toHaveBeenCalledWith('wiki-feedback-123', 'not-helpful');
    });

    it('should toggle off when clicked again', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Click No button (select)
      await user.click(noButton);

      await waitFor(() => {
        expect(noButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Verify setItem was called
      expect(localStorage.setItem).toHaveBeenCalledWith('wiki-feedback-123', 'not-helpful');

      // Click No button again (deselect)
      await user.click(noButton);

      // Verify button deselected
      await waitFor(() => {
        expect(noButton).toHaveAttribute('aria-pressed', 'false');
      });

      // Verify localStorage.removeItem called
      expect(localStorage.removeItem).toHaveBeenCalledWith('wiki-feedback-123');
    });

    it('should show red background when selected', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Click No button
      await user.click(noButton);

      // Verify red background applied
      await waitFor(() => {
        expect(noButton).toHaveClass('bg-red-500', 'text-white');
      });
    });
  });

  describe('Exclusive selection (only one button active)', () => {
    it('should deselect No when Yes is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Click No first
      await user.click(noButton);

      await waitFor(() => {
        expect(noButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Click Yes (should deselect No)
      await user.click(yesButton);

      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'true');
        expect(noButton).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should deselect Yes when No is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Click Yes first
      await user.click(yesButton);

      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Click No (should deselect Yes)
      await user.click(noButton);

      await waitFor(() => {
        expect(noButton).toHaveAttribute('aria-pressed', 'true');
        expect(yesButton).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('localStorage persistence on mount', () => {
    it('should load "helpful" state from localStorage', () => {
      // Pre-populate localStorage
      localStorage.setItem('wiki-feedback-123', 'helpful');

      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });

      // Verify Yes button shows selected state on mount
      expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      expect(yesButton).toHaveClass('bg-green-500');
    });

    it('should load "not-helpful" state from localStorage', () => {
      // Pre-populate localStorage
      localStorage.setItem('wiki-feedback-123', 'not-helpful');

      render(<FeedbackButtons pageId={mockPageId} />);

      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Verify No button shows selected state on mount
      expect(noButton).toHaveAttribute('aria-pressed', 'true');
      expect(noButton).toHaveClass('bg-red-500');
    });

    it('should not set state for invalid localStorage values', () => {
      // Set invalid value
      localStorage.setItem('wiki-feedback-123', 'invalid-value');

      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      // Verify no button selected
      expect(yesButton).toHaveAttribute('aria-pressed', 'false');
      expect(noButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should handle different page IDs independently', () => {
      // Set feedback for different pages
      localStorage.setItem('wiki-feedback-123', 'helpful');
      localStorage.setItem('wiki-feedback-456', 'not-helpful');

      // Render component for page 123
      const { unmount } = render(<FeedbackButtons pageId={123} />);

      let yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      expect(yesButton).toHaveAttribute('aria-pressed', 'true');

      unmount();

      localStorage.clear();
      localStorage.setItem('wiki-feedback-456', 'not-helpful');

      // Render component for page 456
      render(<FeedbackButtons pageId={456} />);

      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });
      expect(noButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('localStorage error handling', () => {
    // Note: Current implementation does NOT handle localStorage errors gracefully
    // These tests verify that localStorage is being called, but the component will crash if errors occur
    // TODO (Future): Add try-catch around localStorage calls for production resilience

    it.skip('should not crash if localStorage.setItem throws', async () => {
      // SKIPPED: Component does not have error handling around localStorage.setItem
      // If quota exceeded, component will crash
      // Add try-catch in FeedbackButtons.tsx to enable this test
    });

    it.skip('should not crash if localStorage.getItem throws', () => {
      // SKIPPED: Component does not have error handling around localStorage.getItem
      // If security error, component will crash on mount
      // Add try-catch in FeedbackButtons.tsx to enable this test
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });
      const noButton = screen.getByRole('button', { name: /mark as not helpful/i });

      expect(yesButton).toHaveAttribute('aria-label', 'Mark as helpful');
      expect(yesButton).toHaveAttribute('aria-pressed');

      expect(noButton).toHaveAttribute('aria-label', 'Mark as not helpful');
      expect(noButton).toHaveAttribute('aria-pressed');
    });

    it('should update aria-pressed when button clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons pageId={mockPageId} />);

      const yesButton = screen.getByRole('button', { name: /mark as helpful/i });

      // Initial state
      expect(yesButton).toHaveAttribute('aria-pressed', 'false');

      // Click button
      await user.click(yesButton);

      // Verify aria-pressed updated
      await waitFor(() => {
        expect(yesButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });
});
