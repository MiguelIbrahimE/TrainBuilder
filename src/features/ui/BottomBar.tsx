import { useGameStore } from '../../store/gameStore';

export function BottomBar() {
  const { network, saveToLocalStorage, loadFromLocalStorage } = useGameStore();

  if (!network) return null;

  const formatMoney = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B`;
    } else if (absAmount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(0)}M`;
    } else if (absAmount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)}K`;
    }
    return `${amount}`;
  };

  const netIncome = network.income - network.expenses;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 px-6 py-3 flex items-center justify-between text-white shadow-2xl">
      {/* Budget Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">💰 Budget</div>
          <div className={`text-xl font-bold ${network.budget < 100_000_000 ? 'text-red-400' : 'text-green-400'}`}>
            €{formatMoney(network.budget)}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">
            {netIncome >= 0 ? '📈 Income' : '📉 Expenses'}
          </div>
          <div className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netIncome >= 0 ? '+' : ''}€{formatMoney(netIncome)}/yr
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-400">
          <div>
            <span className="text-gray-500">Stations:</span>{' '}
            <span className="text-white font-medium">{network.stations.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Tracks:</span>{' '}
            <span className="text-white font-medium">{network.tracks.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Year:</span>{' '}
            <span className="text-white font-medium">{network.gameYear}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={saveToLocalStorage}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        >
          💾 Save
        </button>
        <button
          onClick={loadFromLocalStorage}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        >
          📂 Load
        </button>
      </div>
    </div>
  );
}
