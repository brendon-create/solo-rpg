import { useState } from 'react'

export default function STRQuests({ data = {}, onUpdate }) {
  const {
    jogging,
    weightTraining,
    hiit,
    goals = {
      goal1: { name: 'VO2 Max', unit: '', initial: 33, target: 42, current: 33 },
      goal2: { name: '體脂率', unit: '%', initial: 26, target: 18, current: 26 },
      goal3: { name: '5公里跑步', unit: '分鐘', initial: 60, target: 30, current: 60 }
    }
  } = data

  const [showEditGoalModal, setShowEditGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  const toggle = (field) => {
    onUpdate({ [field]: !data[field] })
  }

  const updateGoal = (goalKey, field, value) => {
    let processedValue = value
    if (field !== 'name' && field !== 'unit') {
      // 數值欄位：允許空字串（用於編輯中），否則轉為數字
      processedValue = value === '' ? '' : (parseFloat(value) || 0)
    }
    const newGoals = {
      ...goals,
      [goalKey]: {
        ...goals[goalKey],
        [field]: processedValue
      }
    }
    onUpdate({ goals: newGoals })
  }

  const handleNumberBlur = (goalKey, field, value) => {
    // 失去焦點時，如果是空字串則設為0
    if (value === '') {
      updateGoal(goalKey, field, '0')
    }
  }

  const openEditGoal = (goalKey) => {
    setEditingGoal({ key: goalKey, ...goals[goalKey] })
    setShowEditGoalModal(true)
  }

  const saveEditGoal = () => {
    if (editingGoal) {
      const { key, ...goalData } = editingGoal
      // 確保數值欄位是數字（將空字串轉為0）
      goalData.initial = parseFloat(goalData.initial) || 0
      goalData.target = parseFloat(goalData.target) || 0
      goalData.current = parseFloat(goalData.current) || 0
      // 如果初始值改變了，自動將當前值同步到新的初始值
      const oldInitial = goals[key].initial
      if (goalData.initial !== oldInitial) {
        goalData.current = goalData.initial
      }
      const newGoals = {
        ...goals,
        [key]: goalData
      }
      onUpdate({ goals: newGoals })
    }
    setShowEditGoalModal(false)
  }

  const completedCount = [jogging, weightTraining, hiit].filter(Boolean).length

  // 計算長期目標進度
  const calculateGoalProgress = (goal) => {
    // 確保所有值都是數字（處理可能的空字串）
    const initial = parseFloat(goal.initial) || 0
    const target = parseFloat(goal.target) || 0
    const current = parseFloat(goal.current) || 0
    if (initial === target) return 100
    const progress = ((current - initial) / (target - initial)) * 100
    return Math.max(0, Math.min(100, Math.round(progress)))
  }

  return (
    <div className="bg-gray-800 border-2 border-red-500/50 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-red-300">💪 STR (體力)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側：每日任務 */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-red-300 mb-3">每日任務</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={jogging || false}
                onChange={() => toggle('jogging')}
                className="w-6 h-6 rounded border-2 border-red-500 bg-gray-700 checked:bg-red-500 cursor-pointer"
              />
              <span className={`text-lg ${jogging ? 'text-green-300 line-through' : 'text-gray-300'} group-hover:text-white transition-colors`}>
                🏃 慢跑
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={weightTraining || false}
                onChange={() => toggle('weightTraining')}
                className="w-6 h-6 rounded border-2 border-red-500 bg-gray-700 checked:bg-red-500 cursor-pointer"
              />
              <span className={`text-lg ${weightTraining ? 'text-green-300 line-through' : 'text-gray-300'} group-hover:text-white transition-colors`}>
                🏋️ 重訓
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hiit || false}
                onChange={() => toggle('hiit')}
                className="w-6 h-6 rounded border-2 border-red-500 bg-gray-700 checked:bg-red-500 cursor-pointer"
              />
              <span className={`text-lg ${hiit ? 'text-green-300 line-through' : 'text-gray-300'} group-hover:text-white transition-colors`}>
                ⚡ HIIT
              </span>
            </label>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              完成: {completedCount} / 3
            </p>
          </div>
        </div>

        {/* 右側：長期目標 */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-red-300">💯 STR目標（每週更新）</h3>
          </div>
          <div className="space-y-4">
            {/* 目標1 */}
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300">{goals.goal1.name}</span>
                  <button
                    onClick={() => openEditGoal('goal1')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ⚙️ <span>修改項目與數值</span>
                  </button>
                </div>
                <span className="text-xs text-purple-400">{calculateGoalProgress(goals.goal1)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">初始{goals.goal1.unit && ` (${goals.goal1.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal1.initial}
                    onChange={(e) => updateGoal('goal1', 'initial', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal1', 'initial', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">目標{goals.goal1.unit && ` (${goals.goal1.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal1.target}
                    onChange={(e) => updateGoal('goal1', 'target', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal1', 'target', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-green-500">當前{goals.goal1.unit && ` (${goals.goal1.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal1.current}
                    onChange={(e) => updateGoal('goal1', 'current', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal1', 'current', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-green-600 rounded text-xs text-green-300 font-bold focus:outline-none focus:border-green-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 建議每週更新當前數值</p>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${calculateGoalProgress(goals.goal1)}%` }}
                />
              </div>
            </div>

            {/* 目標2 */}
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300">{goals.goal2.name}</span>
                  <button
                    onClick={() => openEditGoal('goal2')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ⚙️ <span>修改項目與數值</span>
                  </button>
                </div>
                <span className="text-xs text-purple-400">{calculateGoalProgress(goals.goal2)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">初始{goals.goal2.unit && ` (${goals.goal2.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal2.initial}
                    onChange={(e) => updateGoal('goal2', 'initial', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal2', 'initial', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">目標{goals.goal2.unit && ` (${goals.goal2.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal2.target}
                    onChange={(e) => updateGoal('goal2', 'target', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal2', 'target', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-green-500">當前{goals.goal2.unit && ` (${goals.goal2.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal2.current}
                    onChange={(e) => updateGoal('goal2', 'current', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal2', 'current', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-green-600 rounded text-xs text-green-300 font-bold focus:outline-none focus:border-green-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 建議每週更新當前數值</p>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${calculateGoalProgress(goals.goal2)}%` }}
                />
              </div>
            </div>

            {/* 目標3 */}
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300">{goals.goal3.name}</span>
                  <button
                    onClick={() => openEditGoal('goal3')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ⚙️ <span>修改項目與數值</span>
                  </button>
                </div>
                <span className="text-xs text-purple-400">{calculateGoalProgress(goals.goal3)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">初始{goals.goal3.unit && ` (${goals.goal3.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal3.initial}
                    onChange={(e) => updateGoal('goal3', 'initial', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal3', 'initial', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">目標{goals.goal3.unit && ` (${goals.goal3.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal3.target}
                    onChange={(e) => updateGoal('goal3', 'target', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal3', 'target', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-green-500">當前{goals.goal3.unit && ` (${goals.goal3.unit})`}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goals.goal3.current}
                    onChange={(e) => updateGoal('goal3', 'current', e.target.value)}
                    onBlur={(e) => handleNumberBlur('goal3', 'current', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 bg-gray-800 border border-green-600 rounded text-xs text-green-300 font-bold focus:outline-none focus:border-green-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 建議每週更新當前數值</p>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${calculateGoalProgress(goals.goal3)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 編輯目標彈窗 */}
      {showEditGoalModal && editingGoal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-red-500 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-300 mb-4">編輯目標設定</h3>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-300 text-xs">
                💡 <strong>建議：</strong>目標設定時，建議與專家（或任何您慣用的 AI 系統）確認合理的目標
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">目標名稱</label>
                <input
                  type="text"
                  value={editingGoal.name}
                  onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  placeholder="例如：VO2 Max"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">單位（選填）</label>
                <input
                  type="text"
                  value={editingGoal.unit}
                  onChange={(e) => setEditingGoal({ ...editingGoal, unit: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  placeholder="例如：%、公斤、分鐘"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">初始值</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingGoal.initial}
                  onChange={(e) => setEditingGoal({ ...editingGoal, initial: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">目標值</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingGoal.target}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEditGoal}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                儲存
              </button>
              <button
                onClick={() => setShowEditGoalModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
