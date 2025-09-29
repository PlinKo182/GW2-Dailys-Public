import React from 'react';
import useStore from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { LogOutIcon } from 'lucide-react';

export function LogoutButton() {
  const currentUser = useStore(state => state.currentUser);
  const logout = useStore(state => state.logout);

  const handleLogout = () => {
    logout();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOutIcon className="w-5 h-5 mr-2" />
      Logout ({currentUser})
    </Button>
  );
}