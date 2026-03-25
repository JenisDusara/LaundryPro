interface ShopSettings {
  shop_name: string;
  contact: string;
  address: string;
}

let settings: ShopSettings = {
  shop_name: "LaundryPro",
  contact: "",
  address: "",
};

export function getSettings(): ShopSettings {
  return settings;
}

export function updateSettings(data: Partial<ShopSettings>): ShopSettings {
  settings = { ...settings, ...data };
  return settings;
}
