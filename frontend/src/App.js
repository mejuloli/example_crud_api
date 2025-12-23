import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import PersonForm from './components/PersonForm';
import PersonList from './components/PersonList';

function App() {
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(0);

  // callback to clear edit state and trigger list refresh
  const handleSuccess = () => {
    setEditing(null);
    setRefresh((r) => r + 1);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* notification toaster */}
      <Toaster position="top-right" />
      
      <h1 style={{ textAlign: 'center', color: '#495057' }}>
        Neosilos - Teste Fullstack
      </h1>

      <PersonForm 
        onSuccess={handleSuccess} 
        initialData={editing} 
        onCancel={() => setEditing(null)} 
      />
      
      <PersonList 
        onEdit={setEditing} 
        refreshTrigger={refresh} 
      />
    </div>
  );
}

export default App;