import { loadAccount } from "../actions";
import { AccountContent } from "./account-content";

export default async function AccountPage() {
  const account = await loadAccount();

  return <AccountContent account={account} />;
}
