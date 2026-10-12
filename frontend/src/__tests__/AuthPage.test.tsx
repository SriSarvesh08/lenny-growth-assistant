import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthPage } from '../components/AuthPage';

describe('AuthPage Component', () => {
  it('renders login form by default', () => {
    const handleSuccess = jest.fn();
    render(<AuthPage onAuthSuccess={handleSuccess} />);

    expect(screen.getByRole('heading', { name: 'Lenny Growth Assistant' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('switches to create account registration tab', () => {
    const handleSuccess = jest.fn();
    render(<AuthPage onAuthSuccess={handleSuccess} />);

    const createTab = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(createTab);

    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  it('validates short passwords or missing email', async () => {
    const handleSuccess = jest.fn();
    render(<AuthPage onAuthSuccess={handleSuccess} />);

    const submitButtons = screen.getAllByRole('button');
    const submitBtn = submitButtons.find((btn) => btn.getAttribute('type') === 'submit');
    expect(submitBtn).toBeDefined();
    if (submitBtn) {
      fireEvent.click(submitBtn);
    }

    expect(await screen.findByText('Please fill in all required fields.')).toBeInTheDocument();
  });
});

