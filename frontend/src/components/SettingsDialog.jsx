import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Loader2, Key, Trash2, AlertCircle, Check } from 'lucide-react';
import { Button } from './ui/button';
import * as Dialog from '@radix-ui/react-dialog';

const SettingsDialog = ({ open, onOpenChange }) => {
  const hasGW2ApiKey = useStore((state) => state.hasGW2ApiKey);
  const gw2AccountName = useStore((state) => state.gw2AccountName);
  const gw2ApiKeyPermissions = useStore((state) => state.gw2ApiKeyPermissions);
  const saveUserGW2ApiKey = useStore((state) => state.saveUserGW2ApiKey);
  const removeUserGW2ApiKey = useStore((state) => state.removeUserGW2ApiKey);

  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveUserGW2ApiKey(apiKey.trim());
      setApiKey('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your GW2 API key?')) {
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      await removeUserGW2ApiKey();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] bg-card border border-border rounded-lg shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold mb-6">Settings</Dialog.Title>

            {/* GW2 API Key Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Guild Wars 2 API Key</h3>
              </div>

              {hasGW2ApiKey ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">API Key Active</span>
                        </div>
                        {gw2AccountName && (
                          <p className="text-sm text-muted-foreground">
                            Account: <span className="font-medium">{gw2AccountName}</span>
                          </p>
                        )}
                        {gw2ApiKeyPermissions && gw2ApiKeyPermissions.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Permissions: {gw2ApiKeyPermissions.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRemoveApiKey}
                      disabled={removing}
                      variant="destructive"
                      size="sm"
                    >
                      {removing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove API Key
                    </Button>
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm font-medium mb-2">Update API Key</p>
                    <form onSubmit={handleSaveApiKey} className="space-y-3">
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter new API key"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                        disabled={loading}
                      />
                      <Button type="submit" disabled={loading || !apiKey.trim()} size="sm">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update API Key
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-md p-4 space-y-2 text-sm">
                    <p className="font-medium">How to get your API key:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Visit <a href="https://account.arena.net/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ArenaNet Applications</a></li>
                      <li>Click "New Key"</li>
                      <li>Give it a name (e.g., "Tyria Tracker")</li>
                      <li>Check the "account" permission</li>
                      <li>Copy the generated key</li>
                    </ol>
                  </div>

                  <form onSubmit={handleSaveApiKey} className="space-y-3">
                    <div>
                      <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                        API Key
                      </label>
                      <input
                        id="apiKey"
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                        disabled={loading}
                      />
                    </div>

                    <Button type="submit" disabled={loading || !apiKey.trim()}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save API Key
                    </Button>
                  </form>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <Dialog.Close asChild>
              <Button variant="outline" className="mt-6 w-full">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsDialog;
