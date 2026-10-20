import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Settings as SettingsIcon, Sun, Moon, Monitor,
  Shield, Lock, Bell, Mail, Database, Globe,
  Eye, Save, RotateCcw, ChevronRight,
  AlertTriangle, CheckCircle, Info, Key, Clock,
  Upload, FileText, Zap, Server
} from 'lucide-react';

/* ================================================================
   SETTINGS SECTIONS CONFIG
   ================================================================ */

const SECTIONS = [
  { key: 'appearance', label: 'Appearance', icon: Sun, desc: 'Theme and display preferences' },
  { key: 'security', label: 'Security', icon: Shield, desc: 'Password policy and account lockout' },
  { key: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and alert preferences' },
  { key: 'platform', label: 'Platform', icon: Globe, desc: 'General platform configuration' },
  { key: 'storage', label: 'Storage & Uploads', icon: Upload, desc: 'File upload limits and storage' },
  { key: 'system', label: 'System Info', icon: Server, desc: 'Backend and system information' },
];

/* ================================================================
   DEFAULT SETTINGS (mirrors application.properties)
   ================================================================ */

const getStoredSettings = () => {
  const stored = localStorage.getItem('medicycle-admin-settings');
  const defaults = {
    // Security — password policy
    passwordMinLength: 8,
    passwordMaxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true,
    passwordHistoryCount: 5,

    // Security — account lockout
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,

    // Security — rate limiting
    loginRateCapacity: 10,
    loginRateRefillPerMin: 2,
    authRateCapacity: 30,
    authRateRefillPerMin: 5,

    // Security — JWT
    jwtExpirationHours: 24,
    refreshTokenDays: 30,

    // Notifications
    emailNotificationsEnabled: true,
    donationAlerts: true,
    requestAlerts: true,
    verificationAlerts: true,
    weeklyReportEmail: false,
    
    // Platform
    platformName: 'MediCycle',
    maintenanceMode: false,
    allowGuestRegistration: true,
    autoApprovePharmacies: false,
    donationExpiryWarningDays: 30,

    // Storage
    maxFileSize: '5MB',
    maxRequestSize: '10MB',
    uploadDirectory: 'uploads',
    allowedFileTypes: 'jpg,jpeg,png,pdf',
  };
  if (stored) {
    try { return { ...defaults, ...JSON.parse(stored) }; } catch { /* ignore */ }
  }
  return defaults;
};

/* ================================================================
   SETTINGS COMPONENT
   ================================================================ */

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('appearance');
  const [settings, setSettings] = useState(getStoredSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('medicycle-admin-settings', JSON.stringify(settings));
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  const resetSettings = () => {
    localStorage.removeItem('medicycle-admin-settings');
    setSettings(getStoredSettings());
    setHasChanges(false);
    toast.success('Settings reset to defaults');
  };

  // ── Reusable form components ──

  const ToggleSwitch = ({ label, description, checked, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="bg-surface2 p-1.5 rounded-lg mt-0.5">
            <Icon className="w-4 h-4 text-muted" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-primary">{label}</p>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-blue-600' : 'bg-surface2'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const NumberInput = ({ label, description, value, onChange, min, max, suffix, icon: Icon }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="bg-surface2 p-1.5 rounded-lg mt-0.5">
            <Icon className="w-4 h-4 text-muted" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-primary">{label}</p>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || min || 0)}
          min={min}
          max={max}
          className="w-20 px-3 py-1.5 bg-surface2 border border-theme rounded-lg text-sm text-primary text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suffix && <span className="text-xs text-muted">{suffix}</span>}
      </div>
    </div>
  );

  const TextInput = ({ label, description, value, onChange, placeholder, icon: Icon }) => (
    <div className="py-3">
      <div className="flex items-start gap-3 mb-2">
        {Icon && (
          <div className="bg-surface2 p-1.5 rounded-lg mt-0.5">
            <Icon className="w-4 h-4 text-muted" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-primary">{label}</p>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary placeholder-subtle focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const SectionCard = ({ title, description, icon: Icon, children, alert }) => (
    <div className="bg-surface rounded-xl border border-theme overflow-hidden">
      <div className="px-6 py-4 border-b border-theme flex items-center gap-3">
        <div className="bg-blue-500/15 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      </div>
      {alert && (
        <div className="mx-6 mt-4 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">{alert}</p>
        </div>
      )}
      <div className="px-6 py-2 divide-y divide-theme/50">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="bg-surface2 p-1.5 rounded-lg">
            <Icon className="w-4 h-4 text-muted" />
          </div>
        )}
        <span className="text-sm text-muted">{label}</span>
      </div>
      <span className="text-sm font-medium text-primary">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-blue-400" />
            Platform Settings
          </h1>
          <p className="text-muted mt-1">Configure global application parameters.</p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-muted hover:text-primary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors shadow-md shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <nav className="bg-surface rounded-xl border border-theme overflow-hidden">
            {SECTIONS.map(({ key, label, icon: Icon, desc }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                  activeSection === key
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'border-transparent text-muted hover:text-primary hover:bg-surface2/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-xs text-subtle truncate hidden lg:block">{desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ml-auto shrink-0 transition-transform ${activeSection === key ? 'text-blue-400' : 'text-subtle'}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">

          {/* ─── APPEARANCE ─── */}
          {activeSection === 'appearance' && (
            <SectionCard title="Theme & Appearance" description="Customize how MediCycle looks" icon={Sun}>
              <div className="py-3">
                <p className="text-sm font-medium text-primary mb-3">Color Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun, desc: 'Bright and clean' },
                    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                    { value: 'system', label: 'System', icon: Monitor, desc: 'Follows your OS' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === opt.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-theme bg-surface2/30 hover:border-blue-500/40'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${theme === opt.value ? 'bg-blue-500/20' : 'bg-surface2'}`}>
                        <opt.icon className={`w-5 h-5 ${theme === opt.value ? 'text-blue-400' : 'text-muted'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${theme === opt.value ? 'text-blue-400' : 'text-primary'}`}>{opt.label}</p>
                        <p className="text-xs text-muted">{opt.desc}</p>
                      </div>
                      {theme === opt.value && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ─── SECURITY ─── */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <SectionCard
                title="Password Policy"
                description="Define password strength requirements"
                icon={Lock}
                alert="Changes here reflect display only. Actual enforcement is configured in application.properties."
              >
                <NumberInput
                  label="Minimum Length"
                  description="Minimum number of characters required"
                  value={settings.passwordMinLength}
                  onChange={(v) => updateSetting('passwordMinLength', v)}
                  min={6} max={32} suffix="chars"
                  icon={Key}
                />
                <NumberInput
                  label="Maximum Length"
                  description="Maximum allowed password length"
                  value={settings.passwordMaxLength}
                  onChange={(v) => updateSetting('passwordMaxLength', v)}
                  min={32} max={256} suffix="chars"
                  icon={Key}
                />
                <ToggleSwitch
                  label="Require Uppercase"
                  description="At least one uppercase letter (A-Z)"
                  checked={settings.requireUppercase}
                  onChange={(v) => updateSetting('requireUppercase', v)}
                />
                <ToggleSwitch
                  label="Require Lowercase"
                  description="At least one lowercase letter (a-z)"
                  checked={settings.requireLowercase}
                  onChange={(v) => updateSetting('requireLowercase', v)}
                />
                <ToggleSwitch
                  label="Require Digit"
                  description="At least one number (0-9)"
                  checked={settings.requireDigit}
                  onChange={(v) => updateSetting('requireDigit', v)}
                />
                <ToggleSwitch
                  label="Require Special Character"
                  description="At least one special character (!@#$%...)"
                  checked={settings.requireSpecial}
                  onChange={(v) => updateSetting('requireSpecial', v)}
                />
                <NumberInput
                  label="Password History"
                  description="Number of previous passwords to prevent reuse"
                  value={settings.passwordHistoryCount}
                  onChange={(v) => updateSetting('passwordHistoryCount', v)}
                  min={0} max={20} suffix="passwords"
                />
              </SectionCard>

              <SectionCard title="Account Lockout" description="Protect against brute-force attacks" icon={Shield}>
                <NumberInput
                  label="Max Login Attempts"
                  description="Lock account after this many failed attempts"
                  value={settings.maxLoginAttempts}
                  onChange={(v) => updateSetting('maxLoginAttempts', v)}
                  min={3} max={20} suffix="attempts"
                  icon={AlertTriangle}
                />
                <NumberInput
                  label="Lockout Duration"
                  description="How long the account stays locked"
                  value={settings.lockoutDurationMinutes}
                  onChange={(v) => updateSetting('lockoutDurationMinutes', v)}
                  min={5} max={120} suffix="min"
                  icon={Clock}
                />
              </SectionCard>

              <SectionCard title="Rate Limiting" description="API request throttling" icon={Zap}>
                <NumberInput
                  label="Login Rate Capacity"
                  description="Maximum login requests per window"
                  value={settings.loginRateCapacity}
                  onChange={(v) => updateSetting('loginRateCapacity', v)}
                  min={5} max={100} suffix="req"
                  icon={Zap}
                />
                <NumberInput
                  label="Login Refill Rate"
                  description="Requests refilled per minute"
                  value={settings.loginRateRefillPerMin}
                  onChange={(v) => updateSetting('loginRateRefillPerMin', v)}
                  min={1} max={20} suffix="/min"
                />
                <NumberInput
                  label="Auth Rate Capacity"
                  description="Maximum auth requests per window"
                  value={settings.authRateCapacity}
                  onChange={(v) => updateSetting('authRateCapacity', v)}
                  min={10} max={200} suffix="req"
                />
                <NumberInput
                  label="Auth Refill Rate"
                  description="Requests refilled per minute"
                  value={settings.authRateRefillPerMin}
                  onChange={(v) => updateSetting('authRateRefillPerMin', v)}
                  min={1} max={50} suffix="/min"
                />
              </SectionCard>

              <SectionCard title="Session & Tokens" description="JWT token expiration settings" icon={Key}>
                <NumberInput
                  label="Session Expiration"
                  description="Access token validity period"
                  value={settings.jwtExpirationHours}
                  onChange={(v) => updateSetting('jwtExpirationHours', v)}
                  min={1} max={168} suffix="hours"
                  icon={Clock}
                />
                <NumberInput
                  label="Refresh Token Expiration"
                  description="Refresh token validity period"
                  value={settings.refreshTokenDays}
                  onChange={(v) => updateSetting('refreshTokenDays', v)}
                  min={1} max={90} suffix="days"
                  icon={Clock}
                />
              </SectionCard>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {activeSection === 'notifications' && (
            <SectionCard title="Notification Preferences" description="Control which alerts and emails are sent" icon={Bell}>
              <ToggleSwitch
                label="Email Notifications"
                description="Enable all email notifications from the platform"
                checked={settings.emailNotificationsEnabled}
                onChange={(v) => updateSetting('emailNotificationsEnabled', v)}
                icon={Mail}
              />
              <ToggleSwitch
                label="Donation Alerts"
                description="Notify when new donations are submitted"
                checked={settings.donationAlerts}
                onChange={(v) => updateSetting('donationAlerts', v)}
                icon={FileText}
              />
              <ToggleSwitch
                label="Request Alerts"
                description="Notify when medicine requests are made"
                checked={settings.requestAlerts}
                onChange={(v) => updateSetting('requestAlerts', v)}
                icon={FileText}
              />
              <ToggleSwitch
                label="Verification Alerts"
                description="Notify when pharmacies submit for verification"
                checked={settings.verificationAlerts}
                onChange={(v) => updateSetting('verificationAlerts', v)}
                icon={Shield}
              />
              <ToggleSwitch
                label="Weekly Report Email"
                description="Receive a weekly platform analytics summary"
                checked={settings.weeklyReportEmail}
                onChange={(v) => updateSetting('weeklyReportEmail', v)}
                icon={Mail}
              />
            </SectionCard>
          )}

          {/* ─── PLATFORM ─── */}
          {activeSection === 'platform' && (
            <div className="space-y-6">
              <SectionCard title="General" description="Core platform configuration" icon={Globe}>
                <TextInput
                  label="Platform Name"
                  description="Name displayed in the header and emails"
                  value={settings.platformName}
                  onChange={(v) => updateSetting('platformName', v)}
                  icon={Globe}
                />
                <ToggleSwitch
                  label="Maintenance Mode"
                  description="Temporarily disable the platform for non-admin users"
                  checked={settings.maintenanceMode}
                  onChange={(v) => updateSetting('maintenanceMode', v)}
                  icon={AlertTriangle}
                />
                <ToggleSwitch
                  label="Allow Guest Registration"
                  description="Let users browse as guests without creating an account"
                  checked={settings.allowGuestRegistration}
                  onChange={(v) => updateSetting('allowGuestRegistration', v)}
                  icon={Eye}
                />
              </SectionCard>

              <SectionCard title="Donation & Verification" description="Workflow configuration" icon={CheckCircle}>
                <ToggleSwitch
                  label="Auto-approve Pharmacies"
                  description="Automatically verify new pharmacy registrations"
                  checked={settings.autoApprovePharmacies}
                  onChange={(v) => updateSetting('autoApprovePharmacies', v)}
                  icon={CheckCircle}
                />
                <NumberInput
                  label="Expiry Warning Days"
                  description="Warn donors when medicines expire within this period"
                  value={settings.donationExpiryWarningDays}
                  onChange={(v) => updateSetting('donationExpiryWarningDays', v)}
                  min={7} max={180} suffix="days"
                  icon={Clock}
                />
              </SectionCard>
            </div>
          )}

          {/* ─── STORAGE ─── */}
          {activeSection === 'storage' && (
            <SectionCard
              title="File Uploads & Storage"
              description="Configure upload limits and file types"
              icon={Upload}
              alert="Changes here reflect display only. Actual limits are configured in application.properties."
            >
              <TextInput
                label="Max File Size"
                description="Maximum size for a single uploaded file"
                value={settings.maxFileSize}
                onChange={(v) => updateSetting('maxFileSize', v)}
                placeholder="e.g., 5MB"
                icon={Upload}
              />
              <TextInput
                label="Max Request Size"
                description="Maximum total request body size (includes all files)"
                value={settings.maxRequestSize}
                onChange={(v) => updateSetting('maxRequestSize', v)}
                placeholder="e.g., 10MB"
                icon={Upload}
              />
              <TextInput
                label="Upload Directory"
                description="Server directory for storing uploaded files"
                value={settings.uploadDirectory}
                onChange={(v) => updateSetting('uploadDirectory', v)}
                placeholder="e.g., uploads"
                icon={Database}
              />
              <TextInput
                label="Allowed File Types"
                description="Comma-separated list of allowed extensions"
                value={settings.allowedFileTypes}
                onChange={(v) => updateSetting('allowedFileTypes', v)}
                placeholder="e.g., jpg,jpeg,png,pdf"
                icon={FileText}
              />
            </SectionCard>
          )}

          {/* ─── SYSTEM INFO ─── */}
          {activeSection === 'system' && (
            <div className="space-y-6">
              <SectionCard title="System Information" description="Current backend configuration" icon={Server}>
                <InfoRow label="Application" value="MediCycle" icon={Globe} />
                <InfoRow label="Backend Port" value="8085" icon={Server} />
                <InfoRow label="Database" value="PostgreSQL" icon={Database} />
                <InfoRow label="Mail Provider" value="Gmail SMTP" icon={Mail} />
                <InfoRow label="API Docs" value="/swagger-ui.html" icon={FileText} />
                <InfoRow label="Frontend Port" value="5173" icon={Globe} />
              </SectionCard>

              <SectionCard title="Admin Account" description="Current admin session details" icon={Shield}>
                <InfoRow label="Name" value={user?.name || '—'} icon={Eye} />
                <InfoRow label="Email" value={user?.email || '—'} icon={Mail} />
                <InfoRow label="Role" value={user?.role || '—'} icon={Shield} />
                <InfoRow label="Verified" value={user?.verified ? 'Yes' : 'No'} icon={CheckCircle} />
              </SectionCard>

              <div className="bg-surface rounded-xl border border-theme p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/15 p-2 rounded-lg">
                    <Info className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary">About Configuration Persistence</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Settings saved here are stored locally in your browser. Security and storage settings shown are 
                      informational displays of the backend configuration in <code className="text-blue-400 bg-blue-500/10 px-1 rounded">application.properties</code>. 
                      To change backend behavior, update the properties file and restart the server.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
