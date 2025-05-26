import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext'; // Import actual provider and hook
import LoginPage from './LoginPage';

// Mock the useAuth hook specifically for what LoginPage uses
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
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

describe('LoginPage', () => {
  let mockLogin;
  let mockSetError;

  beforeEach(() => {
    // Reset mocks before each test
    mockLogin = vi.fn();
    mockSetError = vi.fn();
    mockNavigate.mockClear();
    
    useAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      isLoading: false,
      setError: mockSetError,
    });
  });

  const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders login form correctly', () => {
    renderWithRouter(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  test('allows typing into input fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);
    
    const identifierInput = screen.getByLabelText(/username or email/i);
    await user.type(identifierInput, 'testuser');
    expect(identifierInput.value).toBe('testuser');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls login function on form submission and navigates on success', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true); // Simulate successful login
    
    renderWithRouter(<LoginPage />);
    
    await user.type(screen.getByLabelText(/username or email/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(mockSetError).toHaveBeenCalledWith(null); // Clear previous errors
    expect(mockLogin).toHaveBeenCalledWith({
      identifier: 'testuser',
      password: 'password123',
    });
    expect(mockLogin).toHaveBeenCalledTimes(1);
    
    // Check for navigation AFTER the login promise resolves
    // Vitest runs promises, so this should be okay.
    // If using Jest with older async handling, might need `waitFor`
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('shows error message on failed login', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    // Update mock for this specific test to return an error
    useAuth.mockReturnValue({
      login: mockLogin.mockResolvedValue(false), // Simulate failed login
      error: errorMessage, // Error state is set by useAuth after login fails
      isLoading: false,
      setError: mockSetError,
    });
    
    renderWithRouter(<LoginPage />);
    
    await user.type(screen.getByLabelText(/username or email/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // The error is set within the AuthContext and then read by the component.
    // So, the component re-renders with the error message.
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
