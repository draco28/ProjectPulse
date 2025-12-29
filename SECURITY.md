# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ProjectPulse seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**security@projectpulse.dev**

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** and how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Communication**: We will keep you informed about the progress of fixing the vulnerability.
- **Timeline**: We aim to address critical vulnerabilities within 7 days and other vulnerabilities within 30 days.
- **Credit**: If you wish, we will credit you in our security advisory when we disclose the vulnerability.

### Safe Harbor

We consider security research conducted in good faith to be authorized and will not pursue legal action against researchers who:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption of services
- Do not access or modify data that does not belong to them
- Do not exploit vulnerabilities beyond what is necessary to demonstrate the issue
- Report vulnerabilities promptly and do not disclose them publicly until we have addressed them

## Security Best Practices

When using ProjectPulse, we recommend:

### For Self-Hosted Deployments

1. **Keep software updated**: Regularly update to the latest version
2. **Use HTTPS**: Always use HTTPS in production
3. **Secure database**: Use strong passwords and restrict database access
4. **Environment variables**: Never commit secrets to version control
5. **Network security**: Use firewalls and restrict access to necessary ports

### For API/MCP Usage

1. **Token management**: Rotate API tokens regularly
2. **Principle of least privilege**: Only grant necessary permissions
3. **Monitor access**: Review access logs periodically
4. **Secure storage**: Store tokens securely, never in client-side code

## Known Security Considerations

### Database

- ProjectPulse uses PostgreSQL with prepared statements to prevent SQL injection
- Sensitive data is not stored in plaintext

### Authentication

- Session tokens are cryptographically secure
- Passwords (when implemented) are hashed using bcrypt

### API Security

- Rate limiting is implemented on API endpoints
- Input validation is performed on all user inputs
- CORS is configured to restrict origins

## Security Updates

Security updates are released as patch versions. Subscribe to our releases to stay informed:

- Watch this repository for releases
- Check our [CHANGELOG](CHANGELOG.md) for security-related updates

## Contact

For security-related inquiries that are not vulnerability reports, please contact:

**security@projectpulse.dev**

---

Thank you for helping keep ProjectPulse and its users safe!
