import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import PersonForm from './components/PersonForm';
import PersonList from './components/PersonList';

// simple modal styles
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // backdrop dimming
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  content: {
    backgroundColor: '#fff',
    padding: '30px', // increased padding
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px', // increased width to fit form
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    position: 'relative'
  }
};

function App() {
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(0);

  // clear state and refresh list
  const handleSuccess = () => {
    setEditing(null);
    setRefresh((r) => r + 1);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* notification toaster */}
      <Toaster position="top-right" />
      
      <h1 style={{ textAlign: 'center', color: '#495057' }}>
        Person Management System
      </h1>

      {/* create section */}
      <div style={{ marginBottom: '30px' }}>
        <h3>New Person</h3>
        <PersonForm 
          onSuccess={() => setRefresh((r) => r + 1)} 
          initialData={null} 
        />
      </div>
      
      {/* list section */}
      <PersonList 
        onEdit={setEditing} 
        refreshTrigger={refresh} 
      />

      {/* edit modal popup */}
      {editing && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            {/* form component handles its own title */}
            <PersonForm 
              onSuccess={handleSuccess} 
              initialData={editing} 
              onCancel={() => setEditing(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;