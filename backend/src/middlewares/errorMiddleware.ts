import { Request, Response, NextFunction } from 'express'

/**
 * Maps a thrown service error onto a sensible HTTP status. Services signal
 * authorization and lookup failures by throwing plain Errors, which previously
 * all surfaced as 500s and made the frontend show "server error" for what were
 * really 403s and 404s.
 */
function inferStatus(err: any): number {
  if (err?.status || err?.statusCode) {
    return err.status || err.statusCode
  }

  const message = String(err?.message || '').toLowerCase()

  if (message.includes('not authorized') || message.includes('access denied') || message.includes('only the event owner')) {
    return 403
  }
  if (message.includes('unauthenticated') || message.includes('unauthorized')) {
    return 401
  }
  if (message.includes('not found')) {
    return 404
  }
  if (message.includes('required') || message.includes('invalid') || message.includes('must be')) {
    return 400
  }

  return 500
}

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Express cannot take over once headers are out; delegate to the default
  // handler so the socket is torn down properly.
  if (res.headersSent) {
    return next(err)
  }

  const status = inferStatus(err)

  if (status >= 500) {
    console.error(`Unhandled Server Error on ${req.method} ${req.originalUrl}:`, err)
  } else {
    console.warn(`${status} on ${req.method} ${req.originalUrl}: ${err?.message}`)
  }

  res.status(status).json({
    error: err?.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
  })
}

export default errorMiddleware
