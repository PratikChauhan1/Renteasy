/**
 * Validation utilities for RentEasy authentication & profile management
 */

// Email regex check
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

// Indian & International 10-digit mobile number regex check
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Accepts 10 digits starting with 6-9, optionally prefixed with +91 or 0
  const phoneRegex = /^(\+91|0)?[6789]\d{9}$/;
  return phoneRegex.test(cleaned);
}

// Normalize phone to clean 10-digit standard
export function cleanPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return phone.trim();
}

// Password strength requirement
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one number (0-9) or special character.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate complete user registration fields
export function validateUserRegistration(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
}): { valid: boolean; error?: string } {
  const { name, email, phone, password, role } = data;

  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters long.' };
  }

  if (!isValidEmail(email)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. user@example.com).' };
  }

  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Mobile number is required. Please enter your 10-digit mobile number.' };
  }

  if (!isValidPhone(phone)) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number starting with 6-9.' };
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    return { valid: false, error: passCheck.errors[0] };
  }

  if (role !== 'OWNER' && role !== 'TENANT') {
    return { valid: false, error: 'Invalid user role specified.' };
  }

  return { valid: true };
}
