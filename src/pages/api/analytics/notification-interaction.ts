/**
 * API endpoint for tracking notification interactions
 * Records real-time analytics data for notification engagement
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore'

interface NotificationInteraction {
  notificationId: string
  userId: string
  action: 'click' | 'dismiss' | 'view' | 'rate_ride' | 'contact_driver' | 'use_offer'
  timestamp: number
  category: string
  templateId?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const interaction: NotificationInteraction = req.body

    // Validate required fields
    if (!interaction.notificationId || !interaction.userId || !interaction.action) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Store the interaction in Firebase
    await addDoc(collection(db, 'notificationInteractions'), {
      ...interaction,
      timestamp: Timestamp.fromMillis(interaction.timestamp),
      createdAt: Timestamp.now()
    })

    // Update delivery log status if it exists
    try {
      const deliveryLogQuery = collection(db, 'notificationDeliveryLogs')
      // In a real implementation, you would query for the specific delivery log
      // and update its status to 'clicked' or 'dismissed'
      console.log(`Updated delivery log for notification ${interaction.notificationId} to ${interaction.action}`)
    } catch (error) {
      console.error('Error updating delivery log:', error)
    }

    // Update user analytics
    try {
      const today = new Date()
      const analyticsId = `${interaction.userId}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`
      
      const analyticsRef = doc(db, 'notificationAnalytics', analyticsId)
      const analyticsDoc = await getDoc(analyticsRef)
      
      if (analyticsDoc.exists()) {
        const currentData = analyticsDoc.data()
        const updates: any = {}
        
        if (interaction.action === 'click') {
          updates.totalClicked = (currentData.totalClicked || 0) + 1
        } else if (interaction.action === 'dismiss') {
          updates.totalDismissed = (currentData.totalDismissed || 0) + 1
        }
        
        // Update category breakdown
        const categoryKey = `categoryBreakdown.${interaction.category}`
        updates[categoryKey] = (currentData.categoryBreakdown?.[interaction.category] || 0) + 1
        
        // Update time breakdown
        const hour = new Date(interaction.timestamp).getHours()
        const timeKey = `timeBreakdown.${hour}:00`
        updates[timeKey] = (currentData.timeBreakdown?.[`${hour}:00`] || 0) + 1
        
        // Calculate new engagement rate
        const totalSent = currentData.totalSent || 0
        const totalClicked = updates.totalClicked || currentData.totalClicked || 0
        if (totalSent > 0) {
          updates.engagementRate = (totalClicked / totalSent) * 100
        }
        
        updates.lastUpdated = Timestamp.now()
        
        await updateDoc(analyticsRef, updates)
      }
    } catch (error) {
      console.error('Error updating user analytics:', error)
    }

    console.log('Notification interaction tracked:', {
      notificationId: interaction.notificationId,
      userId: interaction.userId,
      action: interaction.action,
      category: interaction.category
    })

    res.status(200).json({
      success: true,
      message: 'Interaction tracked successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error tracking notification interaction:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}