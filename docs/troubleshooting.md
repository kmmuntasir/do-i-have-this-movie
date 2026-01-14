# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the "Do I Have This Movie?" Chrome extension.

## Table of Contents

- [General Troubleshooting Steps](#general-troubleshooting-steps)
- [Badges Not Appearing](#badges-not-appearing)
- [API Connection Failures](#api-connection-failures)
- [Incorrect Server URL Format](#incorrect-server-url-format)
- [Permission Issues](#permission-issues)
- [Performance Issues](#performance-issues)
- [Website-Specific Issues](#website-specific-issues)
- [Getting Help](#getting-help)

## General Troubleshooting Steps

Before diving into specific issues, try these general troubleshooting steps:

### 1. Check Browser Console

The browser console often provides detailed error messages:

1. Open the browser console: Press `F12` or right-click → Inspect → Console
2. Look for red error messages
3. Note any error messages related to the extension

### 2. Verify Extension Status

Ensure the extension is properly loaded and enabled:

1. Go to `chrome://extensions/`
2. Find "Do I Have This Movie?" in the list
3. Verify the toggle switch is ON (blue)
4. Check for any error messages displayed on the extension card

### 3. Reload the Extension

Sometimes a simple reload fixes issues:

1. Go to `chrome://extensions/`
2. Click the refresh button on the extension card
3. Reload the webpage you're testing on

### 4. Clear Browser Cache

Cached data can sometimes cause issues:

1. Open Chrome settings
2. Navigate to Privacy and security → Clear browsing data
3. Select "Cached images and files"
4. Click Clear data

### 5. Check Extension Settings

Verify your configuration is correct:

1. Click the extension icon in the toolbar
2. Verify your Jellyfin server URL is correct
3. Verify your API key is valid
4. Click "Save Settings" if needed

## Badges Not Appearing

### Symptoms

- No badges appear on any website
- Badges appear on some websites but not others
- Badges appeared before but stopped working

### Possible Causes

| Cause | Description |
|-------|-------------|
| Extension not configured | Server URL or API key not set |
| Jellyfin server not accessible | Server is down or unreachable |
| API key invalid or expired | Key was revoked or has expired |
| Website structure changed | Website updated DOM structure |
| Extension disabled | Extension was accidentally disabled |
| Content script error | JavaScript error in content script |

### Solutions

#### 1. Verify Extension Configuration

1. Click the extension icon
2. Check that both server URL and API key are filled
3. Ensure server URL format is correct (see [Incorrect Server URL Format](#incorrect-server-url-format))
4. Click "Save Settings"

#### 2. Test Jellyfin Server Accessibility

Open your Jellyfin server URL in a new tab:

```bash
# Example
http://localhost:8096
```

If the page doesn't load:
- Check that Jellyfin is running
- Verify the server URL is correct
- Check network/firewall settings
- Ensure the port is correct (default: 8096)

#### 3. Verify API Key Validity

Test your API key with a REST client or curl:

```bash
curl -X GET "http://localhost:8096/Users" \
  -H "X-MediaBrowser-Token: YOUR_API_KEY"
```

If you get an error:
- Generate a new API key in Jellyfin
- Update the extension settings with the new key
- Ensure the key hasn't been revoked

#### 4. Refresh the Page

Sometimes the content script needs to reload:

1. Refresh the webpage (F5 or Ctrl+R)
2. If that doesn't work, try a hard refresh (Ctrl+Shift+R)
3. Navigate to a different page and back

#### 5. Check Browser Console for Errors

1. Open the console (F12)
2. Look for error messages from the extension
3. Common errors include:
   - `Cannot read property of undefined`
   - `Failed to fetch`
   - `Network error`

#### 6. Verify Website Support

Check if the website is supported:

| Website | Status |
|---------|--------|
| Netflix | ✅ Fully Supported |
| IMDb | ✅ Fully Supported |
| YTS.bz | ✅ Fully Supported |
| Letterboxd | ⚠️ Partially Implemented |

If the website isn't supported, badges won't appear.

#### 7. Test with Known Content

1. Pick a movie you know is in your Jellyfin library
2. Search for it on a supported website
3. Verify the badge appears
4. Try a movie you know is NOT in your library
5. Verify the badge does NOT appear

## API Connection Failures

### Symptoms

- "Connection failed" error in popup
- Console shows network errors
- Badges never appear even with correct configuration

### Possible Causes

| Cause | Description |
|-------|-------------|
| Incorrect server URL format | Missing protocol or wrong format |
| CORS restrictions | Server doesn't allow cross-origin requests |
| Network/firewall blocking | Connection blocked by network or firewall |
| Server offline | Jellyfin server is not running |
| Wrong port | Incorrect port number in URL |

### Solutions

#### 1. Verify Server URL Format

Ensure your server URL includes the protocol:

```javascript
// ❌ Incorrect formats
localhost:8096
192.168.1.100
jellyfin.example.com

// ✅ Correct formats
http://localhost:8096
http://192.168.1.100:8096
https://jellyfin.example.com
```

#### 2. Check CORS Configuration

Jellyfin must allow CORS requests from Chrome extensions:

1. Open Jellyfin dashboard
2. Navigate to Settings → Networking
3. Ensure "Enable CORS" is checked
4. Add `chrome-extension://*` to allowed origins if needed
5. Restart Jellyfin server

#### 3. Test Network Connectivity

Test if you can reach the server:

```bash
# Test with ping
ping localhost

# Test with curl
curl -I http://localhost:8096

# Test with telnet
telnet localhost 8096
```

If connection fails:
- Check firewall settings
- Ensure Jellyfin is running
- Verify the correct port is being used
- Check network configuration

#### 4. Check Firewall Settings

Ensure your firewall allows connections:

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Allow an app through firewall
3. Find Jellyfin and ensure both private and public networks are checked

**Linux Firewall (ufw):**
```bash
sudo ufw allow 8096/tcp
```

**macOS Firewall:**
1. System Preferences → Security & Privacy → Firewall
2. Click Firewall Options
3. Ensure Jellyfin is allowed

#### 5. Verify Jellyfin Server Status

Check if Jellyfin is running:

```bash
# Check if process is running
ps aux | grep jellyfin

# Check if port is listening
netstat -an | grep 8096
```

If not running:
- Start Jellyfin server
- Check Jellyfin logs for errors
- Verify Jellyfin configuration

#### 6. Test with Reverse Proxy

If using a reverse proxy (nginx, Apache, etc.):

1. Test the proxy URL directly in browser
2. Check proxy configuration
3. Verify proxy is forwarding requests correctly
4. Check proxy logs for errors

## Incorrect Server URL Format

### Common Mistakes

| Mistake | Example | Why It's Wrong |
|---------|---------|----------------|
| Missing protocol | `localhost:8096` | Browser doesn't know HTTP vs HTTPS |
| Trailing slash | `http://localhost:8096/` | Can cause path issues |
| Missing port | `192.168.1.100` | Default HTTP port (80) may not be correct |
| Wrong protocol | `https://localhost:8096` | Localhost typically uses HTTP |

### Correct Format Examples

| Scenario | Correct URL |
|----------|-------------|
| Localhost (same machine) | `http://localhost:8096` |
| Local network | `http://192.168.1.100:8096` |
| Remote with HTTPS | `https://jellyfin.example.com` |
| Remote with custom port | `https://jellyfin.example.com:8443` |

### URL Format Rules

1. **Always include protocol:** `http://` or `https://`
2. **No trailing slashes:** End with hostname or port, not `/`
3. **Include port if not standard:** Specify port if not 80 (HTTP) or 443 (HTTPS)
4. **Use HTTPS for remote:** Always use HTTPS for remote access

### Testing Your URL

Test your URL in a browser before entering it in the extension:

1. Open a new tab
2. Enter your Jellyfin server URL
3. Verify the Jellyfin web interface loads
4. Check the URL in the address bar
5. Copy and paste into extension settings

## Permission Issues

### Symptoms

- Extension can't access website content
- Console shows permission errors
- Badges don't appear on specific websites

### Possible Causes

| Cause | Description |
|-------|-------------|
| Missing host permissions | Website not listed in manifest |
| Incognito mode | Extension not allowed in incognito |
| Extension disabled | Extension was disabled |
| Content script blocked | Website blocks content scripts |

### Solutions

#### 1. Check Manifest Permissions

Verify [`manifest.json`](../manifest.json) includes the website:

```json
{
  "host_permissions": [
    "https://www.netflix.com/*",
    "https://www.imdb.com/*",
    "https://yts.bz/*"
  ]
}
```

If a website is missing:
- Add it to `host_permissions`
- Rebuild the extension: `npm run build`
- Reload the extension in Chrome

#### 2. Check Incognito Mode

If you're in incognito mode:

1. Go to `chrome://extensions/`
2. Find "Do I Have This Movie?"
3. Click "Details"
4. Check "Allow in incognito"
5. Reload the incognito window

#### 3. Verify Extension is Enabled

1. Go to `chrome://extensions/`
2. Find "Do I Have This Movie?"
3. Ensure the toggle is ON (blue)
4. If disabled, enable it

#### 4. Check Website Blocking

Some websites block content scripts:

1. Open browser console (F12)
2. Look for CSP (Content Security Policy) errors
3. Check if the website explicitly blocks extensions

If blocked:
- The extension may not work on that website
- Consider using a different supported website

## Performance Issues

### Symptoms

- Page loads slowly with extension enabled
- High CPU usage
- Browser becomes unresponsive
- Badges take a long time to appear

### Possible Causes

| Cause | Description |
|-------|-------------|
| Large library | Jellyfin library has many items |
- Many elements on page | Page has 100+ movie cards |
- No rate limiting | Too many API calls |
- No caching | Repeated API calls for same items |

### Solutions

#### 1. Reduce Library Size

If your Jellyfin library is very large:

1. Consider creating separate libraries
2. Use the library with fewer items for testing
3. Implement library filtering (future enhancement)

#### 2. Test on Pages with Fewer Elements

Test on pages with fewer movie cards:

1. Visit a page with 10-20 items
2. Verify badges appear quickly
3. If it works, the issue is with large pages

#### 3. Check Network Activity

Monitor network requests:

1. Open DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Look for excessive API calls

If there are too many:
- This is expected behavior (no rate limiting yet)
- Will be improved in future updates

#### 4. Disable Extension Temporarily

Test if the extension is causing the issue:

1. Go to `chrome://extensions/`
2. Disable "Do I Have This Movie?"
3. Reload the page
4. If performance improves, the extension is the cause

## Website-Specific Issues

### Netflix

#### Issue: Badges not appearing on Netflix

**Solutions:**
1. Ensure you're on `netflix.com` (not a regional variant)
2. Refresh the page
3. Try navigating to a different title
4. Check console for errors

#### Issue: Badges in wrong position

**Solutions:**
1. This is a known limitation
2. Netflix's DOM structure changes frequently
3. Report the issue on GitHub

### IMDb

#### Issue: Badges not appearing on IMDb

**Solutions:**
1. Ensure you're on `imdb.com`
2. Try different IMDb pages (search, title, list)
3. Check console for errors
4. Verify your library contains the titles

#### Issue: Wrong year extracted

**Solutions:**
1. This can happen with IMDb's complex structure
2. The extension uses the hero section year
3. May not work correctly on all IMDb pages

### YTS.bz

#### Issue: Badges not appearing on YTS

**Solutions:**
1. Ensure you're on `yts.bz`
2. Try the main page and individual movie pages
3. Check console for errors
4. Verify your library contains the titles

#### Issue: Badges on related movies not working

**Solutions:**
1. This is a known limitation
2. Related movies section has complex structure
3. Will be improved in future updates

### Letterboxd

#### Issue: Badges not appearing on Letterboxd

**Status:** Letterboxd support is partially implemented

**Current Limitations:**
- Basic detection may not work
- No full adapter implementation yet

**Solutions:**
- This is a known issue
- Will be completed in future updates
- See [Future Enhancements](./future-enhancements.md)

## Getting Help

### Report an Issue

If you can't resolve your issue:

1. **Check existing issues:**
   - Visit the [GitHub Issues page](https://github.com/kmmuntasir/do-i-have-this-movie/issues)
   - Search for similar issues

2. **Gather information:**
   - Chrome version
   - Extension version
   - Website where issue occurs
   - Steps to reproduce
   - Console error messages (screenshots preferred)
   - Your Jellyfin server version

3. **Create a new issue:**
   - Use the issue template (if available)
   - Provide all gathered information
   - Be as specific as possible

### Debug Mode

Enable debug mode for more detailed logging:

1. Open browser console (F12)
2. The extension logs detailed information
3. Look for messages starting with `[Do I Have This Movie?]`

### Community Support

- **GitHub Issues:** Report bugs and request features
- **GitHub Discussions:** Ask questions and share ideas
- **Documentation:** Check other documentation files for help

### Documentation

For more information, see:

- [Installation Guide](./installation.md) - Installation instructions
- [Setup Guide](./setup-guide.md) - Configuration help
- [Architecture Overview](./architecture.md) - Understanding how it works
- [Build Process](./build-process.md) - Build and development help

## Common Error Messages

### "Failed to fetch"

**Cause:** Network error or CORS issue

**Solutions:**
1. Check Jellyfin server is running
2. Verify server URL is correct
3. Check CORS configuration
4. Test network connectivity

### "Cannot read property of undefined"

**Cause:** JavaScript error in content script

**Solutions:**
1. Check console for full error details
2. Reload the page
3. Reload the extension
4. Report the issue with full error details

### "Extension not configured"

**Cause:** Server URL or API key not set

**Solutions:**
1. Click extension icon
2. Enter server URL and API key
3. Click "Save Settings"

### "Invalid API key"

**Cause:** API key is invalid or expired

**Solutions:**
1. Generate a new API key in Jellyfin
2. Update extension settings
3. Ensure key is copied correctly

### "Network error"

**Cause:** Connection to Jellyfin failed

**Solutions:**
1. Check Jellyfin server is running
2. Verify server URL is correct
3. Check network/firewall settings
4. Test server URL in browser

## Preventive Measures

To avoid common issues:

1. **Keep extension updated:** Regularly check for updates
2. **Keep Jellyfin updated:** Use the latest stable version
3. **Use HTTPS:** For remote access, always use HTTPS
4. **Generate new API keys:** Periodically regenerate for security
5. **Monitor console:** Check for errors regularly
6. **Test after changes:** Test extension after Jellyfin updates

---

**Last Updated:** 2026-01-14
**Extension Version:** 1.0.0
