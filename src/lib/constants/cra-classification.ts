// CRA (Cyber Resilience Act) classification data
// Based on Annexes III and IV of the EU CRA regulation

export type CraCategory =
  | "default"
  | "important_class_i"
  | "important_class_ii"
  | "critical";

export type ConformityRoute =
  | "module_a"
  | "module_b_c"
  | "module_h"
  | "european_certification";

export interface CraSubcategory {
  id: string;
  category: CraCategory;
  group: string;
}

export interface ClassificationResult {
  category: CraCategory;
  conformityRoute: ConformityRoute;
  requiresNotifiedBody: boolean;
}

// ---------------------------------------------------------------------------
// Annex III — Important Products with Digital Elements
// ---------------------------------------------------------------------------

export const IMPORTANT_CLASS_I: CraSubcategory[] = [
  { id: "identity_management", category: "important_class_i", group: "identity_security" },
  { id: "browsers", category: "important_class_i", group: "identity_security" },
  { id: "password_managers", category: "important_class_i", group: "identity_security" },
  { id: "malware_detection", category: "important_class_i", group: "security_tools" },
  { id: "vpn", category: "important_class_i", group: "security_tools" },
  { id: "siem", category: "important_class_i", group: "security_tools" },
  { id: "boot_managers", category: "important_class_i", group: "system_software" },
  { id: "bios_uefi", category: "important_class_i", group: "system_software" },
  { id: "routers_modems", category: "important_class_i", group: "network_devices" },
  { id: "switches", category: "important_class_i", group: "network_devices" },
  { id: "iot_general", category: "important_class_i", group: "connected_devices" },
  { id: "smart_home_assistants", category: "important_class_i", group: "connected_devices" },
  { id: "smart_home_cameras", category: "important_class_i", group: "connected_devices" },
  { id: "smart_home_locks", category: "important_class_i", group: "connected_devices" },
  { id: "wearables", category: "important_class_i", group: "connected_devices" },
  { id: "connected_toys", category: "important_class_i", group: "connected_devices" },
  { id: "personal_health_devices", category: "important_class_i", group: "connected_devices" },
  { id: "network_management", category: "important_class_i", group: "network_devices" },
];

export const IMPORTANT_CLASS_II: CraSubcategory[] = [
  { id: "hypervisors_container_runtime", category: "important_class_ii", group: "virtualization" },
  { id: "firewalls", category: "important_class_ii", group: "network_security" },
  { id: "intrusion_detection", category: "important_class_ii", group: "network_security" },
  { id: "microprocessors_tamper_resistant", category: "important_class_ii", group: "hardware_security" },
  { id: "microcontrollers_tamper_resistant", category: "important_class_ii", group: "hardware_security" },
  { id: "asics_tamper_resistant", category: "important_class_ii", group: "hardware_security" },
  { id: "operating_systems", category: "important_class_ii", group: "system_software" },
  { id: "pki_digital_certificates", category: "important_class_ii", group: "cryptography" },
  { id: "industrial_automation_plc", category: "important_class_ii", group: "industrial" },
  { id: "industrial_automation_scada", category: "important_class_ii", group: "industrial" },
  { id: "cpads", category: "important_class_ii", group: "industrial" },
];

// ---------------------------------------------------------------------------
// Annex IV — Critical Products with Digital Elements
// ---------------------------------------------------------------------------

export const CRITICAL: CraSubcategory[] = [
  { id: "hardware_security_modules", category: "critical", group: "cryptographic_hardware" },
  { id: "smart_cards", category: "critical", group: "cryptographic_hardware" },
  { id: "smart_card_readers", category: "critical", group: "cryptographic_hardware" },
  { id: "smart_meter_gateways", category: "critical", group: "infrastructure" },
  { id: "secure_crypto_processing_units", category: "critical", group: "cryptographic_hardware" },
];

// ---------------------------------------------------------------------------
// Excluded sectors (Article 2 exclusions)
// ---------------------------------------------------------------------------

export const EXCLUDED_SECTORS = [
  "medical_devices",
  "motor_vehicles",
  "marine_equipment",
  "aviation",
  "military_defense",
  "national_security",
] as const;

export type ExcludedSector = (typeof EXCLUDED_SECTORS)[number];

// ---------------------------------------------------------------------------
// All subcategories combined (for step 5 UI)
// ---------------------------------------------------------------------------

export const ALL_SUBCATEGORIES: CraSubcategory[] = [
  ...IMPORTANT_CLASS_I,
  ...IMPORTANT_CLASS_II,
  ...CRITICAL,
];

// Groups for UI display ordering
export const SUBCATEGORY_GROUPS = [
  "identity_security",
  "security_tools",
  "system_software",
  "network_devices",
  "connected_devices",
  "virtualization",
  "network_security",
  "hardware_security",
  "cryptography",
  "industrial",
  "cryptographic_hardware",
  "infrastructure",
] as const;

// ---------------------------------------------------------------------------
// Classification logic
// ---------------------------------------------------------------------------

export function classifyProduct(
  subcategoryId: string | null
): ClassificationResult {
  if (!subcategoryId) {
    return {
      category: "default",
      conformityRoute: "module_a",
      requiresNotifiedBody: false,
    };
  }

  const sub = ALL_SUBCATEGORIES.find((s) => s.id === subcategoryId);
  if (!sub) {
    return {
      category: "default",
      conformityRoute: "module_a",
      requiresNotifiedBody: false,
    };
  }

  switch (sub.category) {
    case "important_class_i":
      return {
        category: "important_class_i",
        conformityRoute: "module_a",
        requiresNotifiedBody: false,
      };
    case "important_class_ii":
      return {
        category: "important_class_ii",
        conformityRoute: "module_h",
        requiresNotifiedBody: true,
      };
    case "critical":
      return {
        category: "critical",
        conformityRoute: "european_certification",
        requiresNotifiedBody: true,
      };
    default:
      return {
        category: "default",
        conformityRoute: "module_a",
        requiresNotifiedBody: false,
      };
  }
}
