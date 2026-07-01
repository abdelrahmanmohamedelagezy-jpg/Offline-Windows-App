export interface AppSettings {
  cashierCanViewReports: boolean;
  cashierCanViewExpenses: boolean;
  cashierCanViewBarbers: boolean;
  cashierCanAccessAttendance: boolean;
  instagramHandle: string;
  tiktokHandle: string;
}

const SETTINGS_KEY = "barber_app_settings";

const defaultSettings: AppSettings = {
  cashierCanViewReports: false,
  cashierCanViewExpenses: false,
  cashierCanViewBarbers: false,
  cashierCanAccessAttendance: true,
  instagramHandle: "@omarelsadany",
  tiktokHandle: "@omarelsadany",
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
