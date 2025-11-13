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
    if (Array.isArray(val)) {
        return (
             <div className="pl-4 mt-2 border-l-2 border-border/50 space-y-2">
                {val.map((item, index) => (
                    <div key={index} className="flex flex-col">
                         {Object.entries(item).map(([k, v]) => (
                            <ResultItem key={k} label={k} value={v} />
                         ))}
                    </div>
                ))}
            </div>
        )
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
    <div className="py-2 grid grid-cols-3 gap-4">
      <p className="font-semibold font-headline text-muted-foreground col-span-1">
        {label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
      </p>
      <div className="text-sm col-span-2">{renderValue(value)}</div>
    </div>
  );
};

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <div className="space-y-1 divide-y divide-border/50">
        {Object.entries(results).map(([key, value]) => (
        <ResultItem key={key} label={key} value={value} />
        ))}
    </div>
  );
}