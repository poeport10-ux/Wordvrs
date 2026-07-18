import { Link } from "react-router-dom";
import { Badge, Card } from "../components/ui";

const TOOLS = [
  { title: "Ebook publishing", status: "available" as const, desc: "Publish chapters instantly to WordVrs Reader. Set price and visibility from each book's settings." },
  { title: "ISBN management", status: "available" as const, desc: "Attach an ISBN to any book from its settings page for catalog and storefront listings." },
  { title: "Cover design tools", status: "soon" as const, desc: "In-app cover generator and template library. For now, set a cover image URL from book settings." },
  { title: "Print-on-demand", status: "soon" as const, desc: "One-click paperback/hardcover fulfillment via a POD partner integration." },
  { title: "Audiobook creation", status: "soon" as const, desc: "AI narration and human-narrator marketplace, publishing straight to the Reader audiobook player." },
];

export function PublishingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Publishing toolkit</h1>
        <p className="text-sm text-muted">Everything you need to take a manuscript to market.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Card key={tool.title}>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold">{tool.title}</h3>
              <Badge tone={tool.status === "available" ? "success" : "accent"}>
                {tool.status === "available" ? "Available" : "Coming soon"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{tool.desc}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="font-display font-semibold">Ready to publish?</h3>
        <p className="mt-1 text-sm text-muted">
          Head to your book's detail page, fill in the details, and hit publish. It becomes instantly discoverable in
          WordVrs Reader based on your visibility setting.
        </p>
        <Link to="/books" className="mt-3 inline-block text-sm text-primary hover:underline">
          Go to my books →
        </Link>
      </Card>
    </div>
  );
}
