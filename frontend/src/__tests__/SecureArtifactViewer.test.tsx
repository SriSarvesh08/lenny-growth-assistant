import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecureArtifactViewer } from '@/components/SecureArtifactViewer';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('SecureArtifactViewer Component', () => {
  const sampleMarkdown = '# Elena Verna on PLG\n\n- Acquisition loop\n- Retention buffer\n\n<script>alert("hack")</script>';

  test('renders sanitized content and suppresses malicious script', () => {
    render(
      <SecureArtifactViewer
        title="PLG Breakdown"
        type="framework"
        markdownContent={sampleMarkdown}
        wordCount={150}
      />
    );

    expect(screen.getByText('PLG Breakdown')).toBeInTheDocument();
    expect(screen.getByText('framework')).toBeInTheDocument();
    expect(screen.getByText('• 150 words')).toBeInTheDocument();
    expect(screen.getByText('Elena Verna on PLG')).toBeInTheDocument();
    expect(screen.queryByText('alert("hack")')).not.toBeInTheDocument();
  });

  test('copies markdown content to clipboard on button click', async () => {
    render(
      <SecureArtifactViewer
        title="PLG Breakdown"
        markdownContent={sampleMarkdown}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy markdown/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleMarkdown);
  });

  test('toggles to sandboxed iframe view when button clicked', () => {
    render(
      <SecureArtifactViewer
        title="PLG Breakdown"
        markdownContent={sampleMarkdown}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /native sanitized/i });
    fireEvent.click(toggleBtn);

    const iframe = screen.getByTitle('PLG Breakdown');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin');
  });
});
