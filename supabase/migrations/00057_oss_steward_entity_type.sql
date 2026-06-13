-- =============================================================================
-- 00057: Add the open-source software steward economic-operator role
-- The CRA (Article 24) creates a new actor — the "open-source software
-- steward" — a legal person that provides sustained support for FOSS intended
-- for commercial activities. Stewards carry a lighter obligation set than
-- manufacturers (a documented cybersecurity policy, cooperation with
-- authorities, and Article 14 reporting to the extent they're involved) and
-- are outside the CE/DoC/technical-documentation regime. This widens the
-- entity_type CHECK so an org can select that role.
-- =============================================================================

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_entity_type_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_entity_type_check
    CHECK (entity_type IN (
      'manufacturer',
      'authorised_representative',
      'importer',
      'distributor',
      'open_source_software_steward'
    ));
