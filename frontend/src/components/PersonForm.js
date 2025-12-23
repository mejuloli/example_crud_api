import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

const PersonForm = ({ onSuccess, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    person_name: '',
    age: 18,
    hobbies: '',
  });
  const [loading, setLoading] = useState(false);

  // populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        person_name: initialData.person_name,
        age: initialData.age || 18,
        hobbies: Array.isArray(initialData.hobbies)
          ? initialData.hobbies.join(', ')
          : '',
      });
    } else {
      setFormData({ person_name: '', age: 18, hobbies: '' });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // process hobbies string into array
    const payload = {
      ...formData,
      hobbies: formData.hobbies
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h),
    };

    try {
      if (initialData) {
        await api.patch(`/persons/${initialData.id}/`, payload);
      } else {
        await api.post('/persons/', payload);
      }
      
      onSuccess();
      
      if (!initialData) {
        setFormData({ person_name: '', age: 18, hobbies: '' });
      }
      toast.success('Saved successfully!');
    } catch (err) {
      toast.error('Error saving data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        {initialData ? 'Edit Person' : 'New Person'}
      </h3>
      
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '15px',
          gridTemplateColumns: '2fr 1fr 3fr auto',
        }}
      >
        <input
          placeholder="Name"
          value={formData.person_name}
          onChange={(e) =>
            setFormData({ ...formData, person_name: e.target.value })
          }
          required
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) =>
            setFormData({ ...formData, age: e.target.value })
          }
          required
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        
        <input
          placeholder="Hobbies (comma separated)"
          value={formData.hobbies}
          onChange={(e) =>
            setFormData({ ...formData, hobbies: e.target.value })
          }
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#0d6efd',
              color: '#fff',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? '...' : 'Save'}
          </button>
          
          {initialData && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PersonForm;