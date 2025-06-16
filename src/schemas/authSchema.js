import {z} from 'zod';

// Username rules
export const usernameSchema = z
  .string()
  .min(4, 'Username must be at least 4 characters')
  .max(20, 'Username cannot exceed 20 characters')
  .regex(
    /^[a-z0-9_]+$/,
    'Username can only contain lowercase letters, numbers, and underscores',
  )
  .refine(val => !val.startsWith('_') && !val.endsWith('_'), {
    message: 'Username cannot start or end with an underscore',
  })
  .refine(val => !/^(\d+)$/.test(val), {
    message: 'Username cannot be only numbers',
  });

// Sign Up Schema
export const signUpSchema = z.object({
  agree_terms: z.literal(true, {
    errorMap: () => ({message: 'You must agree to the Terms and Conditions'}),
  }),

  username: usernameSchema,
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .nonempty('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must include uppercase, lowercase, number, and special character',
    ),
  user_type: z.enum(['client', 'supplier', 'service_provider'], {
    errorMap: () => ({message: 'Please select a valid role'}),
  }),
});

// Sign In Schema
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().nonempty('Password is required'),
});

// Reset Password Request Schema
export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email').nonempty('Email is required'),
});

// Change Password Schema
export const changePasswordSchema = z
  .object({
    password: z.string().nonempty('Password is required'),
    confirm_password: z.string().nonempty('Confirm Password is required'),
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
