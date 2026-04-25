import { useGraphContract } from '../../graph/state/useGraphStore'

export function GraphContractPanel() {
  const graphUI = useGraphContract()

  // Syntax highlighting helper for JSON
  const formattedJson = JSON.stringify(graphUI, null, 2)
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let color = 'text-indigo-400' // numbers and booleans
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          color = 'text-purple-300' // keys
        } else {
          color = 'text-green-300' // strings
        }
      }
      return `<span class="${color}">${match}</span>`
    })

  return (
    <aside className="glass-panel p-5 flex flex-col h-full flex-grow border-t-4 border-t-indigo-500 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-wide">GraphUI Output</h2>
          <p className="text-xs text-slate-400">Live JSON payload representation</p>
        </div>
      </div>
      
      <div className="relative flex-grow">
        <div className="absolute top-2 right-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">JSON</div>
        <pre 
          className="h-full w-full min-h-[500px] max-h-[600px] overflow-auto rounded-xl border border-slate-700/50 bg-slate-950/80 p-4 text-[13px] leading-6 shadow-inner"
          dangerouslySetInnerHTML={{ __html: formattedJson }}
        />
      </div>
    </aside>
  )
}
