// 📊 Solo RPG by BCCT - Google Apps Script
// 此腳本實現「每天一筆記錄」的更新邏輯，避免重複記錄
// @version 1.1.0
// @lastUpdate 2026-02-17

const SCRIPT_VERSION = "1.1.0";

function getVersion() {
  return ContentService.createTextOutput(JSON.stringify({
    version: SCRIPT_VERSION,
    lastUpdate: "2026-02-17"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // 檢查是否已有表頭
    if (sheet.getLastRow() === 0) {
      initializeSheet(sheet);
    }

    // 獲取今天的日期（只有日期部分，忽略時間）
    const today = new Date();
    const todayDateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // 查找今天的記錄行
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let todayRowIndex = -1;

    for (let i = 1; i < values.length; i++) { // 從第2行開始（跳過表頭）
      const rowDate = values[i][0];
      if (rowDate) {
        const rowDateString = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDateString === todayDateString) {
          todayRowIndex = i + 1; // Sheet行號從1開始
          break;
        }
      }
    }

    // STR/INT/MP/CRT tasks - 將tasks數組轉換為字串
    const strTasks = (data.str?.dailyTasks || []).map(t => `${t.name}:${t.completed}`).join(';')
    const intTasks = (data.int?.tasks || []).map(t => `${t.name}:${t.completed}`).join(';')
    const mpTasks = (data.mp?.tasks || []).map(t => `${t.name}:${t.completed}`).join(';')
    const crtTasks = (data.crt?.tasks || []).map(t => `${t.name}:${t.completed}`).join(';')

    // waterRecords - 序列化為 JSON 字串
    const waterRecordsJson = JSON.stringify(data.hp?.waterRecords || [])

    // 準備要寫入的數據
    const row = [
      todayDateString,
      new Date(), // 最後更新時間
      data.playerName || '',
      strTasks,
      data.str?.goals?.goal1?.name || '',
      data.str?.goals?.goal1?.unit || '',
      data.str?.goals?.goal1?.initial || 0,
      data.str?.goals?.goal1?.target || 0,
      data.str?.goals?.goal1?.current || 0,
      data.str?.goals?.goal2?.name || '',
      data.str?.goals?.goal2?.unit || '',
      data.str?.goals?.goal2?.initial || 0,
      data.str?.goals?.goal2?.target || 0,
      data.str?.goals?.goal2?.current || 0,
      data.str?.goals?.goal3?.name || '',
      data.str?.goals?.goal3?.unit || '',
      data.str?.goals?.goal3?.initial || 0,
      data.str?.goals?.goal3?.target || 0,
      data.str?.goals?.goal3?.current || 0,
      data.hp?.water || 0,
      waterRecordsJson,
      data.hp?.waterTarget || 2400,
      data.hp?.wakeTime || '',
      data.hp?.sleepTime || '',
      data.hp?.meals?.breakfast || false,
      data.hp?.fasting?.breakfastFast || false,
      data.hp?.meals?.lunch || false,
      data.hp?.meals?.dinner || false,
      data.hp?.fasting?.dinnerFast || false,
      data.hp?.fasting?.fullDayFast || false,
      intTasks,
      mpTasks,
      crtTasks,
      data.gold?.income || '',
      data.gold?.incomeTarget || 3000,
      data.gold?.action1Done || false,
      data.gold?.action1Text || '',
      data.gold?.action2Done || false,
      data.gold?.action2Text || '',
      data.gold?.action3Done || false,
      data.gold?.action3Text || '',
      data.skl?.enabled || false,
      data.skl?.taskName || '',
      data.skl?.completed || false,
      data.rsn?.celebrated || false,
      data.rsn?.gratitude || '',
      data.alcohol?.enabled !== undefined ? data.alcohol.enabled : true,
      data.alcohol?.reason || '',
      data.alcohol?.feeling || ''
    ];

    // 安全檢查：確保不會覆蓋表頭（第1行）
    if (todayRowIndex === 1) {
      throw new Error('錯誤：嘗試覆蓋表頭！資料可能損壞，請檢查 Sheet 結構。');
    }

    // 驗證欄位數量是否匹配
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (row.length !== headerRow.length) {
      throw new Error(`欄位數量不匹配！資料有 ${row.length} 個欄位，但表頭有 ${headerRow.length} 個欄位。請更新 Apps Script 程式碼。`);
    }

    if (todayRowIndex > 1) {
      // 更新今天的記錄（確保不是第1行）
      const range = sheet.getRange(todayRowIndex, 1, 1, row.length);
      range.setValues([row]);
    } else {
      // 新增今天的記錄
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '數據已儲存',
      action: todayRowIndex > 0 ? 'updated' : 'created',
      scriptVersion: SCRIPT_VERSION
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheet(sheet) {
  const headers = [
    '日期',
    '最後更新時間',
    '玩家名稱',
    'STR_每日任務',
    'STR_目標1名稱', 'STR_目標1單位', 'STR_目標1初始值', 'STR_目標1目標值', 'STR_目標1當前值',
    'STR_目標2名稱', 'STR_目標2單位', 'STR_目標2初始值', 'STR_目標2目標值', 'STR_目標2當前值',
    'STR_目標3名稱', 'STR_目標3單位', 'STR_目標3初始值', 'STR_目標3目標值', 'STR_目標3當前值',
    'HP_飲水(cc)', 'HP_飲水記錄JSON', 'HP_飲水目標(cc)', 'HP_起床時間', 'HP_就寢時間',
    'HP_早餐自炊', 'HP_早餐禁食',
    'HP_午餐自炊',
    'HP_晚餐自炊', 'HP_晚餐禁食',
    'HP_全日禁食',
    'INT_任務列表',
    'MP_任務列表',
    'CRT_任務列表',
    'GOLD_收入', 'GOLD_收入目標',
    'GOLD_行動1完成', 'GOLD_行動1內容',
    'GOLD_行動2完成', 'GOLD_行動2內容',
    'GOLD_行動3完成', 'GOLD_行動3內容',
    'SKL_啟用', 'SKL_任務名稱', 'SKL_完成',
    'RSN_慶祝', 'RSN_感恩筆記',
    '酒精_啟用', '酒精_理由', '酒精_感受'
  ];

  sheet.appendRow(headers);

  // 格式化表頭
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#9333ea');
  headerRange.setFontColor('#ffffff');

  // 凍結表頭
  sheet.setFrozenRows(1);
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 如果 sheet 是空的，返回空數據
    if (sheet.getLastRow() === 0) {
      const output = ContentService.createTextOutput(JSON.stringify({
        success: true,
        hasData: false,
        message: 'Sheet is empty'
      }));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }

    // 獲取今天的日期
    const today = new Date();
    const todayDateString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // 查找今天的記錄
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let todayRow = null;
    let totalDays = 0;

    for (let i = 1; i < values.length; i++) {
      totalDays++; // 計算總天數
      const rowDate = values[i][0];
      if (rowDate) {
        const rowDateString = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDateString === todayDateString) {
          todayRow = values[i];
          break;
        }
      }
    }

    // 如果沒有今天的記錄，返回總天數和空數據
    if (!todayRow) {
      const output = ContentService.createTextOutput(JSON.stringify({
        success: true,
        hasData: false,
        totalDays: totalDays,
        message: 'No data for today'
      }));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }

    // 解析今天的數據（按照 sheet 的欄位順序）
    const parseTasks = (taskString) => {
      if (!taskString) return [];
      return taskString.split(';').map((item, index) => {
        const [name, completed] = item.split(':');
        // 基於名稱生成穩定的 id（用名稱的 hash）
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') || `task_${index}`;
        return { id, name, completed: completed === 'true' };
      });
    };

    const questData = {
      playerName: todayRow[2] || '',
      str: {
        dailyTasks: parseTasks(todayRow[3]),
        goals: {
          goal1: {
            name: todayRow[4] || '',
            unit: todayRow[5] || '',
            initial: todayRow[6] || 0,
            target: todayRow[7] || 0,
            current: todayRow[8] || 0
          },
          goal2: {
            name: todayRow[9] || '',
            unit: todayRow[10] || '',
            initial: todayRow[11] || 0,
            target: todayRow[12] || 0,
            current: todayRow[13] || 0
          },
          goal3: {
            name: todayRow[14] || '',
            unit: todayRow[15] || '',
            initial: todayRow[16] || 0,
            target: todayRow[17] || 0,
            current: todayRow[18] || 0
          }
        }
      },
      hp: {
        water: todayRow[19] || 0,
        waterRecords: todayRow[20] ? JSON.parse(todayRow[20]) : [],
        waterTarget: todayRow[21] || 2400,
        wakeTime: todayRow[22] || null,
        sleepTime: todayRow[23] || null,
        wakeTimeGoals: { best: '05:00', great: '05:30', ok: '06:00', late: '06:00+' },
        sleepTimeGoals: { best: '21:00', great: '21:30', ok: '22:00', late: '22:00+' },
        meals: {
          breakfast: todayRow[24] || false,
          lunch: todayRow[26] || false,
          dinner: todayRow[27] || false
        },
        fasting: {
          breakfastFast: todayRow[25] || false,
          dinnerFast: todayRow[28] || false,
          fullDayFast: todayRow[29] || false
        }
      },
      int: {
        tasks: parseTasks(todayRow[30])
      },
      mp: {
        tasks: parseTasks(todayRow[31])
      },
      crt: {
        tasks: parseTasks(todayRow[32])
      },
      gold: {
        income: todayRow[33] || '',
        incomeTarget: todayRow[34] || 3000,
        action1Done: todayRow[35] || false,
        action1Text: todayRow[36] || '',
        action2Done: todayRow[37] || false,
        action2Text: todayRow[38] || '',
        action3Done: todayRow[39] || false,
        action3Text: todayRow[40] || ''
      },
      skl: {
        enabled: todayRow[41] || false,
        taskName: todayRow[42] || '',
        completed: todayRow[43] || false
      },
      rsn: {
        celebrated: todayRow[44] || false,
        gratitude: todayRow[45] || ''
      },
      alcohol: {
        enabled: todayRow[46] !== undefined ? todayRow[46] : true,
        reason: todayRow[47] || '',
        feeling: todayRow[48] || ''
      },
      lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : new Date().toISOString()
    };

    // 🔧 關鍵修復：返回所有歷史數據（最多100天）
    const historyData = [];
    const maxDays = Math.min(values.length - 1, 100); // 最多100天
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowDate = row[0];
      if (rowDate) {
        const rowDateString = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        // 解析每天的進度
        const strTasks = parseTasks(row[3]);
        const intTasks = parseTasks(row[30]);
        const mpTasks = parseTasks(row[31]);
        const crtTasks = parseTasks(row[32]);
        const sklEnabled = row[41] || false;
        const sklCompleted = row[43] || false;
        
        // 計算 GOLD
        const income = parseFloat(row[33]) || 0;
        const incomeTarget = row[34] || 3000;
        const actions = [row[35], row[37], row[39]].filter(Boolean).length;
        const actionScore = actions * 16.67;
        let incomeScore = 0;
        if (income <= incomeTarget) {
          incomeScore = (income / incomeTarget) * 50;
        } else {
          const excess = income - incomeTarget;
          incomeScore = 50 + Math.min((excess / 1000) * 5, 25);
        }
        const goldValue = Math.min(actionScore + incomeScore, 100);
        
        // 計算當天的完成度
        const dayProgress = [
          { stat: 'STR', value: Math.round((strTasks.filter(t => t.completed).length / (strTasks.length || 1)) * 100), fullMark: 100 },
          { stat: 'INT', value: Math.round((intTasks.filter(t => t.completed).length / (intTasks.length || 1)) * 100), fullMark: 100 },
          { stat: 'MP', value: Math.round((mpTasks.filter(t => t.completed).length / (mpTasks.length || 1)) * 100), fullMark: 100 },
          { stat: 'CRT', value: Math.round((crtTasks.filter(t => t.completed).length / (crtTasks.length || 1)) * 100), fullMark: 100 },
          { stat: 'GOLD', value: Math.round(goldValue), fullMark: 100 }
        ];
        
        if (sklEnabled) {
          dayProgress.push({ stat: 'SKL', value: sklCompleted ? 100 : 0, fullMark: 100 });
        }
        
        historyData.push({
          date: rowDateString,
          data: dayProgress,
          rsn: {
            celebrated: row[44] || false,
            gratitude: row[45] || ''
          }
        });
      }
    }

    try {
      const responseData = {
        success: true,
        hasData: true,
        totalDays: totalDays,
        questData: questData,
        historyData: historyData, // 新增：返回所有歷史數據
        lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : null,
        scriptVersion: SCRIPT_VERSION
      };
      
      const output = ContentService.createTextOutput(JSON.stringify(responseData));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    } catch (jsonError) {
      // JSON 序列化失敗，返回不含 historyData 的版本
      Logger.log('警告：JSON 序列化失敗，返回簡化版本: ' + jsonError.toString());
      const output = ContentService.createTextOutput(JSON.stringify({
        success: true,
        hasData: true,
        totalDays: totalDays,
        questData: questData,
        historyData: null, // 發生錯誤時不返回歷史數據
        lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : null,
        scriptVersion: SCRIPT_VERSION,
        warning: 'historyData too large or invalid'
      }));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }

  } catch (error) {
    const output = ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}
