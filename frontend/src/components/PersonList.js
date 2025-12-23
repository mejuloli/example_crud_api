import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { fetchPersons } from '../api';

const PersonList = ({ onEdit, refreshTrigger }) => {
  const [persons, setPersons] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // pagination state
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [count, setCount] = useState(0);

  // filters and sorting state
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });
  const [ordering, setOrdering] = useState('-created_date');

  // async stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // unified data loading function
  const loadData = async (url = null) => {
    try {
      let res;
      if (url) {
        // use direct pagination url
        res = await api.get(url);
      } else {
        // build params for filtering and sorting
        const params = new URLSearchParams({
          ...filters,
          ordering: ordering,
        }).toString();
        res = await api.get(`/persons/?${params}`);
      }

      setPersons(res.data.results || []);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
      setCount(res.data.count);
    } catch (e) {
      toast.error('Connection error.');
    }
  };

  // reload on trigger, filter change or sort change
  useEffect(() => {
    loadData();
  }, [refreshTrigger, filters, ordering]);

  // sorting logic
  const handleSort = (field) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else {
      setOrdering(field);
    }
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

  // bulk delete logic
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} items?`
      )
    )
      return;

    try {
      for (const id of selectedIds) {
        await api.delete(`/persons/${id}/`);
      }
      setSelectedIds([]);
      await loadData();
      toast.success('Items deleted successfully!');
    } catch (error) {
      toast.error('Error deleting items.');
    }
  };

  // async statistics logic (celery)
  const handleStats = async () => {
    setLoadingStats(true);
    setStats(null);
    try {
      const { data } = await api.post('/persons/calculate-stats/');
      
      // polling for task result
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
            toast.error('Task processing failed.');
            setLoadingStats(false);
          }
        } catch (err) {
          clearInterval(interval);
          setLoadingStats(false);
        }
      }, 1000);
    } catch (e) {
      toast.error('Error starting task (Backend 500)');
      setLoadingStats(false);
    }
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        paddingBottom: '20px',
      }}
    >
      {/* toolbar with filters and actions */}
      <div
        style={{
          padding: '15px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>
            Filters:
          </span>
          <input
            type="date"
            onChange={(e) =>
              setFilters({ ...filters, start_date: e.target.value })
            }
            style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input
            type="date"
            onChange={(e) =>
              setFilters({ ...filters, end_date: e.target.value })
            }
            style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Delete ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleStats}
            disabled={loadingStats}
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loadingStats ? 'Calculating...' : '📊 Stats Report'}
          </button>
        </div>
      </div>

      {/* stats result banner */}
      {stats && (
        <div
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            padding: '10px',
            textAlign: 'center',
            borderBottom: '1px solid #d1fae5',
          }}
        >
          <strong>Result:</strong> Avg Age: {stats.media_idade} | Std Dev:{' '}
          {stats.desvio_padrao} | Total: {stats.total}
        </div>
      )}

      {/* empty state logic */}
      {persons.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
          <h3 style={{ margin: 0, color: '#374151' }}>No records found</h3>
          <p style={{ fontSize: '14px' }}>
            Register a new person or adjust date filters.
          </p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>
                <input
                  type="checkbox"
                  checked={
                    persons.length > 0 && selectedIds.length === persons.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              
              {/* clickable headers for sorting */}
              <th
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => handleSort('person_name')}
              >
                Name {renderSortIcon('person_name')}
              </th>
              <th
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => handleSort('age')}
              >
                Age {renderSortIcon('age')}
              </th>
              <th style={{ padding: '12px' }}>Hobbies</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {persons.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleOne(p.id)}
                  />
                </td>
                <td style={{ padding: '12px' }}>{p.person_name}</td>
                <td style={{ padding: '12px' }}>{p.age} years</td>
                <td style={{ padding: '12px' }}>
                  {p.hobbies?.map((h) => (
                    <span
                      key={h}
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginRight: '5px',
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => onEdit(p)}
                    style={{
                      background: 'white',
                      border: '1px solid #d1d5db',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* pagination controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px',
          marginTop: '20px',
        }}
      >
        <button
          disabled={!prevPage}
          onClick={() => loadData(prevPage)}
          style={{
            padding: '8px 16px',
            background: prevPage ? '#2563eb' : '#e5e7eb',
            color: prevPage ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '4px',
            cursor: prevPage ? 'pointer' : 'not-allowed',
          }}
        >
          ← Previous
        </button>

        <span style={{ color: '#666', fontSize: '14px' }}>
          Total: {count} records
        </span>

        <button
          disabled={!nextPage}
          onClick={() => loadData(nextPage)}
          style={{
            padding: '8px 16px',
            background: nextPage ? '#2563eb' : '#e5e7eb',
            color: nextPage ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '4px',
            cursor: nextPage ? 'pointer' : 'not-allowed',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default PersonList;