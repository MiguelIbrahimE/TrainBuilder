import { useGameStore } from '../../store/gameStore';

export function TopBar() {
  const { network, saveToLocalStorage, loadFromLocalStorage } = useGameStore();

  if (!network) return null;

  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `€${(amount / 1_000_000_000).toFixed(2)}B`;
    } else if (amount >= 1_000_000) {
      return `€${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000) {
      return `€${(amount / 1_000).toFixed(0)}k`;
    }
    return `€${amount}`;
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between text-white">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold">{network.name}</h1>

        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-400">Budget:</span>{' '}
            <span className={`font-bold ${network.budget < 100_000_000 ? 'text-red-400' : 'text-green-400'}`}>
              {formatMoney(network.budget)}
            </span>
          </div>

          <div>
            <span className="text-gray-400">Income:</span>{' '}
            <span className="font-bold text-green-400">+{formatMoney(network.income)}/yr</span>
          </div>

          <div>
            <span className="text-gray-400">Expenses:</span>{' '}
            <span className="font-bold text-red-400">-{formatMoney(network.expenses)}/yr</span>
          </div>

          <div>
            <span className="text-gray-400">Net:</span>{' '}
            <span className={`font-bold ${network.income - network.expenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {network.income - network.expenses >= 0 ? '+' : ''}{formatMoney(network.income - network.expenses)}/yr
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div className="text-gray-400">
          {network.gameYear}-{network.gameMonth.toString().padStart(2, '0')}
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveToLocalStorage}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            💾 Save
          </button>
          <button
            onClick={loadFromLocalStorage}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            📂 Load
          </button>
        </div>
      </div>
    </div>
  );
}
