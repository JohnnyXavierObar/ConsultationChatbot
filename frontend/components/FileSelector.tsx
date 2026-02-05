import { useState } from 'react';

type FileItem = { id: string; name: string; status: 'pending' | 'uploading' | 'ready' };

export default function FileSelector({ files, onSelect }: { files: FileItem[]; onSelect: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      onSelect(newSelection);
      return newSelection;
    });
  };

  return (
    <div className="file-selector p-2 border-b">
      <h3 className="mb-2 font-bold">Select Ready Files for Chat</h3>
      <ul>
        {files.map(f => (
          <li key={f.id} className="flex justify-between items-center mb-1">
            <label className={`cursor-pointer ${f.status !== 'ready' ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                disabled={f.status !== 'ready'}
                checked={selectedIds.includes(f.id)}
                onChange={() => toggleSelect(f.id)}
                className="mr-2"
              />
              {f.name} {f.status !== 'ready' && `(${f.status})`}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
