// src/schemas/serviceSchema.js
import {z} from 'zod';

export const serviceSchema = z.object({
  service_images: z
    .any()
    .optional()
    .describe('Optional service images (array or single file)'),

  service_title: z.string().min(1, 'Service title is required'),

  service_category: z.string().min(1, 'Service category is required'),

  service_description: z.string().min(1, 'Service description is required'),

  service_status: z.boolean().default(false),

  service_faqs: z
    .array(
      z.object({
        question: z.string().min(1, 'FAQ question is required'),
        answer: z.string().min(1, 'FAQ answer is required'),
      }),
    )
    .min(1, 'At least one FAQ is required')
    .default([{question: '', answer: ''}]),

  service_process: z
    .array(
      z.object({
        step: z.string().min(1, 'Process step is required'),
      }),
    )
    .min(1, 'At least one process step is required')
    .default([{step: ''}]),

  service_feature: z
    .array(
      z.object({
        feature: z.string().min(1, 'Feature is required'),
      }),
    )
    .min(1, 'At least one feature is required')
    .default([{feature: ''}]),

  service_tags: z.array(z.string()).default([]),
});
