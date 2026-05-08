/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Aafiya Siddha Varmam Clinic - Backend Sync Engine (v3.0 - Billing & Clinical)
 * Simplified 12-Field Schema + Media Uploads.
 */

const SHEET_NAME = "Sheet1"; 
const MEDIA_FOLDER_NAME = "ClinicalMedia";

// ─── Core Handlers (GET/POST) ────────────────────────────────────────

function doGet() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map((row, i) => {
    let obj = {};
    headers.forEach((h, j) => {
      obj[h] = row[j];
    });
    obj.rowIndex = i; // Array index for UI
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    
    // 1. Process Media Uploads
    const mediaUrls = [];
    if (data.files && data.files.length > 0) {
      const folder = getOrCreateMediaFolder();
      data.files.forEach(file => {
        const blob = Utilities.newBlob(Utilities.base64Decode(file.data), file.type, file.name);
        const driveFile = folder.createFile(blob);
        driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        mediaUrls.push(`${driveFile.getId()}|${file.type}|${file.name}`);
      });
    }

    // 2. Map Data to Sheet1 (Locked to IST)
    const timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    const headers = getCoreHeaders();

    const rowData = headers.map(header => {
      if (header === "Timestamp") return timestamp;
      if (header.startsWith("Media")) {
        const index = parseInt(header.replace("Media", "")) - 1;
        return mediaUrls[index] || data[header] || "";
      }
      const val = data[header];
      return val !== undefined ? val : "";
    });

    // 3. Save Action (Strategy: Update if rowIndex & action='update' are present, otherwise Append)
    const isUpdate = (data.action === 'update' || data.action === 'EDIT') && data.rowIndex !== undefined;
    
    if (isUpdate) {
      // The API sends (assessmentIndex + 2) which is the ACTUAL 1-based row number in Sheet1.
      const actualRow = Number(data.rowIndex); 
      if (!isNaN(actualRow) && actualRow > 1) {
        sheet.getRange(actualRow, 1, 1, rowData.length).setValues([rowData]);
        return createJsonResponse({ 
          success: true, 
          action: 'update', 
          row: actualRow,
          message: "Record successfully replaced at Row " + actualRow 
        });
      }
    }

    // Default: Append new record
    sheet.appendRow(rowData);
    return createJsonResponse({ 
      success: true, 
      action: 'create', 
      row: sheet.getLastRow(),
      message: "New record successfully appended." 
    });
    
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// ─── Utility & Fix Functions ──────────────────────────────────

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

function getOrCreateMediaFolder() {
  const folders = DriveApp.getFoldersByName(MEDIA_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(MEDIA_FOLDER_NAME);
}

/**
 * 🚀 PRODUCTION FIX (RUN THIS ONCE)
 * Select 'migrateClinicalData' and click RUN to fix your Sheet1 structure.
 */
function migrateClinicalData() {
  const sheet = getOrCreateSheet();
  
  Logger.log("Starting Clean Wipe and Header Setup on Sheet1...");
  
  // Wipe everything
  sheet.clear();
  
  // Re-set Header Titles on Sheet1
  setupHeaders();
  Logger.log("FIX COMPLETE: Sheet1 is now completely clean with the new 12-field schema.");
}

function getCoreHeaders() {
  return [
    "PatientName",
    "Date",
    "PhoneNumber",
    "MedicalHistory",
    "BPSugar",
    "ChiefComplaint",
    "Diagnosis",
    "TreatmentDone",
    "AdviceGiven",
    "FeesCollected",
    "PaidAmount",
    "PendingAmount",
    "Media1",
    "Media2",
    "Media3",
    "Media4",
    "Timestamp"
  ];
}

function setupHeaders() {
  const sheet = getOrCreateSheet();
  const headers = getCoreHeaders();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setFontWeight("bold");
  range.setBackground("#f3f3f3");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}
