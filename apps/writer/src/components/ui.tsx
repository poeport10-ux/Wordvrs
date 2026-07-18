import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-fg hover:opacity-90 shadow-glow",
    secondary: "bg-surface2 text-text hover:bg-surface2/70 border border-border",
    ghost: "text-text hover:bg-surface2",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({
  className = "",
  children,
  as: As = "div",
  ...rest
}: { className?: string; children: ReactNode; as?: "div" | "form" } & HTMLAttributes<HTMLDivElement | HTMLFormElement>) {
  const Tag = As as "div";
  return (
    <Tag className={`rounded-xl2 border border-border bg-surface p-5 shadow-card ${className}`} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </Tag>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${props.className ?? ""}`}
    />
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "accent" | "muted" }) {
  const tones: Record<string, string> = {
    default: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    accent: "bg-accent/20 text-accent",
    muted: "bg-surface2 text-muted",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 border border-dashed border-border bg-surface/50 py-16 text-center">
      <p className="text-lg font-display font-semibold text-text">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-cosmic bg-no-repeat">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <Badge tone="accent">Coming soon</Badge>
      </div>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </Card>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
