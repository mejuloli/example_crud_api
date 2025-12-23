import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

// inline styles for delete modal
const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: 'white', padding: '25px', borderRadius: '8px',
    maxWidth: '400px', width: '90%', textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  }
};

const PersonList = ({ onEdit, refreshTrigger }) => {
  const [persons, setPersons] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // loading state for skeleton screen
  const [isLoading, setIsLoading] = useState(true);

  // pagination & filters state
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });
  const [ordering, setOrdering] = useState('-created_date');

  // stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // load data function
  const loadData = async (url = null) => {
    setIsLoading(true); // start loading effect
    try {
      let res;
      if (url) {
        res = await api.get(url);
      } else {
        const params = new URLSearchParams({ ...filters, ordering }).toString();
        res = await api.get(`/persons/?${params}`);
      }
      setPersons(res.data.results || []);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
      setCount(res.data.count);
    } catch (e) {
      toast.error('Connection error.');
    } finally {
      // artificial delay to show off the skeleton animation (remove in prod)
      setTimeout(() => setIsLoading(false), 500); 
    }
  };

  useEffect(() => {
    loadData();
    setStats(null); // auto-hide stats on refresh
  }, [refreshTrigger, filters, ordering]);

  // sorting logic
  const handleSort = (field) => {
    setOrdering(ordering === field ? `-${field}` : field);
  };

  const renderSortIcon = (field) => {
    if (ordering === field) return ' ⬆️';
    if (ordering === `-${field}`) return ' ⬇️';
    return null;
  };

  // selection logic
  const toggleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? persons.map((p) => p.id) : []);

  const toggleOne = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  // trigger delete modal
  const confirmDelete = () => {
    if (selectedIds.length === 0) return;
    setShowDeleteModal(true);
  };

  // execute bulk delete
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/persons/${id}/`);
      }
      setSelectedIds([]);
      setShowDeleteModal(false);
      
      // refresh data AND clear stats
      await loadData();
      setStats(null);

      toast.success('Items deleted successfully!');
    } catch (error) {
      toast.error('Error deleting items.');
    } finally {
      setIsDeleting(false);
    }
  };

  // stats logic
  const handleStats = async () => {
    setLoadingStats(true);
    setStats(null);
    try {
      const { data } = await api.post('/persons/calculate-stats/');
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/long-task/${data.task_id}/`);
          if (res.data.status === 'SUCCESS') {
            setStats(res.data.result);
            clearInterval(interval);
            setLoadingStats(false);
            toast.success('Report generated!');
          } else if (res.data.status === 'FAILURE') {
            clearInterval(interval);
            toast.error('Task failed.');
            setLoadingStats(false);
          }
        } catch (err) {
          clearInterval(interval);
          setLoadingStats(false);
        }
      }, 1000);
    } catch (e) {
      toast.error('Error starting task.');
      setLoadingStats(false);
    }
  };

  // skeleton row component (ui magic)
  const SkeletonRow = () => (
    <tr style={{ borderTop: '1px solid #eee' }}>
      <td style={{ padding: '12px' }}>
        <div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '3px' }}></div>
      </td>
      <td style={{ padding: '12px' }}>
        <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '4px' }}></div>
      </td>
      <td style={{ padding: '12px' }}>
        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '4px' }}></div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div className="skeleton" style={{ width: '50px', height: '22px', borderRadius: '12px' }}></div>
          <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '12px' }}></div>
        </div>
      </td>
      <td style={{ padding: '12px' }}>
        <div className="skeleton" style={{ width: '50px', height: '26px', borderRadius: '4px' }}></div>
      </td>
    </tr>
  );

  return (
    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', paddingBottom: '20px' }}>
      
      {/* inject pulse animation styles */}
      <style>{`
        @keyframes pulse {
          0% { background-color: #f3f4f6; }
          50% { background-color: #e5e7eb; }
          100% { background-color: #f3f4f6; }
        }
        .skeleton {
          animation: pulse 1.5s infinite ease-in-out;
          background-color: #f3f4f6;
        }
      `}</style>

      {/* toolbar */}
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Filters:</span>
          <input type="date" onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
          <input type="date" onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedIds.length > 0 && (
            <button onClick={confirmDelete} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
              Delete ({selectedIds.length})
            </button>
          )}
          <button onClick={handleStats} disabled={loadingStats} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            {loadingStats ? 'Calculating...' : '📊 Stats Report'}
          </button>
        </div>
      </div>

      {/* stats banner */}
      {stats && (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '10px', textAlign: 'center', borderBottom: '1px solid #d1fae5', position: 'relative' }}>
          <strong>Result:</strong> Avg Age: {stats.media_idade} | Std Dev: {stats.desvio_padrao} | Total: {stats.total}
          <button onClick={() => setStats(null)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#047857' }}>✕</button>
        </div>
      )}

      {/* table content */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}><input type="checkbox" checked={persons.length > 0 && selectedIds.length === persons.length} onChange={toggleSelectAll} disabled={isLoading} /></th>
            <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('person_name')}>Name {renderSortIcon('person_name')}</th>
            <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('age')}>Age {renderSortIcon('age')}</th>
            <th style={{ padding: '12px' }}>Hobbies</th>
            <th style={{ padding: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // render 5 skeleton rows during loading
            Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} />)
          ) : persons.length === 0 ? (
            // empty state
            <tr>
              <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                <h3 style={{ margin: 0, color: '#374151' }}>No records found</h3>
                <p style={{ fontSize: '14px' }}>Register a new person or adjust date filters.</p>
              </td>
            </tr>
          ) : (
            // real data
            persons.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleOne(p.id)} /></td>
                <td style={{ padding: '12px' }}>{p.person_name}</td>
                <td style={{ padding: '12px' }}>{p.age} years</td>
                <td style={{ padding: '12px' }}>
                  {p.hobbies?.map((h) => (
                    <span key={h} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '5px' }}>{h}</span>
                  ))}
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => onEdit(p)} style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
        <button disabled={isLoading || !prevPage} onClick={() => loadData(prevPage)} style={{ padding: '8px 16px', background: (!isLoading && prevPage) ? '#2563eb' : '#e5e7eb', color: (!isLoading && prevPage) ? 'white' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: (!isLoading && prevPage) ? 'pointer' : 'not-allowed' }}>← Previous</button>
        <span style={{ color: '#666', fontSize: '14px' }}>Total: {isLoading ? '...' : count} records</span>
        <button disabled={isLoading || !nextPage} onClick={() => loadData(nextPage)} style={{ padding: '8px 16px', background: (!isLoading && nextPage) ? '#2563eb' : '#e5e7eb', color: (!isLoading && nextPage) ? 'white' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: (!isLoading && nextPage) ? 'pointer' : 'not-allowed' }}>Next →</button>
      </div>

      {/* delete modal */}
      {showDeleteModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.card}>
            <h3 style={{ color: '#dc2626', marginTop: 0 }}>⚠️ Confirm Deletion</h3>
            <p style={{ color: '#4b5563', marginBottom: '20px' }}>
              Are you sure you want to delete <strong>{selectedIds.length}</strong> items? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeDelete} disabled={isDeleting} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', opacity: isDeleting ? 0.7 : 1 }}>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonList;