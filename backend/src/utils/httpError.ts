import { Response } from 'express'

/**
 * Maps a service-layer Error onto an HTTP status.
 *
 * Services signal failures by throwing plain Errors ("Not authorized.",
 * "Album not found."). Controllers used to answer every one of them with a 500,
 * so the client could not distinguish "you may not do this" from "the server is
 * broken", and retried on errors that would never succeed.
 */
export function statusForError(err: any): number {
  if (err?.status || err?.statusCode) {
    return err.status || err.statusCode
  }

  const message = String(err?.message || '').toLowerCase()

  if (
    message.includes('not authorized') ||
    message.includes('access denied') ||
    message.includes('only the event owner') ||
    message.includes('not a participant') ||
    message.includes('do not own')
  ) {
    return 403
  }
  if (message.includes('unauthenticated') || message.includes('unauthorized')) {
    return 401
  }
  if (message.includes('not found')) {
    return 404
  }
  if (
    message.includes('required') ||
    message.includes('invalid') ||
    message.includes('must be') ||
    message.includes('cannot be empty') ||
    message.includes('exceeds')
  ) {
    return 400
  }

  return 500
}

/** Sends a JSON error response with an inferred status code. */
export function sendError(res: Response, err: any) {
  const status = statusForError(err)
  if (status >= 500) {
    console.error('Request failed:', err)
  }
  return res.status(status).json({ error: err?.message || 'Internal Server Error' })
}
