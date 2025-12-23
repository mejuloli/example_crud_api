import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

const PersonForm = ({ onSuccess, initialData, onCancel }) => {
  // form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    hobbies: '',
  });
  
  const [initialValues, setInitialValues] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const data = {
        name: initialData.person_name || '',
        age: String(initialData.age || ''),
        hobbies: initialData.hobbies ? initialData.hobbies.join(', ') : '',
      };
      setFormData(data);
      setInitialValues(data);
    } else {
      const empty = { name: '', age: '', hobbies: '' };
      setFormData(empty);
      setInitialValues(null);
    }
    setErrors({});
  }, [initialData]);

  const hasChanges = useMemo(() => {
    if (!initialValues) return true;
    return (
      formData.name !== initialValues.name ||
      formData.age !== initialValues.age ||
      formData.hobbies !== initialValues.hobbies
    );
  }, [formData, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); 
    
    const newErrors = {};
    const cleanHobbies = formData.hobbies.split(',').map(h => h.trim()).filter(Boolean);
    const ageNum = Number(formData.age);

    // --- FRIENDLY VALIDATION MESSAGES ---
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter a name.'; 
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is missing.';
    } else if (ageNum < 0 || ageNum > 120) {
      newErrors.age = 'Let\'s keep it realistic (0-120).'; // Friendly tone
    }

    if (cleanHobbies.length === 0) {
      newErrors.hobbies = 'Add at least one hobby (e.g. Reading).'; // Helpful hint
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Optional: shake effect or subtle toast could go here
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        person_name: formData.name,
        age: ageNum,
        hobbies: cleanHobbies,
      };

      if (initialData) {
        await api.put(`/persons/${initialData.id}/`, payload);
        toast.success('Successfully updated!');
      } else {
        await api.post('/persons/', payload);
        toast.success('New person added!');
        setFormData({ name: '', age: '', hobbies: '' });
      }
      onSuccess();
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hobbyChips = formData.hobbies
    ? formData.hobbies.split(',').map(h => h.trim()).filter(Boolean)
    : [];

  return (
    <form 
      onSubmit={handleFormSubmit} 
      style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: initialData ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
        
        {/* name input */}
        <div style={{ flex: '2 1 200px' }}>
          <input
            name="name"
            autoFocus 
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            style={{
              width: '100%',
              height: '40px',
              padding: '0 10px',
              borderRadius: '6px',
              border: errors.name ? '1px solid #ef4444' : '1px solid #d1d5db',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {errors.name && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: '500'}}>{errors.name}</div>}
        </div>

        {/* age input */}
        <div style={{ flex: '0 1 80px' }}>
          <input
            name="age"
            type="number"
            min="0"
            max="120"
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            }}
            value={formData.age}
            onChange={handleChange}
            placeholder="Age"
            style={{
              width: '100%',
              height: '40px',
              padding: '0 10px',
              borderRadius: '6px',
              border: errors.age ? '1px solid #ef4444' : '1px solid #d1d5db',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
           {errors.age && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap', fontWeight: '500'}}>{errors.age}</div>}
        </div>

        {/* hobbies input */}
        <div style={{ flex: '3 1 250px' }}>
          <input
            name="hobbies"
            value={formData.hobbies}
            onChange={handleChange}
            placeholder="Hobbies (e.g. Soccer, Games)"
            style={{
              width: '100%',
              height: '40px',
              padding: '0 10px',
              borderRadius: '6px',
              border: errors.hobbies ? '1px solid #ef4444' : '1px solid #d1d5db',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {errors.hobbies && <div style={{color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: '500'}}>{errors.hobbies}</div>}
          
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap', minHeight: '20px' }}>
            {hobbyChips.map((chip, idx) => (
              <span key={idx} style={{
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                display: 'inline-block'
              }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* action buttons */}
        <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto' }}>
          <button
            type="submit"
            disabled={isSubmitting || !hasChanges}
            style={{
              height: '40px',
              background: (isSubmitting || !hasChanges) ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              padding: '0 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (isSubmitting || !hasChanges) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: (isSubmitting || !hasChanges) ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
              transition: 'background 0.2s'
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                height: '40px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '0 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default PersonForm;