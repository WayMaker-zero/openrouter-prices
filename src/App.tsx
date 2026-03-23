import { useEffect, useState, useMemo } from 'react';
import { fetchModels } from './utils/data';
import type { FormattedModel } from './utils/data';
import PriceScatterChart from './components/PriceScatterChart';
import ModelTable from './components/ModelTable';
import { Activity, Database, Zap } from 'lucide-react';

function App() {
  const [data, setData] = useState<FormattedModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lifted state for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('All');

  useEffect(() => {
    fetchModels().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const allProviders = useMemo(() => {
    return ['All', ...Array.from(new Set(data.map(d => d.provider))).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            model.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = filterProvider === 'All' || model.provider === filterProvider;
      return matchesSearch && matchesProvider;
    });
  }, [data, searchTerm, filterProvider]);

  const totalModels = filteredData.length;
  const freeModels = filteredData.filter(d => d.isFree).length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Activity className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-medium">Fetching Model Prices...</h2>
        <p className="text-sm mt-2">Connecting to OpenRouter API</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Database className="w-8 h-8 text-blue-600" />
              OpenRouter Models
            </h1>
            <p className="text-gray-500 mt-1">Real-time API pricing and context window analysis</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <a 
              href="https://openrouter.ai/models" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm text-gray-700 flex items-center gap-2"
            >
              View Official Docs
            </a>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Filtered Models</p>
              <h4 className="text-2xl font-bold text-gray-900">{totalModels}</h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Zap className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Free Models</p>
              <h4 className="text-2xl font-bold text-gray-900">{freeModels}</h4>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          <PriceScatterChart data={filteredData} />
        </div>

        {/* Data Table */}
        <ModelTable 
          data={filteredData} 
          allProviders={allProviders}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterProvider={filterProvider}
          setFilterProvider={setFilterProvider}
        />

      </div>
    </div>
  );
}

export default App;