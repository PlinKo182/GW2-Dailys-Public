import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { UserCircleIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile, addProfile, deleteProfile } = useStore();
  const [newProfileName, setNewProfileName] = useState('');

  const handleAddProfile = (e) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      addProfile(newProfileName.trim());
      setNewProfileName('');
    }
  };

  const handleDeleteProfile = (e, profileName) => {
    e.stopPropagation(); // Prevent dropdown from closing
    if (window.confirm(`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`)) {
      deleteProfile(profileName);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <UserCircleIcon className="w-5 h-5 mr-2" />
          {activeProfile || 'Select Profile'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Profiles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem key={profile} onSelect={() => switchProfile(profile)} className="flex justify-between items-center">
            <span>{profile}</span>
            {profiles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => handleDeleteProfile(e, profile)}
                aria-label={`Delete profile ${profile}`}
              >
                <TrashIcon className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2">
          <form onSubmit={handleAddProfile} className="flex items-center gap-2">
            <Input
              placeholder="New profile name..."
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="h-8"
            />
            <Button type="submit" size="icon" className="h-8 w-8 flex-shrink-0">
              <PlusCircleIcon className="w-5 h-5" />
              <span className="sr-only">Add Profile</span>
            </Button>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}