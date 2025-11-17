'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Save, RefreshCw, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  digest_mode: boolean;
  digest_frequency?: 'hourly' | 'daily' | 'weekly';
}

interface TypeSettings {
  [key: string]: NotificationSettings;
}

export default function NotificationSettingsPage() {
  const { settings, updateSettings, loading } = useNotifications();
  const [typeSettings, setTypeSettings] = useState<TypeSettings>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Notification types
  const notificationTypes = [
    { id: 'appointment_reminder', label: 'Appointment Reminders', icon: '📅' },
    { id: 'lab_result', label: 'Lab Results', icon: '🔬' },
    { id: 'prescription_ready', label: 'Prescription Ready', icon: '💊' },
    { id: 'critical_alert', label: 'Critical Alerts', icon: '🚨' },
    { id: 'system_alert', label: 'System Alerts', icon: '⚙️' },
    { id: 'billing_reminder', label: 'Billing Reminders', icon: '💰' },
    { id: 'general', label: 'General Notifications', icon: '📢' },
  ];

  // Initialize settings
  useEffect(() => {
    if (settings) {
      const initialSettings: TypeSettings = {};
      notificationTypes.forEach((type) => {
        const typeSetting = settings.find((s) => s.notification_type === type.id);
        initialSettings[type.id] = typeSetting || {
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true,
          in_app_enabled: true,
          digest_mode: false,
        };
      });
      setTypeSettings(initialSettings);
    }
  }, [settings]);

  const handleToggle = (typeId: string, channel: keyof NotificationSettings) => {
    setTypeSettings((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [channel]: !prev[typeId]?.[channel],
      },
    }));
    setHasChanges(true);
  };

  const handleQuietHours = (typeId: string, field: 'start' | 'end', value: string) => {
    setTypeSettings((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [`quiet_hours_${field}`]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleDigestFrequency = (typeId: string, frequency: 'hourly' | 'daily' | 'weekly') => {
    setTypeSettings((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        digest_frequency: frequency,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save each type's settings
      for (const [typeId, settings] of Object.entries(typeSettings)) {
        await updateSettings(typeId, settings);
      }
      setHasChanges(false);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    // Reset to default settings
    const defaultSettings: TypeSettings = {};
    notificationTypes.forEach((type) => {
      defaultSettings[type.id] = {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        in_app_enabled: true,
        digest_mode: false,
      };
    });
    setTypeSettings(defaultSettings);
    setHasChanges(true);
    toast.info('Settings reset to defaults');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Notification Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage how you receive notifications for different types of alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            variant="default"
            size="sm"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Channel Legend */}
      <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3">Notification Channels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <span>In-App</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-600" />
            <span>SMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-orange-600" />
            <span>Push</span>
          </div>
        </div>
      </Card>

      {/* Settings by Type */}
      <div className="space-y-4">
        {notificationTypes.map((type) => {
          const settings = typeSettings[type.id] || {};
          return (
            <Card key={type.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    {type.label}
                  </h3>
                </div>
              </div>

              {/* Channel Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <Label htmlFor={`${type.id}-in-app`} className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    In-App
                  </Label>
                  <Switch
                    id={`${type.id}-in-app`}
                    checked={settings.in_app_enabled}
                    onCheckedChange={() => handleToggle(type.id, 'in_app_enabled')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <Label htmlFor={`${type.id}-email`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    Email
                  </Label>
                  <Switch
                    id={`${type.id}-email`}
                    checked={settings.email_enabled}
                    onCheckedChange={() => handleToggle(type.id, 'email_enabled')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <Label htmlFor={`${type.id}-sms`} className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    SMS
                  </Label>
                  <Switch
                    id={`${type.id}-sms`}
                    checked={settings.sms_enabled}
                    onCheckedChange={() => handleToggle(type.id, 'sms_enabled')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <Label htmlFor={`${type.id}-push`} className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-orange-600" />
                    Push
                  </Label>
                  <Switch
                    id={`${type.id}-push`}
                    checked={settings.push_enabled}
                    onCheckedChange={() => handleToggle(type.id, 'push_enabled')}
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="border-t pt-4 space-y-3">
                {/* Quiet Hours */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium w-32">Quiet Hours:</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={settings.quiet_hours_start || '22:00'}
                      onChange={(e) => handleQuietHours(type.id, 'start', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-600">to</span>
                    <input
                      type="time"
                      value={settings.quiet_hours_end || '08:00'}
                      onChange={(e) => handleQuietHours(type.id, 'end', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Digest Mode */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium w-32">Digest Mode:</Label>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={settings.digest_mode}
                      onCheckedChange={() => handleToggle(type.id, 'digest_mode')}
                    />
                    {settings.digest_mode && (
                      <div className="flex items-center gap-2">
                        <select
                          value={settings.digest_frequency || 'daily'}
                          onChange={(e) =>
                            handleDigestFrequency(
                              type.id,
                              e.target.value as 'hourly' | 'daily' | 'weekly'
                            )
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save Reminder */}
      {hasChanges && (
        <Card className="p-4 mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">⚠️ You have unsaved changes</p>
            <Button onClick={handleSave} variant="default" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
