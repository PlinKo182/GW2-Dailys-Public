import React from 'react';
import useStore from '../store/useStore';
import DailyTasks from './DailyTasks';
import Header from './Header';
import Footer from './Footer';

const Dashboard = () => {
  const currentUser = useStore(state => state.currentUser);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser}!</h1>
            <p className="text-muted-foreground">Track your daily tasks and progress</p>
          </div>
          <DailyTasks />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;