import type { FormattedModel } from '../utils/data';
import { Search, Info, ArrowDown, ArrowUp, ArrowUpDown, Settings2, Image as ImageIcon, Wrench, Zap } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  data: FormattedModel[];
  allProviders: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterProvider: string;
  setFilterProvider: (provider: string) => void;
}

type SortField = 'inputPrice1M' | 'outputPrice1M' | 'cacheReadPrice1M' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ModelTable({ 
  data, 
  allProviders, 
  searchTerm, 
  setSearchTerm, 
  filterProvider, 
  setFilterProvider 
}: Props) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Column toggles
  const [showVision, setShowVision] = useState(false);
  const [showMaxOutput, setShowMaxOutput] = useState(false);
  const [showFunctionCalling, setShowFunctionCalling] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return data;

    return [...data].sort((a, b) => {
      // Dynamic models should be pushed to the bottom for clearer pricing comparison
      if (a.isVariable && !b.isVariable) return 1;
      if (!a.isVariable && b.isVariable) return -1;
      if (a.isVariable && b.isVariable) return 0;

      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle nulls for cache pricing (push to bottom)
      if (aValue === null && bValue !== null) return 1;
      if (aValue !== null && bValue === null) return -1;
      if (aValue === null && bValue === null) return 0;

      if (aValue! < bValue!) return sortDirection === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400 inline-block ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 text-blue-600 inline-block ml-1" />;
    return <ArrowDown className="w-4 h-4 text-blue-600 inline-block ml-1" />;
  };

  const ToggleButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
        active 
          ? 'bg-blue-50 border-blue-200 text-blue-700' 
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">All OpenRouter Models</h3>
          <p className="text-sm text-gray-500">Compare pricing for {data.length} models</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Feature Toggles */}
          <div className="flex flex-wrap gap-2 mr-0 md:mr-4 items-center">
            <span className="text-xs text-gray-400 font-medium mr-1"><Settings2 className="w-4 h-4 inline-block mr-1"/>Columns:</span>
            <ToggleButton active={showVision} onClick={() => setShowVision(!showVision)} icon={ImageIcon} label="Vision" />
            <ToggleButton active={showMaxOutput} onClick={() => setShowMaxOutput(!showMaxOutput)} icon={Zap} label="Max Output" />
            <ToggleButton active={showFunctionCalling} onClick={() => setShowFunctionCalling(!showFunctionCalling)} icon={Wrench} label="Tools" />
          </div>

          <div className="flex gap-3 flex-1 md:flex-none">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search models..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <select 
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {allProviders.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Model Name</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Provider</th>
              <th 
                className="px-6 py-4 font-semibold text-gray-700 text-right cursor-pointer hover:bg-gray-50 group select-none"
                onClick={() => handleSort('inputPrice1M')}
                title="Click to sort by Input Price"
              >
                Input/1M ($) {renderSortIcon('inputPrice1M')}
              </th>
              <th 
                className="px-6 py-4 font-semibold text-gray-700 text-right cursor-pointer hover:bg-gray-50 group select-none"
                onClick={() => handleSort('outputPrice1M')}
                title="Click to sort by Output Price"
              >
                Output/1M ($) {renderSortIcon('outputPrice1M')}
              </th>
              <th 
                className="px-6 py-4 font-semibold text-gray-700 text-right cursor-pointer hover:bg-gray-50 group select-none"
                onClick={() => handleSort('cacheReadPrice1M')}
                title="Click to sort by Cached Input Price"
              >
                Cached In/1M ($) {renderSortIcon('cacheReadPrice1M')}
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Context</th>
              
              {/* Optional Columns */}
              {showMaxOutput && <th className="px-6 py-4 font-semibold text-gray-700 text-right bg-blue-50/30">Max Output</th>}
              {showVision && <th className="px-6 py-4 font-semibold text-gray-700 text-center bg-blue-50/30">Vision</th>}
              {showFunctionCalling && <th className="px-6 py-4 font-semibold text-gray-700 text-center bg-blue-50/30">Tools</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map(model => (
              <tr key={model.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{model.modelName}</span>
                    {model.isFree && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Free</span>}
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-600">{model.provider}</td>
                <td className="px-6 py-3 text-right tabular-nums text-gray-800 font-medium">
                  {model.isVariable ? <span className="text-gray-400 italic font-normal">Dynamic</span> : model.inputPrice1M.toFixed(4)}
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-gray-800 font-medium">
                  {model.isVariable ? <span className="text-gray-400 italic font-normal">Dynamic</span> : model.outputPrice1M.toFixed(4)}
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-blue-600 font-medium bg-blue-50/10">
                  {model.isVariable 
                    ? <span className="text-gray-400 italic font-normal">Dynamic</span> 
                    : model.cacheReadPrice1M !== null 
                      ? model.cacheReadPrice1M.toFixed(4) 
                      : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-gray-600">
                  {model.contextLength >= 1000 ? `${(model.contextLength / 1000).toFixed(0)}k` : model.contextLength}
                </td>

                {/* Optional Columns */}
                {showMaxOutput && (
                  <td className="px-6 py-3 text-right tabular-nums text-gray-600 bg-blue-50/10">
                    {model.maxOutputTokens ? (model.maxOutputTokens >= 1000 ? `${(model.maxOutputTokens / 1000).toFixed(0)}k` : model.maxOutputTokens) : <span className="text-gray-300">-</span>}
                  </td>
                )}
                {showVision && (
                  <td className="px-6 py-3 text-center bg-blue-50/10">
                    {model.hasVision ? <ImageIcon className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                  </td>
                )}
                {showFunctionCalling && (
                  <td className="px-6 py-3 text-center bg-blue-50/10">
                    {model.hasFunctionCalling ? <Wrench className="w-4 h-4 text-blue-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
            <Info className="w-8 h-8 text-gray-300 mb-2" />
            <p>No models found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}