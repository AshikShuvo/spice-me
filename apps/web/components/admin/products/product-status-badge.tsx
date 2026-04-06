import { Badge } from "@/components/ui/badge";

interface Props {
  isPublished: boolean;
  isActive: boolean;
}

export function ProductStatusBadge({ isPublished, isActive }: Props) {
  if (!isActive) {
    return <Badge variant="secondary" className="bg-coal/10 text-coal/60">Inactive</Badge>;
  }
  if (isPublished) {
    return <Badge variant="secondary" className="bg-green-100 text-green-700">Published</Badge>;
  }
  return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Draft</Badge>;
}
