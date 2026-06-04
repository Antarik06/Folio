import { query } from '../db'

export const notificationService = {
  /**
   * Helper to send an in-app notification and simulate an email send.
   */
  async sendNotification(
    userId: string,
    type: 'artist_assigned' | 'changes_requested' | 'layout_approved' | 'preflight_failed' | 'chat_message' | 'system',
    title: string,
    message: string,
    data: any = {}
  ): Promise<void> {
    console.log(`[NotificationService] Dispatching notification to ${userId}: [${type}] ${title} - ${message}`)
    
    // Check for artist settings if the recipient is an artist
    const artistCheck = await query(
      'SELECT notification_email, notification_in_app FROM public.artists WHERE user_id = $1',
      [userId]
    )

    let shouldInsertInApp = true
    let shouldSendEmail = true

    if (artistCheck.rows.length > 0) {
      const settings = artistCheck.rows[0]
      shouldInsertInApp = settings.notification_in_app !== false
      shouldSendEmail = settings.notification_email !== false
    }

    // Insert to DB
    if (shouldInsertInApp) {
      await query(
        `INSERT INTO public.notifications (user_id, type, title, message, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, type, title, message, JSON.stringify(data)]
      )
    } else {
      console.log(`[NotificationService] In-app alert suppressed by user preferences for ${userId}`)
    }

    // Mock Email Output
    if (shouldSendEmail) {
      console.log(`[NotificationService] [EMAIL MOCK] Sending email to user ${userId}...
Subject: ${title}
Body:
----------------------------------------
${message}
----------------------------------------`)
    }
  }
}
