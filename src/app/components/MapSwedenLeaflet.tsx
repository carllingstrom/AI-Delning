interface Props {
  aiFilter:  Record<string, boolean>;
  valFilter: Record<string, boolean>;
  onSelectMunicipality?: (name: string) => void;
}

export default function MapSwedenLeaflet({ aiFilter, valFilter, onSelectMunicipality }: Props) {
  // ... existing code ...
  <ForceLayer nodes={nodes} onSelectMunicipality={onSelectMunicipality} />
  // ... existing code ...
}

function ForceLayer({ nodes, onSelectMunicipality }: { nodes: Node[]; onSelectMunicipality?: (name:string)=>void }) {
  // ... existing code ...
  eventHandlers={{
    click: () => {
      setSelected(n.name);
      map.setView([n.lat, n.lng], 7, { animate: true });
      onSelectMunicipality?.(n.name);
    },
  }}
  // ... existing code ...
} 