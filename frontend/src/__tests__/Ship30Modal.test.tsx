import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Ship30Modal } from '@/components/Ship30Modal';
import { api } from '@/utils/api';

jest.mock('@/utils/api', () => ({
  api: {
    generateShip30Essay: jest.fn(),
  },
}));

describe('Ship30Modal Component', () => {
  test('does not render when isOpen is false', () => {
    const { container } = render(
      <Ship30Modal isOpen={false} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders form inputs and generates essay on submit', async () => {
    (api.generateShip30Essay as jest.Mock).mockResolvedValueOnce({
      topic: 'Pricing Optimization',
      framework: 'atomic',
      guidelines: 'Ship 30 format',
      headline: 'The Unspoken Rule of Pricing Optimization',
      markdown_content: '# The Unspoken Rule\n\n*Charge for value.*',
      word_count: 120,
    });

    render(<Ship30Modal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('heading', { name: /ship 30 for 30/i })).toBeInTheDocument();

    const topicInput = screen.getByLabelText(/topic or single core thesis/i);
    fireEvent.change(topicInput, { target: { value: 'Pricing Optimization' } });

    const submitBtn = screen.getByRole('button', { name: /generate ship 30 essay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.generateShip30Essay).toHaveBeenCalledWith(
        'Pricing Optimization',
        'atomic',
        ''
      );
      expect(screen.getByText(/the unspoken rule of pricing optimization/i)).toBeInTheDocument();
      expect(screen.getByText(/charge for value/i)).toBeInTheDocument();
    });
  });
});
