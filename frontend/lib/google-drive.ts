/**
 * Google Drive OAuth helper
 */

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  url: string
  thumbnailUrl: string
  size?: number
}

const isClient = typeof window !== 'undefined'

declare global {
  interface Window {
    google: any
  }
}

/**
 * Loads the Google Identity Services client script
 */
export function loadGoogleScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isClient) return resolve()

    if (window.google && window.google.accounts) {
      return resolve()
    }

    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.async = true
    gisScript.defer = true
    gisScript.onload = () => {
      resolve()
    }
    gisScript.onerror = reject
    document.body.appendChild(gisScript)
  })
}

/**
 * Opens Google login/auth dialog to request access token
 */
export function authenticateGoogleDrive(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isClient || !window.google) {
      return reject(new Error('Google Identity Services script not loaded.'))
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error !== undefined) {
            return reject(response)
          }
          resolve(response.access_token)
        },
      })
      tokenClient.requestAccessToken()
    } catch (err) {
      reject(err)
    }
  })
}
