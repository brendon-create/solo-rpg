// 📊 Solo Leveling - Google Apps Script (改進版)
// 此腳本實現「每天一筆記錄」的更新邏輯，避免重複記錄

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

    // INT/MP/CRT tasks - 將tasks數組轉換為字串
    const intTasks = (data.int?.tasks || []).map(t => `${t.name}:${t.completed}`).join(';')
    const mpTasks = (data.mp?.tasks || []).map(t => `${t.name}:${t.completed}`).join(';')
    const crtTasks = (data.crt?.tasks || []).map(t => `${t.name}:${t.completed}`).join(';')

    // 準備要寫入的數據
    const row = [
      todayDateString,
      new Date(), // 最後更新時間
      data.str?.jogging || false,
      data.str?.weightTraining || false,
      data.str?.hiit || false,
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
      data.alcohol?.reason || '',
      data.alcohol?.feeling || ''
    ];

    if (todayRowIndex > 0) {
      // 更新今天的記錄
      const range = sheet.getRange(todayRowIndex, 1, 1, row.length);
      range.setValues([row]);
    } else {
      // 新增今天的記錄
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '數據已儲存',
      action: todayRowIndex > 0 ? 'updated' : 'created'
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
    'STR_慢跑', 'STR_重訓', 'STR_HIIT',
    'STR_目標1名稱', 'STR_目標1單位', 'STR_目標1初始值', 'STR_目標1目標值', 'STR_目標1當前值',
    'STR_目標2名稱', 'STR_目標2單位', 'STR_目標2初始值', 'STR_目標2目標值', 'STR_目標2當前值',
    'STR_目標3名稱', 'STR_目標3單位', 'STR_目標3初始值', 'STR_目標3目標值', 'STR_目標3當前值',
    'HP_飲水(cc)', 'HP_飲水目標(cc)', 'HP_起床時間', 'HP_就寢時間',
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
    '酒精_理由', '酒精_感受'
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
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        hasData: false,
        message: 'Sheet is empty'
      })).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        hasData: false,
        totalDays: totalDays,
        message: 'No data for today'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 解析今天的數據（按照 sheet 的欄位順序）
    const parseTasks = (taskString) => {
      if (!taskString) return [];
      return taskString.split(';').map(item => {
        const [name, completed] = item.split(':');
        return { name, completed: completed === 'true' };
      });
    };
    
    const questData = {
      str: {
        jogging: todayRow[2] || false,
        weightTraining: todayRow[3] || false,
        hiit: todayRow[4] || false,
        goals: {
          goal1: {
            name: todayRow[5] || '',
            unit: todayRow[6] || '',
            initial: todayRow[7] || 0,
            target: todayRow[8] || 0,
            current: todayRow[9] || 0
          },
          goal2: {
            name: todayRow[10] || '',
            unit: todayRow[11] || '',
            initial: todayRow[12] || 0,
            target: todayRow[13] || 0,
            current: todayRow[14] || 0
          },
          goal3: {
            name: todayRow[15] || '',
            unit: todayRow[16] || '',
            initial: todayRow[17] || 0,
            target: todayRow[18] || 0,
            current: todayRow[19] || 0
          }
        }
      },
      hp: {
        water: todayRow[20] || 0,
        waterTarget: todayRow[21] || 2400,
        wakeTime: todayRow[22] || null,
        sleepTime: todayRow[23] || null,
        waterRecords: [], // 這個需要從前端維護
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
        reason: todayRow[46] || '',
        feeling: todayRow[47] || ''
      },
      lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : new Date().toISOString()
    };
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      hasData: true,
      totalDays: totalDays,
      questData: questData,
      lastUpdate: todayRow[1] ? new Date(todayRow[1]).toISOString() : null
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
