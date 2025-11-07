import React, { useState, useEffect } from 'react';
import './App.css';

const HCC_MAPPINGS = {
  'I10': ['HCC88'],
  'I25.10': ['HCC84'],
  'E11.9': ['HCC18'],
  'E66.9': ['HCC21'],
  'J44.9': ['HCC111'],
  'F17.210': ['HCC55'],
  'I50.9': ['HCC85'],
  'E11.21': ['HCC18', 'HCC106'],
  'N18.9': ['HCC136'],
  'G20': ['HCC104']
};

const HCC_MODELS = {
  'V22': 'CMS-HCC 2022',
  'V24': 'CMS-HCC 2024',
  'V24a': 'CMS-HCC 2024 Advanced',
  'V28': 'CMS-HCC 2028'
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [selectedModel, setSelectedModel] = useState('V24');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const savedCodes = localStorage.getItem('hccSelectedCodes');
    if (savedCodes) {
      setSelectedCodes(JSON.parse(savedCodes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hccSelectedCodes', JSON.stringify(selectedCodes));
  }, [selectedCodes]);

  const handleSearch = (term) => {
    const searchTermUpper = term.toUpperCase().trim();
    if (!searchTermUpper) {
      setSearchResults([]);
      return;
    }

    const results = Object.entries(HCC_MAPPINGS)
      .filter(([icdCode]) => icdCode.includes(searchTermUpper))
      .map(([icdCode, hccCodes]) => ({
        icdCode,
        hccCodes,
        description: getCodeDescription(icdCode)
      }))
      .slice(0, 20);

    setSearchResults(results);
  };

  const getCodeDescription = (icdCode) => {
    const descriptions = {
      'I10': 'Essential hypertension',
      'E11.9': 'Type 2 diabetes without complications',
      'E66.9': 'Obesity',
      'J44.9': 'COPD',
      'I25.10': 'Coronary artery disease',
      'F17.210': 'Nicotine dependence'
    };
    return descriptions[icdCode] || 'Description not available';
  };

  const addCode = (icdCode, hccCodes) => {
    if (!selectedCodes.find(item => item.icdCode === icdCode)) {
      setSelectedCodes(prev => [...prev, {
        icdCode,
        hccCodes,
        description: getCodeDescription(icdCode)
      }]);
      showNotification(`Added ${icdCode}`);
    }
  };

  const removeCode = (icdCode) => {
    setSelectedCodes(prev => prev.filter(item => item.icdCode !== icdCode));
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const exportToCSV = () => {
    const headers = ['ICD-10 Code', 'Description', 'HCC Codes', 'Model Version'];
    const csvData = selectedCodes.map(item => [
      item.icdCode,
      `"${item.description}"`,
      item.hccCodes.join('; '),
      selectedModel
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hcc-crosswalk-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('CSV exported');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>HCC Coding Crosswalk Tool</h1>
        <p>ICD-10 to HCC Mapping Utility</p>
      </header>

      <div className="main-container">
        <div className="model-selection">
          <label>CMS-HCC Model:</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {Object.entries(HCC_MODELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="layout-grid">
          <div className="search-panel">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search ICD-10 codes..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>

            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.length === 0 ? (
                <p className="no-results">No results found</p>
              ) : (
                <div className="results-list">
                  {searchResults.map((result, index) => (
                    <div key={index} className="result-item">
                      <div className="result-code">{result.icdCode}</div>
                      <div className="result-desc">{result.description}</div>
                      <div className="result-hcc">HCC: {result.hccCodes.join(', ')}</div>
                      <button 
                        onClick={() => addCode(result.icdCode, result.hccCodes)}
                        disabled={selectedCodes.find(item => item.icdCode === result.icdCode)}
                      >
                        {selectedCodes.find(item => item.icdCode === result.icdCode) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="selected-panel">
            <div className="panel-header">
              <h3>Selected Codes ({selectedCodes.length})</h3>
              <button onClick={() => setSelectedCodes([])} disabled={selectedCodes.length === 0}>
                Clear All
              </button>
            </div>

            <div className="selected-list">
              {selectedCodes.length === 0 ? (
                <p className="empty-state">No codes selected</p>
              ) : (
                selectedCodes.map((item, index) => (
                  <div key={index} className="selected-item">
                    <div className="item-main">
                      <strong>{item.icdCode}</strong>
                      <span className="hcc-codes">{item.hccCodes.join(', ')}</span>
                    </div>
                    <div className="item-desc">{item.description}</div>
                    <button onClick={() => removeCode(item.icdCode)} className="remove-btn">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="action-buttons">
              <button onClick={exportToCSV} disabled={selectedCodes.length === 0}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
