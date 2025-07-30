'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Star,
  User,
  Shield,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emergencyService, EmergencyContact, EmergencySettings } from '@/services/emergencyService';

interface EmergencyContactsManagerProps {
  userId: string;
  onSettingsUpdate?: (settings: EmergencySettings) => void;
}

export function EmergencyContactsManager({
  userId,
  onSettingsUpdate
}: EmergencyContactsManagerProps) {
  const [settings, setSettings] = useState<EmergencySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showMedicalDialog, setShowMedicalDialog] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    isPrimary: false,
    isActive: true,
    notificationPreferences: {
      sms: true,
      call: true,
      email: false
    }
  });

  const [medicalForm, setMedicalForm] = useState({
    bloodType: '',
    allergies: [] as string[],
    medications: [] as string[],
    medicalConditions: [] as string[],
    emergencyMedicalContact: ''
  });

  useEffect(() => {
    loadEmergencySettings();
  }, [userId]);

  const loadEmergencySettings = async () => {
    setIsLoading(true);
    try {
      const userSettings = await emergencyService.getEmergencySettings(userId);
      setSettings(userSettings);

      if (userSettings?.medicalInfo) {
        setMedicalForm({
          bloodType: userSettings.medicalInfo.bloodType || '',
          allergies: userSettings.medicalInfo.allergies || [],
          medications: userSettings.medicalInfo.medications || [],
          medicalConditions: userSettings.medicalInfo.medicalConditions || [],
          emergencyMedicalContact: userSettings.medicalInfo.emergencyMedicalContact || ''
        });
      }
    } catch (error) {
      console.error('Error loading emergency settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      phoneNumber: '',
      relationship: '',
      isPrimary: false,
      isActive: true,
      notificationPreferences: {
        sms: true,
        call: true,
        email: false
      }
    });
    setShowContactDialog(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
      notificationPreferences: { ...contact.notificationPreferences }
    });
    setShowContactDialog(true);
  };

  const handleSaveContact = async () => {
    if (!settings) return;

    try {
      const newContact: EmergencyContact = {
        id: editingContact?.id || `contact_${Date.now()}`,
        ...contactForm
      };

      let updatedContacts = [...settings.emergencyContacts];

      if (editingContact) {
        // Update existing contact
        const index = updatedContacts.findIndex(c => c.id === editingContact.id);
        if (index !== -1) {
          updatedContacts[index] = newContact;
        }
      } else {
        // Add new contact
        updatedContacts.push(newContact);
      }

      // Ensure only one primary contact
      if (newContact.isPrimary) {
        updatedContacts = updatedContacts.map(c =>
          c.id === newContact.id ? c : { ...c, isPrimary: false }
        );
      }

      const updatedSettings = {
        ...settings,
        emergencyContacts: updatedContacts
      };

      await emergencyService.updateEmergencySettings(updatedSettings);
      setSettings(updatedSettings);
      setShowContactDialog(false);
      onSettingsUpdate?.(updatedSettings);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!settings) return;

    if (!confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      const updatedContacts = settings.emergencyContacts.filter(c => c.id !== contactId);
      const updatedSettings = {
        ...settings,
        emergencyContacts: updatedContacts
      };

      await emergencyService.updateEmergencySettings(updatedSettings);
      setSettings(updatedSettings);
      onSettingsUpdate?.(updatedSettings);
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact. Please try again.');
    }
  };

  const handleSettingChange = async (key: keyof EmergencySettings, value: any) => {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        [key]: value
      };

      await emergencyService.updateEmergencySettings(updatedSettings);
      setSettings(updatedSettings);
      onSettingsUpdate?.(updatedSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const handleSaveMedicalInfo = async () => {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        medicalInfo: {
          bloodType: medicalForm.bloodType || undefined,
          allergies: medicalForm.allergies.length > 0 ? medicalForm.allergies : undefined,
          medications: medicalForm.medications.length > 0 ? medicalForm.medications : undefined,
          medicalConditions: medicalForm.medicalConditions.length > 0 ? medicalForm.medicalConditions : undefined,
          emergencyMedicalContact: medicalForm.emergencyMedicalContact || undefined
        }
      };

      await emergencyService.updateEmergencySettings(updatedSettings);
      setSettings(updatedSettings);
      setShowMedicalDialog(false);
      onSettingsUpdate?.(updatedSettings);
    } catch (error) {
      console.error('Error saving medical info:', error);
      alert('Failed to save medical information. Please try again.');
    }
  };

  const addMedicalItem = (field: 'allergies' | 'medications' | 'medicalConditions', value: string) => {
    if (value.trim()) {
      setMedicalForm(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeMedicalItem = (field: 'allergies' | 'medications' | 'medicalConditions', index: number) => {
    setMedicalForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const relationships = [
    'Spouse/Partner',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Colleague',
    'Neighbor',
    'Doctor',
    'Other'
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading emergency settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-500" />
            Emergency Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your emergency contacts and safety preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="settings">Safety Settings</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {/* Emergency Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Emergency Contacts</CardTitle>
              <Button onClick={handleAddContact}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              {settings?.emergencyContacts.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No emergency contacts</h3>
                  <p className="text-muted-foreground mb-4">
                    Add trusted contacts who will be notified in case of emergency
                  </p>
                  <Button onClick={handleAddContact}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Contact
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {settings?.emergencyContacts.map((contact) => (
                    <Card key={contact.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{contact.name}</h3>
                            {contact.isPrimary && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                            <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                              {contact.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {contact.phoneNumber}
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {contact.relationship}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className={`h-4 w-4 ${contact.notificationPreferences.sms ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="text-xs">SMS</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className={`h-4 w-4 ${contact.notificationPreferences.call ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="text-xs">Call</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className={`h-4 w-4 ${contact.notificationPreferences.email ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="text-xs">Email</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Safety Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Response Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-call Emergency Services</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically contact 911 for critical emergencies
                  </div>
                </div>
                <Switch
                  checked={settings?.autoCallEmergencyServices || false}
                  onCheckedChange={(checked) => handleSettingChange('autoCallEmergencyServices', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Share Location with Contacts</Label>
                  <div className="text-sm text-muted-foreground">
                    Send your real-time location to emergency contacts
                  </div>
                </div>
                <Switch
                  checked={settings?.shareLocationWithContacts || false}
                  onCheckedChange={(checked) => handleSettingChange('shareLocationWithContacts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Panic Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow discrete emergency activation
                  </div>
                </div>
                <Switch
                  checked={settings?.enablePanicMode || false}
                  onCheckedChange={(checked) => handleSettingChange('enablePanicMode', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Panic Mode Activation</Label>
                <Select
                  value={settings?.panicModeActivation || 'triple_tap'}
                  onValueChange={(value) => handleSettingChange('panicModeActivation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="triple_tap">Triple Tap</SelectItem>
                    <SelectItem value="long_press">Long Press</SelectItem>
                    <SelectItem value="shake">Shake Device</SelectItem>
                    <SelectItem value="voice_command">Voice Command</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Discrete Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Activate emergency without obvious alerts
                  </div>
                </div>
                <Switch
                  checked={settings?.discreteMode || false}
                  onCheckedChange={(checked) => handleSettingChange('discreteMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-record Audio</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically start recording during emergencies
                  </div>
                </div>
                <Switch
                  checked={settings?.autoRecordAudio || false}
                  onCheckedChange={(checked) => handleSettingChange('autoRecordAudio', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-take Photos</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically capture photos during emergencies
                  </div>
                </div>
                <Switch
                  checked={settings?.autoTakePhotos || false}
                  onCheckedChange={(checked) => handleSettingChange('autoTakePhotos', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          {/* Medical Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medical Information</CardTitle>
              <Button onClick={() => setShowMedicalDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Medical Info
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Blood Type</h4>
                  <p className="text-muted-foreground">
                    {settings?.medicalInfo?.bloodType || 'Not specified'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Emergency Medical Contact</h4>
                  <p className="text-muted-foreground">
                    {settings?.medicalInfo?.emergencyMedicalContact || 'Not specified'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Allergies</h4>
                  <div className="flex flex-wrap gap-1">
                    {settings?.medicalInfo?.allergies?.length ? (
                      settings.medicalInfo.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline">{allergy}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">None specified</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Medications</h4>
                  <div className="flex flex-wrap gap-1">
                    {settings?.medicalInfo?.medications?.length ? (
                      settings.medicalInfo.medications.map((medication, index) => (
                        <Badge key={index} variant="outline">{medication}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">None specified</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Medical Conditions</h4>
                  <div className="flex flex-wrap gap-1">
                    {settings?.medicalInfo?.medicalConditions?.length ? (
                      settings.medicalInfo.medicalConditions.map((condition, index) => (
                        <Badge key={index} variant="outline">{condition}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">None specified</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phoneNumber}
                onChange={(e) => setContactForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={contactForm.relationship}
                onValueChange={(value) => setContactForm(prev => ({ ...prev, relationship: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map(rel => (
                    <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="primary"
                checked={contactForm.isPrimary}
                onCheckedChange={(checked) => setContactForm(prev => ({ ...prev, isPrimary: checked }))}
              />
              <Label htmlFor="primary">Primary contact</Label>
            </div>

            <div className="space-y-3">
              <Label>Notification Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sms"
                    checked={contactForm.notificationPreferences.sms}
                    onCheckedChange={(checked) => setContactForm(prev => ({
                      ...prev,
                      notificationPreferences: { ...prev.notificationPreferences, sms: checked }
                    }))}
                  />
                  <Label htmlFor="sms">SMS notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="call"
                    checked={contactForm.notificationPreferences.call}
                    onCheckedChange={(checked) => setContactForm(prev => ({
                      ...prev,
                      notificationPreferences: { ...prev.notificationPreferences, call: checked }
                    }))}
                  />
                  <Label htmlFor="call">Phone calls</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email"
                    checked={contactForm.notificationPreferences.email}
                    onCheckedChange={(checked) => setContactForm(prev => ({
                      ...prev,
                      notificationPreferences: { ...prev.notificationPreferences, email: checked }
                    }))}
                  />
                  <Label htmlFor="email">Email notifications</Label>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowContactDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveContact}
                disabled={!contactForm.name || !contactForm.phoneNumber}
              >
                {editingContact ? 'Update' : 'Add'} Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical Info Dialog */}
      <Dialog open={showMedicalDialog} onOpenChange={setShowMedicalDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Information</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                This information will be shared with emergency responders to provide better care.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood Type</Label>
                <Select
                  value={medicalForm.bloodType}
                  onValueChange={(value) => setMedicalForm(prev => ({ ...prev, bloodType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Emergency Medical Contact</Label>
                <Input
                  value={medicalForm.emergencyMedicalContact}
                  onChange={(e) => setMedicalForm(prev => ({ ...prev, emergencyMedicalContact: e.target.value }))}
                  placeholder="Doctor's phone number"
                />
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {medicalForm.allergies.map((allergy, index) => (
                  <Badge key={index} variant="outline" className="flex items-center">
                    {allergy}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeMedicalItem('allergies', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add allergy"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addMedicalItem('allergies', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addMedicalItem('allergies', input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label>Current Medications</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {medicalForm.medications.map((medication, index) => (
                  <Badge key={index} variant="outline" className="flex items-center">
                    {medication}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeMedicalItem('medications', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add medication"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addMedicalItem('medications', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addMedicalItem('medications', input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Medical Conditions */}
            <div className="space-y-2">
              <Label>Medical Conditions</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {medicalForm.medicalConditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="flex items-center">
                    {condition}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeMedicalItem('medicalConditions', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add medical condition"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addMedicalItem('medicalConditions', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addMedicalItem('medicalConditions', input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMedicalDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveMedicalInfo}
              >
                Save Medical Info
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}