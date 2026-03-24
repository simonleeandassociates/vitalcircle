import { supabase } from '../lib/supabase'

export const useCheckinNotification = () => {
  const sendCheckinNotification = async (checkinId, userId) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-checkin-notification', {
        body: {
          checkin_id: checkinId,
          user_id: userId
        }
      })

      if (error) {
        console.error('Error sending notification:', error)
        return { success: false, error }
      }

      console.log('Notification sent:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Error invoking function:', error)
      return { success: false, error }
    }
  }

  return { sendCheckinNotification }
}
