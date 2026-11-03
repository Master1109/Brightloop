import { ProtectedWorkspace } from '../../../components/protected-workspace';

export default function Page() {
  return <ProtectedWorkspace role="ADMIN" initialPage="taxes" />;
}
