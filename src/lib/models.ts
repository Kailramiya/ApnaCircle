import { z } from 'zod';

export const localities = ['Mansarovar', 'Vaishali Nagar', 'Malviya Nagar'] as const;
export const localityKeys = { Mansarovar: 'mansarovar', 'Vaishali Nagar': 'vaishali', 'Malviya Nagar': 'malviya' } as const;
export const categories = ['general', 'help', 'events', 'recommendations'] as const;
export const employmentTypes = ['full_time', 'part_time', 'internship', 'contract'] as const;
export const profileSchema = z.object({
  id: z.uuid(), full_name: z.string(), username: z.string(), avatar_path: z.string().nullable(),
  bio: z.string(), city: z.literal('Jaipur'), locality: z.enum(localities), preferred_language: z.enum(['en', 'hi']),
});
export type Profile = z.infer<typeof profileSchema>;
export const profileInput = z.object({
  full_name: z.string().trim().min(2, 'invalidName').max(60, 'invalidName'),
  username: z.string().trim().regex(/^[a-z0-9_]{3,24}$/, 'invalidUsername'),
  bio: z.string().trim().max(180, 'invalidBio'), locality: z.enum(localities), preferred_language: z.enum(['en', 'hi']),
});
export type ProfileInput = z.infer<typeof profileInput>;
export const credentialsSchema = z.object({
  email: z.string().trim().pipe(z.email('invalidEmail')),
  password: z.string().min(8, 'invalidPassword').max(72, 'invalidPassword'),
});
export type Credentials = z.infer<typeof credentialsSchema>;
