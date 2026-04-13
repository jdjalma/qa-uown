import { ImapFlow } from 'imapflow';
import { sleep } from './common.helpers.js';

export interface EmailHelperConfig {
  user: string;
  password: string;
  host?: string;
  port?: number;
}

export interface EmailContent {
  subject: string;
  body: string;
}

export class EmailHelpers {
  private config: EmailHelperConfig;
  private authFailed = false;

  constructor(config: EmailHelperConfig) {
    this.config = {
      host: 'imap.gmail.com',
      port: 993,
      ...config,
    };
  }

  /**
   * Connects to Gmail IMAP, searches for the most recent verification code email
   * sent to the given address, and extracts the 6-digit OTP code.
   *
   * Polls every few seconds until the email arrives or the timeout is reached.
   */
  async getVerificationCode(recipientEmail: string, timeoutMs = 150_000): Promise<string | null> {
    return this.pollInbox<string>(
      recipientEmail,
      timeoutMs,
      'Code',
      (attempt) => this.fetchFromInbox(recipientEmail, attempt, (body) => this.extractCodeFromBody(body)),
    );
  }

  /**
   * Connects to Gmail IMAP, searches for the most recent email sent to the given
   * address that contains a URL matching the provided pattern, and returns the URL.
   *
   * Useful for extracting finalization/verification links from emails
   * (e.g., PayTomorrow finalization link).
   *
   * @param recipientEmail - The email address to search for
   * @param urlPattern - Regex or string pattern to match against URLs in the email body
   * @param timeoutMs - Maximum time to poll (default 150s)
   * @returns The matching URL or null if not found
   */
  async getEmailLink(recipientEmail: string, urlPattern: string | RegExp, timeoutMs = 150_000): Promise<string | null> {
    const pattern = typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern;
    return this.pollInbox<string>(
      recipientEmail,
      timeoutMs,
      'Link',
      (attempt) => this.fetchFromInbox(recipientEmail, attempt, (body) => this.extractLinkFromBody(body, pattern)),
    );
  }

  /**
   * Searches inbox for an email matching the given subject pattern and returns
   * the full decoded HTML body and subject line.
   *
   * @param recipientEmail - The email address to search for
   * @param subjectPattern - Regex or string to match against the email subject
   * @param timeoutMs - Maximum time to poll (default 150s)
   * @returns Object with subject and body, or null if not found
   */
  async getEmailContent(
    recipientEmail: string,
    subjectPattern: string | RegExp,
    timeoutMs = 150_000,
  ): Promise<EmailContent | null> {
    const pattern = typeof subjectPattern === 'string' ? new RegExp(subjectPattern, 'i') : subjectPattern;
    return this.pollInbox<EmailContent>(
      recipientEmail,
      timeoutMs,
      'EmailContent',
      (attempt) => this.fetchFromInboxBySubject(recipientEmail, attempt, pattern),
    );
  }

  // ── Shared polling loop ───────────────────────────────────────────

  /**
   * Generic polling loop for inbox fetches.
   * Handles authFailed guard, backoff interval, and timeout.
   */
  private async pollInbox<T>(
    recipientEmail: string,
    timeoutMs: number,
    label: string,
    fetchFn: (attempt: number) => Promise<T | null>,
  ): Promise<T | null> {
    const deadline = Date.now() + timeoutMs;
    let interval = 5_000;
    let attempt = 0;

    while (Date.now() < deadline) {
      if (this.authFailed) {
        console.log(`[Email] Skipping retry — IMAP authentication previously failed. Check EMAIL_PASSWORD (must be a 16-char Google App Password).`);
        return null;
      }

      attempt++;
      const result = await fetchFn(attempt);
      if (result) return result;

      if (this.authFailed) return null;

      const remaining = Math.round((deadline - Date.now()) / 1000);
      console.log(`[Email] ${label} not found yet for ${recipientEmail}, retrying in ${interval / 1000}s... (${remaining}s remaining)`);
      await sleep(interval);
      interval = Math.min(interval * 1.3, 15_000);
    }

    console.log(`[Email] Timed out waiting for email ${label.toLowerCase()} for ${recipientEmail}`);
    return null;
  }

  // ── Shared IMAP fetch ─────────────────────────────────────────────

  /**
   * Generic IMAP fetch that connects, searches, and processes each message body
   * with the provided extractor function. Returns the most recent match.
   *
   * @param recipientEmail - Email address to search for
   * @param attempt - Current polling attempt number (for logging)
   * @param extractor - Function that extracts a value from a decoded email body, or null
   */
  /** Process fetched messages and return the most recent match */
  private async processMessages<T>(
    client: ImapFlow,
    uids: number[],
    attempt: number,
    extractor: (decodedBody: string) => T | null,
  ): Promise<T | null> {
    let latestResult: T | null = null;
    let latestDate = new Date(0);

    try {
      for await (const msg of client.fetch(uids, { source: true, envelope: true })) {
        const subject = msg.envelope?.subject || '';
        const msgDate = msg.envelope?.date || new Date(0);
        const decoded = this.decodeQuotedPrintable(msg.source?.toString() || '');
        const result = extractor(decoded);

        if (attempt <= 3 || result) {
          console.log(`[Email] seq=${msg.seq} Subject="${subject}" Date=${msgDate.toISOString()} Found=${result != null}`);
        }
        if (result != null && msgDate > latestDate) {
          latestResult = result;
          latestDate = msgDate;
        }
      }
    } catch (fetchErr) {
      console.log(`[Email] Failed to fetch messages: ${(fetchErr as Error).message}`);
    }

    return latestResult;
  }

  /** Handle IMAP connection errors */
  private handleImapError(err: unknown): void {
    const error = err as Error & { authenticationFailed?: boolean; serverResponseCode?: string };
    if (error.authenticationFailed || error.serverResponseCode === 'AUTHENTICATIONFAILED') {
      this.authFailed = true;
      console.error(`[Email] IMAP AUTHENTICATION FAILED for "${this.config.user}". The EMAIL_PASSWORD must be a 16-character Google App Password (not your Gmail login password). Generate one at: https://myaccount.google.com/apppasswords`);
    } else {
      console.log(`[Email] IMAP error: ${error.message}`);
    }
  }

  private async fetchFromInbox<T>(
    recipientEmail: string,
    attempt: number,
    extractor: (decodedBody: string) => T | null,
  ): Promise<T | null> {
    const client = new ImapFlow({
      host: this.config.host!,
      port: this.config.port!,
      secure: true,
      auth: { user: this.config.user, pass: this.config.password },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        const uids = await this.searchInbox(client, recipientEmail, attempt);
        if (attempt <= 3 || attempt % 5 === 0) {
          console.log(`[Email] attempt=${attempt} Search returned ${uids.length} UIDs for ${recipientEmail}`);
        }
        if (uids.length === 0) return null;
        return await this.processMessages(client, uids, attempt, extractor);
      } finally {
        lock.release();
      }
    } catch (err) {
      this.handleImapError(err);
      return null;
    } finally {
      await client.logout().catch(() => {});
    }
  }

  /**
   * Fetches emails by TO address and matches subject against a regex pattern.
   * Returns the full decoded body of the most recent match.
   */
  private async fetchFromInboxBySubject(
    recipientEmail: string,
    attempt: number,
    subjectPattern: RegExp,
  ): Promise<EmailContent | null> {
    const client = new ImapFlow({
      host: this.config.host!,
      port: this.config.port!,
      secure: true,
      auth: { user: this.config.user, pass: this.config.password },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Search by TO + recent date (subject filtering done client-side for regex support)
        const since = new Date(Date.now() - 10 * 60 * 1000);
        let uids: number[] = [];
        try {
          const result = await client.search({ to: recipientEmail, since });
          uids = result || [];
        } catch {
          try {
            const result = await client.search({ since });
            uids = result || [];
          } catch {
            return null;
          }
        }

        if (attempt <= 3 || attempt % 5 === 0) {
          console.log(`[Email] attempt=${attempt} Subject search returned ${uids.length} UIDs for ${recipientEmail}`);
        }
        if (uids.length === 0) return null;

        let latestResult: EmailContent | null = null;
        let latestDate = new Date(0);

        for await (const msg of client.fetch(uids, { source: true, envelope: true })) {
          const subject = msg.envelope?.subject || '';
          const msgDate = msg.envelope?.date || new Date(0);

          if (!subjectPattern.test(subject)) continue;

          const decoded = this.decodeQuotedPrintable(msg.source?.toString() || '');

          if (attempt <= 3) {
            console.log(`[Email] Subject match: seq=${msg.seq} Subject="${subject}" Date=${msgDate.toISOString()}`);
          }

          if (msgDate > latestDate) {
            latestResult = { subject, body: decoded };
            latestDate = msgDate;
          }
        }

        return latestResult;
      } finally {
        lock.release();
      }
    } catch (err) {
      this.handleImapError(err);
      return null;
    } finally {
      await client.logout().catch(() => {});
    }
  }

  // ── IMAP search strategies ────────────────────────────────────────

  /**
   * Search inbox with fallback strategies:
   *   1. By TO + SUBJECT "Verification"
   *   2. By TO + recent date
   *   3. By recent date only
   */
  private async searchInbox(client: ImapFlow, recipientEmail: string, attempt: number): Promise<number[]> {
    // Strategy 1: Search by SUBJECT + TO (most targeted — verification code emails)
    try {
      const result = await client.search({
        to: recipientEmail,
        subject: 'Verification',
      });
      if (result && result.length > 0) return result;
    } catch {
      // Strategy 1 failed
    }

    // Strategy 2: Search by TO + recent date (catches any email type)
    try {
      const since = new Date(Date.now() - 5 * 60 * 1000);
      const result = await client.search({ to: recipientEmail, since });
      if (result && result.length > 0) return result;
    } catch {
      // Strategy 2 failed
    }

    // Strategy 3: Last resort — search by date only
    try {
      const since = new Date(Date.now() - 5 * 60 * 1000);
      const result = await client.search({ since });
      return result || [];
    } catch {
      return [];
    }
  }

  // ── Extractors ────────────────────────────────────────────────────

  /**
   * Extracts a 6-digit verification code from the decoded email body.
   * Handles common patterns:
   *  - "Your verification code is: 123456"
   *  - "Your verification code is 123456"
   *  - "123456" standalone in the body
   *  - HTML with code in bold/span tags
   */
  private extractCodeFromBody(body: string): string | null {
    // Pattern 1: "verification code is: 123456" or "code: 123456"
    const codePatterns = [
      /verification\s{0,5}code\s{0,5}(?:is)?[\s:]{0,5}(\d{6})/i,
      /your\s{0,5}code\s{0,5}(?:is)?[\s:]{0,5}(\d{6})/i,
      /enter\s*(?:the\s*)?code[\s:]*(\d{6})/i,
      /code[\s:]+(\d{6})/i,
    ];

    for (const pattern of codePatterns) {
      const match = body.match(pattern);
      if (match) return match[1];
    }

    // Pattern 2: standalone 6-digit number — only if body has verification context.
    // Without this guard, account numbers from "Payment Receipt" emails match the regex.
    if (/verif|one.?time|otp|login\s*code/i.test(body)) {
      const standaloneMatch = body.match(/(?<!\d)(\d{6})(?!\d)/);
      if (standaloneMatch) return standaloneMatch[1];
    }

    return null;
  }

  /**
   * Extracts a URL matching the given pattern from the decoded email body.
   */
  private extractLinkFromBody(body: string, urlPattern: RegExp): string | null {
    const urlRegex = /https?:\/\/[^\s"'<>\]]+/g;
    const urls = body.match(urlRegex) || [];
    for (const url of urls) {
      if (urlPattern.test(url)) {
        return url;
      }
    }
    return null;
  }

  private decodeQuotedPrintable(text: string): string {
    return text
      .replace(/=\r?\n/g, '') // soft line breaks
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

}
