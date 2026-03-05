<!-- PT-BR: Decisão de usar IMAP via imapflow para extração de OTP de emails Gmail. -->

# ADR-008: IMAP via imapflow for OTP Extraction

## Status
Accepted

## Date
2025-02-10

## Context
The Website portal uses email OTP authentication (6-digit code). E2E tests need to capture this code to complete login. The platform sends real emails to Gmail accounts.

Options considered:
- **Email service mock**: fast, but doesn't test the real delivery flow
- **Gmail API**: requires complex OAuth2, Google credentials setup
- **Direct IMAP**: standard protocol, works with Gmail (app passwords), no OAuth needed

## Decision
Use **`imapflow`** for IMAP connection to Gmail and OTP extraction:

- Connects via IMAP to Gmail with app password
- Searches for the most recent email with subject matching
- Extracts 6-digit code via regex
- Timeout: 150s (waits for email delivery)
- Email aliases (`user+unique@gmail.com`) for isolation between parallel tests

## Consequences

**Positive:**
- Tests the real email flow (end-to-end)
- Gmail app passwords are simple to configure
- Email aliases allow isolation without extra accounts
- `imapflow` is robust and maintained

**Negative:**
- Dependency on network and Gmail service (may fail in restrictive CI)
- 150s timeout increases total test duration
- Test emails accumulate in the inbox

**Mitigations:**
- 150s timeout is sufficient for normal delivery
- Email aliases prevent collisions between parallel runs
- Periodic inbox cleanup (not automated)

## References
- `src/helpers/email.helpers.ts`
- `src/config/environment.ts` (IMAP credentials)
