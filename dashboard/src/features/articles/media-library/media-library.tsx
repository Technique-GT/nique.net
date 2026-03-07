import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

export default function MediaLibrary() {
  const [cdnUrl, setCdnUrl] = useState("");

  const handleCopy = async () => {
    if (!cdnUrl.trim()) return;
    await navigator.clipboard.writeText(cdnUrl.trim());
    toast.success("URL copied to clipboard.");
  };

  const handleOpen = () => {
    if (!cdnUrl.trim()) return;
    window.open(cdnUrl.trim(), "_blank", "noopener,noreferrer");
  };

  return (
    <Main>
      <PageHeader
        title="Media Library"
        description="Manage media externally and paste URLs into articles."
      />

      <Card>
        <CardHeader>
          <CardTitle>External Media URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Media files are no longer stored in the database. Upload to your CDN/storage provider and use the
            resulting URL in the article&apos;s Featured Media field.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="https://cdn.example.com/path/to/image.jpg"
              value={cdnUrl}
              onChange={(e) => setCdnUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleOpen} disabled={!cdnUrl.trim()}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
              <Button type="button" onClick={handleCopy} disabled={!cdnUrl.trim()}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Main>
  );
}
