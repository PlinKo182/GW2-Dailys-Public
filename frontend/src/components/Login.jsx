import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get actions from the store
  const loginUser = useStore(state => state.loginUser);
  const addUser = useStore(state => state.addUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter a username.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginUser(username);
      // Success will trigger a re-render from App.js, no need to do anything here.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter a username.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await addUser(username);
      // Success will trigger a re-render from App.js
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-lg shadow-md">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-card-foreground">Welcome</h1>
            <p className="text-muted-foreground">Login or create a new account.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={loading}
              aria-label="Username"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col space-y-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="outline" onClick={handleCreateUser} disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Login;