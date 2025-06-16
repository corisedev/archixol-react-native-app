import {z} from 'zod';

/* ----------------------------------
   🧑 Service Provider Profile Schema
----------------------------------- */
export const SPProfileSchema = z.object({
  profile_img: z.any().optional(),
  banner_img: z.any().optional(),

  fullname: z
    .string()
    .min(1, 'Display Name is required')
    .max(50, 'Display Name must not exceed 50 characters'),

  email: z
    .string()
    .email('Invalid Email Address')
    .max(100, 'Email must not exceed 100 characters'),

  address: z.string().optional(),

  experience: z
    .union([
      z.number().min(0, 'Experience cannot be negative').max(100),
      z
        .string()
        .transform(val => parseFloat(val))
        .refine(val => !isNaN(val), 'Experience must be a number'),
    ])
    .optional(),

  introduction: z
    .string()
    .min(100, 'About section must have at least 100 characters')
    .max(600, 'About section must not exceed 600 characters'),

  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d$/, 'CNIC must be in the format xxxxx-xxxxxxx-x'),

  phone_number: z
    .string()
    .regex(
      /^\+?\d{10,15}$/,
      'Phone number must be valid and between 10–15 digits',
    ),

  website: z.string().url('Must be a valid URL').optional(),
  service_location: z.string().optional(),
  services_tags: z.array(z.string()).nonempty('At least 1 skill required'),
});

/* ----------------------------------
   📜 Certificate Schema
----------------------------------- */
export const certificateSchema = z.object({
  certificate_img: z
    .array(z.instanceof(File))
    .nonempty('At least one certificate image is required'),
  title: z.string().nonempty('Title is required'),
  dated: z.string().date('Invalid date format'),
});

/* ----------------------------------
   🏢 Company Document Schema
----------------------------------- */
export const companyDocSchema = z.object({
  doc_image: z
    .array(z.instanceof(File))
    .nonempty('At least one document image is required'),
  title: z.string().nonempty('Title is required'),
  dated: z.string().date('Invalid date format'),
});
