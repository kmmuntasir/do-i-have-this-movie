// Opt-in sync of source settings through the user's Chrome account.
// `chrome.storage.local.sources` stays the working copy everywhere else; this
// module mirrors it to `chrome.storage.sync`. The Local Files source is never
// synced: its folder access and file index belong to one device.

const KEY = 'sources';

const withoutLocal = (sources = {}) => {
  const { local, ...rest } = sources;
  return rest;
};

export async function isSyncEnabled() {
  const { syncEnabled } = await chrome.storage.local.get('syncEnabled');
  return syncEnabled === true;
}

/** Mirror local settings to the account. No-op unless the user opted in. */
export async function pushSources(sources) {
  if (!(await isSyncEnabled())) return;
  await chrome.storage.sync.set({ [KEY]: withoutLocal(sources) });
}

/** Copy account settings into local storage, keeping this device's Local Files config. */
export async function pullSources() {
  if (!(await isSyncEnabled())) return false;
  const remote = (await chrome.storage.sync.get(KEY))[KEY];
  if (!remote) return false;
  const local = (await chrome.storage.local.get(KEY))[KEY] || {};
  const merged = { ...remote, ...(local.local ? { local: local.local } : {}) };
  if (JSON.stringify(merged) === JSON.stringify(local)) return false; // also stops sync/local echo loops
  await chrome.storage.local.set({ [KEY]: merged });
  return true;
}

/**
 * Turn sync on or off. Turning on pulls existing account settings, or uploads
 * this device's settings if the account has none. Turning off deletes the copy
 * from the account.
 * @returns {Promise<'pulled'|'pushed'|'removed'>}
 */
export async function setSyncEnabled(enabled) {
  await chrome.storage.local.set({ syncEnabled: enabled });
  if (!enabled) {
    await chrome.storage.sync.remove(KEY);
    return 'removed';
  }
  if ((await chrome.storage.sync.get(KEY))[KEY]) {
    await pullSources();
    return 'pulled';
  }
  const { sources } = await chrome.storage.local.get(KEY);
  await pushSources(sources || {});
  return 'pushed';
}
