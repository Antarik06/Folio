import { z } from 'zod'

export const updateEventSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'processing', 'completed', 'archived']),
  coverPhotoId: z.string().uuid().nullable().optional(),
  allowGuestUploads: z.boolean(),
  autoApproveGuestUploads: z.boolean(),
  requireGuestFaceEnrollment: z.boolean(),
})

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  addressLine1: z.string().min(1, 'Address is required.'),
  addressLine2: z.string().optional().default(''),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  postalCode: z.string().regex(/^[a-zA-Z0-9]{4,10}$/, 'Enter a valid postal code (4–10 alphanumeric characters).'),
  country: z.string().min(1, 'Country is required.'),
})

export const createOrderSchema = z.object({
  albumId: z.string().uuid('Invalid album ID.'),
  productType: z.enum(['softcover', 'hardcover']),
  size: z.enum(['small', 'large']),
  quantity: z.number().int().min(1).max(10),
  shippingAddress: shippingAddressSchema,
})

export const renameAlbumSchema = z.object({
  title: z.string().min(1, 'Album name cannot be empty.'),
})

export const updateAlbumCoverSchema = z.object({
  coverPhotoId: z.string().uuid().nullable(),
})
