import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Send, CheckCircle, XCircle, Clock, Trash2, Database, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LogEntry {
  id: string;
  email: string;
  firstName: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  error?: string;
}

interface EmailRecipient {
  email: string;
  firstName: string;
}

export default function EmailSender() {
  const [subject, setSubject] = useState("${firstName}, remote side gig - $250 to $1,000/mo");
  const [emailTemplate, setEmailTemplate] = useState(`Hey \${firstName},

Found your profile and thought this might be a good fit.

We're hiring people to post sports betting slideshows on TikTok and Instagram using our automated slideshow generator. You just click a button on our website and it generates everything - images, captions, audio. Then you download and post.

How it works:

1 account pair (1 TikTok + 1 Instagram) = $200-250/month - 1 pair is 10-15 mins work per day!
2 account pairs = $400-500/month
2 phones running 2 pairs each = up to $1,000/month

No editing, no creativity, no filming - just copy-paste. Do it whenever and wherever you want. No posting requirements either - post as little or as much as you want.

Only requirement: Based in US, UK, Canada, or Germany.

All info on this link: www.betaiapp.com/account-managers (click on View Full Details)

If you are ready to start, please click on Get Started and fill the form!`);

  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [delayMs, setDelayMs] = useState(500);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // DB Filters
  const [roleFilter, setRoleFilter] = useState<'all' | 'ugc_creator' | 'account_manager'>('all');
  const [discordFilter, setDiscordFilter] = useState<'all' | 'joined' | 'not_joined'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('approved');

  const extractFirstName = (email: string): string => {
    const localPart = email.split('@')[0];

    // Common patterns to extract names
    const patterns = [
      /^([a-zA-Z]+)\./,           // firstname.something
      /^([a-zA-Z]+)_/,            // firstname_something
      /^([a-zA-Z]+)[0-9]/,        // firstname123
      /^ugc\.?([a-zA-Z]+)/i,      // ugc.firstname or ugcfirstname
      /^([a-zA-Z]+)ugc/i,         // firstnameugc
      /^hello\.?([a-zA-Z]+)/i,    // hello.firstname
      /^contact\.?([a-zA-Z]+)/i,  // contact.firstname
      /^([a-zA-Z]+)\.ugc/i,       // firstname.ugc
      /^([a-zA-Z]+)creates/i,     // firstnamecreates
      /^([a-zA-Z]+)collab/i,      // firstnamecollab
      /^createdby([a-zA-Z]+)/i,   // createdbyfirstname
      /^createwith([a-zA-Z]+)/i,  // createwithfirstname
      /^([a-zA-Z]+)business/i,    // firstnamebusiness
      /^([a-zA-Z]+)media/i,       // firstnamemedia
      /^([a-zA-Z]{3,})/,          // Just take first 3+ letters
    ];

    for (const pattern of patterns) {
      const match = localPart.match(pattern);
      if (match && match[1] && match[1].length >= 2) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        // Skip generic words
        if (!['ugc', 'hello', 'contact', 'info', 'support', 'content', 'creator', 'collab'].includes(name.toLowerCase())) {
          return name;
        }
      }
    }

    return 'Friend';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line && line.includes('@'));

      const newRecipients: EmailRecipient[] = lines.map(line => {
        // Handle CSV with columns or just email addresses
        const parts = line.split(',');
        const email = parts[0].trim().replace(/"/g, '');
        const firstName = parts[1]?.trim().replace(/"/g, '') || extractFirstName(email);
        return { email, firstName };
      });

      setRecipients(newRecipients);
    };
    reader.readAsText(file);
  };

  const handlePasteEmails = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line && line.includes('@'));
    const newRecipients: EmailRecipient[] = lines.map(email => ({
      email: email.trim(),
      firstName: extractFirstName(email.trim())
    }));
    setRecipients(newRecipients);
  };

  const getEmailHtml = (firstName: string): string => {
    const bodyContent = emailTemplate.replace(/\${firstName}/g, firstName);

    const formattedBody = bodyContent
      .split(/\n\s*\n+/)
      .filter(p => p.trim())
      .map(paragraph => {
        const lines = paragraph.trim().split('\n').map(l => l.trim()).filter(l => l);
        return `<p style="margin: 0 0 14px 0; color: #333333;">${lines.join('<br>')}</p>`;
      })
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
  <div style="max-width: 600px;">
    ${formattedBody}

    <!-- Signature -->
    <table cellpadding="0" cellspacing="0" style="margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
      <tr>
        <td style="vertical-align: top; padding-right: 14px;">
          <a href="https://www.betaiapp.com" style="text-decoration: none;">
            <img src="https://www.betaiapp.com/icons/apple-touch-icon.png" alt="Bet.AI" width="50" height="50" style="border-radius: 10px;">
          </a>
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #333333;">Emerson</p>
          <p style="margin: 0 0 12px 0; color: #666666; font-size: 13px;">Ops Manager @ Bet.AI</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right: 10px;">
                <a href="https://www.betaiapp.com/creators" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; padding: 8px 14px; border-radius: 6px;">
                  CREATOR PLATFORM →
                </a>
              </td>
              <td>
                <a href="https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717" style="text-decoration: none;">
                  <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83" alt="Download on the App Store" height="32" style="display: block;">
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  };

  const sendEmail = async (recipient: EmailRecipient): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-am-recruitment', {
        body: {
          to: recipient.email,
          subject: subject.replace(/\${firstName}/g, recipient.firstName),
          html: getEmailHtml(recipient.firstName)
        }
      });

      if (error) {
        // Try to extract more details from the error
        const errorDetail = error.message || JSON.stringify(error);
        return { success: false, error: errorDetail };
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Unknown error from Resend' };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  };

  const handleSendAll = async () => {
    if (recipients.length === 0) return;

    setIsSending(true);
    abortRef.current = false;

    // Initialize all as pending
    const initialLogs: LogEntry[] = recipients.map((r, i) => ({
      id: `${Date.now()}-${i}`,
      email: r.email,
      firstName: r.firstName,
      status: 'pending' as const,
      timestamp: new Date()
    }));
    setLogs(initialLogs);

    for (let i = 0; i < recipients.length; i++) {
      if (abortRef.current) break;

      const recipient = recipients[i];

      // Update status to sending (still pending but we're working on it)
      setLogs(prev => prev.map((log, idx) =>
        idx === i ? { ...log, timestamp: new Date() } : log
      ));

      const result = await sendEmail(recipient);

      // Update with result
      setLogs(prev => prev.map((log, idx) =>
        idx === i ? {
          ...log,
          status: result.success ? 'success' : 'failed',
          error: result.error,
          timestamp: new Date()
        } : log
      ));

      // Delay between emails
      if (i < recipients.length - 1 && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    setIsSending(false);
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const loadFromDatabase = async () => {
    setIsLoadingFromDb(true);
    try {
      let query = supabase
        .from('users')
        .select('email, full_name')
        .is('deleted_at', null);

      // Role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      } else {
        query = query.in('role', ['ugc_creator', 'account_manager']);
      }

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('application_status', statusFilter);
      }

      // Discord filter
      if (discordFilter === 'joined') {
        query = query.not('discord_id', 'is', null);
      } else if (discordFilter === 'not_joined') {
        query = query.is('discord_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading from DB:', error);
        return;
      }

      if (data) {
        const newRecipients: EmailRecipient[] = data
          .filter(user => user.email && typeof user.email === 'string' && !user.email.includes('@betaiapp.com'))
          .map(user => {
            // Extract ONLY the email, nothing else
            const rawEmail = String(user.email).trim().toLowerCase();
            const firstName = user.full_name?.split(' ')[0] || extractFirstName(rawEmail);
            return { email: rawEmail, firstName };
          })
          .filter(r => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(r.email));
        setRecipients(newRecipients);
      }
    } catch (err) {
      console.error('Error loading from DB:', err);
    } finally {
      setIsLoadingFromDb(false);
    }
  };

  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const pendingCount = logs.filter(l => l.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Bulk Email Sender</h1>

        {/* Logs bar at top */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Send Logs:</span>
                <div className="flex gap-2">
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {successCount} sent
                  </Badge>
                  <Badge className="bg-red-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    {failedCount} failed
                  </Badge>
                  <Badge className="bg-yellow-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {pendingCount} pending
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {logs.length > 0 && (
                  <>
                    <span className="text-gray-500 text-xs">
                      Latest: {logs[logs.length - 1]?.email}
                    </span>
                    <Button
                      onClick={clearLogs}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* Scrollable log entries */}
            {logs.length > 0 && (
              <div className="mt-3 max-h-[150px] overflow-y-auto space-y-1 border-t border-gray-800 pt-3">
                {[...logs].reverse().map((log) => (
                  <div
                    key={log.id}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-2 ${
                      log.status === 'success'
                        ? 'bg-green-900/30'
                        : log.status === 'failed'
                        ? 'bg-red-900/30'
                        : 'bg-yellow-900/30'
                    }`}
                  >
                    {log.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
                    {log.status === 'failed' && <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    {log.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500 animate-pulse flex-shrink-0" />}
                    <span className="text-gray-300 truncate">{log.email}</span>
                    {log.error && <span className="text-red-400 truncate">- {log.error}</span>}
                    <span className="text-gray-500 ml-auto flex-shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side by side: Email Template and Recipients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Template */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Email Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Subject Line</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject (use ${firstName} for personalization)"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Email Body (use ${'{firstName}'} for personalization)
                </label>
                <Textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Write your email template here..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recipients ({recipients.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Load from Database */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                  <Database className="w-4 h-4" />
                  Load from Database
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={roleFilter} onValueChange={(v: 'all' | 'ugc_creator' | 'account_manager') => setRoleFilter(v)}>
                    <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="ugc_creator">UGC Creators</SelectItem>
                      <SelectItem value="account_manager">Acc Managers</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={discordFilter} onValueChange={(v: 'all' | 'joined' | 'not_joined') => setDiscordFilter(v)}>
                    <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Discord" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Discord</SelectItem>
                      <SelectItem value="joined">Discord Joined</SelectItem>
                      <SelectItem value="not_joined">No Discord</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(v: 'all' | 'approved' | 'pending' | 'rejected') => setStatusFilter(v)}>
                    <SelectTrigger className="w-[130px] bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={loadFromDatabase}
                    disabled={isLoadingFromDb}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoadingFromDb ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    Load
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV/TXT
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={delayMs}
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-24 bg-gray-800 border-gray-700 text-white"
                    placeholder="Delay"
                  />
                  <span className="text-gray-400 text-sm">ms delay</span>
                </div>
              </div>

              <Textarea
                placeholder="Or paste email addresses here (one per line)..."
                className="bg-gray-800 border-gray-700 text-white min-h-[150px] font-mono text-sm"
                onChange={(e) => handlePasteEmails(e.target.value)}
              />

              {recipients.length > 0 && (
                <div className="max-h-[180px] overflow-y-auto bg-gray-800 rounded p-2">
                  {recipients.slice(0, 50).map((r, i) => (
                    <div key={i} className="text-sm text-gray-300 py-1 border-b border-gray-700 last:border-0">
                      <span className="text-blue-400">{r.firstName}</span> - {r.email}
                    </div>
                  ))}
                  {recipients.length > 50 && (
                    <div className="text-gray-500 text-sm pt-2">
                      ... and {recipients.length - 50} more
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!isSending ? (
                  <Button
                    onClick={handleSendAll}
                    disabled={recipients.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to {recipients.length} Recipients
                  </Button>
                ) : (
                  <Button
                    onClick={handleStop}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Stop Sending
                  </Button>
                )}
                <Button
                  onClick={() => setRecipients([])}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Clear Recipients
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
