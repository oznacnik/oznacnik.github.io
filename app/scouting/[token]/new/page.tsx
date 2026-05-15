import { assertToken } from "@/lib/scouting";
import NewStop from "./NewStop";

export const metadata = {
  title: "Scouting — nová zastávka",
  robots: { index: false, follow: false },
};

export default async function NewStopPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  assertToken(token);
  return <NewStop token={token} />;
}
