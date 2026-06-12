import { getCurrentUserRole } from "../actions";
import { loadEntityState } from "./actions";
import { EntityContent } from "./entity-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function EntityPage() {
  const [{ state }, role] = await Promise.all([
    loadEntityState(),
    getCurrentUserRole(),
  ]);

  if (!state) {
    return null;
  }

  return (
    <>
      <LearnScreenContext screenKey="settingsEntity" />
      <EntityContent initial={state} currentUserRole={role} />
    </>
  );
}

export const metadata = { title: "Entity role" };
