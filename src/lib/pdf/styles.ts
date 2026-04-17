import { StyleSheet } from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Brand colors — aligned with app design tokens (globals.css)
// ---------------------------------------------------------------------------

export const colors = {
  navy: "#0B0B1D",
  primary: "#3B82F6",
  text: "#0B0B1D",
  textSecondary: "#494959",
  textMuted: "#828282",
  border: "#0B0B1D",
  background: "#F5F5F5",
  white: "#FFFFFF",
} as const;

// ---------------------------------------------------------------------------
// Base styles shared across all templates
// ---------------------------------------------------------------------------

export const baseStyles = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  h1: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 12,
  },
  h2: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 8,
    marginTop: 16,
  },
  h3: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.text,
  },
  label: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginRight: 6,
  },
  calloutBox: {
    backgroundColor: colors.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 10,
    marginBottom: 12,
  },
  calloutLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  tableHeader: {
    backgroundColor: colors.navy,
    flexDirection: "row" as const,
    padding: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 6,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },
});
