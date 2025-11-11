# Mac Mini Self-Hosting Guide
**Complete Setup for Portfolio Hosting with Cloudflare Tunnel**

**Last Updated:** 2025-11-12
**Estimated Setup Time:** 45 minutes
**Total Cost:** $0 (completely free with Cloudflare URLs, optional domains: ~$46)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Choose Your Path](#choose-your-path)
3. [Prerequisites](#prerequisites)
4. [Architecture Diagram](#architecture-diagram)
5. [Phase 1A: Free URL Quick Start (No Domain)](#phase-1a-free-url-quick-start-no-domain) ⭐ **Start Here**
6. [Phase 1B: Custom Domain Setup (Optional)](#phase-1b-custom-domain-setup-optional)
7. [Phase 2: Docker Desktop Setup](#phase-2-docker-desktop-setup)
8. [Phase 3: Cloudflare Tunnel Setup](#phase-3-cloudflare-tunnel-setup)
9. [Phase 4: Dokploy Installation](#phase-4-dokploy-installation)
10. [Phase 5: Deploy Applications](#phase-5-deploy-applications)
11. [Phase 6: Auto-Start Configuration](#phase-6-auto-start-configuration)
12. [Phase 7: Monitoring & Alerts](#phase-7-monitoring--alerts)
13. [Phase 8: Remote Management](#phase-8-remote-management)
14. [Phase 9: Upgrading to Custom Domain (Later)](#phase-9-upgrading-to-custom-domain-later)
15. [Troubleshooting](#troubleshooting)
16. [Maintenance & Updates](#maintenance--updates)
17. [Migration to VPS (Future)](#migration-to-vps-future)

---

## Overview

### What This Guide Covers

This guide will help you:
- ✅ Self-host 4 SaaS projects on your Mac mini
- ✅ Make them publicly accessible via Cloudflare Tunnel
- ✅ Configure auto-start after reboots
- ✅ Set up monitoring and alerts
- ✅ Enable remote management

### Your Infrastructure Specs

```
Mac mini (192.168.1.15)
├─ Network: Airtel WiFi
├─ Upload Speed: 199 Mbps (excellent!)
├─ Runtime: 24/7 capable
└─ OS: macOS (current)

Expected Performance:
├─ 4 Next.js SaaS applications
├─ Combined traffic: 2,000-4,000 visitors/day
├─ Latency: 100-150ms (via Cloudflare)
└─ Uptime: 99%+ (with auto-restart)
```

### Benefits vs VPS

| Feature | Mac Mini Setup | Hostinger VPS |
|---------|---------------|---------------|
| **Cost** | $0/mo | $8.99/mo |
| **4-Year Cost** | $0 | $333 |
| **Performance** | Excellent (local hardware) | Good (2 vCPU, 8GB) |
| **Upload Speed** | 199 Mbps | ~100 Mbps |
| **Learning Value** | ⭐⭐⭐⭐⭐ (Advanced) | ⭐⭐⭐⭐ (High) |
| **Latency** | 100-150ms | 80-120ms |
| **Uptime SLA** | 99%+ (self-managed) | 99.9% (guaranteed) |
| **Setup Complexity** | Medium | Easy |

**Verdict:** Mac mini is perfect for portfolio phase, migrate to VPS if/when needed.

---

## Choose Your Path

### 🚀 Quick Decision Matrix

**Choose Path A (Free URLs) if:**
- ✅ You want to start TODAY with $0 cost
- ✅ You want to test everything risk-free
- ✅ You're budget-conscious
- ✅ You don't need "professional" URLs yet
- ✅ You want to buy domain later when you have job/income

**Choose Path B (Custom Domain) if:**
- ✅ You want professional URLs (yourname.com)
- ✅ You're willing to invest ~$46 now
- ✅ You're ready for Black Friday domain purchases
- ✅ You want maximum polish from day one

---

### Path A: Free URL Setup ⭐ **RECOMMENDED TO START**

```
Timeline: 45 minutes
Cost: $0

Your apps will be accessible at:
├─ https://careful-horse-1234.trycloudflare.com (ProjectPulse)
├─ https://bright-fish-5678.trycloudflare.com (App 2)
├─ https://happy-dog-9012.trycloudflare.com (App 3)
└─ https://swift-cat-3456.trycloudflare.com (App 4)

Features:
✅ Full SSL (HTTPS)
✅ Fast Cloudflare CDN
✅ DDoS protection
✅ Same performance as custom domain
✅ Upgrade to custom domain in 5 minutes (later)

What you get:
✅ Functional portfolio for job applications
✅ Share with recruiters immediately
✅ Test all features risk-free
✅ Zero financial commitment

Follow: Phase 1A → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

---

### Path B: Custom Domain Setup

```
Timeline: 60 minutes (includes domain purchase + DNS wait)
Cost: ~$46 (one-time for 2-5 years)

Your apps will be accessible at:
├─ https://projectpulse.yourname.com
├─ https://saasapp2.yourname.com
├─ https://saasapp3.yourname.com
└─ https://saasapp4.yourname.com

Features:
✅ Professional URLs
✅ Memorable addresses
✅ Custom branding
✅ Email addresses (contact@yourname.com)

What you get:
✅ Maximum professional polish
✅ Personal brand (yourname.com)
✅ Better for long-term portfolio

Follow: Phase 1B → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

---

### Path C: Hybrid (Start Free, Upgrade Later) ⭐⭐⭐⭐⭐ **SMARTEST**

```
Week 1: Use Free URLs
├─ Set up everything with $0 cost
├─ Test for a few weeks
├─ Verify everything works
└─ Share with recruiters using free URLs

Week 4-12: Upgrade to Custom Domain
├─ Buy domain when ready (Black Friday 2025?)
├─ Follow Phase 9 (5 minute upgrade)
├─ Update resume with new URLs
└─ Professional URLs after job search

Total Cost: $0 now, ~$30-46 later (when you choose)
Best of both worlds! ✅
```

---

**💡 Recommendation: Start with Path A (Free), upgrade to Path B later!**

Most of this guide follows **Path A** - the free option.
If you want custom domains, follow Path 1B instead of 1A, then continue normally.

---

## Prerequisites

### Required Hardware

- ✅ Mac mini (already have: 192.168.1.15)
- ✅ Airtel WiFi router (already have)
- ✅ 199 Mbps upload speed (verified)
- ✅ Ability to run 24/7 (confirmed)

### Required Software

- ✅ macOS (any recent version)
- ⚠️ Docker Desktop for Mac (we'll install)
- ⚠️ Homebrew (we'll install if needed)
- ⚠️ Git (usually pre-installed)

### Required Accounts (Free)

- ⚠️ Cloudflare account (we'll create) - **Required for Path A**
- ⚠️ Domain registrar account - **Only if following Path B**
- ✅ GitHub account (you already have)
- ⚠️ UptimeRobot account (optional, for monitoring)

### Path A: No Purchases Needed! ✅

**For free URL setup:**
- Nothing to buy!
- Create free Cloudflare account (next phase)
- Start immediately with $0 cost

### Path B: Optional Domain Purchases

**If choosing custom domains (Black Friday or anytime):**

```bash
# Domains to purchase:
1. yourname.com (5 years) - ~$30
   Where: Namecheap or Porkbun

2. yourname.dev (2 years) - ~$16
   Where: Google Domains or Namecheap

Total: ~$46 (one-time for 2-5 years)
```

**What NOT to buy (either path):**
- ❌ VPS hosting (using Mac mini instead)
- ❌ Managed database (using self-hosted PostgreSQL)
- ❌ CDN service (Cloudflare free tier included)
- ❌ SSL certificates (automatic via Cloudflare)

**Total savings: $333+ over 4 years!**

---

## Architecture Diagram

### Current Dev Setup (Before This Guide)

```
┌─────────────────────────────────────────┐
│ Windows PC (192.168.1.x)                │
│  - Windsurf editor                      │
│  - Browser → http://192.168.1.15:3000  │
│  - Local network only ❌                │
└──────────────┬──────────────────────────┘
               │
               │ Local Network
               │
┌──────────────▼──────────────────────────┐
│ Mac mini (192.168.1.15)                 │
│  - Docker Compose                       │
│  - PostgreSQL                           │
│  - Next.js dev server                   │
│  - Not publicly accessible ❌           │
└─────────────────────────────────────────┘
```

### After This Guide (Production Self-Hosted)

```
┌─────────────────────────────────────────────────────┐
│ INTERNET (Public Access) ✅                         │
│                                                     │
│  Recruiters/Users anywhere in the world            │
│  Access: https://projectpulse.yourname.com         │
└──────────────┬──────────────────────────────────────┘
               │
               │ HTTPS
               │
┌──────────────▼──────────────────────────────────────┐
│ CLOUDFLARE GLOBAL NETWORK                           │
│                                                     │
│  ├─ Edge Servers (200+ locations worldwide)        │
│  ├─ DDoS Protection                                │
│  ├─ SSL/TLS Termination                            │
│  ├─ CDN (Static Asset Caching)                     │
│  └─ WAF (Web Application Firewall)                 │
└──────────────┬──────────────────────────────────────┘
               │
               │ Encrypted Tunnel (No port forwarding!)
               │
┌──────────────▼──────────────────────────────────────┐
│ YOUR HOME NETWORK (192.168.1.x)                     │
│                                                     │
│  Airtel Router - No configuration needed! ✅        │
└──────────────┬──────────────────────────────────────┘
               │
               │ Local Network
               │
┌──────────────▼──────────────────────────────────────┐
│ MAC MINI (192.168.1.15)                             │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ Cloudflare Tunnel Agent             │           │
│  │  - Auto-starts on boot ✅           │           │
│  │  - Connects to Cloudflare edge      │           │
│  │  - No inbound ports needed          │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ DOKPLOY (Docker Management)         │           │
│  │  - Web UI: localhost:3000           │           │
│  │  - Auto-deploys from Git            │           │
│  │  - Manages all containers           │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ APPLICATIONS (Docker Containers)    │           │
│  │                                     │           │
│  │  ├─ ProjectPulse (port 3001)       │           │
│  │  │  URL: projectpulse.yourname.com │           │
│  │  │  RAM: ~500 MB                   │           │
│  │  │                                 │           │
│  │  ├─ SaaS App 2 (port 3002)         │           │
│  │  │  URL: saasapp2.yourname.com     │           │
│  │  │  RAM: ~500 MB                   │           │
│  │  │                                 │           │
│  │  ├─ SaaS App 3 (port 3003)         │           │
│  │  │  URL: saasapp3.yourname.com     │           │
│  │  │  RAM: ~500 MB                   │           │
│  │  │                                 │           │
│  │  └─ SaaS App 4 (port 3004)         │           │
│  │     URL: saasapp4.yourname.com     │           │
│  │     RAM: ~500 MB                   │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ DATABASE (Shared PostgreSQL)        │           │
│  │  - Port: 5432                       │           │
│  │  - Schemas:                         │           │
│  │    ├─ projectpulse_schema           │           │
│  │    ├─ saasapp2_schema               │           │
│  │    ├─ saasapp3_schema               │           │
│  │    └─ saasapp4_schema               │           │
│  │  - RAM: ~800 MB                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ OPTIONAL SERVICES                   │           │
│  │  ├─ Redis (caching)                 │           │
│  │  ├─ Umami (analytics)               │           │
│  │  └─ Uptime Kuma (monitoring)        │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  Total Resource Usage:                             │
│  ├─ RAM: ~4 GB / 8 GB available                    │
│  ├─ CPU: ~40-60% average                           │
│  └─ Disk: ~20 GB                                   │
└─────────────────────────────────────────────────────┘

Windows PC (Development)
├─ Edit code locally
├─ Git push → Auto-deploys via Dokploy
└─ Access via public URL (same as users!)
```

### Traffic Flow

```
User Request:
  https://projectpulse.yourname.com
       ↓
  DNS lookup → Cloudflare IP
       ↓
  Cloudflare Edge (nearest location)
       ├─ Checks cache (static assets)
       ├─ If cached → Return immediately (fast!)
       └─ If not cached → Continue to origin
       ↓
  Cloudflare Tunnel (encrypted)
       ↓
  Mac mini (192.168.1.15)
       ↓
  Dokploy (reverse proxy)
       ↓
  Docker container (ProjectPulse)
       ↓
  Next.js app processes request
       ↓
  PostgreSQL query (if needed)
       ↓
  Response back through tunnel
       ↓
  User receives page

Total latency: ~100-150ms (feels instant!)
```

---

## Phase 1A: Free URL Quick Start (No Domain) ⭐ **START HERE**

**Skip to Phase 2 if following Path B (custom domain)**

This phase sets up your apps with FREE Cloudflare Tunnel URLs - no domain purchase needed!

### Step 1A.1: Create Free Cloudflare Account

```
1. Visit: https://dash.cloudflare.com/sign-up

2. Sign up (free):
   - Email: your@email.com
   - Password: [secure password]
   - Verify email

3. You're in! Dashboard loads.

4. No credit card needed ✅
   No domain needed ✅
   Completely free ✅
```

### Step 1A.2: Understand Free URL Structure

**When you deploy apps, Cloudflare will give you URLs like:**

```
Pattern: https://[random-words-1234].trycloudflare.com

Examples:
├─ https://careful-horse-1234.trycloudflare.com
├─ https://bright-fish-5678.trycloudflare.com
├─ https://happy-dog-9012.trycloudflare.com
└─ https://swift-cat-3456.trycloudflare.com

Features:
✅ Full HTTPS (SSL certificate included)
✅ Cloudflare CDN (fast worldwide)
✅ DDoS protection
✅ No expiration
✅ Works exactly like custom domain
```

**Random IDs explained:**
- Cloudflare generates unique identifiers
- Format: `adjective-animal-number`
- Can't customize (that requires custom domain)
- Still professional and functional!

### Step 1A.3: Save Your Cloudflare Account Info

```bash
# Save these for later phases:
Email: your@email.com
Password: [your password]
Account ID: [find in dashboard → Overview]

# You'll need this when creating tunnels
```

### Step 1A.4: That's It!

**You're done with Phase 1A!** 🎉

No domain purchase, no DNS configuration, no waiting for propagation.

**Next:** Continue to Phase 2 (Docker Desktop Setup)

**Your apps will get free URLs automatically when you:**
- Set up Cloudflare Tunnel (Phase 3)
- Deploy apps (Phase 5)

**Want custom domains later?** Follow Phase 9 (5 minute upgrade)

---

## Phase 1B: Custom Domain Setup (Optional)

**Skip this if following Path A (free URLs)**

This phase is for those who want custom domains like `yourname.com`.

### Step 1B.1: Purchase Domains (Black Friday or Anytime)

**Option A: Namecheap** (Recommended)

```
1. Visit: https://www.namecheap.com/domain-web-hosting-ssl-deals/black-friday/

2. Search for your domain:
   - yourname.com
   - Check availability

3. Add to cart:
   - Select 5 years (best value)
   - Disable auto-renew (you'll renew manually)
   - Skip WHOIS protection (Cloudflare provides this)

4. Repeat for yourname.dev:
   - Select 2 years

5. Checkout:
   - Total: ~$46 for both domains
   - Use Black Friday coupon if available
```

**Option B: Porkbun** (Cheapest renewals)

```
1. Visit: https://porkbun.com/

2. Search and purchase same domains

3. Prices typically lower than Namecheap
```

### Step 1B.2: Point Domains to Cloudflare

**After purchasing domains:**

```
1. Create Cloudflare account (free):
   Visit: https://dash.cloudflare.com/sign-up

2. Add your first domain:
   - Click "Add Site"
   - Enter: yourname.com
   - Select "Free" plan
   - Click "Continue"

3. Cloudflare will scan DNS records:
   - Note the nameservers shown:
     Example:
     ns1: alex.ns.cloudflare.com
     ns2: dana.ns.cloudflare.com

4. Update nameservers at your registrar:

   Namecheap:
   - Go to Domain List
   - Click "Manage" next to yourname.com
   - Find "Nameservers" section
   - Select "Custom DNS"
   - Enter Cloudflare nameservers
   - Save changes

   Porkbun:
   - Go to Domain Management
   - Click on yourname.com
   - Scroll to "Authoritative Nameservers"
   - Change to Cloudflare nameservers
   - Update

5. Wait for DNS propagation:
   - Usually 5-30 minutes
   - Cloudflare will email when ready
   - Status shows "Active" in dashboard

6. Repeat for yourname.dev
```

### Step 1B.3: Configure Cloudflare Settings

**Optimize settings for performance:**

```
In Cloudflare dashboard for yourname.com:

1. SSL/TLS Settings:
   - Go to SSL/TLS tab
   - Set encryption mode: "Full (strict)"
   - Enable "Always Use HTTPS": ON
   - Enable "Automatic HTTPS Rewrites": ON

2. Speed Settings:
   - Go to Speed tab
   - Auto Minify: Check CSS, JavaScript, HTML
   - Brotli: ON
   - Early Hints: ON
   - Rocket Loader: OFF (can break Next.js)

3. Caching:
   - Go to Caching tab
   - Caching Level: "Standard"
   - Browser Cache TTL: "Respect Existing Headers"

4. Network:
   - HTTP/2: ON (default)
   - HTTP/3 (with QUIC): ON
   - 0-RTT Connection Resumption: ON
   - WebSockets: ON
```

**Repeat for yourname.dev**

---

## Phase 2: Docker Desktop Setup

### Step 2.1: Install Homebrew (if not installed)

```bash
# Check if Homebrew is installed
which brew

# If not installed, install it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Follow on-screen instructions to add to PATH
# Usually requires adding to ~/.zshrc or ~/.bash_profile

# Verify installation
brew --version
```

### Step 2.2: Install Docker Desktop

```bash
# Install Docker Desktop via Homebrew
brew install --cask docker

# Or download manually:
# Visit: https://www.docker.com/products/docker-desktop/
# Download for Mac (Apple Silicon or Intel)
# Install DMG file
```

### Step 2.3: Configure Docker Desktop

```
1. Open Docker Desktop application

2. Go to Preferences (⌘ + ,)

3. General Settings:
   ✅ Start Docker Desktop when you log in
   ✅ Use Docker Compose V2

4. Resources:
   - CPUs: 2 (leave some for macOS)
   - Memory: 6 GB (leave 2 GB for macOS)
   - Swap: 2 GB
   - Disk: 60 GB

5. Docker Engine (Advanced):
   Add to daemon.json:
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }

   This prevents logs from filling disk.

6. Apply & Restart

7. Verify Docker is running:
   docker --version
   docker ps
```

### Step 2.4: Test Docker

```bash
# Test Docker installation
docker run hello-world

# Expected output:
# "Hello from Docker!"
# "This message shows that your installation appears to be working correctly."

# Check Docker Compose
docker compose version

# Should show: Docker Compose version v2.x.x
```

---

## Phase 3: Cloudflare Tunnel Setup

**Choose your path:**
- **Path A (Free URLs):** Follow Steps 3.1-3.4A
- **Path B (Custom Domain):** Follow Steps 3.1-3.4B

### Step 3.1: Install cloudflared

```bash
# Install via Homebrew
brew install cloudflare/cloudflare/cloudflared

# Verify installation
cloudflared --version

# Expected output: cloudflared version 2024.x.x
```

### Step 3.2: Authenticate with Cloudflare

**For Path A (Free URLs):**

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Browser will open:
# 1. Login with your Cloudflare account
# 2. Click "Authorize" (no domain selection needed!)
# 3. Terminal shows: "You have successfully logged in"

# Credentials saved to:
# ~/.cloudflared/cert.pem
```

**For Path B (Custom Domain):**

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Browser will open:
# 1. SELECT your domain (yourname.com)
# 2. Click "Authorize"
# 3. Terminal shows: "You have successfully logged in"

# Credentials saved to:
# ~/.cloudflared/cert.pem
```

### Step 3.3: Create Tunnel

```bash
# Create a named tunnel
cloudflared tunnel create mac-mini-portfolio

# Output shows:
# Tunnel credentials written to:
# ~/.cloudflared/[TUNNEL-ID].json
#
# Created tunnel mac-mini-portfolio with id [TUNNEL-ID]

# Save the TUNNEL-ID for next steps
# Example: 12345678-abcd-1234-efgh-123456789012
```

---

### Step 3.4A: Configure Tunnel for Free URLs ⭐ **PATH A**

**Skip to Step 3.4B if using custom domain**

**Create config file:**

```bash
# Create/edit config file
nano ~/.cloudflared/config.yml
```

**Add this configuration:**

```yaml
# ~/.cloudflared/config.yml (PATH A - FREE URLS)

# Replace [TUNNEL-ID] with your actual tunnel ID
tunnel: [TUNNEL-ID]
credentials-file: /Users/[YOUR-USERNAME]/.cloudflared/[TUNNEL-ID].json

# Ingress rules WITHOUT custom hostnames (free URLs)
ingress:
  # ProjectPulse - Port 3001
  - service: http://localhost:3001

# Optional: Logging configuration
logDirectory: /Users/[YOUR-USERNAME]/.cloudflared/logs
loglevel: info
```

**Replace placeholders:**
- `[TUNNEL-ID]` → Your actual tunnel ID from step 3.3
- `[YOUR-USERNAME]` → Your Mac username (run `whoami` to find)

**Save file:** `Ctrl+O`, `Enter`, `Ctrl+X`

**How Free URLs Work:**

When you start the tunnel, Cloudflare automatically assigns a free URL:
```
cloudflared tunnel run mac-mini-portfolio

# Output will show:
# Your quick Tunnel has been created!
# https://careful-horse-1234.trycloudflare.com
```

Each port gets its own unique URL. We'll get URLs for all 4 apps when we deploy them!

**Continue to Step 3.6**

---

### Step 3.4B: Configure Tunnel for Custom Domain **PATH B**

**Skip this if using free URLs (Path A)**

**Create config file:**

```bash
# Create/edit config file
nano ~/.cloudflared/config.yml
```

**Add this configuration:**

```yaml
# ~/.cloudflared/config.yml (PATH B - CUSTOM DOMAIN)

# Replace [TUNNEL-ID] with your actual tunnel ID
tunnel: [TUNNEL-ID]
credentials-file: /Users/[YOUR-USERNAME]/.cloudflared/[TUNNEL-ID].json

# Ingress rules WITH custom hostnames
ingress:
  # ProjectPulse - Main SaaS app
  - hostname: projectpulse.yourname.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # SaaS App 2
  - hostname: saasapp2.yourname.com
    service: http://localhost:3002
    originRequest:
      noTLSVerify: true

  # SaaS App 3
  - hostname: saasapp3.yourname.com
    service: http://localhost:3003
    originRequest:
      noTLSVerify: true

  # SaaS App 4
  - hostname: saasapp4.yourname.com
    service: http://localhost:3004
    originRequest:
      noTLSVerify: true

  # Dokploy admin panel (optional - secure with Cloudflare Access later)
  # - hostname: admin.yourname.com
  #   service: http://localhost:3000
  #   originRequest:
  #     noTLSVerify: true

  # Catch-all rule (required)
  - service: http_status:404

# Optional: Logging configuration
logDirectory: /Users/[YOUR-USERNAME]/.cloudflared/logs
loglevel: info
```

**Replace placeholders:**
- `[TUNNEL-ID]` → Your actual tunnel ID from step 3.3
- `[YOUR-USERNAME]` → Your Mac username (run `whoami` to find)
- `yourname.com` → Your actual domain

**Save file:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Create DNS Records:**

```bash
# Route each subdomain through the tunnel
cloudflared tunnel route dns mac-mini-portfolio projectpulse.yourname.com
cloudflared tunnel route dns mac-mini-portfolio saasapp2.yourname.com
cloudflared tunnel route dns mac-mini-portfolio saasapp3.yourname.com
cloudflared tunnel route dns mac-mini-portfolio saasapp4.yourname.com

# Optional: Admin panel
# cloudflared tunnel route dns mac-mini-portfolio admin.yourname.com

# Verify DNS records in Cloudflare dashboard:
# - Go to DNS tab
# - Should see CNAME records pointing to [TUNNEL-ID].cfargotunnel.com
```

**Continue to Step 3.6**

---

### Step 3.5: Test Tunnel (Manual)

**Both paths follow the same steps here:**

```bash
# Start tunnel manually (for testing)
cloudflared tunnel run mac-mini-portfolio

# Expected output:
# INF Starting tunnel tunnelID=[TUNNEL-ID]
# INF Connection established connIndex=0
# INF Connection established connIndex=1
# INF Connection established connIndex=2
# INF Connection established connIndex=3

# PATH A: Will also show free URL:
# Your quick Tunnel has been created!
# https://careful-horse-1234.trycloudflare.com

# PATH B: Custom domains will work when DNS propagates

# Tunnel is now running! (Keep terminal open)

# Test in another terminal:
# curl https://[your-url]
# (Will return error for now - no app running yet)

# Stop tunnel: Ctrl+C
```

### Step 3.6: Install Tunnel as System Service

**This makes tunnel auto-start on boot:**

```bash
# Install as LaunchDaemon (starts before login)
sudo cloudflared service install

# Start the service
sudo launchctl start com.cloudflare.cloudflared

# Verify it's running
sudo launchctl list | grep cloudflared

# Check logs
tail -f ~/.cloudflared/logs/cloudflared.log

# Service is now running in background!
# Will auto-start on Mac mini reboot ✅
```

**Verify auto-start:**

```bash
# Service status
sudo launchctl list | grep cloudflared

# Should show:
# [PID]  0  com.cloudflare.cloudflared

# Test by restarting Mac mini later
```

---

## Phase 4: Dokploy Installation

### Step 4.1: Install Dokploy

**Dokploy is a self-hosted PaaS platform (like Heroku/Vercel but on your server)**

```bash
# Create directory for Dokploy
mkdir -p ~/dokploy
cd ~/dokploy

# Download Dokploy docker-compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/Dokploy/dokploy/main/docker-compose.yml

# Review the file (optional)
cat docker-compose.yml

# Start Dokploy
docker compose up -d

# Wait for containers to start (~1-2 minutes)
docker compose ps

# Expected output:
# NAME                SERVICE             STATUS
# dokploy             dokploy             running
# dokploy-postgres    postgres            running
# dokploy-traefik     traefik             running
```

### Step 4.2: Access Dokploy Dashboard

```
1. Open browser on Mac mini:
   http://localhost:3000

2. First-time setup:
   - Create admin account
   - Email: your@email.com
   - Password: [secure password]
   - Confirm password
   - Click "Create Account"

3. Dashboard loads:
   - Empty projects list (we'll add apps next)
   - Sidebar shows: Projects, Applications, Databases, Settings
```

### Step 4.3: Configure Dokploy for Multiple Apps

**Access from Windows PC (optional - for remote management):**

```
Since Mac mini is on local network:
http://192.168.1.15:3000

Login with credentials created above.
```

**For public access to admin panel (optional, secure it first!):**

```bash
# Edit Cloudflare tunnel config to add admin subdomain
nano ~/.cloudflared/config.yml

# Add entry:
  - hostname: admin.yourname.com
    service: http://localhost:3000

# Restart tunnel
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared

# Create DNS route
cloudflared tunnel route dns mac-mini-portfolio admin.yourname.com

# Access from anywhere:
# https://admin.yourname.com
```

**Security recommendation:** Use Cloudflare Access to secure admin panel (covered in Phase 8).

---

## Phase 5: Deploy Applications

### Step 5.1: Create Shared PostgreSQL Database

**In Dokploy dashboard:**

```
1. Click "Databases" in sidebar

2. Click "New Database"

3. Configure:
   - Name: shared-postgres
   - Type: PostgreSQL
   - Version: 15
   - Database name: postgres
   - Username: postgres
   - Password: [generate strong password]
   - Port: 5432 (default)
   - Memory limit: 1GB
   - Restart policy: always

4. Click "Create"

5. Wait for database to start (~30 seconds)

6. Note connection string:
   postgresql://postgres:[PASSWORD]@shared-postgres:5432/postgres

   Save this for app deployments!
```

### Step 5.2: Create Database Schemas for Each App

**Connect to PostgreSQL:**

```bash
# Install PostgreSQL client (if not installed)
brew install postgresql@15

# Connect to database
docker exec -it dokploy-postgres-1 psql -U postgres

# You're now in PostgreSQL shell
```

**Create schemas:**

```sql
-- Create schema for ProjectPulse
CREATE SCHEMA IF NOT EXISTS projectpulse_schema;

-- Create schema for SaaS App 2
CREATE SCHEMA IF NOT EXISTS saasapp2_schema;

-- Create schema for SaaS App 3
CREATE SCHEMA IF NOT EXISTS saasapp3_schema;

-- Create schema for SaaS App 4
CREATE SCHEMA IF NOT EXISTS saasapp4_schema;

-- Grant permissions (replace 'postgres' if using different user)
GRANT ALL PRIVILEGES ON SCHEMA projectpulse_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA saasapp2_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA saasapp3_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA saasapp4_schema TO postgres;

-- Verify schemas created
\dn

-- Expected output:
--         List of schemas
--         Name              |  Owner
-- -------------------------|----------
--  projectpulse_schema     | postgres
--  saasapp2_schema         | postgres
--  saasapp3_schema         | postgres
--  saasapp4_schema         | postgres
--  public                  | postgres

-- Exit PostgreSQL
\q
```

### Step 5.3: Deploy ProjectPulse (First App)

**In Dokploy dashboard:**

```
1. Click "Projects" → "New Project"
   - Name: Portfolio Projects
   - Description: My SaaS portfolio applications
   - Click "Create"

2. Click into "Portfolio Projects"

3. Click "New Application"

4. Configure Application:
   Tab: General
   ├─ Name: projectpulse
   ├─ Git Repository: https://github.com/yourusername/AI_HUB
   ├─ Branch: master (or main)
   ├─ Build Method: Dockerfile (or Nixpacks auto-detect)
   └─ Port: 3001

   Tab: Environment Variables
   ├─ DATABASE_URL:
   │    postgresql://postgres:[PASSWORD]@shared-postgres:5432/postgres?schema=projectpulse_schema
   ├─ NEXT_PUBLIC_APP_URL:
   │    https://projectpulse.yourname.com
   ├─ NODE_ENV: production
   └─ Add any other app-specific env vars

   Tab: Domain
   ├─ Domain: projectpulse.yourname.com
   └─ SSL: Handled by Cloudflare Tunnel ✅

   Tab: Health Check
   ├─ Enabled: Yes
   ├─ Path: /api/health (or /)
   └─ Interval: 30s

   Tab: Resources
   ├─ Memory Limit: 600MB
   ├─ CPU Limit: 1.0
   └─ Restart Policy: always

5. Click "Create Application"

6. Deployment starts automatically:
   - Cloning repository
   - Building Docker image
   - Starting container
   - Health check

   Watch logs in real-time (Logs tab)

7. Wait for deployment (~2-5 minutes)

8. Status shows "Running" ✅

9. Test access:
   https://projectpulse.yourname.com

   Should load your app! 🎉
```

### Step 5.4: Deploy Additional Apps

**Repeat Step 5.3 for each additional app:**

```
App 2:
├─ Name: saasapp2
├─ Repository: [your-repo-url]
├─ Port: 3002
├─ DATABASE_URL schema: saasapp2_schema
├─ Domain: saasapp2.yourname.com
└─ NEXT_PUBLIC_APP_URL: https://saasapp2.yourname.com

App 3:
├─ Name: saasapp3
├─ Repository: [your-repo-url]
├─ Port: 3003
├─ DATABASE_URL schema: saasapp3_schema
├─ Domain: saasapp3.yourname.com
└─ NEXT_PUBLIC_APP_URL: https://saasapp3.yourname.com

App 4:
├─ Name: saasapp4
├─ Repository: [your-repo-url]
├─ Port: 3004
├─ DATABASE_URL schema: saasapp4_schema
├─ Domain: saasapp4.yourname.com
└─ NEXT_PUBLIC_APP_URL: https://saasapp4.yourname.com
```

### Step 5.5: Run Database Migrations

**For each app, run Prisma migrations:**

```bash
# Get container ID
docker ps | grep projectpulse

# Execute migration inside container
docker exec -it [CONTAINER-ID] npx prisma migrate deploy

# Or use Dokploy console:
# Click app → Console tab → Run command:
npx prisma migrate deploy

# Repeat for each app
```

### Step 5.6: Verify All Apps Running

```bash
# Check all containers
docker ps

# Expected output:
# CONTAINER ID   IMAGE                    STATUS          PORTS
# abc123         projectpulse:latest      Up 5 minutes    3001/tcp
# def456         saasapp2:latest          Up 4 minutes    3002/tcp
# ghi789         saasapp3:latest          Up 3 minutes    3003/tcp
# jkl012         saasapp4:latest          Up 2 minutes    3004/tcp
# mno345         postgres:15              Up 10 minutes   5432/tcp
# pqr678         dokploy:latest           Up 15 minutes   3000/tcp

# Test each URL:
curl -I https://projectpulse.yourname.com
curl -I https://saasapp2.yourname.com
curl -I https://saasapp3.yourname.com
curl -I https://saasapp4.yourname.com

# All should return: HTTP/2 200 ✅
```

---

## Phase 6: Auto-Start Configuration

### Step 6.1: Docker Desktop Auto-Start

**Already configured in Phase 2.3:**

```
Docker Desktop → Preferences → General
✅ Start Docker Desktop when you log in
```

**Verify:**

```bash
# Check LaunchAgent
ls ~/Library/LaunchAgents/ | grep docker

# Should show: com.docker.helper.plist
```

### Step 6.2: Dokploy Auto-Start

**Configure restart policy:**

```bash
# Edit Dokploy docker-compose.yml
cd ~/dokploy
nano docker-compose.yml
```

**Ensure all services have `restart: always`:**

```yaml
services:
  dokploy:
    restart: always  # ← Add if missing
    # ... rest of config

  postgres:
    restart: always  # ← Add if missing
    # ... rest of config

  traefik:
    restart: always  # ← Add if missing
    # ... rest of config
```

**Apply changes:**

```bash
# Restart Dokploy with new config
docker compose down
docker compose up -d

# Verify restart policy
docker inspect dokploy | grep RestartPolicy

# Should show: "Name": "always"
```

### Step 6.3: Application Auto-Start

**All apps deployed via Dokploy automatically have `restart: always`**

Verify:

```bash
# Check each container's restart policy
docker inspect projectpulse | grep RestartPolicy
docker inspect saasapp2 | grep RestartPolicy
docker inspect saasapp3 | grep RestartPolicy
docker inspect saasapp4 | grep RestartPolicy

# All should show: "Name": "always" ✅
```

### Step 6.4: Cloudflare Tunnel Auto-Start

**Already configured in Phase 3.7:**

```bash
# Verify service is installed
sudo launchctl list | grep cloudflared

# Should show running ✅
```

### Step 6.5: Test Auto-Start

**Reboot Mac mini:**

```bash
sudo reboot
```

**After reboot (~3 minutes), verify everything started:**

```bash
# 1. Check Docker is running
docker ps

# 2. Check Cloudflare tunnel
sudo launchctl list | grep cloudflared

# 3. Check all apps responding
curl -I https://projectpulse.yourname.com
curl -I https://saasapp2.yourname.com
curl -I https://saasapp3.yourname.com
curl -I https://saasapp4.yourname.com

# All should return 200 OK ✅
```

**Timeline after reboot:**

```
0:00 - Mac mini powers on
0:30 - macOS boots
0:45 - Docker Desktop starts
1:00 - Cloudflare Tunnel connects
1:30 - Dokploy containers start
2:00 - App containers start
2:30 - Health checks pass
3:00 - All apps fully accessible ✅
```

---

## Phase 7: Monitoring & Alerts

### Step 7.1: Install Uptime Monitoring (UptimeRobot)

**Create account:**

```
1. Visit: https://uptimerobot.com/

2. Sign up (free tier):
   - Monitors: 50 (more than enough!)
   - Check interval: 5 minutes
   - Alerts: Email, SMS (paid)

3. Add monitors for each app:

   Monitor 1:
   ├─ Monitor Type: HTTP(s)
   ├─ Friendly Name: ProjectPulse
   ├─ URL: https://projectpulse.yourname.com
   ├─ Monitoring Interval: 5 minutes
   └─ Alert Contacts: your@email.com

   Monitor 2:
   ├─ Monitor Type: HTTP(s)
   ├─ Friendly Name: SaaS App 2
   ├─ URL: https://saasapp2.yourname.com
   └─ ... (same as above)

   Repeat for all 4 apps

4. Configure alerts:
   - Settings → Alert Contacts
   - Add email: your@email.com
   - Verify email

   Alert threshold:
   - Notify when: down for 5 minutes
   - Re-notify: every 30 minutes until up
```

### Step 7.2: Install Self-Hosted Monitoring (Optional)

**Deploy Uptime Kuma via Dokploy:**

```
In Dokploy dashboard:

1. New Application
   ├─ Name: uptime-kuma
   ├─ Docker Image: louislam/uptime-kuma:1
   ├─ Port: 3001 (internal)
   ├─ Domain: status.yourname.com
   └─ Restart: always

2. Add to Cloudflare tunnel:
   nano ~/.cloudflared/config.yml

   Add:
   - hostname: status.yourname.com
     service: http://localhost:3001

3. Restart tunnel:
   sudo launchctl stop com.cloudflare.cloudflared
   sudo launchctl start com.cloudflare.cloudflared

4. Access: https://status.yourname.com

5. Configure monitors (same as UptimeRobot but self-hosted!)
```

### Step 7.3: Resource Monitoring

**Monitor Mac mini resources:**

```bash
# Create monitoring script
nano ~/monitor-resources.sh
```

**Add content:**

```bash
#!/bin/bash
# ~/monitor-resources.sh
# Monitors Mac mini resources and sends alerts

LOG_FILE="$HOME/resource-monitor.log"
ALERT_EMAIL="your@email.com"

# Get current resource usage
CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
MEMORY_PRESSURE=$(memory_pressure | grep "System-wide memory free percentage" | awk '{print $5}' | sed 's/%//')
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Get Docker stats
DOCKER_CONTAINERS=$(docker ps --format "{{.Names}}: CPU={{.CPUPerc}} MEM={{.MemUsage}}")

# Log timestamp and metrics
echo "$(date): CPU=${CPU_USAGE}% MEM_FREE=${MEMORY_PRESSURE}% DISK=${DISK_USAGE}%" >> "$LOG_FILE"

# Alert thresholds
if (( $(echo "$CPU_USAGE > 85" | bc -l) )); then
    echo "ALERT: High CPU usage: ${CPU_USAGE}%" | mail -s "Mac Mini Alert" "$ALERT_EMAIL"
fi

if (( $(echo "$MEMORY_PRESSURE < 20" | bc -l) )); then
    echo "ALERT: Low memory: ${MEMORY_PRESSURE}% free" | mail -s "Mac Mini Alert" "$ALERT_EMAIL"
fi

if (( $(echo "$DISK_USAGE > 85" | bc -l) )); then
    echo "ALERT: High disk usage: ${DISK_USAGE}%" | mail -s "Mac Mini Alert" "$ALERT_EMAIL"
fi

# Keep last 1000 lines of log
tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp"
mv "$LOG_FILE.tmp" "$LOG_FILE"
```

**Make executable and schedule:**

```bash
# Make executable
chmod +x ~/monitor-resources.sh

# Add to crontab (run every 5 minutes)
crontab -e

# Add line:
*/5 * * * * /Users/[YOUR-USERNAME]/monitor-resources.sh

# Verify crontab
crontab -l
```

### Step 7.4: Container Health Monitoring

**Create container watchdog:**

```bash
# Create watchdog script
nano ~/watchdog-containers.sh
```

**Add content:**

```bash
#!/bin/bash
# ~/watchdog-containers.sh
# Monitors containers and restarts if unhealthy

APPS=("projectpulse" "saasapp2" "saasapp3" "saasapp4")
LOG_FILE="$HOME/watchdog.log"

for app in "${APPS[@]}"; do
    # Check if container is running
    if ! docker ps | grep -q "$app"; then
        echo "$(date): $app is DOWN! Attempting restart..." >> "$LOG_FILE"
        docker start "$app"

        # Send alert
        echo "$app was down and restarted" | mail -s "Container Alert" your@email.com
    else
        # Check if responding to HTTP
        CONTAINER_PORT=$(docker port "$app" | head -1 | cut -d':' -f2)
        if ! curl -sf "http://localhost:$CONTAINER_PORT" > /dev/null; then
            echo "$(date): $app not responding! Restarting..." >> "$LOG_FILE"
            docker restart "$app"

            # Send alert
            echo "$app was unresponsive and restarted" | mail -s "Container Alert" your@email.com
        fi
    fi
done
```

**Make executable and schedule:**

```bash
chmod +x ~/watchdog-containers.sh

# Add to crontab (run every 5 minutes)
crontab -e

# Add:
*/5 * * * * /Users/[YOUR-USERNAME]/watchdog-containers.sh
```

### Step 7.5: Log Rotation

**Prevent logs from filling disk:**

```bash
# Create log rotation script
sudo nano /usr/local/bin/rotate-docker-logs.sh
```

**Add content:**

```bash
#!/bin/bash
# Rotate Docker logs to prevent disk fill

# Truncate logs for all containers
for container in $(docker ps -q); do
    log_file=$(docker inspect --format='{{.LogPath}}' "$container")
    if [ -f "$log_file" ]; then
        log_size=$(stat -f%z "$log_file" 2>/dev/null || echo 0)
        # If log > 50MB, truncate
        if [ "$log_size" -gt 52428800 ]; then
            truncate -s 0 "$log_file"
            echo "$(date): Truncated log for container $container" >> /var/log/docker-log-rotation.log
        fi
    fi
done
```

**Schedule via cron:**

```bash
sudo chmod +x /usr/local/bin/rotate-docker-logs.sh

# Add to root crontab (daily at 3am)
sudo crontab -e

# Add:
0 3 * * * /usr/local/bin/rotate-docker-logs.sh
```

---

## Phase 8: Remote Management

### Step 8.1: SSH Access from Phone/Laptop

**Configure SSH key authentication:**

```bash
# On your laptop/phone (using Termius or similar)
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your@email.com"

# Copy public key to Mac mini
# On Mac mini, create authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys

# Paste your public key
# Save and exit

# Set permissions
chmod 600 ~/.ssh/authorized_keys

# Test SSH from laptop
ssh yourusername@192.168.1.15

# Should connect without password! ✅
```

**Install Termius (mobile SSH client):**

```
iOS/Android:
1. Download Termius from App Store/Play Store (free)

2. Add host:
   - Alias: Mac Mini Portfolio
   - Hostname: 192.168.1.15
   - Port: 22
   - Username: [your-mac-username]
   - Key: [import your SSH private key]

3. Test connection

4. Now you can SSH from phone! 📱
```

### Step 8.2: Cloudflare Access (Secure SSH via Tunnel)

**For SSH access from anywhere without exposing port 22:**

```bash
# Add SSH to Cloudflare tunnel config
nano ~/.cloudflared/config.yml
```

**Add SSH service:**

```yaml
ingress:
  # ... existing app entries ...

  # SSH access (secure with Cloudflare Access!)
  - hostname: ssh.yourname.com
    service: ssh://localhost:22

  # ... catch-all rule ...
```

**Restart tunnel:**

```bash
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared
```

**Create DNS route:**

```bash
cloudflared tunnel route dns mac-mini-portfolio ssh.yourname.com
```

**Secure with Cloudflare Access (Zero Trust):**

```
1. In Cloudflare dashboard:
   - Go to Zero Trust
   - Access → Applications → Add Application

2. Configure:
   - Name: Mac Mini SSH
   - Session duration: 24 hours
   - Application domain: ssh.yourname.com

3. Add policy:
   - Policy name: SSH Access
   - Action: Allow
   - Include: Emails ending in: @yourdomain.com (your email)

4. Save

5. Now SSH via Cloudflare:
   cloudflared access ssh --hostname ssh.yourname.com

   Or configure SSH client:
   Add to ~/.ssh/config:

   Host mac-mini
     ProxyCommand cloudflared access ssh --hostname ssh.yourname.com
     User [your-username]

   Then connect:
   ssh mac-mini
```

### Step 8.3: Screen Sharing (VNC)

**Enable macOS Screen Sharing:**

```
1. On Mac mini:
   System Preferences → Sharing

2. Enable "Screen Sharing"
   - Allow access for: Only these users: [your-username]

3. Note VNC password (or set one)

4. Port 5900 is now open locally
```

**Access via VNC client:**

```
From local network:
- VNC Viewer app
- Connect to: 192.168.1.15:5900
- Enter password

From internet (via Cloudflare Tunnel):
- Add to tunnel config:
  - hostname: vnc.yourname.com
    service: tcp://localhost:5900

- Use Cloudflare WARP + Access
- Or use SSH tunnel:
  ssh -L 5900:localhost:5900 yourusername@192.168.1.15

  Then VNC to: localhost:5900
```

### Step 8.4: Emergency Commands

**Save these for quick access:**

```bash
# Restart all containers
docker restart $(docker ps -q)

# Restart Dokploy
cd ~/dokploy && docker compose restart

# Restart Cloudflare Tunnel
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared

# Check disk space
df -h

# Check memory
vm_stat

# Check CPU
top -l 1 | head -n 10

# View Docker logs
docker logs [container-name] --tail 100

# Restart specific app
docker restart projectpulse

# Nuclear option (restart everything)
sudo reboot
```

**Create emergency script:**

```bash
nano ~/emergency-restart.sh
```

**Content:**

```bash
#!/bin/bash
# Emergency restart script

echo "🚨 Emergency restart initiated..."

# Restart Cloudflare Tunnel
echo "Restarting Cloudflare Tunnel..."
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared

# Restart Dokploy
echo "Restarting Dokploy..."
cd ~/dokploy && docker compose restart

# Wait for Dokploy to be ready
sleep 10

# Restart all app containers
echo "Restarting all apps..."
docker restart $(docker ps -q | grep -v dokploy)

echo "✅ Emergency restart complete!"
echo "Check status: docker ps"
```

```bash
chmod +x ~/emergency-restart.sh

# Run when needed:
~/emergency-restart.sh
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Cloudflare Tunnel Not Connecting

**Symptoms:**
- `cloudflared` service not running
- Apps not accessible via public URLs
- Tunnel logs show connection errors

**Solution:**

```bash
# Check tunnel status
sudo launchctl list | grep cloudflared

# View logs
tail -f ~/.cloudflared/logs/cloudflared.log

# Restart tunnel
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared

# If still failing, check config
nano ~/.cloudflared/config.yml

# Verify:
# - Tunnel ID matches
# - Credentials file path correct
# - Hostnames match DNS records

# Test tunnel manually
cloudflared tunnel run mac-mini-portfolio
# (Look for connection errors)
```

#### Issue 2: App Not Responding (504 Gateway Timeout)

**Symptoms:**
- URL loads but returns 504 error
- Cloudflare shows "Error 504: Gateway Timeout"

**Solution:**

```bash
# Check if container is running
docker ps | grep [app-name]

# If not running, start it
docker start [app-name]

# Check container logs
docker logs [app-name] --tail 100

# Check if app is listening on correct port
docker exec [app-name] netstat -tuln | grep [port]

# Restart container
docker restart [app-name]

# If still failing, check Dokploy logs
docker logs dokploy --tail 100
```

#### Issue 3: Database Connection Failed

**Symptoms:**
- App starts but crashes immediately
- Logs show "Error: connect ECONNREFUSED"
- Database connection errors

**Solution:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs dokploy-postgres-1 --tail 100

# Test database connection
docker exec -it dokploy-postgres-1 psql -U postgres -c "\l"

# Verify connection string in app
# Should be:
# postgresql://postgres:[PASSWORD]@shared-postgres:5432/postgres?schema=[schema-name]

# Check if schema exists
docker exec -it dokploy-postgres-1 psql -U postgres -c "\dn"

# Restart database if needed
docker restart dokploy-postgres-1
```

#### Issue 4: High Memory Usage / Out of Memory

**Symptoms:**
- Mac mini feels slow
- Containers randomly crashing
- "Out of memory" errors in logs

**Solution:**

```bash
# Check memory usage
docker stats --no-stream

# Identify memory hog
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# Restart memory-hogging container
docker restart [container-name]

# Add memory limits to containers
# In Dokploy → App Settings → Resources:
# Memory Limit: 600MB per app

# Clear Docker cache
docker system prune -a
# (This removes unused images/containers)

# If still issues, reduce apps running simultaneously
# Or upgrade to more RAM
```

#### Issue 5: SSL Certificate Errors

**Symptoms:**
- Browser shows "Your connection is not private"
- SSL certificate warnings
- Mixed content errors

**Solution:**

```bash
# Check Cloudflare SSL mode
# In Cloudflare dashboard:
# SSL/TLS → Overview → Set to "Full (strict)"

# Ensure tunnel config has originRequest
nano ~/.cloudflared/config.yml

# Each service should have:
  - hostname: app.yourname.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true  # ← Important!

# Restart tunnel after changes
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared

# Force HTTPS redirect in Cloudflare
# SSL/TLS → Edge Certificates:
# - Always Use HTTPS: ON
# - Automatic HTTPS Rewrites: ON
```

#### Issue 6: DNS Not Resolving

**Symptoms:**
- URLs don't load
- "This site can't be reached"
- DNS_PROBE_FINISHED_NXDOMAIN

**Solution:**

```bash
# Check DNS records in Cloudflare
# Dashboard → DNS → Verify CNAME records exist

# Verify tunnel routes
cloudflared tunnel route dns mac-mini-portfolio [subdomain].yourname.com

# Test DNS resolution
dig projectpulse.yourname.com

# Should show:
# ANSWER SECTION:
# projectpulse.yourname.com. 300 IN CNAME [tunnel-id].cfargotunnel.com.

# If no CNAME, recreate route:
cloudflared tunnel route dns mac-mini-portfolio projectpulse.yourname.com

# Clear DNS cache (on your computer)
# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns
```

#### Issue 7: Slow Performance / High Latency

**Symptoms:**
- Pages take >5 seconds to load
- Slow API responses
- Apps feel sluggish

**Solution:**

```bash
# 1. Check Mac mini CPU/Memory
top -l 1 | head -n 10

# 2. Check Docker resource usage
docker stats

# 3. Optimize Docker Desktop
# Preferences → Resources:
# - Increase RAM to 6-7GB
# - Increase CPU to 3-4 cores

# 4. Enable caching
# Add Redis cache:
docker run -d --name redis \
  --restart always \
  -p 6379:6379 \
  redis:alpine

# 5. Check network speed
# Run speed test:
curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -

# 6. Enable Cloudflare caching
# In Cloudflare dashboard:
# Caching → Configuration:
# - Caching Level: Standard
# - Browser Cache TTL: 4 hours

# 7. Optimize Next.js builds
# In next.config.js:
module.exports = {
  output: 'standalone',
  compress: true,
  swcMinify: true,
}

# Rebuild apps with optimizations
```

#### Issue 8: Auto-Start Not Working After Reboot

**Symptoms:**
- Mac mini reboots
- Apps don't come back online
- Manual restart required

**Solution:**

```bash
# 1. Check Docker Desktop auto-start
# Docker Desktop → Preferences → General:
# ✅ Start Docker Desktop when you log in

# 2. Verify Cloudflare service
sudo launchctl list | grep cloudflared

# If not listed, reinstall service:
sudo cloudflared service install

# 3. Check container restart policies
docker inspect [container-name] | grep RestartPolicy

# Should show: "Name": "always"

# If not, update:
docker update --restart=always [container-name]

# 4. Ensure Dokploy compose has restart: always
cd ~/dokploy
nano docker-compose.yml

# All services should have:
restart: always

# Apply changes:
docker compose down
docker compose up -d

# 5. Test by rebooting
sudo reboot

# After reboot, verify:
docker ps  # All containers running
```

---

## Maintenance & Updates

### Weekly Maintenance

```bash
# Create weekly maintenance script
nano ~/weekly-maintenance.sh
```

**Content:**

```bash
#!/bin/bash
# Weekly maintenance script

echo "🔧 Starting weekly maintenance..."

# 1. Update Docker images
echo "Updating Docker images..."
docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>" | xargs -L1 docker pull

# 2. Clean up unused Docker resources
echo "Cleaning Docker..."
docker system prune -f --volumes

# 3. Check disk space
echo "Disk space:"
df -h /

# 4. Rotate logs
echo "Rotating logs..."
for container in $(docker ps -q); do
    log_file=$(docker inspect --format='{{.LogPath}}' "$container")
    if [ -f "$log_file" ]; then
        truncate -s 0 "$log_file"
    fi
done

# 5. Backup database
echo "Backing up database..."
docker exec dokploy-postgres-1 pg_dump -U postgres postgres > ~/backups/db-backup-$(date +%Y%m%d).sql

# Keep only last 7 days of backups
find ~/backups -name "db-backup-*.sql" -mtime +7 -delete

# 6. Check for Dokploy updates
echo "Checking for Dokploy updates..."
cd ~/dokploy
docker compose pull

# 7. Restart if updates available
if docker compose up -d; then
    echo "✅ Updates applied and restarted"
else
    echo "✅ No updates available"
fi

echo "✅ Weekly maintenance complete!"
```

**Schedule:**

```bash
chmod +x ~/weekly-maintenance.sh

# Add to crontab (every Sunday at 3am)
crontab -e

# Add:
0 3 * * 0 /Users/[YOUR-USERNAME]/weekly-maintenance.sh > /Users/[YOUR-USERNAME]/maintenance.log 2>&1
```

### Monthly Tasks

**Manual checks (first Sunday of month):**

```bash
# 1. Check macOS updates
# System Preferences → Software Update

# 2. Check Docker Desktop updates
# Docker Desktop → Check for Updates

# 3. Review monitoring logs
cat ~/resource-monitor.log | tail -n 1000

# 4. Review uptime reports
# UptimeRobot dashboard → View reports

# 5. Test backups (restore to test database)
docker exec -i dokploy-postgres-1 psql -U postgres -d postgres_test < ~/backups/db-backup-latest.sql

# 6. Review and update dependencies in apps
# (Git push triggers auto-deploy in Dokploy)

# 7. Check certificate expiry (Cloudflare auto-renews, but verify)
# Cloudflare dashboard → SSL/TLS → Edge Certificates

# 8. Review access logs for security issues
docker logs traefik --tail 1000 | grep -i "error\|unauthorized"
```

### Updating Applications

**Dokploy makes updates easy:**

```
1. Make code changes locally
2. Commit and push to GitHub:
   git add .
   git commit -m "Update: feature X"
   git push origin master

3. Dokploy detects push (if webhook configured)
   OR manually trigger deploy:
   - Dokploy dashboard → App → Deploy tab
   - Click "Deploy Latest"

4. Watch logs for deployment progress

5. New version live in ~2-5 minutes! ✅
```

**For immediate updates:**

```bash
# Rebuild specific app
docker exec dokploy dokploy deploy projectpulse

# Or restart with latest code
cd ~/dokploy
docker compose pull projectpulse
docker compose up -d projectpulse
```

---

## Migration to VPS (Future)

### When to Consider VPS

**Migrate to VPS if:**

- ✅ One app goes viral (>10,000 visitors/day)
- ✅ You land a job (can afford $9/mo)
- ✅ ISP changes terms (blocks self-hosting)
- ✅ Need 99.9% uptime SLA (professional)
- ✅ Want to shut down Mac mini
- ✅ Need better redundancy

### Migration Process

**Steps to migrate (when ready):**

```
1. Purchase VPS (Hostinger KVM 2)
   - Follow Black Friday guide
   - Or regular pricing: $8.99/mo

2. Install Dokploy on VPS:
   ssh root@vps-ip
   curl -sSL https://dokploy.com/install.sh | sh

3. Export databases from Mac mini:
   docker exec dokploy-postgres-1 pg_dump -U postgres postgres > backup.sql

4. Import to VPS:
   scp backup.sql root@vps-ip:/root/
   docker exec -i dokploy-postgres-1 psql -U postgres < /root/backup.sql

5. Deploy apps on VPS (same as Phase 5)
   - Use Dokploy dashboard
   - Point to same GitHub repos
   - Use same environment variables

6. Update DNS (switch traffic):
   In Cloudflare:
   - Change A records from tunnel to VPS IP
   - Wait for DNS propagation (5-30 min)

7. Verify VPS working:
   - Test all URLs
   - Check database connections
   - Monitor for 24 hours

8. Decommission Mac mini (optional):
   - Stop Cloudflare tunnel
   - Stop Docker containers
   - Keep as backup/dev environment

Total migration time: ~2 hours
Downtime: <5 minutes (DNS propagation)
```

### Cost Comparison After Migration

```
Current (Mac mini):
├─ VPS: $0/mo
├─ Electricity: ~$8/mo
├─ Domains: $4/mo (amortized)
└─ Total: ~$12/mo

After VPS migration:
├─ VPS: $8.99/mo
├─ Mac mini: Can shut down (save electricity)
├─ Domains: $4/mo
└─ Total: ~$13/mo

Difference: ~$1/mo ($12/year)
Benefits:
- Better uptime
- Professional infrastructure
- Can repurpose Mac mini
```

---

## Appendix

### Useful Commands Reference

```bash
# Docker
docker ps                          # List running containers
docker ps -a                       # List all containers
docker logs [container] -f         # Follow container logs
docker restart [container]         # Restart container
docker exec -it [container] bash   # Enter container shell
docker stats                       # Show resource usage
docker system prune -a             # Clean up everything

# Dokploy
docker logs dokploy -f             # View Dokploy logs
docker compose -f ~/dokploy/docker-compose.yml restart  # Restart Dokploy

# Cloudflare Tunnel
sudo launchctl list | grep cloudflared              # Check status
sudo launchctl stop com.cloudflare.cloudflared      # Stop tunnel
sudo launchctl start com.cloudflare.cloudflared     # Start tunnel
tail -f ~/.cloudflared/logs/cloudflared.log         # View logs
cloudflared tunnel info mac-mini-portfolio          # Tunnel info

# System
top -l 1                           # CPU usage snapshot
vm_stat                            # Memory stats
df -h                              # Disk usage
netstat -an | grep LISTEN          # Check open ports
lsof -i :[port]                    # Check what's using a port

# Database
docker exec -it dokploy-postgres-1 psql -U postgres  # Connect to DB
docker exec dokploy-postgres-1 pg_dump -U postgres postgres > backup.sql  # Backup
docker exec -i dokploy-postgres-1 psql -U postgres < backup.sql  # Restore

# Network
ping projectpulse.yourname.com     # Test connectivity
dig projectpulse.yourname.com      # DNS lookup
curl -I https://projectpulse.yourname.com  # Test HTTP
traceroute projectpulse.yourname.com  # Trace route

# Maintenance
brew update && brew upgrade        # Update Homebrew packages
brew upgrade cloudflared           # Update cloudflared
softwareupdate -l                  # Check macOS updates
```

### Environment Variables Template

```bash
# Save as .env.template (commit to repo)
# Copy to .env and fill in actual values (don't commit!)

# Database
DATABASE_URL="postgresql://postgres:PASSWORD@shared-postgres:5432/postgres?schema=SCHEMA_NAME"

# App URLs
NEXT_PUBLIC_APP_URL="https://yourapp.yourname.com"

# Node environment
NODE_ENV="production"

# Feature flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_ERROR_REPORTING="true"

# API keys (if needed)
# OPENAI_API_KEY="sk-..."
# STRIPE_SECRET_KEY="sk_test_..."
# SENDGRID_API_KEY="SG..."

# Auth secrets (if using NextAuth)
# NEXTAUTH_URL="https://yourapp.yourname.com"
# NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Optional: Redis cache
# REDIS_URL="redis://localhost:6379"

# Optional: S3 storage
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."
# AWS_S3_BUCKET="..."
# AWS_REGION="us-east-1"
```

### Dokploy docker-compose.yml

```yaml
# ~/dokploy/docker-compose.yml
# Base Dokploy configuration

version: '3.8'

services:
  dokploy:
    image: dokploy/dokploy:latest
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - dokploy-data:/app/data
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/dokploy
    depends_on:
      - postgres
    networks:
      - dokploy-network

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_DB=dokploy
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - dokploy-network

  traefik:
    image: traefik:v2.10
    restart: always
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - dokploy-network

networks:
  dokploy-network:
    driver: bridge

volumes:
  dokploy-data:
  postgres-data:
```

### Cloudflare Tunnel Complete Config

```yaml
# ~/.cloudflared/config.yml
# Complete Cloudflare Tunnel configuration

# Replace [TUNNEL-ID] with your actual tunnel ID
# Replace [YOUR-USERNAME] with your Mac username
# Replace yourname.com with your actual domain

tunnel: [TUNNEL-ID]
credentials-file: /Users/[YOUR-USERNAME]/.cloudflared/[TUNNEL-ID].json

# Logging
logDirectory: /Users/[YOUR-USERNAME]/.cloudflared/logs
loglevel: info

# Metrics (optional - for monitoring)
metrics: localhost:2000

# Ingress rules (order matters - specific before catch-all)
ingress:
  # ProjectPulse - Main SaaS app
  - hostname: projectpulse.yourname.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      keepAliveTimeout: 90s

  # SaaS App 2
  - hostname: saasapp2.yourname.com
    service: http://localhost:3002
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      keepAliveTimeout: 90s

  # SaaS App 3
  - hostname: saasapp3.yourname.com
    service: http://localhost:3003
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      keepAliveTimeout: 90s

  # SaaS App 4
  - hostname: saasapp4.yourname.com
    service: http://localhost:3004
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      keepAliveTimeout: 90s

  # Optional: Dokploy admin panel (secure with Cloudflare Access!)
  - hostname: admin.yourname.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true

  # Optional: Uptime Kuma status page
  - hostname: status.yourname.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # Optional: SSH access (secure with Cloudflare Access!)
  - hostname: ssh.yourname.com
    service: ssh://localhost:22

  # Catch-all rule (required - must be last)
  - service: http_status:404
```

### Backup Script

```bash
#!/bin/bash
# ~/backup.sh
# Complete backup script for all data

BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup at $(date)"

# 1. Backup PostgreSQL database
echo "Backing up database..."
docker exec dokploy-postgres-1 pg_dump -U postgres postgres > "$BACKUP_DIR/db-$DATE.sql"

# 2. Backup Docker volumes
echo "Backing up Docker volumes..."
docker run --rm \
  -v dokploy-data:/data \
  -v "$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/dokploy-data-$DATE.tar.gz" -C /data .

# 3. Backup Cloudflare config
echo "Backing up Cloudflare config..."
cp -r ~/.cloudflared "$BACKUP_DIR/cloudflared-$DATE"

# 4. Backup Dokploy config
echo "Backing up Dokploy config..."
cp -r ~/dokploy "$BACKUP_DIR/dokploy-$DATE"

# 5. Compress everything
echo "Compressing backups..."
tar czf "$BACKUP_DIR/complete-backup-$DATE.tar.gz" \
  "$BACKUP_DIR/db-$DATE.sql" \
  "$BACKUP_DIR/dokploy-data-$DATE.tar.gz" \
  "$BACKUP_DIR/cloudflared-$DATE" \
  "$BACKUP_DIR/dokploy-$DATE"

# 6. Clean up individual files
rm -rf "$BACKUP_DIR/db-$DATE.sql" \
  "$BACKUP_DIR/dokploy-data-$DATE.tar.gz" \
  "$BACKUP_DIR/cloudflared-$DATE" \
  "$BACKUP_DIR/dokploy-$DATE"

# 7. Keep only last 7 days of backups
find "$BACKUP_DIR" -name "complete-backup-*.tar.gz" -mtime +7 -delete

# 8. Optional: Upload to cloud storage
# aws s3 cp "$BACKUP_DIR/complete-backup-$DATE.tar.gz" s3://your-bucket/backups/

echo "✅ Backup complete: $BACKUP_DIR/complete-backup-$DATE.tar.gz"
echo "Backup size: $(du -h "$BACKUP_DIR/complete-backup-$DATE.tar.gz" | cut -f1)"
```

**Schedule backups:**

```bash
chmod +x ~/backup.sh

# Daily at 2am
crontab -e
# Add:
0 2 * * * /Users/[YOUR-USERNAME]/backup.sh >> /Users/[YOUR-USERNAME]/backup.log 2>&1
```

---

## Support & Resources

### Official Documentation

- **Dokploy**: https://docs.dokploy.com/
- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Docker**: https://docs.docker.com/
- **Next.js**: https://nextjs.org/docs

### Community

- **Dokploy Discord**: https://discord.gg/dokploy
- **Cloudflare Community**: https://community.cloudflare.com/
- **Docker Forums**: https://forums.docker.com/

### Troubleshooting Help

If you encounter issues:

1. **Check logs first**:
   ```bash
   # App logs
   docker logs [container-name] --tail 100

   # Tunnel logs
   tail -f ~/.cloudflared/logs/cloudflared.log

   # System logs
   log show --predicate 'process == "Docker"' --last 10m
   ```

2. **Search for error messages**:
   - Copy exact error text
   - Google: "[error text] docker" or "[error text] cloudflare tunnel"
   - Check GitHub issues for known problems

3. **Ask Claude Code**:
   - Share error logs
   - Describe what you were doing when error occurred
   - I'll help debug!

4. **Community support**:
   - Post in Dokploy Discord
   - Ask on Cloudflare Community
   - Stack Overflow with relevant tags

---

## Phase 9: Upgrading to Custom Domain (Later)

**This phase is for Path A users who want to add custom domains later.**

If you started with free URLs and now want professional custom domains, follow these steps!

### When to Upgrade

**Good times to upgrade:**
- ✅ After landing a job (can afford $46)
- ✅ Before major job applications (more professional)
- ✅ Black Friday sales (save money!)
- ✅ When sharing portfolio widely (easier to remember)
- ✅ When you want custom email (contact@yourname.com)

**No rush if:**
- ❌ Still job hunting on tight budget
- ❌ Free URLs working fine for you
- ❌ Not sharing portfolio widely yet

### Step 9.1: Purchase Domains

**Follow Phase 1B.1 to purchase domains:**
- yourname.com (~$30 for 5 years)
- yourname.dev (~$16 for 2 years)

Total: ~$46

### Step 9.2: Add to Cloudflare

**Follow Phase 1B.2 to add domains to Cloudflare:**
- Point nameservers to Cloudflare
- Wait for DNS propagation (5-30 min)

### Step 9.3: Update Tunnel Configuration

**Edit your existing tunnel config:**

```bash
# Stop tunnel first
sudo launchctl stop com.cloudflare.cloudflared

# Edit config
nano ~/.cloudflared/config.yml
```

**Replace FREE URL config with CUSTOM DOMAIN config:**

**Before (Free URLs):**
```yaml
ingress:
  - service: http://localhost:3001
```

**After (Custom Domains):**
```yaml
ingress:
  # ProjectPulse
  - hostname: projectpulse.yourname.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # SaaS App 2
  - hostname: saasapp2.yourname.com
    service: http://localhost:3002
    originRequest:
      noTLSVerify: true

  # SaaS App 3
  - hostname: saasapp3.yourname.com
    service: http://localhost:3003
    originRequest:
      noTLSVerify: true

  # SaaS App 4
  - hostname: saasapp4.yourname.com
    service: http://localhost:3004
    originRequest:
      noTLSVerify: true

  # Catch-all (required)
  - service: http_status:404
```

Save file: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 9.4: Create DNS Records

```bash
# Route each subdomain through the tunnel
cloudflared tunnel route dns mac-mini-portfolio projectpulse.yourname.com
cloudflared tunnel route dns mac-mini-portfolio saasapp2.yourname.com
cloudflared tunnel route dns mac-mini-portfolio saasapp3.yourname.com
cloudflared tunnel route dns mac-mini-portfolio saasapp4.yourname.com
```

### Step 9.5: Restart Tunnel

```bash
# Restart tunnel with new config
sudo launchctl start com.cloudflare.cloudflared

# Verify it's running
sudo launchctl list | grep cloudflared

# Check logs
tail -f ~/.cloudflared/logs/cloudflared.log
```

### Step 9.6: Update Environment Variables

**For each app in Dokploy:**

```
1. Go to Dokploy dashboard
2. Click on each app
3. Go to Environment Variables tab
4. Update NEXT_PUBLIC_APP_URL:

   Old: https://careful-horse-1234.trycloudflare.com
   New: https://projectpulse.yourname.com

5. Click "Save"
6. Click "Redeploy" (rebuilds with new env var)

Repeat for all 4 apps.
```

### Step 9.7: Test New URLs

```bash
# Test each custom domain
curl -I https://projectpulse.yourname.com
curl -I https://saasapp2.yourname.com
curl -I https://saasapp3.yourname.com
curl -I https://saasapp4.yourname.com

# All should return: HTTP/2 200 ✅
```

### Step 9.8: Update Your Resume/Portfolio

**Old URLs (free):**
```
Portfolio: https://careful-horse-1234.trycloudflare.com
```

**New URLs (custom):**
```
Portfolio: https://projectpulse.yourname.com
```

**Update everywhere:**
- ✅ Resume
- ✅ LinkedIn
- ✅ GitHub profile README
- ✅ Portfolio landing page
- ✅ Email signature

### Step 9.9: Done!

**Upgrade complete!** 🎉

**What changed:**
- ✅ Professional URLs
- ✅ Memorable addresses
- ✅ Custom branding
- ✅ Ready for custom email

**What stayed the same:**
- ✅ Same apps
- ✅ Same performance
- ✅ Same hosting (Mac mini)
- ✅ Still $0/month hosting cost

**Total upgrade time:** ~15 minutes
**Downtime:** ~2 minutes (during tunnel restart)

**Old free URLs still work** for a few days (Cloudflare caches), so no broken links immediately!

---

## Conclusion

**You now have:**

✅ Professional self-hosted infrastructure
✅ 4 SaaS applications live on internet
✅ Free hosting (vs $333/year VPS)
✅ Auto-start after reboots
✅ Monitoring and alerts
✅ Remote management from anywhere
✅ Backup automation
✅ Migration path to VPS when needed

**Total setup time:** ~45 minutes

**Total cost:**
- **Path A (Free URLs):** $0 upfront, $0/month hosting ✅
- **Path B (Custom Domain):** $46 upfront (domains), $0/month hosting
- **Path C (Hybrid):** $0 now, $46 later when ready

**Learning value:** ⭐⭐⭐⭐⭐ Maximum!

**Resume bullet (Path A - Free URLs):**
> "Designed and deployed self-hosted production infrastructure using Docker, Cloudflare Zero Trust tunnel architecture, and automated CI/CD via Dokploy. Implemented monitoring, auto-recovery, and backup systems achieving 99%+ uptime while reducing hosting costs to $0/month (100% savings vs $333/year cloud VPS)."

**Resume bullet (Path B - Custom Domain):**
> "Architected and deployed professional portfolio infrastructure on self-hosted Mac mini server with custom domain (yourname.com), Cloudflare CDN, automated SSL, and Docker containerization. Achieved 99%+ uptime with auto-recovery systems while saving $333/year vs traditional VPS hosting."

**Next session:** We'll execute this guide step-by-step together! 🚀

---

**Last updated:** 2025-11-12
**Version:** 2.0 (FREE URL EDITION)
**Maintained by:** Claude Code + You
**Questions?** Bring them to next session!

---

## 🎯 Quick Start Summary

**Following Path A (Free URLs - Recommended)?**

Your journey:
1. ✅ Phase 1A: Create free Cloudflare account (2 min)
2. ✅ Phase 2: Install Docker Desktop (10 min)
3. ✅ Phase 3: Set up Cloudflare Tunnel - Path A (10 min)
4. ✅ Phase 4: Install Dokploy (10 min)
5. ✅ Phase 5: Deploy your 4 apps (15 min)
6. ✅ Phase 6: Configure auto-start (5 min)
7. ✅ Phase 7: Set up monitoring (optional, 5 min)
8. 🎉 **DONE! Portfolio live with $0 cost!**

**Want custom domain later?** Follow Phase 9 (15 min upgrade)

**Total time:** 45 minutes | **Total cost:** $0
