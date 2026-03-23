import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis, Legend } from 'recharts';
import type { FormattedModel } from '../utils/data';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface Props {
  data: FormattedModel[];
}

export default function PriceScatterChart({ data }: Props) {
  const maxInputPriceLimit = 200; // Expanded default value for the slider

  const [maxInputPrice, setMaxInputPrice] = useState(15); // Default to $15 to zoom in on the majority
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  // Filter out free models, variable pricing, and apply the slider limits
  const filteredData = useMemo(() => {
    return data
      .filter(m => !m.isFree && !m.isVariable && m.inputPrice1M > 0 && m.inputPrice1M <= maxInputPrice)
      .map(m => ({
        ...m,
        providerGroup: m.provider
      }));
  }, [data, maxInputPrice]);

  const providers = Array.from(new Set(filteredData.map(d => d.providerGroup)));
  
  // A palette for different providers. Use a simple hash to ensure stable colors 
  // even when the providers list is filtered.
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
  ];

  const getProviderColor = (provider: string) => {
    let hash = 0;
    for (let i = 0; i < provider.length; i++) {
      hash = provider.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Input vs Output Price per 1M Tokens (USD)</h3>
          <p className="text-sm text-gray-500 mt-1">Compare model pricing efficiency.</p>
        </div>
        
        {/* Slider Controls */}
        <div className="w-full md:w-64 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <label className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
            <span>Max Input Price ($)</span>
            <span className="text-blue-600">${maxInputPrice}</span>
          </label>
          <Slider
            min={0.1}
            max={maxInputPriceLimit}
            step={0.1}
            value={maxInputPrice}
            onChange={(val) => setMaxInputPrice(val as number)}
            trackStyle={{ backgroundColor: '#3b82f6', height: 6 }}
            handleStyle={{
              borderColor: '#3b82f6',
              height: 16,
              width: 16,
              marginTop: -5,
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>$0.1</span>
            <span>$200+</span>
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              dataKey="inputPrice1M" 
              name="Input Price/1M" 
              unit="$" 
              domain={[0, 'dataMax']}
              tick={{ fill: '#6b7280', fontSize: 12 }} 
            />
            <YAxis 
              type="number" 
              dataKey="outputPrice1M" 
              name="Output Price/1M" 
              unit="$" 
              domain={[0, 'dataMax']}
              tick={{ fill: '#6b7280', fontSize: 12 }} 
            />
            <ZAxis type="number" dataKey="contextLength" range={[50, 400]} name="Context" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 shadow-md rounded-lg text-sm z-50 relative">
                      <p className="font-semibold text-gray-800">{data.name}</p>
                      <p className="text-gray-500 text-xs mb-2">{data.provider}</p>
                      <p className="text-blue-600 font-medium">Input: ${data.inputPrice1M}/1M</p>
                      <p className="text-green-600 font-medium">Output: ${data.outputPrice1M}/1M</p>
                      <p className="text-gray-600 mt-1">Context: {(data.contextLength / 1000).toFixed(0)}k</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }} 
              onMouseEnter={(e) => setHoveredProvider(e.value || null)}
              onMouseLeave={() => setHoveredProvider(null)}
            />
            
            {/* Draw Scatter Points */}
            {providers.slice(0, 15).map((provider) => (
              <Scatter 
                key={provider} 
                name={provider} 
                data={filteredData.filter(d => d.providerGroup === provider)} 
                fill={getProviderColor(provider)}
                onMouseEnter={() => setHoveredProvider(provider)}
                onMouseLeave={() => setHoveredProvider(null)}
              >
                {filteredData.filter(d => d.providerGroup === provider).map((_entry, index) => {
                  const isFaded = hoveredProvider !== null && hoveredProvider !== provider;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getProviderColor(provider)} 
                      opacity={isFaded ? 0.1 : 0.8}
                      className="transition-opacity duration-200"
                    />
                  );
                })}
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        * Bubble size indicates context window length. Use slider to zoom in on cheaper models. Hover over legend to highlight providers.
      </p>
    </div>
  );
}