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
  phone: z.string().min(1, 'Phone number is required.').regex(/^[+]?[0-9\s-]{10,15}$/, 'Please enter a valid phone number (10-15 digits).'),
})

/**
 * Polaroid images must be durable http(s) URLs. The studio used to hand over
 * `blob:` object URLs, which resolve only inside the tab that created them — so
 * orders were stored with references no server, printer or other device could
 * ever fetch.
 */
const durableImageUrl = z
  .string()
  .refine((v) => /^https?:\/\//i.test(v), {
    message: 'Photos must be uploaded before ordering.',
  })

export const polaroidMetadataSchema = z.object({
  images: z.array(durableImageUrl).default([]),
  frame: z.string().optional(),
  quantities: z.array(z.number().int().min(0)).default([]),
})

export const createOrderSchema = z
  .object({
    // Polaroid orders are not tied to an album, so albumId is optional here and
    // required conditionally below.
    albumId: z.string().uuid('Invalid album ID.').optional(),
    productType: z.enum(['softcover', 'hardcover', 'polaroid']),
    size: z.enum(['small', 'large']),
    // Upper bound is enforced server-side against the min_max_copies setting.
    quantity: z.number().int().min(1),
    shippingAddress: shippingAddressSchema,
    promoCode: z.string().trim().min(1).max(64).optional(),
    metadata: polaroidMetadataSchema.optional(),
  })
  .refine((data) => data.productType === 'polaroid' || Boolean(data.albumId), {
    message: 'Album ID is required.',
    path: ['albumId'],
  })
  .refine(
    (data) =>
      data.productType !== 'polaroid' ||
      (data.metadata?.images?.length ?? 0) > 0,
    {
      message: 'Select at least one photo for your polaroid prints.',
      path: ['metadata'],
    }
  )

export const renameAlbumSchema = z.object({
  title: z.string().min(1, 'Album name cannot be empty.'),
})

export const updateAlbumCoverSchema = z.object({
  coverPhotoId: z.string().uuid().nullable(),
})
