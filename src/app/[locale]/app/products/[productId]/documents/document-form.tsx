"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentType } from "./actions";

// ---------------------------------------------------------------------------
// Form field definitions per document type
// ---------------------------------------------------------------------------

interface FieldDef {
  key: string;
  labelKey: string;
  placeholderKey: string;
  hintKey?: string;
  type: "input" | "textarea" | "date" | "select";
  options?: { value: string; labelKey: string }[];
}

export const DOC_FIELDS: Record<DocumentType, FieldDef[]> = {
  declaration_of_conformity: [
    { key: "manufacturer_name", labelKey: "manufacturerName", placeholderKey: "manufacturerNamePlaceholder", type: "input" },
    { key: "manufacturer_address", labelKey: "manufacturerAddress", placeholderKey: "manufacturerAddressPlaceholder", type: "textarea" },
    { key: "product_name", labelKey: "productName", placeholderKey: "productNamePlaceholder", type: "input" },
    { key: "product_identification", labelKey: "productIdentification", placeholderKey: "productIdentificationPlaceholder", type: "input" },
    { key: "conformity_statement", labelKey: "conformityStatement", placeholderKey: "conformityStatementPlaceholder", type: "textarea" },
    { key: "standards_applied", labelKey: "standardsApplied", placeholderKey: "standardsAppliedPlaceholder", hintKey: "standardsAppliedHint", type: "textarea" },
    { key: "notified_body_name", labelKey: "notifiedBodyName", placeholderKey: "notifiedBodyNamePlaceholder", type: "input" },
    { key: "notified_body_number", labelKey: "notifiedBodyNumber", placeholderKey: "notifiedBodyNumberPlaceholder", type: "input" },
    { key: "place", labelKey: "place", placeholderKey: "placePlaceholder", type: "input" },
    { key: "date", labelKey: "date", placeholderKey: "", type: "date" },
    { key: "signatory_name", labelKey: "signatoryName", placeholderKey: "signatoryNamePlaceholder", type: "input" },
    { key: "signatory_position", labelKey: "signatoryPosition", placeholderKey: "signatoryPositionPlaceholder", type: "input" },
  ],
  vulnerability_disclosure_policy: [
    { key: "policy_scope", labelKey: "policyScope", placeholderKey: "policyScopePlaceholder", type: "textarea" },
    { key: "reporting_channels", labelKey: "reportingChannels", placeholderKey: "reportingChannelsPlaceholder", type: "textarea" },
    { key: "response_timeline", labelKey: "responseTimeline", placeholderKey: "responseTimelinePlaceholder", type: "textarea" },
    { key: "disclosure_timeline", labelKey: "disclosureTimeline", placeholderKey: "disclosureTimelinePlaceholder", type: "textarea" },
    { key: "safe_harbor_statement", labelKey: "safeHarborStatement", placeholderKey: "safeHarborStatementPlaceholder", type: "textarea" },
  ],
  incident_report: [
    { key: "incident_title", labelKey: "incidentTitle", placeholderKey: "incidentTitlePlaceholder", type: "input" },
    { key: "incident_date", labelKey: "incidentDate", placeholderKey: "", type: "date" },
    { key: "incident_description", labelKey: "incidentDescription", placeholderKey: "incidentDescriptionPlaceholder", type: "textarea" },
    { key: "impact_assessment", labelKey: "impactAssessment", placeholderKey: "impactAssessmentPlaceholder", type: "textarea" },
    { key: "mitigation_actions", labelKey: "mitigationActions", placeholderKey: "mitigationActionsPlaceholder", type: "textarea" },
    { key: "notification_date", labelKey: "notificationDate", placeholderKey: "", type: "date" },
  ],
  risk_assessment: [
    { key: "risk_title", labelKey: "riskTitle", placeholderKey: "riskTitlePlaceholder", type: "input" },
    { key: "threat_description", labelKey: "threatDescription", placeholderKey: "threatDescriptionPlaceholder", type: "textarea" },
    { key: "vulnerabilities_identified", labelKey: "vulnerabilitiesIdentified", placeholderKey: "vulnerabilitiesIdentifiedPlaceholder", type: "textarea" },
    {
      key: "risk_level",
      labelKey: "riskLevel",
      placeholderKey: "",
      type: "select",
      options: [
        { value: "low", labelKey: "riskLevelLow" },
        { value: "medium", labelKey: "riskLevelMedium" },
        { value: "high", labelKey: "riskLevelHigh" },
        { value: "critical", labelKey: "riskLevelCritical" },
      ],
    },
    { key: "mitigation_plan", labelKey: "mitigationPlan", placeholderKey: "mitigationPlanPlaceholder", type: "textarea" },
    { key: "residual_risk", labelKey: "residualRisk", placeholderKey: "residualRiskPlaceholder", type: "textarea" },
  ],
  technical_documentation: [
    { key: "tech_doc_scope", labelKey: "techDocScope", placeholderKey: "techDocScopePlaceholder", type: "textarea" },
    { key: "design_description", labelKey: "designDescription", placeholderKey: "designDescriptionPlaceholder", type: "textarea" },
    { key: "development_process", labelKey: "developmentProcess", placeholderKey: "developmentProcessPlaceholder", type: "textarea" },
    { key: "testing_results", labelKey: "testingResults", placeholderKey: "testingResultsPlaceholder", type: "textarea" },
    { key: "update_mechanism", labelKey: "updateMechanism", placeholderKey: "updateMechanismPlaceholder", type: "textarea" },
    { key: "support_period", labelKey: "supportPeriod", placeholderKey: "supportPeriodPlaceholder", type: "input" },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentForm({
  documentType,
  initialData,
  onSave,
  saving,
}: {
  documentType: DocumentType;
  initialData: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  saving: boolean;
}) {
  const t = useTranslations("documents");
  const fields = DOC_FIELDS[documentType];
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    for (const field of fields) {
      data[field.key] = initialData[field.key] ?? "";
    }
    return data;
  });

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={field.key}>{t(`fields.${field.labelKey}`)}</Label>

          {field.type === "input" && (
            <Input
              id={field.key}
              value={formData[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={
                field.placeholderKey
                  ? t(`fields.${field.placeholderKey}`)
                  : undefined
              }
            />
          )}

          {field.type === "textarea" && (
            <Textarea
              id={field.key}
              rows={4}
              value={formData[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={
                field.placeholderKey
                  ? t(`fields.${field.placeholderKey}`)
                  : undefined
              }
            />
          )}

          {field.type === "date" && (
            <Input
              id={field.key}
              type="date"
              value={formData[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          )}

          {field.type === "select" && field.options && (
            <select
              id={field.key}
              value={formData[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              className={cn(
                // Match the Nask Input recipe: filled background with
                // 10 px radius, no border by default, `bg-input` token.
                // The earlier select used `rounded-xl` + `text-sm`
                // which drifted from the design system; the new
                // classes inherit the same look as every other form
                // control in the app.
                "h-11 w-full rounded-md bg-input px-3 text-p2 text-foreground transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
            >
              <option value="">{"\u2014"}</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`fields.${opt.labelKey}`)}
                </option>
              ))}
            </select>
          )}

          {field.hintKey && (
            <p className="text-[11px] text-muted-foreground">
              {t(`fields.${field.hintKey}`)}
            </p>
          )}
        </div>
      ))}

      {/* Save footer */}
      <div className="sticky bottom-0 -mx-6 border-t border-border bg-card/80 px-6 py-3 backdrop-blur-sm">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? t("editor.saving") : t("editor.save")}
        </Button>
      </div>
    </form>
  );
}
