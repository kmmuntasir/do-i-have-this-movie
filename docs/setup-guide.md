# Setup Guide

This guide will help you configure the "Do I Have This Movie?" extension to connect with your Jellyfin media server.

## Step 1: Get Your Jellyfin Server URL

Your Jellyfin server URL is the address where your Jellyfin instance is accessible. It typically looks like:

### Common URL Formats

| Scenario | Example URL |
|----------|-------------|
| Localhost (same machine) | `http://localhost:8096` |
| Local network | `http://192.168.1.100:8096` |
| Remote access | `https://jellyfin.example.com` |
| Custom domain | `https://media.mydomain.com` |

### Finding Your Server URL

1. **If running locally:**
   - Check your Jellyfin configuration for the listening port (default: 8096)
   - Use `localhost` if browsing on the same machine
   - Use your local IP address if browsing from another device on your network

2. **If on a local network:**
   - Find your server's IP address (e.g., 192.168.1.100)
   - Include the port number if not using the default (8096)

3. **If accessible via internet:**
   - Use your configured domain name or public IP
   - Ensure HTTPS is properly configured for security

### Important Notes

- **Protocol is required:** Always include `http://` or `https://`
- **No trailing slashes:** Do not end with `/` (e.g., `http://localhost:8096/` is incorrect)
- **Port is required:** Include the port number if not using standard HTTP/HTTPS ports
- **Accessibility:** Ensure your Jellyfin server is accessible from the browser where you're using the extension

### Network Configuration

If your Jellyfin server is not accessible:

1. **Localhost access:**
   - Ensure Jellyfin is running
   - Check firewall settings on your machine
   - Verify the port is not blocked

2. **Local network access:**
   - Ensure your devices are on the same network
   - Check your router's firewall settings
   - Verify the server's IP address

3. **Remote access:**
   - Configure port forwarding on your router
   - Set up a reverse proxy (recommended for security)
   - Use HTTPS to encrypt traffic

## Step 2: Generate an API Key

The extension requires an API key to communicate with your Jellyfin server.

### Creating an API Key

1. Log in to your Jellyfin web dashboard
2. Navigate to **Settings** → **API Keys** (or **Dashboard** → **API Keys**)
3. Click the **"Add API Key"** button
4. Enter a descriptive name (e.g., "Chrome Extension", "Do I Have This Movie?")
5. Click **"Save"**
6. Copy the generated API key immediately - you won't be able to see it again!

### API Key Security

- Keep your API key confidential
- Don't share it publicly or commit it to version control
- You can revoke and regenerate keys if needed
- Consider creating separate keys for different applications

### Testing Your API Key

You can verify your API key works by making a test request:

```bash
curl -X GET "http://localhost:8096/Users" \
  -H "X-MediaBrowser-Token: YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual API key and adjust the URL to match your server.

## Step 3: Configure the Extension

Once you have your server URL and API key, configure the extension:

1. Click the extension icon in your Chrome toolbar
2. Enter your **Jellyfin Server URL** in the first field
3. Enter your **API Key** in the second field
4. Click **"Save Settings"**

### Configuration Validation

After saving, the extension will:

- Validate the server URL format
- Test the connection to your Jellyfin server
- Verify the API key is valid
- Cache your library for faster lookups

### Troubleshooting Configuration

#### Connection Failed

If you see a connection error:

1. Verify your server URL is correct and accessible
2. Check that your Jellyfin server is running
3. Ensure your API key is valid
4. Check browser console for error messages (F12)

#### Invalid API Key

If you receive an invalid API key error:

1. Double-check you copied the entire key
2. Generate a new API key in Jellyfin
3. Ensure the key hasn't been revoked
4. Verify you're using the correct server

#### CORS Errors

If you encounter CORS (Cross-Origin Resource Sharing) errors:

1. Check your Jellyfin server configuration
2. Ensure CORS is enabled for Chrome extensions
3. Verify your network allows extension requests

## Step 4: Verify the Setup

After configuring the extension:

1. Visit a supported website (Netflix, IMDb, or YTS.bz)
2. Navigate to a movie or TV show listing
3. Look for the **"✓ In Library"** badge next to titles you own
4. Try browsing different pages to ensure dynamic detection works

### Testing with Known Content

For initial testing:

1. Pick a movie you know is in your Jellyfin library
2. Search for it on IMDb or another supported site
3. Verify the badge appears correctly
4. Try a movie you know is NOT in your library to confirm the badge doesn't appear

## Advanced Configuration

### Custom Badge Appearance

The extension uses default badge styling, but you can customize it by modifying the CSS in [`content.css`](../content.css).

### Multiple Jellyfin Servers

Currently, the extension supports a single Jellyfin server configuration. For multiple servers:

1. Use the server with the most comprehensive library
2. Consider setting up a combined library view in Jellyfin
3. Submit a feature request for multi-server support

### Library Refresh

The extension caches your library for performance. To refresh:

1. Open the extension popup
2. Click "Refresh Library" (if available)
3. Or reload the extension from `chrome://extensions/`

## Next Steps

Once configured, the extension will automatically work as you browse. For more information, see:

- [Architecture Overview](./architecture.md) - Understand how the extension works
- [Troubleshooting Guide](./troubleshooting.md) - Resolve common issues
- [Adding New Websites](./adding-new-websites.md) - Extend support to more platforms
