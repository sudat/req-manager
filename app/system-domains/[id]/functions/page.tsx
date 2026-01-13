import { redirect } from "next/navigation";

export default function SystemDomainFunctionsRedirect({ params }: { params: { id: string } }) {
  redirect(`/system-domains/${params.id}`);
}
