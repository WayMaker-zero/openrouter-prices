import type { FormattedModel } from '../utils/data';
import { getMarkedModelIds, setModelMarked } from '../utils/db';
import {
  Search,
  Info,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Settings2,
  Image as ImageIcon,
  Wrench,
  Zap,
  RefreshCw,
  Star,
  ChevronDown,
  Check,
  Building2,
  X,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';

interface Props {
  data: FormattedModel[];
  allProviders: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterProvider: string;
  setFilterProvider: (provider: string) => void;
}

type SortField = 'inputPrice1M' | 'outputPrice1M' | 'cacheReadPrice1M' | 'cacheWritePrice1M' | null;
type SortDirection = 'asc' | 'desc' | null;

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  anthropic: 'bg-orange-50 text-orange-700 border-orange-200/70',
  google: 'bg-blue-50 text-blue-700 border-blue-200/70',
  'meta-llama': 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  deepseek: 'bg-cyan-50 text-cyan-700 border-cyan-200/70',
  mistralai: 'bg-amber-50 text-amber-700 border-amber-200/70',
  qwen: 'bg-violet-50 text-violet-700 border-violet-200/70',
  xai: 'bg-slate-100 text-slate-800 border-slate-300/70',
};

function getProviderBadgeClass(provider: string): string {
  const key = provider.toLowerCase();
  return PROVIDER_COLORS[key] ?? 'bg-slate-100 text-slate-600 border-slate-200/80';
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}k`;
  return String(count);
}

export default function ModelTable({
  data,
  allProviders,
  searchTerm,
  setSearchTerm,
  filterProvider,
  setFilterProvider,
}: Props) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [sortMarkedIds, setSortMarkedIds] = useState<Set<string>>(new Set());

  // Column toggles
  const [showVision, setShowVision] = useState(false);
  const [showMaxOutput, setShowMaxOutput] = useState(false);
  const [showFunctionCalling, setShowFunctionCalling] = useState(false);

  // Custom Provider Dropdown state
  const [providerOpen, setProviderOpen] = useState(false);
  const [providerQuery, setProviderQuery] = useState('');
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(e.target as Node)) {
        setProviderOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProviderOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredProviders = useMemo(() => {
    const q = providerQuery.trim().toLowerCase();
    if (!q) return allProviders;
    return allProviders.filter(p => p.toLowerCase().includes(q) || (p === 'All' && 'all providers'.includes(q)));
  }, [allProviders, providerQuery]);

  useEffect(() => {
    getMarkedModelIds().then(ids => {
      setMarkedIds(ids);
      setSortMarkedIds(ids);
    });
  }, []);

  useEffect(() => {
    setSortMarkedIds(markedIds);
  }, [data, sortField, sortDirection]);

  const handleRefreshSort = () => {
    setSortMarkedIds(new Set(markedIds));
  };

  const toggleMark = (id: string) => {
    setMarkedIds(prev => {
      const next = new Set(prev);
      const marked = !next.has(id);
      if (marked) next.add(id);
      else next.delete(id);
      setModelMarked(id, marked);
      return next;
    });
  };

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
    return [...data].sort((a, b) => {
      const aMarked = sortMarkedIds.has(a.id);
      const bMarked = sortMarkedIds.has(b.id);
      if (aMarked !== bMarked) return aMarked ? -1 : 1;

      if (!sortField || !sortDirection) return 0;

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
  }, [data, sortField, sortDirection, sortMarkedIds]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    if (sortDirection === 'asc') return <ArrowUp className="w-3.5 h-3.5 text-blue-600" />;
    return <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const ToggleButton = ({
    active,
    onClick,
    icon: Icon,
    label,
  }: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
        active
          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs'
          : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  const renderPrice = (val: number | null, isVariable: boolean, isFree?: boolean, accent = false) => {
    if (isVariable) {
      return <span className="text-xs text-slate-400 italic font-normal">Dynamic</span>;
    }
    if (isFree && val === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
          FREE
        </span>
      );
    }
    if (val === null) {
      return <span className="text-slate-300">—</span>;
    }
    return (
      <span className={`font-mono tabular-nums text-sm font-semibold ${accent ? 'text-blue-600' : 'text-slate-800'}`}>
        <span className="text-slate-400 font-normal text-xs mr-0.5">$</span>
        {val.toFixed(4)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 md:p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Settings2 className="w-3.5 h-3.5" />
            Columns:
          </span>
          <ToggleButton active={showVision} onClick={() => setShowVision(!showVision)} icon={ImageIcon} label="Vision" />
          <ToggleButton active={showMaxOutput} onClick={() => setShowMaxOutput(!showMaxOutput)} icon={Zap} label="Max Output" />
          <ToggleButton active={showFunctionCalling} onClick={() => setShowFunctionCalling(!showFunctionCalling)} icon={Wrench} label="Tools" />
          <button
            onClick={handleRefreshSort}
            title="按当前标记状态刷新排序"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-xs cursor-pointer ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search models or providers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>
          {/* Custom Provider Dropdown */}
          <div className="relative" ref={providerDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setProviderOpen(prev => !prev);
                setProviderQuery('');
              }}
              className={`w-full sm:w-52 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                providerOpen
                  ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                  : filterProvider !== 'All'
                    ? 'bg-blue-50/60 border-blue-200 text-blue-800 hover:bg-blue-50'
                    : 'bg-slate-50/50 border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Building2 className={`w-4 h-4 shrink-0 ${filterProvider !== 'All' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">
                  {filterProvider === 'All' ? 'All Providers' : filterProvider}
                </span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                {filterProvider !== 'All' && (
                  <span
                    role="button"
                    aria-label="Clear provider filter"
                    onClick={e => {
                      e.stopPropagation();
                      setFilterProvider('All');
                    }}
                    className="p-0.5 rounded-md hover:bg-blue-200/60 text-blue-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    providerOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </span>
            </button>

            {providerOpen && (
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white rounded-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 z-30 overflow-hidden">
                <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Filter providers..."
                      value={providerQuery}
                      onChange={e => setProviderQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredProviders.map(p => {
                    const isSelected = filterProvider === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setFilterProvider(p);
                          setProviderOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-100/80'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {p === 'All' ? (
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                          ) : (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] border truncate ${getProviderBadgeClass(p)}`}
                            >
                              {p}
                            </span>
                          )}
                          {p === 'All' && <span>All Providers</span>}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredProviders.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching providers
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Column Header (Desktop) */}
      <div className="hidden lg:grid lg:grid-cols-12 items-center gap-3 px-5 py-2.5 bg-slate-100/90 backdrop-blur-sm rounded-xl border border-slate-200/70 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-2 z-10">
        <div className="col-span-4">Model &amp; Provider</div>
        <button
          onClick={() => handleSort('inputPrice1M')}
          className="col-span-2 flex items-center justify-end gap-1 hover:text-slate-900 group cursor-pointer text-right"
          title="Click to sort by Input Price"
        >
          <span>Input /1M</span>
          {renderSortIcon('inputPrice1M')}
        </button>
        <button
          onClick={() => handleSort('outputPrice1M')}
          className="col-span-2 flex items-center justify-end gap-1 hover:text-slate-900 group cursor-pointer text-right"
          title="Click to sort by Output Price"
        >
          <span>Output /1M</span>
          {renderSortIcon('outputPrice1M')}
        </button>
        <button
          onClick={() => handleSort('cacheReadPrice1M')}
          className="col-span-1 flex items-center justify-end gap-1 hover:text-slate-900 group cursor-pointer text-right"
          title="Click to sort by Cached Input Price"
        >
          <span>Cache In</span>
          {renderSortIcon('cacheReadPrice1M')}
        </button>
        <button
          onClick={() => handleSort('cacheWritePrice1M')}
          className="col-span-2 flex items-center justify-end gap-1 hover:text-slate-900 group cursor-pointer text-right"
          title="Click to sort by Cache Write Price"
        >
          <span>Cache Write</span>
          {renderSortIcon('cacheWritePrice1M')}
        </button>
        <div className="col-span-1 text-right">Context</div>
      </div>

      {/* Card List */}
      <div className="space-y-1.5">
        {sortedData.map(model => {
          const isMarked = markedIds.has(model.id);
          const hasOptionalCols = showMaxOutput || showVision || showFunctionCalling;

          return (
            <div
              key={model.id}
              onClick={() => toggleMark(model.id)}
              title="Click to mark/unmark this model"
              className={`group rounded-xl border px-4 py-2.5 transition-all cursor-pointer ${
                isMarked
                  ? 'bg-amber-50/70 border-amber-300/80 shadow-xs hover:bg-amber-50 hover:border-amber-400'
                  : 'bg-white border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300/90'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-2 lg:gap-3">
                {/* Model Name & Provider Badge (Single Row) */}
                <div className="lg:col-span-4 flex items-center gap-2.5 min-w-0">
                  <Star
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isMarked
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 group-hover:text-slate-400'
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {model.modelName}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border shrink-0 ${getProviderBadgeClass(
                        model.provider
                      )}`}
                    >
                      {model.provider}
                    </span>
                    {model.isFree && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold shrink-0">
                        Free
                      </span>
                    )}
                    {hasOptionalCols && (
                      <>
                        {showMaxOutput && model.maxOutputTokens && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium shrink-0">
                            <Zap className="w-2.5 h-2.5 text-amber-500" />
                            {formatTokens(model.maxOutputTokens)}
                          </span>
                        )}
                        {showVision && model.hasVision && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium shrink-0">
                            <ImageIcon className="w-2.5 h-2.5" />
                            Vision
                          </span>
                        )}
                        {showFunctionCalling && model.hasFunctionCalling && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium shrink-0">
                            <Wrench className="w-2.5 h-2.5" />
                            Tools
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Input Price */}
                <div className="lg:col-span-2 flex lg:block justify-between items-center lg:text-right">
                  <span className="lg:hidden text-xs font-medium text-slate-400">Input /1M</span>
                  {renderPrice(model.inputPrice1M, model.isVariable, model.isFree)}
                </div>

                {/* Output Price */}
                <div className="lg:col-span-2 flex lg:block justify-between items-center lg:text-right">
                  <span className="lg:hidden text-xs font-medium text-slate-400">Output /1M</span>
                  {renderPrice(model.outputPrice1M, model.isVariable, model.isFree)}
                </div>

                {/* Cache Read */}
                <div className="lg:col-span-1 flex lg:block justify-between items-center lg:text-right">
                  <span className="lg:hidden text-xs font-medium text-slate-400">Cache In</span>
                  {renderPrice(model.cacheReadPrice1M, model.isVariable, false, true)}
                </div>

                {/* Cache Write */}
                <div className="lg:col-span-2 flex lg:block justify-between items-center lg:text-right">
                  <span className="lg:hidden text-xs font-medium text-slate-400">Cache Write</span>
                  {renderPrice(model.cacheWritePrice1M, model.isVariable, false, true)}
                </div>

                {/* Context */}
                <div className="lg:col-span-1 flex lg:justify-end justify-between items-center">
                  <span className="lg:hidden text-xs font-medium text-slate-400">Context</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium tabular-nums">
                    {formatTokens(model.contextLength)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Info className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No models found matching your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search term or provider filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
