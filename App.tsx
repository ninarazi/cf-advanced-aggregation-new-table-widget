
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Check, Sigma, Filter, LayoutGrid, 
  MoreVertical, Pin, Bell, Plus, Grid, Layers, X, MoreHorizontal, 
  Download, Trash2, Edit2, FileText, File, Menu, Info, HelpCircle
} from 'lucide-react';
import { generateMockRows, COLUMNS } from './data/mock';
import { TableRow, TableNode, GroupNode, RowNode, TotalNode } from './types';

export default function App() {
  const [rawData] = useState<TableRow[]>(generateMockRows(120));
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeGroups, setActiveGroups] = useState<string[]>(['manager', 'country']);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [menuConfig, setMenuConfig] = useState<{ x: number, y: number, colId: string } | null>(null);

  const handleGroupAction = (colId: string) => {
    setActiveGroups(prev => {
      if (prev.includes(colId)) return prev;
      return [...prev, colId];
    });
    setExpandedIds(new Set()); 
    setMenuConfig(null);
  };

  const removeGroup = (colId: string) => {
    setActiveGroups(prev => prev.filter(id => id !== colId));
    setExpandedIds(new Set());
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return rawData;
    const lower = searchTerm.toLowerCase();
    return rawData.filter(r => 
      r.name.toLowerCase().includes(lower) || 
      r.company.name.toLowerCase().includes(lower)
    );
  }, [rawData, searchTerm]);

  // Recursive Tree Construction
  const tree = useMemo(() => {
    const buildTree = (data: TableRow[], groupKeys: string[], level: number, parentPath: string): TableNode[] => {
      if (groupKeys.length === 0) {
        return data.map(r => ({ 
          type: 'row', 
          id: `${parentPath}|${r.id}`, 
          data: r, 
          level 
        }));
      }
      const [key, ...remaining] = groupKeys;
      const groupsMap = new Map<string, TableRow[]>();
      data.forEach(item => {
        let val = '';
        if (key === 'manager') val = item.manager.name;
        else if (key === 'company') val = item.company.name;
        else val = String((item as any)[key]);
        if (!groupsMap.has(val)) groupsMap.set(val, []);
        groupsMap.get(val)!.push(item);
      });

      return Array.from(groupsMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([val, items]) => {
          const path = `${parentPath}/${val}`;
          return {
            type: 'group',
            id: path,
            path,
            level,
            groupKey: key,
            groupValue: val,
            itemCount: items.length,
            children: buildTree(items, remaining, level + 1, path)
          };
        });
    };
    return buildTree(filteredData, activeGroups, 0, 'root');
  }, [filteredData, activeGroups]);

  // Flattened structure for rendering
  const visibleNodes = useMemo(() => {
    const flattened: TableNode[] = [];

    const calculateAggregates = (nodes: TableNode[]): Record<string, number> => {
      const stats: Record<string, number> = {};
      const getLeafRows = (n: TableNode): TableRow[] => {
        if (n.type === 'row') return [n.data];
        if (n.type === 'total') return [];
        return n.children.flatMap(getLeafRows);
      };
      const leafRows = nodes.flatMap(getLeafRows);
      
      COLUMNS.forEach(col => {
        if (col.type === 'number') {
          stats[col.id] = leafRows.reduce((acc, r) => acc + (Number((r as any)[col.id]) || 0), 0);
        }
      });
      return stats;
    };

    const traverse = (nodes: TableNode[], isRoot = false) => {
      nodes.forEach(node => {
        flattened.push(node);
        if (node.type === 'group' && expandedIds.has(node.id)) {
          traverse(node.children);
          flattened.push({
            type: 'total',
            id: `total-${node.id}`,
            label: `Total ${node.groupValue}`,
            level: node.level + 1,
            stats: calculateAggregates(node.children)
          } as TotalNode);
        }
      });

      if (isRoot && nodes.length > 0) {
        flattened.push({
          type: 'total',
          id: 'grand-total',
          label: 'Total',
          level: 0,
          stats: calculateAggregates(nodes)
        } as TotalNode);
      }
    };

    traverse(tree, true);
    return flattened;
  }, [tree, expandedIds]);

  const toggleExpansion = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleNode = (node: TableNode) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      const getLeafIds = (n: TableNode): string[] => {
        if (n.type === 'row') return [n.id];
        if (n.type === 'total') return [];
        return n.children.flatMap(getLeafIds);
      };
      
      const ids = getLeafIds(node);
      const allSelected = ids.every(id => prev.has(id));
      
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      
      return next;
    });
  };

  const getSelectionState = (node: TableNode) => {
    if (node.type === 'total') return 'disabled';
    if (node.type === 'row') return selectedRowIds.has(node.id) ? 'checked' : 'unchecked';
    const getLeafIds = (n: TableNode): string[] => {
      if (n.type === 'row') return [n.id];
      if (n.type === 'total') return [];
      return n.children.flatMap(getLeafIds);
    }
    const ids = getLeafIds(node);
    if (ids.length === 0) return 'unchecked';
    const selectedCount = ids.filter(id => selectedRowIds.has(id)).length;
    
    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === ids.length) return 'checked';
    return 'indeterminate';
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F1F5F9] text-[13px] font-sans">
      {/* Top Navbar */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Menu className="w-5 h-5 text-blue-600 cursor-pointer" />
          <nav className="flex items-center gap-5">
            {['Home', 'New', 'Workspaces', 'Recents'].map((nav, i) => (
              <button key={nav} className={`text-[12px] font-medium flex items-center gap-1 transition-colors ${i === 0 ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>
                {i === 0 ? <Grid className="w-4 h-4"/> : nav} {nav !== 'Home' && <ChevronDown className="w-3.5 h-3.5 opacity-40"/>}
              </button>
            ))}
          </nav>
          <div className="relative ml-2">
            <input 
              type="text" 
              placeholder="Search" 
              className="pl-4 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-md w-96 text-[12px] outline-none focus:ring-1 focus:ring-blue-200 transition-all" 
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
          </div>
        </div>
        <div className="flex items-center gap-5">
           <LayoutGrid className="w-5 h-5 text-slate-400 cursor-pointer" />
           <HelpCircle className="w-5 h-5 text-slate-400 cursor-pointer" />
           <Bell className="w-5 h-5 text-slate-400 cursor-pointer" />
           <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm overflow-hidden bg-orange-500 flex items-center justify-center text-[11px] font-bold text-white">EM</div>
        </div>
      </header>

      {/* Widget Toolbar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-slate-800 text-[16px]">New Table Widget</h1>
        </div>
        <div className="flex items-center gap-3">
           <button className="text-[13px] font-medium text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">Aktionen <ChevronDown className="w-3.5 h-3.5 opacity-40"/></button>
           <button className="text-[13px] font-medium text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors">Eigenschaften</button>
           <button className="bg-blue-600 text-white px-5 py-1.5 rounded-md text-[13px] font-semibold shadow-sm hover:bg-blue-700 transition-colors">Layout</button>
           <button className="text-[13px] font-medium text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors">Versionen</button>
           <div className="w-px h-5 bg-slate-200 mx-1" />
           <X className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
           <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
        </div>
      </div>

      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-t-lg flex flex-col overflow-hidden shadow-sm">
          <div className="h-12 flex items-center px-4 justify-between border-b border-slate-200">
             <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Search" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] w-56 outline-none focus:border-blue-300 transition-all" 
                  />
                </div>
                <button className="bg-[#0061FE] text-white px-4 py-1.5 rounded-md text-[12px] font-bold shadow-sm hover:bg-blue-700 transition-all">Add New Item</button>
                <div className="h-5 w-px bg-slate-200 mx-2" />
                <Filter className="w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-600" />
                <LayoutGrid className="w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-600" />
                <Download className="w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-600" />
                <Trash2 className="w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-600" />
                <Edit2 className="w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-600" />
                <Sigma className="w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-600" />
             </div>
             <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-[12px] font-medium cursor-pointer hover:bg-slate-50 transition-colors">
                  <Layers className="w-4 h-4 text-slate-400"/> Compact <ChevronDown className="w-3.5 h-3.5 opacity-40"/>
                </div>
                <HelpCircle className="w-5 h-5 text-slate-300 cursor-pointer" />
                <MoreVertical className="w-5 h-5 text-slate-300 cursor-pointer" />
             </div>
          </div>

          {/* AG-Grid Style Multi-Grouping Bar */}
          <div className="h-10 flex items-center px-5 bg-white border-b border-slate-200 text-[11px] select-none">
             <span className="text-slate-500 font-bold mr-4">Group by:</span>
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
               {activeGroups.length === 0 ? (
                 <span className="italic text-slate-400">Drag column here to group</span>
               ) : (
                 <>
                   {activeGroups.map(gid => (
                     <div key={gid} className="flex items-center gap-2 bg-[#E9F2FF] text-[#1D4ED8] border border-[#BFDBFE] px-2.5 py-1 rounded-md font-bold shadow-sm transition-transform hover:scale-105">
                       <Layers className="w-3.5 h-3.5 opacity-70" />
                       {COLUMNS.find(c => c.id === gid)?.label}
                       <div className="flex items-center gap-1 border-l border-blue-200 pl-1 ml-1">
                         <Sigma className="w-3 h-3 cursor-pointer hover:text-blue-900" />
                         <button onClick={() => removeGroup(gid)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                       </div>
                     </div>
                   ))}
                   <button className="text-blue-600 font-bold ml-3 hover:underline whitespace-nowrap">Expand All</button>
                   <div className="w-px h-3 bg-slate-200 mx-2" />
                   <button onClick={() => setExpandedIds(new Set())} className="text-slate-400 font-bold hover:underline whitespace-nowrap">Collapse All</button>
                 </>
               )}
             </div>
          </div>
        </div>

        {/* The Grid Table */}
        <div className="flex-1 bg-white border-x border-b border-slate-200 overflow-auto relative rounded-b-lg shadow-inner">
          <table className="w-full border-collapse table-fixed min-w-[1500px]">
            <thead className="sticky top-0 z-40 shadow-sm">
              <tr className="h-[36px] bg-[#5f6b7d]">
                <th className="w-[44px] bg-[#5f6b7d] p-0 sticky left-0 z-50 border-r border-slate-400/30">
                  <div className="flex items-center justify-center">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-transparent border-slate-300/40 cursor-pointer" />
                  </div>
                </th>
                <th className="w-[300px] bg-[#5f6b7d] px-4 text-left text-white text-[11px] font-black uppercase tracking-widest sticky left-[44px] z-50 border-r border-slate-400/30">
                  <div className="flex items-center justify-between">
                    <span>Group</span>
                    <MoreVertical className="w-3.5 h-3.5 opacity-40" />
                  </div>
                </th>
                {COLUMNS.map(col => (
                  <th key={col.id} style={{ width: col.width }} className="px-4 text-left text-white text-[11px] font-black uppercase tracking-widest group border-r border-slate-400/30 relative last:border-r-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 truncate">
                        <div className="w-px h-3 bg-white/20 mr-2" />
                        <span className="truncate">{col.label}</span>
                      </div>
                      <MoreHorizontal 
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-white/20 rounded transition-all p-0.5" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuConfig({ x: e.clientX, y: e.clientY, colId: col.id });
                        }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleNodes.map((node, index) => {
                const s = getSelectionState(node);
                
                if (node.type === 'total') {
                  return (
                    <tr key={node.id} className="h-[34px] bg-slate-50/80 border-b border-slate-200 font-bold text-slate-800">
                      <td className="sticky left-0 bg-slate-50 border-r border-slate-200 z-10 p-0"></td>
                      <td className="sticky left-[44px] bg-slate-50 border-r border-slate-200 px-4 z-10">
                         <div className="flex items-center h-full" style={{ paddingLeft: `${node.level * 24}px` }}>
                            <span className="text-[11px]">{node.label}</span>
                         </div>
                      </td>
                      {COLUMNS.map(col => (
                        <td key={col.id} className={`px-4 border-r border-slate-100 text-[12px] truncate ${col.type === 'number' ? 'text-right font-mono text-blue-700' : ''}`}>
                          {col.type === 'number' ? node.stats[col.id]?.toLocaleString() : ''}
                        </td>
                      ))}
                    </tr>
                  );
                }

                if (node.type === 'group') {
                  const isExpanded = expandedIds.has(node.id);
                  return (
                    <tr 
                      key={node.id} 
                      className="h-[34px] bg-white border-b border-slate-100 sticky z-30 hover:bg-slate-50 transition-colors"
                      style={{ top: `${(node.level + 1) * 36}px` }}
                    >
                      <td className="sticky left-0 bg-white border-r border-slate-200 z-10 p-0">
                         <div className="flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={s === 'checked'}
                              ref={el => { if (el) el.indeterminate = s === 'indeterminate'; }}
                              onChange={() => handleToggleNode(node)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                         </div>
                      </td>
                      <td className="sticky left-[44px] bg-white border-r border-slate-200 px-4 z-10">
                         <div className="flex items-center h-full relative" style={{ paddingLeft: `${node.level * 24}px` }}>
                            {/* Nesting lines */}
                            {Array.from({ length: node.level }).map((_, i) => (
                              <div key={i} className="absolute border-l border-slate-200 h-full" style={{ left: `${i * 24 + 10}px`, top: 0 }} />
                            ))}
                            <button 
                              onClick={() => toggleExpansion(node.id)} 
                              className="p-1 hover:bg-slate-200 rounded-md mr-2 transition-colors"
                            >
                               {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-800"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                            </button>
                            <span className="font-semibold text-slate-800 text-[13px] truncate">{node.groupValue}</span>
                            <span className="text-[11px] text-slate-400 font-medium ml-2">({node.itemCount})</span>
                         </div>
                      </td>
                      <td colSpan={COLUMNS.length} className="bg-slate-50/5"></td>
                    </tr>
                  );
                }

                const row = node.data;
                return (
                  <tr key={node.id} className="h-[34px] border-b border-slate-100 hover:bg-blue-50/40 transition-colors group">
                    <td className="sticky left-0 bg-white border-r border-slate-100 z-10 p-0 group-hover:bg-blue-50/50">
                       <div className="flex items-center justify-center h-full">
                          <input 
                            type="checkbox" 
                            checked={s === 'checked'}
                            onChange={() => handleToggleNode(node)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                          />
                       </div>
                    </td>
                    <td className="sticky left-[44px] bg-white border-r border-slate-100 px-4 z-10 group-hover:bg-blue-50/50">
                       <div className="relative h-full w-full" style={{ paddingLeft: `${node.level * 24}px` }}>
                          {Array.from({ length: node.level }).map((_, i) => (
                             <div key={i} className="absolute border-l border-slate-200 h-full" style={{ left: `${i * 24 + 10}px`, top: 0 }} />
                          ))}
                          <div className="absolute w-4 h-px bg-slate-200" style={{ left: `${(node.level - 1) * 24 + 10}px`, top: '17px' }} />
                       </div>
                    </td>
                    {COLUMNS.map(col => (
                      <td key={col.id} className={`px-4 border-r border-slate-100 text-[13px] truncate ${col.type === 'number' ? 'text-right font-mono text-slate-500' : 'text-slate-700'}`}>
                         {col.id === 'name' ? (
                           <div className="flex items-center gap-2.5">
                             <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold shadow-xs">
                               {row.manager.initials}
                             </div>
                             <span className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">{row.name}</span>
                           </div>
                         ) : col.type === 'boolean' ? (
                           <div className="flex items-center justify-center">
                              <Layers className={`w-4 h-4 ${row.external ? 'text-blue-500' : 'text-slate-200'}`} />
                           </div>
                         ) : col.type === 'color' ? (
                           <div className="flex items-center gap-2">
                             <div className="w-4 h-4 rounded border border-white shadow-xs" style={{ backgroundColor: row.favColor }}></div>
                             <span className="text-[11px] font-mono opacity-60 uppercase">{row.favColor}</span>
                           </div>
                         ) : col.type === 'files' ? (
                           <div className="flex gap-1.5 justify-center opacity-40 group-hover:opacity-80 transition-opacity">
                             <FileText className="w-4 h-4 text-slate-500" />
                             <File className="w-4 h-4 text-slate-500" />
                           </div>
                         ) : (row as any)[col.id]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* HIT Footer as per Screenshot */}
        <div className="h-10 bg-white border-x border-b border-slate-200 rounded-b-lg flex items-center px-4 text-[12px] text-slate-500">
           <span>{filteredData.length} hits | {selectedRowIds.size > 0 ? `${selectedRowIds.size} rows selected` : 'No rows selected'}</span>
        </div>
      </main>

      {/* Dynamic Column Context Menu */}
      {menuConfig && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuConfig(null)} />
          <div 
            className="fixed z-[101] bg-white border border-slate-200 shadow-xl rounded-lg w-64 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ left: Math.min(menuConfig.x, window.innerWidth - 270), top: Math.min(menuConfig.y, window.innerHeight - 350) }}
          >
             <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Column Actions</div>
             <button onClick={() => handleGroupAction(menuConfig.colId)} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-blue-700 font-bold flex items-center gap-3 transition-colors">
               <Layers className="w-4 h-4" /> Group by {COLUMNS.find(c => c.id === menuConfig.colId)?.label}
             </button>
             <div className="h-px bg-slate-100 my-1 mx-2" />
             <button onClick={() => setMenuConfig(null)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600 flex items-center gap-3">
               <Filter className="w-4 h-4 opacity-50" /> Filter Settings...
             </button>
             <button onClick={() => setMenuConfig(null)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600 flex items-center gap-3">
               <Sigma className="w-4 h-4 opacity-50" /> Aggregation Functions
             </button>
             <div className="h-px bg-slate-100 my-1 mx-2" />
             <button onClick={() => setMenuConfig(null)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600">Sort Ascending</button>
             <button onClick={() => setMenuConfig(null)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-600">Sort Descending</button>
             <div className="h-px bg-slate-100 my-1 mx-2" />
             <button onClick={() => { setActiveGroups([]); setMenuConfig(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-3">
               <X className="w-4 h-4" /> Reset All Grouping
             </button>
          </div>
        </>
      )}

      {/* Global Status Footer */}
      <footer className="h-7 bg-[#111827] flex items-center px-4 justify-between shrink-0 text-white/50 text-[10px] font-bold">
         <div className="flex items-center gap-4">
            <span className="uppercase tracking-widest text-blue-400">cplace NextGen Platform</span>
            <div className="h-3 w-px bg-white/10" />
            <span className="opacity-40">MULTI_GROUPING_READY</span>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-white/80">RENDER_LATENCY: 12ms</span>
         </div>
      </footer>
    </div>
  );
}
