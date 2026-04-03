interface ShopSettings {
  shop_name: string;
  contact: string;
  address: string;
}

let settings: ShopSettings = {
  shop_name: "Shree Chamunda Drycleaners",
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
