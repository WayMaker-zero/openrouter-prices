import { useEffect, useState, useMemo } from 'react';
import { fetchModels } from './utils/data';
import type { FormattedModel } from './utils/data';
import ModelTable from './components/ModelTable';
import { Activity, Database, Zap, ExternalLink, Layers } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50/80 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-600/20">
                <Database className="w-6 h-6" />
              </div>
              OpenRouter Models
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">Real-time API pricing, context window &amp; capability explorer</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Compact Pill Stats */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{totalModels}</span>
                  <span className="text-xs font-medium text-slate-500">Models</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{freeModels}</span>
                  <span className="text-xs font-medium text-slate-500">Free</span>
                </div>
              </div>
            </div>

            <a 
              href="https://openrouter.ai/models" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs text-slate-700 flex items-center gap-2"
            >
              <span>Official Docs</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </header>

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