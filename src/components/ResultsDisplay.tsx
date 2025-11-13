import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultsDisplayProps {
  results: object;
}

const isURL = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
};

const ResultItem = ({ label, value }: { label: string; value: any }) => {
  const renderValue = (val: any) => {
    if (typeof val === 'string') {
      if (isURL(val)) {
        return <a href={val} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{val}</a>;
      }
      return <span className="text-foreground">{val}</span>;
    }
    if (typeof val === 'boolean') {
      return <span className={val ? "text-primary" : "text-destructive/80"}>{val.toString()}</span>;
    }
    if (typeof val === 'object' && val !== null) {
      return (
        <div className="pl-4 mt-2 border-l-2 border-border/50">
          {Object.entries(val).map(([k, v]) => (
            <ResultItem key={k} label={k} value={v} />
          ))}
        </div>
      );
    }
    return <span className="text-foreground">{String(val)}</span>;
  };

  return (
    <div className="py-2">
      <p className="font-semibold font-headline text-muted-foreground">
        {label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
      </p>
      <div className="text-sm">{renderValue(value)}</div>
    </div>
  );
};

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Investigation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(results).map(([key, value]) => (
            <ResultItem key={key} label={key} value={value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
