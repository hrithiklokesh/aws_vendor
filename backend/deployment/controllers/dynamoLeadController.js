import * as DynamoLead from '../models/DynamoLead.js';
import { sendLeadNotification } from '../websocket/notificationSocket.js';
import { createNewLeadNotification } from '../models/DynamoNotification.js';

// Create a new lead
export const createLead = async (req, res) => {
  try {
    const leadData = req.body;
    const lead = await DynamoLead.createLead(leadData);
    
    // If the lead is assigned to a vendor, send a WebSocket notification
    if (lead.assignedVendorId) {
      console.log(`dynamoLeadController: Lead assigned to vendor ${lead.assignedVendorId}, sending WebSocket notification`);
      
      // Force the status to 'new' if it's not set to ensure it appears as unread and pending
      const leadForNotification = {
        ...lead,
        status: lead.status || 'new',
        requiresAction: true // Explicitly set this to ensure lead is treated as pending
      };
      
      // Send real-time notification via WebSocket
      sendLeadNotification(lead.assignedVendorId, leadForNotification);
      
      // Create a notification record (this is a no-op in current implementation but kept for compatibility)
      await createNewLeadNotification(lead, lead.assignedVendorId);
    }
    
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Failed to create lead', error: error.message });
  }
};

// Get all leads
export const getAllLeads = async (req, res) => {
  try {
    const leads = await DynamoLead.getAllLeads();
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error getting all leads:', error);
    res.status(500).json({ message: 'Failed to get leads', error: error.message });
  }
};

// Get lead by ID
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await DynamoLead.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.status(200).json(lead);
  } catch (error) {
    console.error('Error getting lead by ID:', error);
    res.status(500).json({ message: 'Failed to get lead', error: error.message });
  }
};

// Get leads by client ID
export const getLeadsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const leads = await DynamoLead.getLeadsByClientId(clientId);
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error getting leads by client ID:', error);
    res.status(500).json({ message: 'Failed to get leads', error: error.message });
  }
};

// Get leads by vendor ID
export const getLeadsByVendorId = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const leads = await DynamoLead.getLeadsByVendorId(vendorId);
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error getting leads by vendor ID:', error);
    res.status(500).json({ message: 'Failed to get leads', error: error.message });
  }
};

// Get leads by PM ID
export const getLeadsByPmId = async (req, res) => {
  try {
    const { pmId } = req.params;
    const leads = await DynamoLead.getLeadsByPmId(pmId);
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error getting leads by PM ID:', error);
    res.status(500).json({ message: 'Failed to get leads', error: error.message });
  }
};

// Update a lead
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const leadData = req.body;
    
    // Get the current lead to check if vendor assignment has changed
    const currentLead = await DynamoLead.getLeadById(id);
    
    const updatedLead = await DynamoLead.updateLead(id, leadData);
    
    // Check if a vendor was newly assigned
    if (updatedLead.assignedVendorId && 
        (!currentLead.assignedVendorId || currentLead.assignedVendorId !== updatedLead.assignedVendorId)) {
      console.log(`dynamoLeadController: Vendor ${updatedLead.assignedVendorId} newly assigned to lead, sending WebSocket notification`);
      
      // For a newly assigned lead, ensure it appears as pending
      const leadForNotification = {
        ...updatedLead,
        status: 'new',
        requiresAction: true // Explicitly set this to ensure lead is treated as pending
      };
      
      // Send real-time notification via WebSocket
      sendLeadNotification(updatedLead.assignedVendorId, leadForNotification);
      
      // Create a notification record (this is a no-op in current implementation but kept for compatibility)
      await createNewLeadNotification(updatedLead, updatedLead.assignedVendorId);
    }
    
    // If status changed and there's a vendor assigned, send notification about status change
    else if (currentLead.status !== updatedLead.status && updatedLead.assignedVendorId) {
      console.log(`dynamoLeadController: Lead status changed for vendor ${updatedLead.assignedVendorId}, sending WebSocket notification`);
      
      // Send real-time notification via WebSocket
      sendLeadNotification(updatedLead.assignedVendorId, {
        ...updatedLead,
        statusChange: {
          oldStatus: currentLead.status,
          newStatus: updatedLead.status
        },
        // For some status changes, we want to ensure the lead still appears as requiring action
        requiresAction: updatedLead.status === 'pending'
      });
    }
    
    res.status(200).json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Failed to update lead', error: error.message });
  }
};

// Delete a lead
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    await DynamoLead.deleteLead(id);
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Failed to delete lead', error: error.message });
  }
};