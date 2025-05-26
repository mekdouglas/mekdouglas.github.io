import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Actual hook
import RegistrationPage from './RegistrationPage';

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual, // Preserve other exports like AuthProvider
    useAuth: vi.fn(),
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegistrationPage', () => {
  let mockRegister;
  let mockSetError;

  beforeEach(() => {
    mockRegister = vi.fn();
    mockSetError = vi.fn();
    mockNavigate.mockClear();

    useAuth.mockReturnValue({
      register: mockRegister,
      error: null,
      isLoading: false,
      setError: mockSetError,
    });
  });

  const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders registration form correctly', () => {
    renderWithRouter(<RegistrationPage />);
    
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
  });

  test('allows typing into input fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);
    
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    expect(screen.getByLabelText(/username/i).value).toBe('newuser');

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    expect(screen.getByLabelText(/email/i).value).toBe('newuser@example.com');

    await user.type(screen.getByLabelText(/password/i), 'newpassword123');
    expect(screen.getByLabelText(/password/i).value).toBe('newpassword123');
  });

  test('calls register function and navigates on successful registration', async () => {
    const user = userEvent.setup();
    // Simulate successful registration
    mockRegister.mockResolvedValue({ success: true, message: 'Registration successful!' });
    
    renderWithRouter(<RegistrationPage />);
    
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(mockSetError).toHaveBeenCalledWith(null); // Clear previous errors
    expect(mockRegister).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'newpassword123',
    });
    expect(mockRegister).toHaveBeenCalledTimes(1);

    // Check for success message (optional, depends on how you want to test this part)
    expect(await screen.findByText('Registration successful! Please login.')).toBeInTheDocument();
    
    // Check for navigation (use await for timers)
    // Need to advance timers if setTimeout is used for navigation
    vi.useFakeTimers();
    await user.click(screen.getByRole('button', { name: /register/i })); // Click again to trigger timeout
    await vi.advanceTimersByTimeAsync(2000); // Advance by the timeout duration
    vi.useRealTimers(); // Restore real timers

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows error message on failed registration', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email already exists';
    // Simulate failed registration
    useAuth.mockReturnValue({
      register: mockRegister.mockResolvedValue({ success: false, message: errorMessage }),
      error: errorMessage, // AuthContext's error state is set by the component after register returns
      isLoading: false,
      setError: mockSetError,
    });
    
    renderWithRouter(<RegistrationPage />);
    
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
