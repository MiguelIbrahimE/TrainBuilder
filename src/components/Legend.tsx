export function Legend() {
return (
<div className="space-y-2">
<h2 className="font-medium">Legend</h2>
<div className="space-y-1 text-sm">
<Row color="#dc2626" label="Drivers (red)" />
<Row color="#22c55e" label="Walkers (green)" />
<Row color="#2563eb" label="Train riders (blue)" />
<Row color="#a855f7" label="Cyclists (purple)" />
</div>
<p className="text-xs text-gray-400">More blue ⇒ more transit usage. More red ⇒ more car trips.</p>
</div>
)
}


function Row({ color, label }: { color: string; label: string }) {
return (
<div className="flex items-center gap-2">
<span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: color }} />
<span>{label}</span>
</div>
)
}